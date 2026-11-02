import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CustomRequestModal } from './CustomRequestModal';

interface CustomRequestBannerProps {
  onOpenModal?: () => void;
}

export const CustomRequestBanner: React.FC<CustomRequestBannerProps> = ({ onOpenModal }) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpen = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  return (
    <>
      <section className="bg-[#171922] border-y border-white/[0.08] py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded bg-[#0F1115] border border-white/[0.1] flex items-center justify-center text-[#E5252A] shrink-0 relative">
                <span className="absolute inset-0 rounded bg-[#E5252A]/20 animate-ping pointer-events-none opacity-40"></span>
                <Sparkles className="w-6 h-6 relative z-10 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-black text-[#ECE5D8] uppercase tracking-tight">
                  LOOKING FOR A SPECIFIC MODEL?
                </h3>
                <p className="text-[#94A3B8] text-xs sm:text-sm mt-0.5 text-center md:text-left font-sans">
                  Our sourcing desk finds verified allocations, specific trims, and tailored certified preowned models across verified networks.
                </p>
              </div>
            </div>

            <button
              id="btn-custom-vehicle-request"
              onClick={handleOpen}
              className="w-full md:w-auto flex items-center justify-center text-center bg-[#222634] hover:bg-[#2A2F3D] active:scale-[0.98] text-[#ECE5D8] hover:text-white border border-white/[0.15] hover:border-[#E5252A]/50 text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded transition-all shrink-0 cursor-pointer hover:shadow-[0_0_20px_rgba(229,37,42,0.25)]"
            >
              SUBMIT CUSTOM VEHICLE REQUEST
            </button>
          </div>
        </div>
      </section>

      <CustomRequestModal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
      />
    </>
  );
};
