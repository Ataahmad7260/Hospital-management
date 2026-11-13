import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Baby,
  FlaskConical,
  Ambulance,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

interface ServicesGridProps {
  onSelectService: (serviceName: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({ onSelectService }) => {
  const services = [
    {
      number: '01',
      title: 'General Medicine',
      department: 'Internal Medicine & Preventative Care',
      description:
        'Comprehensive diagnostics and personalized treatment plans for acute ailments, lifestyle diseases, diabetes management, and chronic adult disorders.',
      icon: Stethoscope,
      capabilities: [
        'Preventative Health Screenings',
        'Hypertension & Glycemic Control',
        'Adult Immunization Programs',
        'Continuous Health Monitoring',
      ],
    },
    {
      number: '02',
      title: 'Cardiology & Vascular',
      department: 'Heart Health & Hemodynamics',
      description:
        'Dedicated cardiac monitoring and non-invasive cardiovascular evaluations, supported by digital 12-lead ECG, 2D echocardiography, and intensive telemetry.',
      icon: HeartPulse,
      capabilities: [
        'Digital 12-Lead Electrocardiography',
        'Color Doppler Echocardiography',
        'Coronary Risk Assessment',
        'Post-Infarction Rehabilitation',
      ],
    },
    {
      number: '03',
      title: 'Pediatrics & Neonatal Care',
      department: 'Child Health & Development',
      description:
        'Compassionate medical care from newborns through adolescence, featuring specialized neonatal observation, growth milestone tracking, and immunizations.',
      icon: Baby,
      capabilities: [
        'Newborn Screening & Phototherapy',
        'Complete Pediatric Vaccination Schedule',
        'Nutritional & Growth Analytics',
        'Pediatric Emergency Response',
      ],
    },
    {
      number: '04',
      title: 'Diagnostics & Pathology',
      department: 'Laboratory & Diagnostic Imaging',
      description:
        'Fully automated clinical pathology, digital hematology, microbiology, and clinical biochemistry delivering fast, accurate, cloud-synchronized test reports.',
      icon: FlaskConical,
      capabilities: [
        'Automated Blood & Serum Profiling',
        'Rapid Point-of-Care Testing (POCT)',
        'Culture & Sensitivity Diagnostics',
        'Digital Cloud Report Delivery',
      ],
    },
    {
      number: '05',
      title: 'Emergency & Trauma Care',
      department: 'Acute Resuscitation & Critical Care',
      description:
        'Level-II emergency response pavilion equipped with motorized resuscitation bays, rapid triage protocols, emergency oxygen pipelines, and ambulance dispatch.',
      icon: Ambulance,
      capabilities: [
        '24/7 Rapid Triage & Stabilization',
        'Advanced Cardiac Life Support (ACLS)',
        'Poly-trauma & Fracture Resuscitation',
        'Immediate ICU Direct Intake',
      ],
    },
    {
      number: '06',
      title: 'Surgery & Recovery',
      department: 'Operative Suites & Post-Op Ward',
      description:
        'Modern surgical suites with laminar airflow HEPA filtration, minimally invasive laparoscopic equipment, dedicated post-anesthesia recovery, and sterile nursing wards.',
      icon: Activity,
      capabilities: [
        'Minimally Invasive Laparoscopic Surgery',
        'General & Gastrointestinal Procedures',
        'Strict Sterile Infection Protocol',
        'Post-Operative Pain Management',
      ],
    },
  ];

  return (
    <section id="services" className="bg-[#0A0A0A] py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="text-xs font-mono tracking-widest text-[#8E8E93] uppercase font-semibold">
              Departments & Clinical Centers
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight mb-4">
            Comprehensive Medical Services
          </h2>
          <p className="text-sm sm:text-base text-[#8E8E93] font-normal leading-relaxed">
            Every clinical specialty at Aura Hospital operates with unified digital record-keeping,
            senior attending physicians, and transparent pricing structures designed for patient comfort.
          </p>
        </div>

        {/* 6 Service Cards Grid (2 rows x 3 columns on large screens) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.number}
                className="bg-[#121212] border border-[#222222] hover:border-[#444444] rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 group hover:bg-[#141414] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                <div>
                  {/* Top: Number & Category Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-medium tracking-widest text-[#666666] group-hover:text-white transition-colors duration-200">
                      {service.number}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-[#181818] border border-[#2B2B2B] group-hover:border-[#444444] flex items-center justify-center text-[#A1A1AA] group-hover:text-white transition-all duration-200">
                      <Icon size={20} />
                    </div>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-xl font-medium text-white tracking-tight mb-1 group-hover:text-white transition-colors">
                    {service.title}
                  </h3>
                  <div className="text-xs font-mono text-[#71717A] mb-4">
                    {service.department}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-2 pt-4 border-t border-[#1C1C1C]">
                    {service.capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[11px] font-mono text-[#A1A1AA]"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#52525B]" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-8 pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#666666] uppercase tracking-wider">
                    Available Daily
                  </span>
                  <button
                    onClick={() => onSelectService(service.title)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] group-hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Consult Department</span>
                    <ArrowUpRight
                      size={14}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

