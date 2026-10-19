import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Bed, Siren, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';

export const HospitalOperations: React.FC = () => {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Patients Registered', value: '1,420 Active', icon: Users, color: 'text-blue-400' },
    { label: 'Today Appointments', value: '128 Scheduled', icon: Calendar, color: 'text-teal-400' },
    { label: 'IPD Bed Occupancy', value: '94% (42/45)', icon: Bed, color: 'text-amber-400' },
    { label: 'Emergency Admissions', value: '2 Active Triage', icon: Siren, color: 'text-red-400' },
    { label: 'Daily Collection', value: '$48,250', icon: CreditCard, color: 'text-emerald-400' },
    { label: 'Pending Invoice Claims', value: '14 Accounts', icon: AlertTriangle, color: 'text-purple-400' },
  ];

  return (
    <section className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Real-Time Command Center
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See your entire hospital at a glance.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Live operational oversight across outpatient queues, inpatient admissions, laboratory queues, pharmacy stock, and billing revenue.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className="text-lg font-bold text-white tracking-tight">{m.value}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Department Occupancy</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Cardiology Ward</span>
                  <span className="text-white font-semibold">90%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>ICU / CCU Unit</span>
                  <span className="text-white font-semibold">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>General Orthopedics</span>
                  <span className="text-white font-semibold">75%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pharmacy Alerts</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>Paracetamol 500mg</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">1,200 Stock</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>Insulin Glargine 100IU</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px]">14 Low Stock</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>Cefixime 200mg</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">320 Stock</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diagnostic Orders</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span>Pending Sample Collection</span>
                <span className="font-bold text-amber-400">12 Samples</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span>Pathologist Verification</span>
                <span className="font-bold text-blue-400">8 Reports</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span>Completed & Signed</span>
                <span className="font-bold text-emerald-400">122 Completed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/login')}
            className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            Explore Hospital Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
