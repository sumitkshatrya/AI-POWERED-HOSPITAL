import React from 'react';
import { Star, Quote, Building2, Stethoscope, Award } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Dr. Arthur Pendelton, MD',
      role: 'Chief Medical Officer',
      hospital: 'St. Jude Metropolitan Health System',
      quote:
        'MediCore reduced our emergency department door-to-treatment time by 48%. The automated ESI triage and real-time bed telemetry gave our clinical team complete control over acute flow.',
      metric: '48% Faster ER Triage',
      rating: 5,
    },
    {
      name: 'Dr. Meera Iyer, MBBS, FRCR',
      role: 'Head of Diagnostic Radiology',
      hospital: 'Apex Care Multi-Specialty Hospital',
      quote:
        'The DICOM and PACS viewer integration alongside the AI assistant flag micro-nodules and ischemic markers in seconds. It has completely eliminated diagnostic reporting backlogs.',
      metric: 'Zero Reporting Backlog',
      rating: 5,
    },
    {
      name: 'David Kowalski, FACHE',
      role: 'Vice President of Hospital Operations',
      hospital: 'Greater Midwest Regional Network (12 Branches)',
      quote:
        'Managing 12 hospital branches on a single unified multi-tenant database eliminated double-entry errors. Our pharmacy inventory and billing claims are finally in complete synchronization.',
      metric: '99.8% Claims Accuracy',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Clinical Verification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Trusted by hospital leaders worldwide.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            See how hospital executives, attending doctors, and clinical directors run their health systems on MediCore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6 relative group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {t.metric}
                  </span>
                </div>

                <Quote className="w-8 h-8 text-blue-500/30 group-hover:text-blue-500/60 transition-colors" />

                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-1">
                <h4 className="text-base font-bold text-white">{t.name}</h4>
                <p className="text-xs font-medium text-blue-400">{t.role}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.hospital}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

