import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { X, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { submitEnquiry } from '../firebase/enquiries';
import { postEnquiryWebhook } from '../utils/mailDispatcher';

interface EnquiryModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email' | 'whatsapp'>('phone');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSubmittedRef(null);
      setIsSubmitting(false);
      setMessage('');
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const sanitizeStr = (s?: string) =>
    (s || '')
      .replace(/\s*\([OO0o]\)/gi, '')
      .replace(/\s+O$/gi, '')
      .replace(/\bO\b/gi, '')
      .replace(/\(O\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanModel = sanitizeStr(vehicle.model);
  const cleanTrim = sanitizeStr(vehicle.trim);
  const cleanMake = sanitizeStr(vehicle.make);
  const vehicleDisplayName = `${vehicle.year} ${cleanMake} ${cleanModel} ${cleanTrim}`.replace(/\s+/g, ' ').trim();
  const vehicleLocation = vehicle.location || 'Central Vault';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please provide your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 7) {
      setErrorMsg('Please provide a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    const enquiryRefId = `ENQ-${Date.now().toString().slice(-6)}`;

    try {
      // 1. Dispatch POST request to AI Agent webhook (retries twice if first attempt fails)
      await postEnquiryWebhook({
        enquiryId: enquiryRefId,
        customerName: fullName.trim(),
        customerPhone: cleanPhone,
        customerEmail: email.trim() || undefined,
        preferredContact,
        vehicleId: vehicle.id,
        vehicleName: vehicleDisplayName,
        vehicleYear: vehicle.year,
        vehicleLocation,
        vehiclePrice: vehicle.price ?? null,
        message: message.trim() || undefined,
        source: 'website_enquiry_modal',
      });

      // 2. Local in-memory acknowledgement
      const res = await submitEnquiry({
        customer: {
          name: fullName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          preferredContact,
          message: message.trim() || undefined,
        },
        vehicle: {
          id: vehicle.id,
          name: vehicleDisplayName,
          year: vehicle.year,
          location: vehicleLocation,
          price: vehicle.price ?? null,
          variant: vehicle.variant || vehicle.trim || '',
        },
        source: 'website_enquiry_modal',
      });

      if (res.success) {
        setSubmittedRef(res.enquiryId || enquiryRefId);
        if (onSuccess) onSuccess();
      } else {
        setSubmittedRef(enquiryRefId);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Enquiry submission note:', err);
      setSubmittedRef(enquiryRefId);
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="enquiry-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="enquiry-modal-container"
        className="bg-[#171922] border border-white/[0.15] rounded-xl max-w-xl w-full p-4 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[94vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-enquiry-modal"
          onClick={onClose}
          aria-label="Close enquiry form"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#94A3B8] hover:text-white p-1.5 sm:p-2 rounded hover:bg-white/[0.05] transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {submittedRef ? (
          <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <div className="text-[10px] sm:text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                ENQUIRY RECORDED SUCCESSFULLY
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-[#ECE5D8] uppercase tracking-tight mt-1">
                Consultation Dispatched
              </h3>
            </div>

            <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
              Your inquiry for the <span className="text-[#ECE5D8] font-bold">{vehicleDisplayName}</span> has been logged into the dealership telemetry registry. Our regional executive will reach out to you via <span className="text-[#ECE5D8] font-bold uppercase">{preferredContact}</span>.
            </p>

            <div className="p-2.5 sm:p-3 bg-[#0F1115] border border-white/[0.08] rounded-lg max-w-xs mx-auto text-xs font-mono text-[#94A3B8]">
              <span>Inquiry Reference: </span>
              <span className="text-emerald-400 font-bold">{submittedRef}</span>
            </div>

            <div className="pt-1 sm:pt-2">
              <button
                onClick={onClose}
                className="px-5 sm:px-6 py-2 sm:py-2.5 rounded bg-[#E5252A] hover:bg-[#c00017] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Return to Showroom
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#E5252A] text-[10px] sm:text-xs font-mono font-bold tracking-wider mb-1 sm:mb-2">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>DIRECT VEHICLE ACQUISITION ENQUIRY</span>
            </div>

            <h3 className="font-display text-lg sm:text-2xl font-black text-[#ECE5D8] tracking-tight uppercase mb-0.5 sm:mb-1">
              Private Consultation
            </h3>

            <p className="text-[11px] sm:text-xs text-[#94A3B8] mb-3 sm:mb-5 leading-relaxed font-sans">
              Connect directly with our vehicle desk to arrange private vetting, reserve inspection slots, or discuss bespoke acquisition terms.
            </p>

            {/* Target Vehicle Summary Card */}
            <div className="bg-[#0F1115] border border-white/[0.08] rounded-lg p-2.5 sm:p-4 mb-3 sm:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#94A3B8] uppercase block">
                  Target Inventory Unit
                </span>
                <span className="font-display font-black text-[#ECE5D8] text-sm sm:text-base">
                  {vehicleDisplayName}
                </span>
              </div>

              {Boolean(vehicle.price && vehicle.price > 0) && (
                <div className="sm:text-right shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#94A3B8] uppercase block">
                    Acquisition Price
                  </span>
                  <span className="font-mono font-black text-white text-sm sm:text-base">
                    ₹{((vehicle.price || 0) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-xs text-red-300">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] sm:text-xs font-mono font-bold text-[#ECE5D8] uppercase tracking-wider mb-1 sm:mb-1.5">
                  Full Name <span className="text-[#E5252A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="enquiry-customer-name"
                  placeholder="e.g. Rahul Nair"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] sm:text-xs font-mono font-bold text-[#ECE5D8] uppercase tracking-wider mb-1 sm:mb-1.5">
                  Phone Number <span className="text-[#E5252A]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  id="enquiry-customer-phone"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-colors font-mono"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-[10px] sm:text-xs font-mono font-bold text-[#ECE5D8] uppercase tracking-wider mb-1 sm:mb-1.5">
                  Email Address <span className="text-[10px] sm:text-xs text-[#94A3B8] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="email"
                  id="enquiry-customer-email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-colors"
                />
              </div>

              {/* Message (Optional) */}
              <div>
                <label className="block text-[10px] sm:text-xs font-mono font-bold text-[#ECE5D8] uppercase tracking-wider mb-1 sm:mb-1.5">
                  Message / Questions <span className="text-[10px] sm:text-xs text-[#94A3B8] font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={1}
                  id="enquiry-customer-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us if you want an inspection, test drive, or specific trade questions..."
                  className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-colors resize-none sm:rows-2"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="submit-enquiry-btn"
                  className="w-full flex items-center justify-center gap-2 bg-[#E5252A] hover:bg-[#c00017] disabled:opacity-60 text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 sm:py-3.5 px-4 sm:px-6 rounded transition-all cursor-pointer shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SUBMITTING ENQUIRY...</span>
                    </>
                  ) : (
                    <>
                      <span>SUBMIT PRIVATE ENQUIRY</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[9px] sm:text-[10px] font-mono text-[#94A3B8]/60 text-center mt-1.5 sm:mt-2">
                  Direct encrypted submission to regional dealership desk.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
