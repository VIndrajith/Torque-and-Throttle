import React from 'react';
import { Phone, Mail, Clock, MapPin, ChevronRight } from 'lucide-react';

interface FooterProps {
  onNavigateSection?: (sectionId: string) => void;
  onOpenConcierge?: () => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onOpenConcierge,
  onNavigateAdmin,
}) => {
  const handleLinkClick = (action: string) => {
    if (action === 'home') {
      if (onNavigateSection) onNavigateSection('hero');
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'cars') {
      if (onNavigateSection) onNavigateSection('inventory');
      else document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'bikes') {
      if (onOpenConcierge) onOpenConcierge();
      else document.getElementById('custom-request-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'about') {
      if (onNavigateSection) onNavigateSection('how-it-works');
      else document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'contact') {
      if (onOpenConcierge) onOpenConcierge();
      else if (onNavigateSection) onNavigateSection('test-drive');
    } else if (action === 'test-drive') {
      if (onNavigateSection) onNavigateSection('test-drive');
      else document.getElementById('test-drive-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="app-footer"
      className="relative z-10 bg-[#07080B] text-[#94A3B8] pt-16 pb-6 overflow-hidden border-t border-white/[0.08]"
    >
      {/* Decorative Automotive Silhouette on Far Right matching reference */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[45%] pointer-events-none select-none overflow-hidden opacity-30 lg:opacity-50">
        <svg
          viewBox="0 0 500 350"
          className="w-full h-full object-cover object-right"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5252A" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#FF1E27" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#07080B" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="fadeEdge" cx="100%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#07080B" stopOpacity="0" />
              <stop offset="100%" stopColor="#07080B" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Car Rear Silhouette curves */}
          <path
            d="M 180 350 C 220 280, 270 210, 340 180 C 400 150, 460 140, 500 130 L 500 350 Z"
            fill="#0B0D13"
          />
          <path
            d="M 320 185 C 380 155, 440 145, 500 135"
            stroke="white"
            strokeOpacity="0.08"
            strokeWidth="1.5"
          />
          {/* Wheel arch contour */}
          <path
            d="M 280 350 C 290 280, 360 270, 420 310"
            stroke="white"
            strokeOpacity="0.06"
            strokeWidth="2"
          />
          {/* Glowing Red LED Taillight Strip */}
          <path
            d="M 330 200 C 370 190, 430 185, 495 192"
            stroke="url(#redGlow)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="blur(3px)"
          />
          <path
            d="M 330 200 C 370 190, 430 185, 495 192"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 340 212 C 380 202, 440 198, 495 204"
            stroke="#E5252A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          {/* Rear quarter panel highlight */}
          <path
            d="M 210 350 C 250 260, 310 210, 420 170"
            stroke="#E5252A"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10">
        {/* Main 4-Column Layout - optimized mobile alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 text-center sm:text-left">
          
          {/* Column 1: Brand & Passion (3.5 cols) */}
          <div className="lg:col-span-3 space-y-4 flex flex-col items-center sm:items-start">
            {/* Turbo Logo Circular Badge */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <img
                  src="/logo-icon.jpg"
                  alt="Torque & Throttle Logo"
                  className="w-full h-full object-contain rounded-full shadow-[0_0_15px_rgba(229,37,42,0.45)] ring-1 ring-[#E5252A]/40"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h3 className="font-display text-lg sm:text-xl font-black text-[#ECE5D8] tracking-wider leading-none uppercase">
                  TORQUE &amp; THROTTLE
                </h3>
              </div>
            </div>

            {/* Tagline row */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#ECE5D8] uppercase">
              <span>CARS</span>
              <span className="text-[#E5252A] font-black">|</span>
              <span>BIKES</span>
              <span className="text-[#E5252A] font-black">|</span>
              <span>COMMUNITY</span>
            </div>

            <div className="text-xs text-[#94A3B8] leading-relaxed pt-0.5">
              <p>Handpicked. Verified.</p>
              <p>Certified Preowned Quality guaranteed.</p>
            </div>

            {/* Red horizontal accent */}
            <div className="w-8 h-[2px] bg-[#E5252A] mx-auto sm:mx-0"></div>

            {/* More Than Machines script & slogan */}
            <div className="pt-1 text-center sm:text-left">
              <div
                className="text-2xl sm:text-[28px] text-[#ECE5D8] font-normal leading-tight"
                style={{ fontFamily: "'Satisfy', 'Caveat', cursive" }}
              >
                More Than Machines
              </div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E5252A] mt-1">
                IT'S A PASSION
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links (2.5 cols) */}
          <div className="hidden sm:flex lg:col-span-3 space-y-3 flex-col items-center sm:items-start">
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#ECE5D8]">
                QUICK LINKS
              </h4>
              <div className="w-8 h-[2px] bg-[#E5252A] mt-1.5 mx-auto sm:mx-0"></div>
            </div>

            <ul className="space-y-2.5 pt-2 text-xs font-sans w-full max-w-xs sm:max-w-none">
              <li>
                <button
                  onClick={() => handleLinkClick('home')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('cars')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>Cars for Sale</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('bikes')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>Bikes for Sale</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('about')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('contact')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>Contact Us</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('test-drive')}
                  className="flex items-center justify-center sm:justify-start gap-2 text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors group cursor-pointer text-center sm:text-left w-full sm:w-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#E5252A] transition-colors hidden sm:inline-block" />
                  <span>Schedule Test Drive</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Locations (3 cols) */}
          <div className="lg:col-span-3 space-y-3 flex flex-col items-center sm:items-start">
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#ECE5D8]">
                OUR LOCATIONS
              </h4>
              <div className="w-8 h-[2px] bg-[#E5252A] mt-1.5 mx-auto sm:mx-0"></div>
            </div>

            <div className="space-y-4 pt-2 w-full max-w-xs sm:max-w-none">
              {/* Location 1: Bangalore */}
              <div className="flex items-start justify-center sm:justify-start gap-3 text-center sm:text-left">
                <MapPin className="w-4 h-4 text-[#E5252A] fill-[#E5252A] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-[#ECE5D8] text-sm">Bangalore</div>
                  <div className="text-[#ECE5D8]/80">Torque &amp; Throttle</div>
                  <div className="text-[#94A3B8]">Bangalore, Karnataka, India</div>
                  <div className="italic text-[#94A3B8]/90 text-[11px] pt-0.5">
                    Your trusted pitstop in Bangalore
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[180px] border-b border-white/[0.08] mx-auto sm:mx-0"></div>

              {/* Location 2: Kerala */}
              <div className="flex items-start justify-center sm:justify-start gap-3 text-center sm:text-left">
                <MapPin className="w-4 h-4 text-[#E5252A] fill-[#E5252A] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-[#ECE5D8] text-sm">Kerala</div>
                  <div className="text-[#ECE5D8]/80">Torque &amp; Throttle</div>
                  <div className="text-[#94A3B8]">Kerala, India</div>
                  <div className="italic text-[#94A3B8]/90 text-[11px] pt-0.5">
                    Serving auto enthusiasts across Kerala
                  </div>
                </div>
              </div>

              {/* Road badge */}
              <div className="pt-3 flex items-center justify-center sm:justify-start gap-2.5 text-[#ECE5D8]">
                {/* Curved Road Icon */}
                <svg
                  viewBox="0 0 32 32"
                  className="w-5 h-5 text-[#94A3B8] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 6 28 C 12 18, 14 12, 16 4" />
                  <path d="M 26 28 C 22 18, 20 12, 19 4" />
                  <line x1="16" y1="26" x2="16" y2="22" strokeDasharray="2 2" strokeWidth="2" stroke="#E5252A" />
                  <line x1="17.5" y1="17" x2="17.5" y2="13" strokeDasharray="2 2" strokeWidth="2" stroke="#E5252A" />
                  <line x1="18" y1="8" x2="18" y2="5" strokeDasharray="2 2" strokeWidth="2" stroke="#E5252A" />
                </svg>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase font-bold text-[#ECE5D8]">
                  SAME PASSION. CLOSER TO YOU.
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Stay Connected & Questions (3.5 cols) */}
          <div className="lg:col-span-3 space-y-3 flex flex-col items-center sm:items-start">
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#ECE5D8]">
                STAY CONNECTED
              </h4>
              <div className="w-8 h-[2px] bg-[#E5252A] mt-1.5 mx-auto sm:mx-0"></div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed pt-2 text-center sm:text-left">
              Follow our journey for the latest stock, updates and automotive content.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center justify-center sm:justify-start gap-3.5 pt-1">
              {/* Instagram Button */}
              <a
                href="https://www.instagram.com/_torqueandthrottle_/"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-instagram-link"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md hover:scale-105 hover:shadow-[0_0_15px_rgba(220,39,67,0.5)] transition-all cursor-pointer"
                title="Follow Torque & Throttle on Instagram"
                aria-label="Follow Torque & Throttle on Instagram"
              >
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/919400581250"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-whatsapp-link"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md hover:scale-105 hover:shadow-[0_0_15px_rgba(37,211,102,0.5)] transition-all cursor-pointer"
                title="Chat with Torque & Throttle on WhatsApp"
                aria-label="Chat with Torque & Throttle on WhatsApp"
              >
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>

            {/* Instagram Handle Text */}
            <div className="pt-0.5 text-center sm:text-left">
              <a
                href="https://www.instagram.com/_torqueandthrottle_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors"
              >
                @_torqueandthrottle_
              </a>
            </div>

            <div className="w-full max-w-[180px] border-b border-white/[0.08] my-3 mx-auto sm:mx-0"></div>

            {/* Have a question? */}
            <div className="space-y-2 pt-1 flex flex-col items-center sm:items-start w-full">
              <div className="font-display text-xs font-bold uppercase tracking-wider text-[#ECE5D8] text-center sm:text-left">
                HAVE A QUESTION?
              </div>

              <div className="space-y-2 text-xs w-full max-w-xs sm:max-w-none">
                {/* Phone */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#E5252A] shrink-0" />
                  <a
                    href="tel:+919400581250"
                    className="text-[#ECE5D8] hover:text-[#E5252A] font-semibold tracking-wide transition-colors"
                  >
                    +91 9400581250
                  </a>
                </div>

                {/* Email */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-[#E5252A] shrink-0" />
                  <a
                    href="mailto:sudhakaransanjay921@gmail.com"
                    className="text-[#ECE5D8]/90 hover:text-[#E5252A] transition-colors truncate"
                  >
                    sudhakaransanjay921@gmail.com
                  </a>
                </div>

                {/* Hours */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 text-[#94A3B8]">
                  <Clock className="w-3.5 h-3.5 text-[#E5252A] shrink-0" />
                  <span>Mon – Sun : 9:00 AM – 8:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Red Accent Divider matching the reference image */}
        <div className="w-full h-[1px] bg-[#E5252A] mt-6 mb-5"></div>

        {/* Bottom Bar: Copyright | Drive-Explore-Belong | Location Flag */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          {/* Copyright */}
          <div className="flex items-center gap-3">
            <span>&copy; 2025 Torque &amp; Throttle. All rights reserved.</span>
          </div>

          {/* Slogan with red dividers */}
          <div className="flex items-center gap-2.5 text-xs font-bold tracking-[0.22em] text-[#ECE5D8] uppercase">
            <span>DRIVE</span>
            <span className="text-[#E5252A] font-black">|</span>
            <span>EXPLORE</span>
            <span className="text-[#E5252A] font-black">|</span>
            <span>BELONG</span>
          </div>

          {/* Locations & India Flag */}
          <div className="flex items-center gap-2 text-xs text-[#ECE5D8]/90">
            <span>Bangalore</span>
            <span className="text-white/20">|</span>
            <span>Kerala</span>
            <span className="text-white/20">|</span>
            <span>India</span>
            <span className="text-base leading-none" role="img" aria-label="India flag">
              🇮🇳
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
