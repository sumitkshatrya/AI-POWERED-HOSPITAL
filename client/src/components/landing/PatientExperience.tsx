import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Pill, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PatientExperience: React.FC = () => {
  const navigate = useNavigate();

  const patientFlow = [
    'Find Doctor',
    'Book Appointment',
    'Consultation',
    'Prescription',
    'Lab Orders',
    'Follow-up',
  ];

  return (
    <section className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Patient Portal
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Healthcare that feels simpler for patients.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Empower patients with a mobile-first portal to manage their care, consult doctors, and track reports anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[300px] sm:w-[320px] bg-slate-900 rounded-[40px] border-4 border-slate-800 p-4 shadow-2xl relative">
              <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-4" />

              <div className="bg-slate-950 rounded-2xl p-4 space-y-3 text-xs border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">Welcome Back</div>
                    <div className="font-bold text-white text-sm">Priya Singh</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    PS
                  </div>
                </div>

                <div className="bg-blue-600/15 border border-blue-500/30 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-blue-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Today, 10:30 AM</span>
                    <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-[9px]">Confirmed</span>
                  </div>
                  <div className="font-bold text-white text-xs">Dr. Rajesh Kumar</div>
                  <div className="text-[10px] text-slate-300">Cardiology OPD • Room 204</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400"><Pill className="w-3 h-3" /> Active Prescription</span>
                    <span>2 Medicines</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200">Amlodipine 5mg • Once daily</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-sky-400"><FileText className="w-3 h-3" /> Lab Investigation</span>
                    <span>PDF Ready</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200">Complete Blood Count (CBC)</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1"><CreditCard className="w-3 h-3 text-slate-400" /> OPD Consultation Fee</span>
                  <span className="font-bold text-white">$45.00 Paid</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <h3 className="text-2xl font-bold text-white">Seamless Connected Patient Journey</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {patientFlow.map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-slate-300 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant appointment booking with live doctor slot confirmation.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Digital access to e-prescriptions, diagnostic lab reports, and radiology scans.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automated SMS and email reminders for upcoming consultations & follow-ups.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                Explore Patient Experience <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
