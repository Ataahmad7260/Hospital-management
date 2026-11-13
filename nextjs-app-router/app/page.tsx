'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { StatsBar } from '../../components/StatsBar';
import { ServicesGrid } from '../../components/ServicesGrid';
import { SpecialistsSection } from '../../components/SpecialistsSection';
import { AboutSection } from '../../components/AboutSection';
import { ContactSection } from '../../components/ContactSection';
import { Footer } from '../../components/Footer';

export default function AuraLandingNextPage() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

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

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#EDEDED] font-sans antialiased overflow-x-hidden">
      {/* 1. Sticky Top Navigation Bar */}
      <Navbar onLoginClick={handleNavigateToLogin} />

      <main className="w-full">
        {/* 2. Hero Section with Live Status Badge & Headline */}
        <Hero
          onLoginClick={handleNavigateToLogin}
          onExploreClick={handleExploreServices}
        />

        {/* 3. Quick Info & Statistics Bar */}
        <StatsBar />

        {/* 4. Comprehensive Medical Services Grid (01 - 06) */}
        <ServicesGrid onSelectService={() => handleNavigateToLogin()} />

        {/* 5. Medical Specialists Section */}
        <SpecialistsSection onBookConsultation={() => handleNavigateToLogin()} />

        {/* 6. About Our Facility Section (2-Column Architectural Layout) */}
        <AboutSection />

        {/* 7. Emergency Triage & Contact Section */}
        <ContactSection onLoginClick={handleNavigateToLogin} />
      </main>

      {/* 8. Footer with Darbhanga, Bihar Location & Quick Links */}
      <Footer onLoginClick={handleNavigateToLogin} />
    </div>
  );
}
