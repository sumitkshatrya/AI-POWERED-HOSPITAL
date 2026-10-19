import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Bed,
  Bot,
  CheckCircle2,
  Search,
  Stethoscope,
  Activity,
  Shield,
  Clock,
  HeartPulse,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';

export interface HeroSectionProps {
  onOpenDemo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
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

  const handleDemoClick = () => {
    if (onOpenDemo) {
      onOpenDemo();
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-slate-950 text-white border-b border-slate-900">
      {/* Background glow illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Value Proposition & Search */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>{brandConfig.name} • AI-Powered Clinical Ecosystem</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              One platform for{' '}
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                smarter healthcare.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {brandConfig.subTagline ||
                'Connect hospitals, doctors, nurses, labs, pharmacies, and patients through one unified intelligent clinical management platform.'}
            </p>

            {/* Quick Public Doctor & Treatment Finder Bar */}
            <form
              onSubmit={handleTreatmentSearch}
              className="bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0 backdrop-blur-md"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors, specializations, or procedures (e.g. Cardiology, MRI)..."
                  value={treatmentQuery}
                  onChange={(e) => setTreatmentQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-blue-600/30"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Find Doctor</span>
              </button>
            </form>

            {/* Call To Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 text-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDemoClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <span>Interactive Live Demo</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>HIPAA & SOC-2 Certified</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero-Latency Real-Time Sync</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>99.99% Uptime Guarantee</span>
              </span>
            </div>
          </div>

          {/* Right Column: Live Clinical Portal Simulation */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    {brandConfig.name} Live Command • Metro Medical Hub
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>All 14 Nodes Online</span>
                </span>
              </div>

              {/* Real-Time Live Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Today Appointments</div>
                  <div className="text-xl font-bold text-white mt-1">128</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+14% vs yesterday</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Bed Occupancy</div>
                  <div className="text-xl font-bold text-white mt-1">94%</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">3 ICU Beds Free</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Doctors on Duty</div>
                  <div className="text-xl font-bold text-white mt-1">24 Active</div>
                  <div className="text-[10px] text-blue-400 mt-0.5">Across 8 Wards</div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Emergency Triage</div>
                  <div className="text-xl font-bold text-red-400 mt-1">2 Critical</div>
                  <div className="text-[10px] text-red-400 mt-0.5">Ambulance En Route</div>
                </div>
              </div>

              {/* Live OPD Queue Telemetry */}
              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live OPD Consultation Queue</span>
                  </span>
                  <span className="text-blue-400 font-mono">Dr. Sarah Jenkins (Cardiology)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        01
                      </div>
                      <div>
                        <div className="font-semibold text-white">Rahul Sharma (Male, 42)</div>
                        <div className="text-[10px] text-slate-400">Token #104 • Post-Op Cardiac Follow-up</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-[10px] border border-emerald-500/20">
                      In Consultation
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs opacity-75">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                        02
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">Elena Rostova (Female, 38)</div>
                        <div className="text-[10px] text-slate-500">Token #105 • ECG Review & Blood Panel</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium text-[10px]">
                      Waiting in Lounge
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Bed Telemetry Pill */}
              <div className="absolute -top-4 -right-4 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-400">IPD Bed Capacity</div>
                  <div className="text-xs font-bold text-white">94% (42/45 Beds Occupied)</div>
                </div>
              </div>

              {/* Floating AI Diagnostic Assistant Pill */}
              <div className="absolute -bottom-4 -left-4 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-400">Clinical AI Copilot</div>
                  <div className="text-xs font-bold text-emerald-400">Prescription Safety Verified</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;

