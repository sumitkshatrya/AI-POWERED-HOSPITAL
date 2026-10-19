import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Bed, Bot, CheckCircle2, Search, Stethoscope } from 'lucide-react';

interface HeroProps {
  onOpenDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [treatmentQuery, setTreatmentQuery] = useState('');

  const handleTreatmentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (treatmentQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(treatmentQuery.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-slate-950 text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              AI-Powered Healthcare Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              One platform for <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">smarter healthcare.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Connect hospitals, doctors, staff, and patients through one modern healthcare management platform. Simplify hospital operations, empower doctors, and elevate patient care.
            </p>

            {/* Quick Public Doctor & Treatment Finder Bar */}
            <form onSubmit={handleTreatmentSearch} className="bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find doctor by treatment (e.g. Bypass, Knee, Acne, Pregnancy)..."
                  value={treatmentQuery}
                  onChange={(e) => setTreatmentQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-blue-600/30"
              >
                <Stethoscope className="w-4 h-4" />
                Find Doctor
              </button>
            </form>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-sm"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2 text-sm"
              >
                Book a Demo
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No complex setup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Secure architecture</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Built for modern care</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">MediCore Live Portal • City General</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Systems
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Today Appointments</div>
                  <div className="text-xl font-bold text-white mt-1">128</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+14% vs yesterday</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Bed Occupancy</div>
                  <div className="text-xl font-bold text-white mt-1">94%</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">3 ICU Beds</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Doctors Available</div>
                  <div className="text-xl font-bold text-white mt-1">12</div>
                  <div className="text-[10px] text-blue-400 mt-0.5">Across 6 Wards</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Emergency Alerts</div>
                  <div className="text-xl font-bold text-red-400 mt-1">2 Active</div>
                  <div className="text-[10px] text-red-400 mt-0.5">Ambulance Triage</div>
                </div>
              </div>

              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Current OPD Consultation Queue</span>
                  <span className="text-blue-400">Dr. Rajesh Kumar (Cardiology)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">01</div>
                      <div>
                        <div className="font-semibold text-white">Rahul Sharma (Male, 42)</div>
                        <div className="text-[10px] text-slate-400">Token #104 • Post-Op Follow-up</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-[10px]">In Consultation</span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-400">Bed Occupancy</div>
                  <div className="text-xs font-bold text-white">94% (42/45 Beds)</div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-400">AI Assistant</div>
                  <div className="text-xs font-bold text-emerald-400">AI Summary Ready</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
