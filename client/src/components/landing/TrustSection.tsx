import React from 'react';
import { Building2, Stethoscope, HeartPulse, Activity, Microscope } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const categories = [
    { title: 'Super Specialty Hospitals', icon: Building2, desc: 'Multi-department care' },
    { title: 'Polyclinics & Outpatient', icon: HeartPulse, desc: 'Multi-doctor practices' },
    { title: 'Independent Practitioners', icon: Stethoscope, desc: 'Private consultation' },
    { title: 'Diagnostic & LIS Centers', icon: Microscope, desc: 'Pathology & Radiology' },
    { title: 'Healthcare Networks', icon: Activity, desc: 'Multi-branch chains' },
  ];

  return (
    <section id="about" className="py-12 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-8">
          Built for modern healthcare teams
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">{cat.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
