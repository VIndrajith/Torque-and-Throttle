import React from 'react';
import { Layers, CreditCard, Truck, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const STEPS = [
    {
      num: '01',
      title: 'DIGITAL 360° & CHASSIS INSPECTION',
      desc: 'Scrutinize high-resolution paint meter depth scans, chassis laser straightness readouts, and listen to recorded cold-start engine acoustic feeds online.',
      subtext: 'Every cosmetic flaw documented down to 1mm.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'SEAMLESS CONCIERGE ALLOCATION',
      desc: 'Lock in your vehicle reservation and review certified condition reports with an assigned private curator with zero hassle.',
      subtext: 'Direct digital reservation with white-glove support.',
      icon: CreditCard,
    },
    {
      num: '03',
      title: 'DIRECT ENCLOSED DRIVEWAY DELIVERY',
      desc: 'Delivered directly to your driveway in a climate-controlled enclosed hauler, complete with full vehicle orientation, keys, and transfer documentation.',
      subtext: 'Direct-to-consumer digital startup handover at your doorstep.',
      icon: Truck,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#0F1115]/95 backdrop-blur-sm border-b border-white/[0.06] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header matching Image 3 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5252A]"></span>
            <span>FRICTIONLESS EXPERIENCE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#ECE5D8] tracking-tight uppercase mb-4">
            HOW TORQUE &amp; THROTTLE WORKS
          </h2>
          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed">
            From digital chassis inspection to enclosed flatbed delivery in your driveway, acquire certified preowned vehicles with complete confidence.
          </p>
        </div>

        {/* Animated Progression Track on Desktop */}
        <div className="hidden md:block relative h-1 bg-white/[0.06] mb-8 mx-16 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5252A] to-transparent w-1/3 animate-beam"></div>
        </div>

        {/* 3 Step Cards matching Image 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group bg-[#171922] border border-white/[0.08] hover:border-[#E5252A]/40 rounded-lg p-3.5 sm:p-7 flex flex-col justify-between relative shadow-md sm:shadow-xl hover:shadow-[0_12px_32px_-8px_rgba(229,37,42,0.22)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Upper edge highlight */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#E5252A]/50 transition-all"></div>

                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded bg-[#0F1115] border border-white/[0.1] group-hover:border-[#E5252A]/40 flex items-center justify-center text-[#E5252A] group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="font-display text-xl sm:text-3xl font-black text-[#E5252A]/70 group-hover:text-[#E5252A] font-mono transition-colors">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-display text-sm sm:text-lg font-bold text-[#ECE5D8] mb-1.5 sm:mb-3 leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-[#94A3B8] text-[11px] sm:text-xs leading-relaxed mb-3 sm:mb-6 font-sans text-center sm:text-left">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2.5 sm:pt-4 border-t border-white/[0.06] flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#ECE5D8]">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5252A] shrink-0" />
                  <span className="font-medium">{step.subtext}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
