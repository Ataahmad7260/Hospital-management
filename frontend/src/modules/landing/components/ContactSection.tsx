import React from 'react';
import { Phone, Mail, MapPin, Ambulance, ArrowRight } from 'lucide-react';

interface ContactSectionProps {
  onLoginClick: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onLoginClick }) => {
  return (
    <section id="contact" className="bg-[#0D0D0D] py-20 lg:py-24 border-t border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="text-xs font-mono tracking-widest text-[#8E8E93] uppercase font-semibold">
              Emergency & Reception
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight leading-tight mb-4">
            Connect with Aura Hospital
          </h2>
          <p className="text-sm sm:text-base text-[#8E8E93] font-normal leading-relaxed">
            Direct communication channels for emergency resuscitation triage, appointment
            scheduling, diagnostic inquiries, and patient navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Card 1: 24/7 Emergency Casualty */}
          <div className="bg-[#121212] border border-[#222222] hover:border-[#333333] rounded-2xl p-6 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-white mb-4">
              <Ambulance size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Emergency Casualty</h3>
            <p className="text-xs text-[#8E8E93] mb-4">
              Direct hotline to emergency triage & trauma team.
            </p>
            <a
              href="tel:+916272250100"
              className="text-sm font-mono font-medium text-white hover:underline block"
            >
              +91 6272 250 100
            </a>
            <span className="text-[10px] font-mono text-emerald-400 mt-1 inline-block">
              ● 24/7 Active Line
            </span>
          </div>

          {/* Card 2: General Appointments */}
          <div className="bg-[#121212] border border-[#222222] hover:border-[#333333] rounded-2xl p-6 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-white mb-4">
              <Phone size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">OPD Appointments</h3>
            <p className="text-xs text-[#8E8E93] mb-4">
              Consultation booking & specialist desk.
            </p>
            <a
              href="tel:+916272250101"
              className="text-sm font-mono font-medium text-white hover:underline block"
            >
              +91 6272 250 101
            </a>
            <span className="text-[10px] font-mono text-[#8E8E93] mt-1 inline-block">
              Mon - Sat • 08:00 - 20:00
            </span>
          </div>

          {/* Card 3: Clinical Administration */}
          <div className="bg-[#121212] border border-[#222222] hover:border-[#333333] rounded-2xl p-6 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-white mb-4">
              <Mail size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Email Inquiries</h3>
            <p className="text-xs text-[#8E8E93] mb-4">
              Medical records, billing & institutional inquiries.
            </p>
            <a
              href="mailto:contact@aurahospital.org"
              className="text-sm font-mono font-medium text-white hover:underline block truncate"
            >
              contact@aurahospital.org
            </a>
            <span className="text-[10px] font-mono text-[#8E8E93] mt-1 inline-block">
              Response within 2 hours
            </span>
          </div>

          {/* Card 4: Physical Location */}
          <div className="bg-[#121212] border border-[#222222] hover:border-[#333333] rounded-2xl p-6 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-white mb-4">
              <MapPin size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Campus Location</h3>
            <p className="text-xs text-[#8E8E93] mb-2 leading-relaxed">
              Station Road, Near Medical College,
              <br />
              Darbhanga, Bihar 846004
            </p>
            <span className="text-[10px] font-mono text-[#8E8E93] inline-block">
              Ample Ambulatory Parking
            </span>
          </div>
        </div>

        {/* Call to action portal banner */}
        <div className="rounded-2xl border border-[#2B2B2B] bg-[#141414] p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-2">
              Ready to Access Your Digital Health Record?
            </h3>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-xl leading-relaxed">
              Patients, doctors, and pharmacy personnel can sign in to view consultation history,
              electronic prescriptions, lab tests, and hospital ledger.
            </p>
          </div>
          <button
            onClick={onLoginClick}
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-black font-medium text-xs sm:text-sm hover:bg-[#E5E5E5] transition-all cursor-pointer group"
          >
            <span>Launch Clinical Portal</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </button>
        </div>
      </div>
    </section>
  );
};
