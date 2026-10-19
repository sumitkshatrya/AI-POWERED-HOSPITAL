import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is MediCore?',
      a: 'MediCore is an all-in-one, multi-tenant AI-powered hospital and doctor management SaaS platform designed to streamline clinical, operational, diagnostic, and financial workflows across modern healthcare organizations.',
    },
    {
      q: 'Who can use MediCore?',
      a: 'MediCore is built for super-specialty hospitals, polyclinics, independent doctors, pathology laboratories, radiology diagnostic centers, pharmacies, and patients.',
    },
    {
      q: 'Can hospitals manage multiple branches?',
      a: 'Yes. MediCore features native multi-tenant and multi-branch architecture allowing health systems to manage multiple physical locations, central staff directories, and consolidated financial reporting from a single administration hub.',
    },
    {
      q: 'Can patients book appointments?',
      a: 'Yes. Patients can search for doctors by specialty or location, view real-time availability slots, book online appointments, receive instant token confirmations, and access diagnostic reports via the patient portal.',
    },
    {
      q: 'Does it support pharmacy and laboratory?',
      a: 'Absolutely. MediCore includes a Pathology Laboratory Information System (LIS) for sample barcode tracking and automated report generation, as well as a Pharmacy POS with real-time inventory management and batch expiry tracking.',
    },
    {
      q: 'Does it support telemedicine?',
      a: 'Yes. MediCore includes encrypted HD video consultation capabilities allowing clinicians to conduct remote follow-ups, issue digital e-prescriptions, and share lab reports securely with patients.',
    },
    {
      q: 'How does the AI assistant work?',
      a: 'The MediCore AI Copilot assists clinicians by generating automated patient medical history summaries, drafting structured clinical consultation notes, and providing explanations for complex laboratory reports. All AI outputs are advisory and must be verified by licensed healthcare professionals.',
    },
    {
      q: 'How is patient information protected?',
      a: 'MediCore enforces strict multi-tenant isolation, role-based access control (RBAC), end-to-end TLS encryption in transit, encrypted document storage, and comprehensive security audit logs for all system access events.',
    },
  ];

  return (
    <section className="py-20 bg-slate-900 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Got questions? We have answers.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Learn more about how MediCore powers modern healthcare organizations.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:text-blue-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
