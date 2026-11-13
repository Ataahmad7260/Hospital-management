import React from 'react';
import { ArrowRight, ChevronRight, PhoneCall } from 'lucide-react';

interface HeroProps {
  onLoginClick: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onLoginClick, onExploreClick }) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#0A0A0A] pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Subtle Architectural Grid Background & Ambient Monochrome Flare */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1F1F1F 1px, transparent 1px), linear-gradient(to bottom, #1F1F1F 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#222222]/40 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
        <div className="max-w-4xl mx-auto sm:mx-0">
          {/* Live Status Badge: Emergency Care Open 24/7 with Pulsing Emerald Dot */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#262626] shadow-xs mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4D4D8] font-medium">
              Emergency Care Open 24/7
            </span>
            <span className="text-[#3F3F46]">•</span>
            <span className="text-[11px] font-mono text-[#A1A1AA] hidden sm:inline">
              ICU & Ambulance Standing By
            </span>
          </div>

          {/* Main Headline: Large, elegant light font */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.08] mb-6">
            Advanced Healthcare, <br />
            <span className="font-normal text-white">Delivered with Compassion.</span>
          </h1>

          {/* Subtitle: Brief, reassuring description of integrated digital platform */}
          <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] font-normal leading-relaxed max-w-2xl mb-10">
            Aura Hospital unites senior multi-specialty clinicians, state-of-the-art diagnostic
            laboratories, and secure electronic health records to deliver precision medical outcomes
            for you and your family.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4 mb-12">
            {/* Primary Button: Solid White */}
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white text-black font-medium text-sm tracking-wide hover:bg-[#EAEAEA] active:scale-[0.99] transition-all duration-200 shadow-md cursor-pointer group"
            >
              <span>Access Patient Portal</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </button>

            {/* Secondary Button: Dark Outline */}
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#2E2E2E] bg-[#121212]/80 hover:bg-[#1A1A1A] hover:border-[#444444] text-[#EDEDED] font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer"
            >
              <span>Explore Services</span>
              <ChevronRight size={16} className="text-[#71717A]" />
            </button>
          </div>

          {/* Direct Hotline Strip */}
          <div className="pt-8 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#8E8E93]">
            <div className="flex items-center gap-2">
              <PhoneCall size={14} className="text-[#A1A1AA]" />
              <span>Direct Emergency Triage:</span>
              <a
                href="tel:+916272250100"
                className="text-white font-medium hover:underline tracking-wider"
              >
                +91 6272 250 100
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F3F46]" />
              <span>Accreditation: NABH Compliant Clinical Standards</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
