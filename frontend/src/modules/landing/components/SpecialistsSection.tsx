import React from 'react';
import { Stethoscope, Calendar, Award, ArrowUpRight } from 'lucide-react';

interface SpecialistsSectionProps {
  onBookConsultation: (doctorName: string) => void;
}

export const SpecialistsSection: React.FC<SpecialistsSectionProps> = ({ onBookConsultation }) => {
  const specialists = [
    {
      name: 'Dr. Sarah Smith',
      role: 'Chief of Cardiology',
      specialty: 'Cardiology & Cardiovascular Care',
      qualifications: 'MBBS, MD (Cardiology), FACC',
      experience: '16+ Years Experience',
      availability: 'Mon - Fri • 09:00 AM - 02:00 PM',
      consultationFee: '₹750',
    },
    {
      name: 'Dr. Ahmed Farooq',
      role: 'Senior Consultant',
      specialty: 'Internal & General Medicine',
      qualifications: 'MBBS, MD (General Medicine)',
      experience: '12+ Years Experience',
      availability: 'Mon - Sat • 10:00 AM - 04:00 PM',
      consultationFee: '₹600',
    },
    {
      name: 'Dr. Fareed Zama',
      role: 'Consultant Surgeon',
      specialty: 'Orthopedics & Joint Restoration',
      qualifications: 'MBBS, MS (Orthopedics), MCh',
      experience: '14+ Years Experience',
      availability: 'Tue, Thu, Sat • 01:00 PM - 06:00 PM',
      consultationFee: '₹800',
    },
    {
      name: 'Dr. Elena Roy',
      role: 'Pediatric Specialist',
      specialty: 'Pediatrics & Neonatology',
      qualifications: 'MBBS, DNB (Pediatrics)',
      experience: '10+ Years Experience',
      availability: 'Mon - Sat • 09:00 AM - 01:00 PM',
      consultationFee: '₹550',
    },
  ];

  return (
    <section id="specialists" className="bg-[#0D0D0D] py-20 lg:py-28 border-t border-[#1F1F1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="text-xs font-mono tracking-widest text-[#8E8E93] uppercase font-semibold">
              Medical Faculty & Specialists
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight mb-4">
            Consult Our Attending Physicians
          </h2>
          <p className="text-sm sm:text-base text-[#8E8E93] font-normal leading-relaxed">
            Every specialist at Aura Hospital holds national and international clinical board
            certifications, bringing decades of diagnostic expertise to each consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialists.map((doc, idx) => (
            <div
              key={idx}
              className="bg-[#121212] border border-[#222222] hover:border-[#383838] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group hover:bg-[#141414]"
            >
              <div>
                {/* Doctor Avatar / Icon Placeholder */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#2C2C2C] flex items-center justify-center font-mono text-sm font-semibold text-white">
                    {doc.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(1, 3)
                      .join('')}
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#181818] border border-[#2A2A2A] text-[#9E9E9E]">
                    {doc.consultationFee}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white tracking-tight mb-0.5">
                  {doc.name}
                </h3>
                <div className="text-xs text-[#A1A1AA] font-medium mb-1">
                  {doc.role}
                </div>
                <div className="text-[11px] font-mono text-[#71717A] mb-4">
                  {doc.specialty}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[#1C1C1C] text-[11px] text-[#8E8E93]">
                  <div className="flex items-center gap-1.5">
                    <Award size={12} className="text-[#A1A1AA]" />
                    <span className="truncate">{doc.qualifications}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Stethoscope size={12} className="text-[#A1A1AA]" />
                    <span>{doc.experience}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#A1A1AA]" />
                    <span className="truncate">{doc.availability}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1C1C1C]">
                <button
                  onClick={() => onBookConsultation(doc.name)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#2E2E2E] group-hover:border-white text-xs font-medium text-white group-hover:bg-white group-hover:text-black transition-all duration-200 cursor-pointer"
                >
                  <span>Book Slot</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

