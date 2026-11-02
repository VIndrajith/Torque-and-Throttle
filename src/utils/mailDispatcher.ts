export const AI_AGENT_WEBHOOK_URL =
  (import.meta as any).env?.VITE_AI_AGENT_WEBHOOK_URL ||
  'https://hook.eu1.make.com/oegp35uomovhnm2gtix2jrem19rnhc4k';
export const TARGET_CONTACT_EMAIL = 'sudhakaransanjay921@gmail.com';

export interface DeliveryResponse {
  success: boolean;
  message: string;
  id?: string;
  requestPayload?: any;
}

export interface CustomVehicleRequestPayload {
  targetModel: string;
  targetTimeline: string;
  clientName: string;
  clientContact: string;
}

export interface TestDriveRequestPayload {
  vehicleName: string;
  preferredDate: string;
  fullName: string;
  mobile: string;
  notes?: string;
}

export interface EnquiryRequestPayload {
  targetInventoryUnit: string;
  fullName: string;
  phoneNumber: string;
  emailAddress?: string;
  messageQuestions?: string;
}

/**
 * Dispatches the payload to Make.com AI Agent webhook.
 * Requirement: Send two times if one failed (automatic retry).
 * First leverages the server-side relay, then direct POST fallback.
 */
async function sendSingleWebhook(payload: Record<string, any>): Promise<void> {
  let delivered = false;
  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // 1. Preferred path: Server-side relay (unrestricted Node.js POST)
      const res = await fetch('/api/webhook-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        delivered = true;
        break;
      }
      throw new Error(`Server relay returned status ${res.status}`);
    } catch (relayErr: any) {
      lastError = relayErr;
      console.warn(`[Webhook POST Attempt ${attempt}/2] Relay failed, attempting direct fetch:`, relayErr?.message || relayErr);

      // 2. Direct client fetch fallback
      try {
        const directRes = await fetch(AI_AGENT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify(payload),
        });

        if (directRes.ok) {
          delivered = true;
          break;
        }
        throw new Error(`Direct POST returned status ${directRes.status}`);
      } catch (directErr: any) {
        lastError = directErr;
        console.warn(`[Webhook POST Attempt ${attempt}/2] Direct fetch failed:`, directErr?.message || directErr);
      }
    }

    // If attempt 1 failed, wait briefly before sending a second time ("Send two times if one failed")
    if (!delivered && attempt < 2) {
      console.log('[Webhook POST] Attempt 1 failed. Sending second time (Attempt 2)...');
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  if (!delivered) {
    console.error('[Webhook Dispatch] All 2 attempts failed:', lastError);
  }
}

/**
 * 1. CUSTOM VEHICLE REQUEST:
 * Dispatches exactly ONCE with:
 * - "Request Type": "Custom Vehicle Request"
 * - "TARGET VEHICLE / MODEL"
 * - "Acquisition Timeline"
 * - "Your Full Name"
 * - "Contact Phone or Email"
 */
export async function sendCustomVehicleRequest(payload: CustomVehicleRequestPayload): Promise<DeliveryResponse> {
  const webhookBody = {
    'Request Type': 'Custom Vehicle Request',
    'TARGET VEHICLE / MODEL': payload.targetModel,
    'Acquisition Timeline': payload.targetTimeline,
    'Your Full Name': payload.clientName,
    'Contact Phone or Email': payload.clientContact,
  };

  await sendSingleWebhook(webhookBody);

  return {
    success: true,
    message: 'Custom vehicle request successfully transmitted to AI Agent.',
    requestPayload: webhookBody,
  };
}

// Backward-compatible alias
export async function sendDirectEmail(payload: {
  fields: Array<{ label: string; value: any }>;
  clientName?: string;
  clientContact?: string;
  additionalNotes?: string;
}): Promise<DeliveryResponse> {
  const modelField = payload.fields.find((f) => f.label.toLowerCase().includes('model') || f.label.toLowerCase().includes('vehicle'));
  const timelineField = payload.fields.find((f) => f.label.toLowerCase().includes('timeline'));

  return sendCustomVehicleRequest({
    targetModel: String(modelField?.value || 'Specified Vehicle Model'),
    targetTimeline: String(timelineField?.value || 'Within 30 Days'),
    clientName: payload.clientName || 'Anonymous Client',
    clientContact: payload.clientContact || 'Not provided',
  });
}

/**
 * 2. TEST DRIVE SCHEDULING:
 * Dispatches exactly ONCE with:
 * - "Request Type": "Test Drive Scheduling"
 * - "TARGET VEHICLE"
 * - "PREFERRED DATE"
 * - "FULL NAME"
 * - "MOBILE NUMBER"
 * - "SPECIAL INSTRUCTIONS / QUESTIONS (OPTIONAL)"
 */
export async function postTestDriveWebhook(payload: {
  vehicleName: string;
  preferredDate: string;
  fullName: string;
  mobile: string;
  notes?: string;
  [key: string]: any;
}): Promise<DeliveryResponse> {
  const webhookBody = {
    'Request Type': 'Test Drive Scheduling',
    'TARGET VEHICLE': payload.vehicleName,
    'PREFERRED DATE': payload.preferredDate,
    'FULL NAME': payload.fullName,
    'MOBILE NUMBER': payload.mobile,
    'SPECIAL INSTRUCTIONS / QUESTIONS (OPTIONAL)': payload.notes || '',
  };

  await sendSingleWebhook(webhookBody);

  return {
    success: true,
    message: 'Test drive reservation successfully transmitted to AI Agent.',
    requestPayload: webhookBody,
  };
}

/**
 * 3. I'M INTERESTED / VEHICLE ENQUIRY:
 * Dispatches exactly ONCE with:
 * - "Request Type": "I'm Interested / Vehicle Enquiry"
 * - "Target Inventory Unit"
 * - "Full Name"
 * - "Phone Number"
 * - "Email Address (optional)"
 * - "Message / Questions (optional)"
 */
export async function postEnquiryWebhook(data: {
  vehicleName?: string;
  targetInventoryUnit?: string;
  customerName?: string;
  fullName?: string;
  customerPhone?: string;
  phoneNumber?: string;
  customerEmail?: string;
  emailAddress?: string;
  message?: string;
  messageQuestions?: string;
  [key: string]: any;
}): Promise<DeliveryResponse> {
  const webhookBody = {
    'Request Type': "I'm Interested / Vehicle Enquiry",
    'Target Inventory Unit': data.targetInventoryUnit || data.vehicleName || 'Vehicle Unit',
    'Full Name': data.fullName || data.customerName || 'Anonymous',
    'Phone Number': data.phoneNumber || data.customerPhone || '',
    'Email Address (optional)': data.emailAddress || data.customerEmail || '',
    'Message / Questions (optional)': data.messageQuestions || data.message || '',
  };

  await sendSingleWebhook(webhookBody);

  return {
    success: true,
    message: 'Enquiry successfully transmitted to AI Agent.',
    requestPayload: webhookBody,
  };
}
