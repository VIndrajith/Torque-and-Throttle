import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal, Layers, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';

interface HomeVaultTeaserProps {
  onNavigateToInventory: () => void;
  totalVehiclesCount: number;
  previewVehicles: Vehicle[];
  onViewVehicleDetail: (v: Vehicle) => void;
}

export const HomeVaultTeaser: React.FC<HomeVaultTeaserProps> = ({
  onNavigateToInventory,
  totalVehiclesCount,
  previewVehicles,
  onViewVehicleDetail,
}) => {
  return (
    <section id="home-vault-teaser-section" className="py-20 bg-[#0F1115]/95 backdrop-blur-sm border-b border-white/[0.08] relative z-10 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#E5252A]/10 blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-widest uppercase mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>THE CURATED VAULT</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#ECE5D8] tracking-tight uppercase leading-tight">
              EXPLORE OUR VERIFIED INVENTORY
            </h2>
            <p className="text-[#94A3B8] text-sm sm:text-base max-w-2xl mt-3 leading-relaxed font-sans text-center md:text-left mx-auto md:mx-0">
              Secondary road-legal certified preowned vehicles, thoroughly inspected and validated. Browse our full catalogue on our dedicated inventory portal.
            </p>
          </div>

          <button
            id="teaser-view-all-inventory-btn"
            onClick={onNavigateToInventory}
            className="w-full md:w-auto inline-flex items-center justify-center text-center gap-2.5 bg-[#E5252A] hover:bg-[#c00017] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-4 rounded transition-all shadow-[0_0_20px_rgba(229,37,42,0.35)] hover:shadow-[0_0_30px_rgba(229,37,42,0.6)] shrink-0 cursor-pointer group"
          >
            <span>VIEW ALL {totalVehiclesCount} VEHICLES</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>



        {/* Bottom Banner Bar */}
        <div className="relative overflow-hidden bg-[#12141C] border border-white/[0.08] hover:border-[#E5252A]/40 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 group">
          {/* Subtle traveling light beam on banner border */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E5252A]/60 to-transparent animate-beam"></div>

          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            <CheckCircle2 className="w-4 h-4 text-[#E5252A] shrink-0 animate-pulse" />
            <span>Looking for specific horsepower, manual gearbox, or transmission criteria?</span>
          </div>
          <button
            onClick={onNavigateToInventory}
            className="text-xs font-bold uppercase tracking-wider text-[#ECE5D8] group-hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5252A] group-hover:rotate-45 transition-transform" />
            <span className="group-hover:text-[#E5252A] transition-colors">Launch Complete Filter Matrix →</span>
          </button>
        </div>
      </div>
    </section>
  );
};
