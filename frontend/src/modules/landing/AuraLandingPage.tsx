import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatsBar } from './components/StatsBar';
import { ServicesGrid } from './components/ServicesGrid';
import { SpecialistsSection } from './components/SpecialistsSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

interface AuraLandingPageProps {
  onNavigateToLogin: () => void;
}

export const AuraLandingPage: React.FC<AuraLandingPageProps> = ({ onNavigateToLogin }) => {
  useEffect(() => {
    // Set page title for Aura Hospital
    document.title = 'Aura Hospital | Advanced Healthcare & Digital Clinical Portal';
  }, []);

  const handleExploreServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      const topOffset = 80;
      const elementPosition = servicesSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectService = (_serviceName: string) => {
    // Smoothly route to login / consultation booking
    onNavigateToLogin();
  };

  const handleBookConsultation = (_doctorName: string) => {
    // Route to login to book consultation slot
    onNavigateToLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#EDEDED] font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden">
      {/* 1. Sticky Top Navigation Bar */}
      <Navbar onLoginClick={onNavigateToLogin} />

      <main className="w-full">
        {/* 2. Hero Section with Live Status Badge & Headline */}
        <Hero
          onLoginClick={onNavigateToLogin}
          onExploreClick={handleExploreServices}
        />

        {/* 3. Quick Info & Statistics Bar */}
        <StatsBar />

        {/* 4. Comprehensive Medical Services Grid (01 - 06) */}
        <ServicesGrid onSelectService={handleSelectService} />

        {/* 5. Medical Specialists Section */}
        <SpecialistsSection onBookConsultation={handleBookConsultation} />

        {/* 6. About Our Facility Section (2-Column Architectural Layout) */}
        <AboutSection />

        {/* 7. Emergency Triage & Contact Section */}
        <ContactSection onLoginClick={onNavigateToLogin} />
      </main>

      {/* 8. Footer with Darbhanga, Bihar Location & Quick Links */}
      <Footer onLoginClick={onNavigateToLogin} />
    </div>
  );
};

