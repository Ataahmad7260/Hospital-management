import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Shield } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Specialists', href: '#specialists' },
    { label: 'About Us', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'bg-[#0A0A0A] border-b border-[#1A1A1A]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <a
            href="#hero"
            onClick={(e) => handleScrollTo(e, '#hero')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#2B2B2B] group-hover:border-[#4B4B4B] flex items-center justify-center font-mono font-bold text-sm tracking-tight text-white transition-colors duration-200 shadow-sm">
              H+
            </div>
            <div className="flex flex-col">
              <span className="text-white text-base sm:text-lg font-medium tracking-tight group-hover:text-[#EDEDED] transition-colors">
                Aura Hospital
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase -mt-0.5">
                Medical & Surgical Institute
              </span>
            </div>
          </a>

          {/* Desktop Navigation Anchor Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-sm font-normal text-[#A1A1AA] hover:text-white transition-colors duration-200 tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action: Patient Login Outline Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#333333] hover:border-white text-white hover:text-black bg-transparent hover:bg-white text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer shadow-xs group"
            >
              <span>Patient Login</span>
              <ArrowUpRight
                size={14}
                className="text-[#888888] group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onLoginClick}
              className="px-3.5 py-1.5 rounded-full border border-[#333333] text-white text-xs font-medium hover:bg-white hover:text-black transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#161616] border border-transparent hover:border-[#262626] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#222222] bg-[#0E0E0E] px-4 pt-4 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="px-3 py-2 rounded-md text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-[#181818] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#222222]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-[#E5E5E5] transition-colors"
            >
              <Shield size={15} />
              <span>Access Patient Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

