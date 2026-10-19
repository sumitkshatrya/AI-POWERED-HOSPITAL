import React from 'react';
import { Siren, Truck, ShieldAlert, Stethoscope, HeartPulse, Bed } from 'lucide-react';

export const EmergencySection: React.FC = () => {
  const steps = [
    { title: 'Emergency Request', icon: Siren, desc: '911 / Hotline alert triggered' },
    { title: 'Ambulance Dispatch', icon: Truck, desc: 'GPS tracked fleet en-route' },
    { title: 'Red-Flag Triage', icon: ShieldAlert, desc: 'Vital assessment at desk' },
    { title: 'Doctor Assignment', icon: Stethoscope, desc: 'Immediate ER clinician alert' },
    { title: 'Immediate Treatment', icon: HeartPulse, desc: 'Resuscitation & stabilization' },
    { title: 'ICU / Ward Admission', icon: Bed, desc: 'Reserved bed transfer' },
  ];

  return (
    <section className="py-20 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
      <div className="absolute top-1/2 left-10 w-[300px] h-[300px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Siren className="w-3.5 h-3.5" /> Emergency Response System
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            When every second matters.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3">
            Automated emergency registration, real-time ambulance tracking, red-flag triage prioritization, and instant ICU bed reservations.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/40 transition flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Step {idx + 1}</div>
                <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
