import React from 'react';
import { ArrowUpRight, Phone, Mail, MapPin, Shield } from 'lucide-react';

interface FooterProps {
  onLoginClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLoginClick }) => {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <footer className="bg-[#080808] border-t border-[#1C1C1C] text-[#8E8E93] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#1A1A1A]">
          {/* Col 1: Brand & Mission (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2B2B2B] flex items-center justify-center font-mono font-bold text-xs tracking-tight text-white">
                H+
              </div>
              <span className="text-white text-base font-semibold tracking-tight">
                Aura Hospital
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#71717A] max-w-sm">
              A modern healthcare and surgical institute committed to evidence-based medicine,
              streamlined patient workflows, and zero-compromise clinical sterility.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121212] border border-[#222222] text-[11px] font-mono text-[#D4D4D8]">
                <Shield size={12} className="text-white" />
                <span>NABH Accredited Facility</span>
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white font-medium">
              Navigation
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleScrollTo(e, '#services')}
                  className="hover:text-white transition-colors"
                >
                  Services & Clinics
                </a>
              </li>
              <li>
                <a
                  href="#specialists"
                  onClick={(e) => handleScrollTo(e, '#specialists')}
                  className="hover:text-white transition-colors"
                >
                  Medical Specialists
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleScrollTo(e, '#about')}
                  className="hover:text-white transition-colors"
                >
                  About Our Facility
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleScrollTo(e, '#contact')}
                  className="hover:text-white transition-colors"
                >
                  Emergency Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Clinical Portals (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white font-medium">
              Digital Portals
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={onLoginClick}
                  className="hover:text-white transition-colors flex items-center gap-1 text-left cursor-pointer"
                >
                  <span>Patient Health Records</span>
                  <ArrowUpRight size={11} className="text-[#666666]" />
                </button>
              </li>
              <li>
                <button
                  onClick={onLoginClick}
                  className="hover:text-white transition-colors flex items-center gap-1 text-left cursor-pointer"
                >
                  <span>Doctor Clinical Desk</span>
                  <ArrowUpRight size={11} className="text-[#666666]" />
                </button>
              </li>
              <li>
                <button
                  onClick={onLoginClick}
                  className="hover:text-white transition-colors flex items-center gap-1 text-left cursor-pointer"
                >
                  <span>Pharmacist Dispensary</span>
                  <ArrowUpRight size={11} className="text-[#666666]" />
                </button>
              </li>
              <li>
                <button
                  onClick={onLoginClick}
                  className="hover:text-white transition-colors flex items-center gap-1 text-left cursor-pointer"
                >
                  <span>Administrator Clearance</span>
                  <ArrowUpRight size={11} className="text-[#666666]" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Location & Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white font-medium">
              Darbhanga Campus
            </div>
            <div className="space-y-2.5 text-xs text-[#8E8E93]">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#A1A1AA] shrink-0 mt-0.5" />
                <span>Station Road, Near Medical College, Darbhanga, Bihar 846004</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#A1A1AA] shrink-0" />
                <a href="tel:+916272250100" className="hover:text-white font-mono">
                  +91 6272 250 100 (Emergency)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#A1A1AA] shrink-0" />
                <a href="mailto:contact@aurahospital.org" className="hover:text-white font-mono">
                  contact@aurahospital.org
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#52525B]">
          <div>
            © {currentYear} Aura Hospital & Medical Institute. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">
              Patient Rights & Charter
            </span>
            <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">
              Clinical Quality Guidelines
            </span>
            <span className="text-[#3F3F46]">Darbhanga • Bihar</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

