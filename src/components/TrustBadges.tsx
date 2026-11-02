import React from 'react';
import { ShieldCheck, Gauge, CheckCircle2, Award } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const BADGES = [
    {
      title: 'Comprehensive Diagnostic Verified',
      subtitle: 'Chassis & electronic telemetry diagnostics',
      icon: ShieldCheck,
    },
    {
      title: 'Test Drive Available',
      subtitle: 'VIP city route or open highway road experience',
      icon: Gauge,
    },
    {
      title: 'Clean Title Guarantee',
      subtitle: 'Zero structural or collision anomalies',
      icon: CheckCircle2,
    },
    {
      title: '100% Trustworthy',
      subtitle: 'Verified provenance & transparent handovers',
      icon: Award,
    },
  ];

  return (
    <section className="bg-[#171922] border-b border-white/[0.08] py-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BADGES.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="group flex items-center gap-3.5 p-3 rounded bg-[#0F1115]/60 hover:bg-[#0F1115] border border-white/[0.05] hover:border-[#E5252A]/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded bg-[#171922] border border-white/[0.1] group-hover:border-[#E5252A]/40 flex items-center justify-center text-[#E5252A] group-hover:scale-110 shrink-0 transition-all duration-200">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#ECE5D8] group-hover:text-white transition-colors font-display uppercase tracking-wide">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] font-sans">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
