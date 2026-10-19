import React from 'react';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';

export const AnalyticsSection: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Executive Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Data-driven healthcare analytics.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Real-time business intelligence for hospital CEOs, medical directors, and administrative heads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Patient Flow Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track peak OPD queue wait times, patient registration growth rates, and department bottleneck metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Financial Revenue Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consolidated revenue streams across IPD admissions, OPD consultations, diagnostic lab orders, and pharmacy sales.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Bed & Resource Utilization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live occupancy rates for ICU beds, general wards, ventilator availability, and operating theater schedules.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
