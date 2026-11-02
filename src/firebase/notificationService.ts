import { Enquiry } from '../types';

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'whatsapp' | 'ai_agent';
  message: string;
  recipient?: string;
  error?: string;
}

export class NotificationService {
  /**
   * Internal status tracker for enquiry notifications.
   * Webhook dispatch is handled once at user submission time.
   */
  static async sendEmailNotification(
    enquiry: Enquiry
  ): Promise<NotificationResult> {
    return {
      success: true,
      channel: 'ai_agent',
      message: `Enquiry ${enquiry.id} logged.`,
    };
  }

  /**
   * WhatsApp Notification Architecture.
   */
  static async sendWhatsAppNotification(
    enquiry: Enquiry,
    targetPhone?: string
  ): Promise<NotificationResult> {
    return {
      success: false,
      channel: 'whatsapp',
      recipient: targetPhone,
      message: 'WhatsApp Business API pending provider configuration.',
    };
  }
}
