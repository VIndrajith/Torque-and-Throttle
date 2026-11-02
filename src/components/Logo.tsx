import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'vertical' | 'badge-only';
  showSubtext?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  layout = 'horizontal',
  showSubtext = false,
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const badgeDimensions = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  const textSizes = {
    sm: 'text-sm font-black tracking-wider leading-none',
    md: 'text-base sm:text-lg font-black tracking-wider leading-tight',
    lg: 'text-2xl sm:text-3xl font-black tracking-wider leading-tight',
    xl: 'text-3xl sm:text-4xl font-black tracking-wider leading-tight',
  };

  // Standalone full emblem badge
  if (layout === 'badge-only') {
    return (
      <div
        id="torque-throttle-logo-badge"
        className={`relative inline-flex items-center justify-center overflow-hidden rounded select-none ${badgeDimensions[size]} ${className}`}
      >
        <img
          src="/logo.jpg"
          alt="Torque & Throttle"
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(229,37,42,0.4)]"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    );
  }

  // Vertical stacked emblem
  if (layout === 'vertical') {
    return (
      <div
        id="torque-throttle-logo-vertical"
        className={`flex flex-col items-center select-none text-center ${className}`}
      >
        <div className={`relative ${iconDimensions[size]} flex items-center justify-center mb-2`}>
          <img
            src="/logo-icon.jpg"
            alt="Torque & Throttle Emblem"
            className="w-full h-full object-contain rounded-full shadow-[0_0_15px_rgba(229,37,42,0.45)]"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-display text-[#ECE5D8] uppercase tracking-wider ${textSizes[size]}`}>
            TORQUE &amp;
          </span>
          <span className={`font-display text-[#ECE5D8] uppercase tracking-wider ${textSizes[size]}`}>
            THROTTLE
          </span>
          {showSubtext && (
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5252A] font-mono font-bold mt-1.5">
              Certified Preowned Car Marketplace
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal lockup (Default for Navbar and Header bars)
  return (
    <div
      id="torque-throttle-logo-horizontal"
      className={`flex items-center select-none gap-3 ${className}`}
    >
      {/* Official circular turbocharger badge */}
      <div
        className={`relative ${iconDimensions[size]} shrink-0 flex items-center justify-center`}
      >
        <img
          src="/logo-icon.jpg"
          alt="Torque & Throttle Badge"
          className="w-full h-full object-contain rounded-full shadow-[0_0_15px_rgba(229,37,42,0.45)] ring-1 ring-[#E5252A]/40"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display text-[#ECE5D8] uppercase tracking-wider font-black ${textSizes[size]}`}
            style={{ letterSpacing: '0.04em' }}
          >
            TORQUE &amp; THROTTLE
          </span>
        </div>
        {showSubtext && (
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#94A3B8] font-mono font-semibold">
            Certified Preowned Car Marketplace
          </span>
        )}
      </div>
    </div>
  );
};
