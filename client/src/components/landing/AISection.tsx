import React from 'react';
import { Bot, Sparkles, FileText, ShieldAlert, Zap, Eye, Brain } from 'lucide-react';

export const AISection: React.FC = () => {
  return (
    <section id="ai" className="py-20 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            INTELLIGENT HEALTHCARE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI that works alongside your healthcare team.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            Turn complex healthcare information into useful, understandable insights — while keeping clinicians in complete control.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Bot className="w-4 h-4" /> MediCore AI Assistant
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">Copilot Active</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-end gap-2">
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-sm">
                  Summarize this patient's recent medical history and flagged allergies.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none max-w-md space-y-2 leading-relaxed">
                  <p className="font-semibold text-white">Based on the available EMR records:</p>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li><strong className="text-white">3 recent consultations</strong> in Cardiology & OPD</li>
                    <li><strong className="text-white">Current medications (2):</strong> Amlodipine 5mg, Metformin 500mg</li>
                    <li><strong className="text-white">Recent investigations (4):</strong> Blood Pressure 135/85, HbA1c 6.8%</li>
                    <li><strong className="text-red-400">Documented Allergy:</strong> Penicillin (Severe Rash)</li>
                    <li><strong className="text-white">Follow-up:</strong> Recommended in 2 weeks</li>
                  </ul>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
                    Please verify this summary against the original medical record.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-amber-300 text-xs font-medium mt-4">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>AI-generated information should be reviewed by an authorized healthcare professional.</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {[
              { title: 'AI Patient Summaries', desc: 'Synthesizes long consultation histories, chronic conditions, and previous test results into bulleted summaries.', icon: Brain },
              { title: 'AI Clinical Draft Notes', desc: 'Assists clinicians by drafting structured SOAP notes during active consultations.', icon: FileText },
              { title: 'AI Report Explanations', desc: 'Translates complex pathology and diagnostic lab terminology into patient-friendly explanations.', icon: Eye },
              { title: 'AI Operational Insights', desc: 'Predicts peak OPD queue hours, bed utilization spikes, and pharmacy stock reorders.', icon: Zap },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{card.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
