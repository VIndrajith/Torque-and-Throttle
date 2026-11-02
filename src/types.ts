export interface VehicleSpecs {
  powerHp: number;
  zeroToSixtySec: number;
  torqueLbFt: number;
  transmission: string;
  drivetrain: string;
  engine: string;
  owners: number;
  curbWeightLbs?: number;
  topSpeedMph?: number;
  fuelType?: string;
  quarterMileSec?: number;
}

export interface DynoDataPoint {
  rpm: number;
  hp: number;
  torque: number;
}

export type PowerDataPoint = DynoDataPoint;

export interface DynoTelemetry {
  peakBhp: number;
  peakTorque: number;
  dynoCurve: DynoDataPoint[];
  ecuFlashCount: number;
  boostPsi: number;
  ambientTempF: number;
  correctionFactor: string;
  dynoOperator: string;
  dynoDate: string;
}

export type PowertrainTelemetry = DynoTelemetry;

export interface InspectionSummary {
  totalPoints: number;
  passedPoints: number;
  borescopeStatus: string;
  brakePadFrontMm: number;
  brakePadRearMm: number;
  tireTread32ndsFront: number;
  tireTread32ndsRear: number;
  paintDepthMicronsAvg: number;
  paintPanelReadings: { panel: string; microns: number; status: 'Factory' | 'Blend' | 'PPF' }[];
  frameStraightnessToleranceMm: number;
  compressionPsi: number[];
  batteryHealthPercent?: number;
}

export interface CarfaxReport {
  accidents: number;
  owners: number;
  serviceRecords: number;
  lastOdometerDate: string;
  titleStatus: string;
  countryOfOrigin: string;
}

export interface Vehicle {
  id: string;
  // 13 Registered Attributes
  make: string; // 1. Company
  model: string; // 2. Model
  year: number; // 3. Year
  category: 'suv' | 'sedans' | 'hatchback' | 'mpv' | 'motorcycle' | string; // 4. Category
  trim: string; // 5. Trim
  engine?: string; // 6. Engine Description
  powerHp?: number; // 7. Power (HP)
  torque?: number; // 8. Torque
  transmission?: string; // 9. Transmission
  drivetrain?: string; // 10. Drivetrain
  mileage: number; // 11. Odometer
  owners?: number; // 12. Owner Count
  exteriorColor: string; // 14. Exterior Paint

  // Media & State
  imageUrl: string;
  galleryImages?: string[];
  additionalImages?: string[];
  status?: 'available' | 'reserved' | 'sold';
  isSold?: boolean;

  // Optional compatibility attributes
  variant?: string;
  chassis?: string;
  price?: number;
  estimatedMonthly?: number;
  location?: string;
  primaryBadge?: string;
  secondaryBadge?: string;
  interiorColor?: string;
  highlights?: string[];
  vin?: string;
  fullVin?: string;
  registrationNo?: string;
  targetPrice?: number;
  floorPrice?: number;
  ignitionTiming?: string;
  fuelTrim?: string;
  borescopeScore?: string;
  cylinderCompressionPsi?: number[];
  specs?: Partial<VehicleSpecs>;
  dynoTelemetry?: Partial<DynoTelemetry>;
  inspection?: Partial<InspectionSummary>;
  carfax?: Partial<CarfaxReport>;
  notes?: string;
}

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'inspection_scheduled'
  | 'negotiation'
  | 'closed'
  | 'cancelled';

export interface EnquiryCustomer {
  name: string;
  phone: string;
  email?: string;
  preferredContact?: 'phone' | 'email' | 'whatsapp';
  message?: string;
}

export interface EnquiryVehicle {
  id: string;
  name: string;
  year?: number | null;
  location?: string;
  price?: number | null;
  variant?: string;
  mileage?: number;
}

export interface EnquiryNote {
  id?: string;
  text: string;
  createdBy: string;
  createdByName?: string;
  createdAt: any; // Timestamp or ISO string
}

export interface EnquiryAuditLog {
  id?: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  timestamp: any;
  details?: string;
}

export interface Enquiry {
  id?: string;
  customer: EnquiryCustomer;
  vehicle: EnquiryVehicle;
  status: EnquiryStatus;
  assignedAdminId?: string;
  assignedAdminName?: string;
  source: string;
  createdAt: any;
  updatedAt: any;
  notificationStatus?: 'sent' | 'pending' | 'failed' | 'disabled';
}

export type AdminRole = 'admin' | 'sales' | 'superadmin';

export interface AdminUser {
  id: string;
  uid?: string;
  role: AdminRole;
  name: string;
  email: string;
  location: string;
  phone?: string;
}

export type QuickFilter = 'all' | 'certified' | 'sub-4s' | 'under-20k-miles' | 'manual' | 'v8-plus';

export interface FilterState {
  category: string;
  make: string;
  transmission: string;
  selectedVehicleId?: string;
  chassis?: string;
  year?: string;
  quickFilter?: QuickFilter;
  searchQuery?: string;
  sortBy?: string;
  budget?: string;
}

export interface BookingRequest {
  vehicleId: string;
  vehicleName: string;
  date: string;
  timeSlot: string;
  fullName: string;
  mobile: string;
  email: string;
  experienceNotes: string;
  agreedToTerms: boolean;
}
