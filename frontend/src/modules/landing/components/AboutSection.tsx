import React from 'react';
import {
  CheckCircle2,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const commitments = [
    {
      title: '100% Unified Digital Health Records',
      description:
        'Zero paper bottlenecks. Diagnostic reports, doctor notes, and pharmacy orders are permanently accessible via encrypted portals with real-time auditability.',
    },
    {
      title: 'Architected for Clinical Precision & Sterility',
      description:
        'Positive-pressure laminar airflow operating suites, continuous microbiological air sampling, and strict hospital-acquired infection (HAI) prevention protocols.',
    },
    {
      title: 'Frictionless Administrative Workflows',
      description:
        'Transparent consultation fees, upfront itemized estimates for inpatient care, and automated insurance pre-authorization to eliminate discharge delays.',
    },
  ];

  const facilitySpecs = [
    { label: 'Licensed Inpatient Beds', value: '150+' },
    { label: 'Modular Surgical Theaters', value: '3' },
    { label: 'Intensive Critical Care Units', value: '12 Beds' },
    { label: 'In-House Automated Pathology', value: '24/7' },
  ];

  return (
    <section id="about" className="bg-[#0A0A0A] py-20 lg:py-28 border-t border-[#1C1C1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column (7 cols): Vision, Mission & Narrative */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <span className="text-xs font-mono tracking-widest text-[#8E8E93] uppercase font-semibold">
                About Our Facility
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight mb-6">
              Modern Clinical Infrastructure Meets Compassionate Care.
            </h2>
            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed mb-6">
              Located in the heart of Darbhanga, Bihar, Aura Hospital was conceived to bridge the gap
              between advanced metropolitan tertiary care standards and regional accessibility. We have
              eliminated the chronic delays, misplaced paper folders, and diagnostic opacity that
              characterize legacy healthcare institutions.
            </p>
            <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed mb-10">
              Through our unified Hospital Management System, our medical teams, nursing departments,
              and pharmaceutical dispensary collaborate instantaneously on a shared digital backbone.
            </p>

            {/* Commitments List */}
            <div className="space-y-6">
              {commitments.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-white tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Facility Specifications & Accreditation Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#121212] border border-[#242424] rounded-2xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between pb-6 border-b border-[#202020] mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-white">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Aura Central Campus</div>
                    <div className="text-xs font-mono text-[#71717A]">
                      Darbhanga, Bihar • India
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#1B1B1B] text-[#A1A1AA] border border-[#2D2D2D]">
                  Level II
                </span>
              </div>

              {/* Grid of 4 Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {facilitySpecs.map((spec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#161616] border border-[#222222] flex flex-col justify-between"
                  >
                    <span className="text-2xl font-light text-white tracking-tight mb-1">
                      {spec.value}
                    </span>
                    <span className="text-[11px] font-mono text-[#8E8E93] leading-tight">
                      {spec.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Accreditation and Standards strip */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-medium">
                  <ShieldCheck size={14} className="text-white" />
                  <span>Clinical Clearance & Compliance</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Registered under State Clinical Establishments Act • Biomedical Waste Management
                  Certified • 100% NABH Nursing Standards Compliant.
                </p>
              </div>

              {/* Location Footer Note */}
              <div className="mt-6 pt-4 border-t border-[#1C1C1C] text-[11px] font-mono text-[#71717A] flex items-center justify-between">
                <span>Coordinates: 26.1542° N, 85.8918° E</span>
                <span>Bihar 846004</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
