import React from 'react';
import { UserCheck, Calendar, Clock, Stethoscope, FileText, TestTube, Pill, CreditCard, RefreshCw } from 'lucide-react';

export const HealthcareJourney: React.FC = () => {
  const steps = [
    { title: 'Registration', desc: 'Single digital identity creation with unique UHID number.', icon: UserCheck },
    { title: 'Appointment', desc: 'Online scheduling or walk-in OPD token allocation.', icon: Calendar },
    { title: 'OPD Queue', desc: 'Live queue monitoring on wall display monitors.', icon: Clock },
    { title: 'Diagnosis', desc: 'Doctor clinical consultation & vitals recording.', icon: Stethoscope },
    { title: 'Prescription', desc: 'e-Prescription generation with drug dosage checks.', icon: FileText },
    { title: 'Laboratory', desc: 'Sample collection & automated LIS test verification.', icon: TestTube },
    { title: 'Pharmacy', desc: 'POS prescription fulfillment & inventory update.', icon: Pill },
    { title: 'Billing', desc: 'Unified invoice generation & payment processing.', icon: CreditCard },
    { title: 'Follow-up', desc: 'Automated telemedicine reminder & appointment scheduling.', icon: RefreshCw },
  ];

  return (
    <section className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Connected Care Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            One connected patient journey.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Eliminate operational silos by connecting every step of the patient experience into a continuous digital care continuum.
          </p>
        </div>

        <div className="flex flex-nowrap overflow-x-auto pb-6 gap-4 scrollbar-thin scrollbar-thumb-slate-700">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="min-w-[200px] p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition flex flex-col items-start group shrink-0"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Step {idx + 1}</div>
                <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
