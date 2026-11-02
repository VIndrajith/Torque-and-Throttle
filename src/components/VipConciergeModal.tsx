import React, { useState } from 'react';
import { X, Headphones, Phone, Mail, MapPin, Clock, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface VipConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipConciergeModal: React.FC<VipConciergeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('+919400581250');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('sudhakaransanjay921@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#171922] border border-white/[0.15] rounded-xl max-w-md w-full p-4 sm:p-6 relative shadow-2xl my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Contact Window"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#94A3B8] hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[#E5252A] text-[10px] sm:text-xs font-mono font-bold tracking-wider mb-1.5 sm:mb-2 pr-8">
          <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>DIRECT CONTACT &amp; ADVISORY DESK</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg sm:text-2xl font-black text-[#ECE5D8] mb-1 sm:mb-1.5 uppercase tracking-tight pr-6">
          Contact Torque &amp; Throttle
        </h3>

        <p className="text-[11px] sm:text-xs text-[#94A3B8] leading-relaxed mb-3.5 sm:mb-5 font-sans">
          Connect directly with our team for purchase enquiries, private inspections, appraisals, or vehicle sourcing.
        </p>

        {/* Contact Cards Grid */}
        <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-5">
          {/* Phone Card */}
          <div className="p-2.5 sm:p-3.5 bg-[#0F1115] border border-white/[0.1] hover:border-[#E5252A]/50 rounded-lg text-xs transition-all flex items-center justify-between gap-2 sm:gap-3 group">
            <a
              href="tel:+919400581250"
              className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E5252A]/10 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A] shrink-0">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="truncate">
                <span className="text-[9px] sm:text-[10px] text-[#94A3B8] uppercase font-mono block leading-none mb-0.5">
                  Direct Phone
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#ECE5D8] group-hover:text-white block truncate">
                  +91 9400581250
                </span>
              </div>
            </a>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyPhone}
                title="Copy phone number"
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-md bg-white/[0.05] hover:bg-white/[0.12] text-[#94A3B8] hover:text-[#ECE5D8] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline sm:inline">Copy</span>
                  </>
                )}
              </button>

              <a
                href="tel:+919400581250"
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md bg-[#E5252A] hover:bg-[#c00017] text-white font-mono text-[10px] sm:text-xs font-bold uppercase transition-colors cursor-pointer shadow-sm"
              >
                Call
              </a>
            </div>
          </div>

          {/* WhatsApp Action Card */}
          <div className="p-2.5 sm:p-3.5 bg-[#0F1115] border border-[#25D366]/30 hover:border-[#25D366]/70 rounded-lg text-xs transition-all flex items-center justify-between gap-2 sm:gap-3 group">
            <a
              href="https://wa.me/919400581250"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="truncate">
                <span className="text-[9px] sm:text-[10px] text-[#25D366] uppercase font-mono font-bold block leading-none mb-0.5">
                  WhatsApp Chat
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#ECE5D8] group-hover:text-white block truncate">
                  +91 9400581250
                </span>
              </div>
            </a>

            <a
              href="https://wa.me/919400581250"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md bg-[#25D366] hover:bg-[#20ba59] text-white font-mono text-[10px] sm:text-xs font-bold uppercase transition-colors cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
            >
              <span>Chat</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Email Card */}
          <div className="p-2.5 sm:p-3.5 bg-[#0F1115] border border-white/[0.1] hover:border-[#E5252A]/50 rounded-lg text-xs transition-all flex items-center justify-between gap-2 sm:gap-3 group">
            <a
              href="mailto:sudhakaransanjay921@gmail.com"
              className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E5252A]/10 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A] shrink-0">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="truncate">
                <span className="text-[9px] sm:text-[10px] text-[#94A3B8] uppercase font-mono block leading-none mb-0.5">
                  Direct Email
                </span>
                <span
                  className="font-bold text-[11px] sm:text-xs text-[#ECE5D8] group-hover:text-white block truncate"
                  title="sudhakaransanjay921@gmail.com"
                >
                  sudhakaransanjay921@gmail.com
                </span>
              </div>
            </a>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyEmail}
                title="Copy email address"
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-md bg-white/[0.05] hover:bg-white/[0.12] text-[#94A3B8] hover:text-[#ECE5D8] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline sm:inline">Copy</span>
                  </>
                )}
              </button>

              <a
                href="mailto:sudhakaransanjay921@gmail.com"
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md bg-[#222634] hover:bg-[#2A2F3D] text-[#ECE5D8] hover:text-white border border-white/10 font-mono text-[10px] sm:text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Email
              </a>
            </div>
          </div>

          {/* Locations & Operating Hours Badge */}
          <div className="p-2.5 sm:p-3.5 bg-[#0F1115] border border-white/[0.06] rounded-lg text-xs text-[#94A3B8] space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#ECE5D8] font-bold text-[11px] sm:text-xs">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E5252A] shrink-0" />
              <span>Locations &amp; Hubs:</span>
            </div>
            <div className="text-[10px] sm:text-[11px] pl-4 sm:pl-5 space-y-0.5 sm:space-y-1">
              <div>
                <strong className="text-[#ECE5D8]">Bangalore:</strong> Torque &amp; Throttle, Bangalore, Karnataka, India
              </div>
              <div>
                <strong className="text-[#ECE5D8]">Kerala:</strong> Torque &amp; Throttle, Kerala, India
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-[#94A3B8] pl-4 sm:pl-5 pt-0.5 sm:pt-1">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Mon – Sun: 9:00 AM – 8:00 PM IST</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#222634] hover:bg-[#2A2F3D] text-[#ECE5D8] hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border border-white/[0.1] transition-colors cursor-pointer"
        >
          Close Window
        </button>
      </div>
    </div>
  );
};
