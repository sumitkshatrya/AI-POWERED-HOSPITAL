import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenDemo?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenDemo }) => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Clinic Essentials',
      tag: 'Independent Practices',
      desc: 'Ideal for polyclinics, single-doctor OPD practices, and outpatient centers.',
      features: [
        'Up to 5 Doctor Profiles',
        'OPD Queue & Token Display',
        'e-Prescriptions & Clinical Notes',
        'Basic Patient EMR Records',
        'SMS Appointment Reminders',
      ],
      popular: false,
      ctaText: 'Get Started',
      action: () => navigate('/register'),
    },
    {
      name: 'Hospital Pro',
      tag: 'Recommended for Hospitals',
      desc: 'Complete suite for multi-specialty hospitals, IPD wards, LIS, & Pharmacy.',
      features: [
        'Unlimited Doctor Profiles',
        'Multi-Branch & Ward Bed Management',
        'Pathology LIS & Radiology RIS Workflow',
        'Pharmacy POS & Stock Inventory',
        'Billing, Invoices & Insurance Claims',
        'AI Clinical Assistant Copilot',
      ],
      popular: true,
      ctaText: 'Schedule Hospital Demo',
      action: () => (onOpenDemo ? onOpenDemo() : navigate('/login')),
    },
    {
      name: 'Enterprise Network',
      tag: 'Multi-Hospital Chains',
      desc: 'Custom infrastructure deployment for multi-city hospital groups & networks.',
      features: [
        'Unlimited Multi-Tenant Branches',
        'Dedicated Cloud / On-Premise Instance',
        'Custom EHR & Local Lab Integrations',
        'HIPAA & Local Compliance Audits',
        '24/7 Dedicated Technical SLA',
        'Custom AI Model Fine-tuning',
      ],
      popular: false,
      ctaText: 'Contact Enterprise Sales',
      action: () => navigate('/#contact'),
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Flexible Deployment
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transparent plans for modern healthcare.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Whether you run a single clinic or a multi-hospital chain, MediCore scales seamlessly with your operational needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl border flex flex-col justify-between transition relative ${
                plan.popular
                  ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Most Popular Choice
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{plan.tag}</div>
                <h3 className="text-2xl font-extrabold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">{plan.desc}</p>

                <div className="border-t border-slate-800 pt-6 space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={plan.action}
                className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                {plan.ctaText} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
