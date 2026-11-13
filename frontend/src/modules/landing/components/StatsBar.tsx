import React from 'react';
import { Clock, Users, ShieldCheck } from 'lucide-react';

export const StatsBar: React.FC = () => {
  const stats = [
    {
      metric: '24/7 / 365',
      title: '24/7 Emergency & Triage',
      description:
        'Around-the-clock emergency casualty, intensive care units (ICU), and on-call surgical specialists standing by at all times.',
      icon: Clock,
      subText: 'Zero-Wait Triage Intake',
    },
    {
      metric: '45+ Specialists',
      title: 'Board-Certified Consultants',
      description:
        'Senior physicians across Cardiology, Neurology, Pediatrics, Orthopedics, Obstetrics, and Advanced Laparoscopic Surgery.',
      icon: Users,
      subText: 'Multi-Disciplinary Care',
    },
    {
      metric: '100% Digital',
      title: 'Integrated Electronic Health Records',
      description:
        'Unified digital patient ledger, real-time prescription synchronization, and instant lab report delivery to your patient portal.',
      icon: ShieldCheck,
      subText: 'Encrypted & Confidential',
    },
  ];

  return (
    <section className="border-y border-[#222222] bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#222222]">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-8 lg:p-10 flex flex-col justify-between hover:bg-[#121212] transition-colors duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl lg:text-4xl font-light text-white tracking-tight">
                      {item.metric}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#262626] group-hover:border-[#383838] flex items-center justify-center text-[#A1A1AA] group-hover:text-white transition-colors duration-200">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-medium text-white mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#1C1C1C] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-[11px] font-mono text-[#71717A] tracking-wider uppercase">
                    {item.subText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
