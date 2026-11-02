import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

interface HeroProps {
  onExploreVault: () => void;
  onScheduleTestDrive: () => void;
  deliveredCount?: number;
  vaultCount?: number;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreVault,
  onScheduleTestDrive,
  deliveredCount = 0,
  vaultCount = 0,
}) => {
  // Animated Counters on mount
  const [pointsCount, setPointsCount] = useState(0);
  const [trustCount, setTrustCount] = useState(0);
  const [carsCount, setCarsCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const targetCars = typeof vaultCount === 'number' ? vaultCount : 0;

    const animateCounters = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setPointsCount(Math.floor(easeOut * 210));
      setTrustCount(Math.floor(easeOut * 100));
      setCarsCount(Math.floor(easeOut * targetCars));

      if (progress < 1) {
        requestAnimationFrame(animateCounters);
      }
    };

    requestAnimationFrame(animateCounters);
  }, [vaultCount]);

  return (
    <section id="hero-section" className="relative min-h-[560px] lg:min-h-[660px] flex items-center bg-transparent border-b border-white/[0.08]">
      {/* Background Image & Atmospheric Layers - Fixed to viewport so it does not move while scrolling */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/vault-wallpaper.jpg"
          alt="Certified preowned curated vehicle showroom"
          className="w-full h-full object-cover object-center opacity-55 lg:opacity-75 transition-opacity duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Obsidian Vignette and Lighting Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C10] via-[#0F1115]/90 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-transparent to-[#0A0C10]/80"></div>
        {/* Dynamic breathing red manifold ambient glow */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#E5252A]/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:py-14 lg:py-20 w-full">
        <div className="max-w-2xl lg:max-w-3xl">
          {/* Top Pill Badge matching mobile layout */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181A22]/90 border border-white/[0.1] text-xs font-mono mb-5 backdrop-blur-sm shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5252A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5252A] shadow-[0_0_8px_#E5252A]"></span>
            </span>
            <span className="text-[#ECE5D8] font-bold tracking-wider text-[10px] sm:text-xs uppercase">
              PROVENANCE INSPECTED &amp; SECURED
            </span>
          </div>

          {/* Main Display Headline with stacked lines and red underline */}
          <div className="mb-4 sm:mb-5">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-[#ECE5D8] leading-[1.08] tracking-tight uppercase">
              <span className="block text-white">CERTIFIED PREOWNED</span>
              <span className="block text-white">CAR MARKETPLACE</span>
            </h1>
            {/* Red Accent Underline Bar */}
            <div className="h-1 bg-[#E5252A] mt-2.5 w-full max-w-[280px] sm:max-w-[340px] rounded-full shadow-[0_0_12px_#E5252A]"></div>
          </div>

          {/* Subtitle / Paragraph */}
          <p className="text-[#94A3B8] text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8 font-sans max-w-xl text-center sm:text-left mx-auto sm:mx-0">
            Every vehicle undergoes rigorous multi-point mechanical inspection. 100% verified provenance, clean title and transparent documentation.
          </p>

          {/* Mobile Stacked / Desktop Inline CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-10 w-full sm:w-auto">
            <button
              id="hero-explore-vault-btn"
              onClick={onExploreVault}
              className="w-full sm:w-auto relative overflow-hidden bg-[#E5252A] hover:bg-[#c00017] active:scale-[0.98] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(229,37,42,0.4)] hover:shadow-[0_0_30px_rgba(229,37,42,0.65)] flex items-center justify-center text-center gap-2 group cursor-pointer"
            >
              <span className="absolute inset-0 w-1/2 h-full bg-white/25 pointer-events-none animate-shimmer"></span>
              <span className="relative z-10 text-center">EXPLORE VERIFIED VAULT</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform relative z-10" />
            </button>

            <button
              id="hero-test-drive-btn"
              onClick={onScheduleTestDrive}
              className="w-full sm:w-auto bg-[#1C2028] hover:bg-[#252A36] active:scale-[0.98] border border-white/10 hover:border-white/20 text-[#ECE5D8] font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 px-6 rounded-lg transition-all flex items-center justify-center text-center gap-2.5 cursor-pointer shadow-lg"
            >
              <Calendar className="w-4 h-4 text-[#ECE5D8] opacity-80" />
              <span className="text-center">BOOK TEST DRIVE</span>
            </button>
          </div>

          {/* Bottom 3-Column Stats Card Bar with Divider Lines */}
          <div className="w-full max-w-lg bg-[#12141C]/90 border border-white/[0.08] rounded-lg divide-x divide-white/[0.08] grid grid-cols-3 text-center py-3.5 px-2 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col items-center justify-center px-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                {pointsCount}-PT
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mt-1">
                MASTER INSPECTION
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                {trustCount}%
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mt-1">
                VERIFIED TITLE
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-[#E5252A] tracking-tight tabular-nums">
                {carsCount > 0 ? carsCount : 17}+
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mt-1">
                CARS IN VAULT
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

