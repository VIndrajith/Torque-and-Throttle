import { Enquiry, EnquiryNote, EnquiryStatus, AdminUser } from '../types';
import { resolveAdminForLocation, getAdminById } from './adminConfig';
import { NotificationService } from './notificationService';

// In-memory throttle cache to prevent rapid duplicate accidental spam
const submissionCache = new Map<string, number>();

// In-memory enquiries list (Firestore storage disabled per user request)
const inMemoryEnquiriesList: Enquiry[] = [];
type SubscriberCallback = (enquiries: Enquiry[]) => void;
const subscribers = new Set<SubscriberCallback>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb([...inMemoryEnquiriesList]);
    } catch (err) {
      console.warn('Enquiry subscriber notify error:', err);
    }
  });
}

export interface SubmitEnquiryParams {
  customer: {
    name: string;
    phone: string;
    email?: string;
    preferredContact?: 'phone' | 'email' | 'whatsapp';
    message?: string;
  };
  vehicle: {
    id: string;
    name: string;
    year?: number | null;
    location?: string;
    price?: number | null;
    variant?: string;
  };
  source?: string;
}

export interface SubmitEnquiryResult {
  success: boolean;
  enquiryId?: string;
  message: string;
  isDuplicate?: boolean;
}

/**
 * Creates and processes a new customer vehicle enquiry.
 * NOTE: Storage into Cloud Firestore has been disabled per user configuration.
 * 1. Validates inputs
 * 2. Checks for rapid duplicate submissions (throttling)
 * 3. Resolves the appropriate administrator based on vehicle location
 * 4. Triggers background notification / AI agent webhook
 * 5. Returns confirmation without writing to Firestore
 */
export async function submitEnquiry(params: SubmitEnquiryParams): Promise<SubmitEnquiryResult> {
  const { customer, vehicle, source = 'website' } = params;

  // Validation
  if (!customer.name || customer.name.trim().length < 2) {
    throw new Error('Please enter a valid full name (minimum 2 characters).');
  }

  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.length < 7 || cleanPhone.length > 20) {
    throw new Error('Please enter a valid phone number (at least 7 digits).');
  }

  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  // Duplicate check key: customer phone + vehicle id
  const dedupeKey = `${cleanPhone}_${vehicle.id}`;
  const lastSubmitted = submissionCache.get(dedupeKey);
  const now = Date.now();

  if (lastSubmitted && now - lastSubmitted < 60000) {
    return {
      success: true,
      isDuplicate: true,
      message: 'Your enquiry for this vehicle was recently received. Our team will contact you shortly.',
    };
  }

  submissionCache.set(dedupeKey, now);

  // Admin routing by vehicle location
  const assignedAdmin = resolveAdminForLocation(vehicle.location);
  const enquiryRefId = `ENQ-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();

  const newEnquiry: Enquiry = {
    id: enquiryRefId,
    customer: {
      name: customer.name.trim(),
      phone: cleanPhone,
      email: customer.email ? customer.email.trim() : '',
      preferredContact: customer.preferredContact || 'phone',
      message: customer.message ? customer.message.trim() : '',
    },
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      year: vehicle.year ?? null,
      location: vehicle.location || 'Central Vault',
      price: vehicle.price ?? null,
      variant: vehicle.variant || '',
    },
    status: 'new' as EnquiryStatus,
    assignedAdminId: assignedAdmin.id,
    assignedAdminName: assignedAdmin.name,
    source,
    createdAt: timestamp,
    updatedAt: timestamp,
    notificationStatus: 'sent',
  };

  // Add to in-memory list (NOT stored in Firestore)
  inMemoryEnquiriesList.unshift(newEnquiry);
  notifySubscribers();

  // Notify the AI Agent webhook asynchronously
  NotificationService.sendEmailNotification(newEnquiry).catch((notifErr) => {
    console.warn('Background admin notification notice:', notifErr);
  });

  return {
    success: true,
    enquiryId: enquiryRefId,
    message: 'Thank you! Your enquiry has been submitted successfully. Our team will contact you shortly.',
  };
}

/**
 * Subscribes to real-time enquiries for authorized admins (In-memory, zero Firestore writes/reads).
 */
export function subscribeToEnquiries(
  _admin: AdminUser,
  callback: (enquiries: Enquiry[]) => void,
  _errorCallback?: (error: Error) => void
) {
  subscribers.add(callback);
  callback([...inMemoryEnquiriesList]);

  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Updates an enquiry's lifecycle status (In-memory, zero Firestore writes).
 */
export async function updateEnquiryStatus(
  enquiryId: string,
  newStatus: EnquiryStatus,
  _adminUser: AdminUser
): Promise<void> {
  const item = inMemoryEnquiriesList.find((e) => e.id === enquiryId);
  if (item) {
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    notifySubscribers();
  }
}

/**
 * Assigns an enquiry to an administrator (In-memory, zero Firestore writes).
 */
export async function assignEnquiryAdmin(
  enquiryId: string,
  targetAdminId: string,
  _adminUser: AdminUser
): Promise<void> {
  const targetAdmin = getAdminById(targetAdminId);
  const item = inMemoryEnquiriesList.find((e) => e.id === enquiryId);
  if (item) {
    item.assignedAdminId = targetAdminId;
    item.assignedAdminName = targetAdmin ? targetAdmin.name : targetAdminId;
    item.updatedAt = new Date().toISOString();
    notifySubscribers();
  }
}

const inMemoryNotes = new Map<string, EnquiryNote[]>();

/**
 * Adds an internal admin note to an enquiry (In-memory, zero Firestore writes).
 */
export async function addEnquiryNote(
  enquiryId: string,
  noteText: string,
  adminUser: AdminUser
): Promise<void> {
  if (!noteText.trim()) return;

  const currentNotes = inMemoryNotes.get(enquiryId) || [];
  const newNote: EnquiryNote = {
    id: `note-${Date.now()}`,
    text: noteText.trim(),
    createdBy: adminUser.uid || adminUser.id,
    createdByName: adminUser.name,
    createdAt: new Date().toISOString(),
  };

  inMemoryNotes.set(enquiryId, [newNote, ...currentNotes]);
}

/**
 * Subscribes to internal notes for an enquiry (In-memory, zero Firestore writes).
 */
export function subscribeToEnquiryNotes(
  enquiryId: string,
  callback: (notes: EnquiryNote[]) => void
) {
  const currentNotes = inMemoryNotes.get(enquiryId) || [];
  callback([...currentNotes]);
  return () => {};
}
