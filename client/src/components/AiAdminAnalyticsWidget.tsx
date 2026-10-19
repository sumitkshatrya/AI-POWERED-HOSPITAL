import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, DollarSign, Calendar, Users, AlertTriangle, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { aiService, AdminAnalyticsData } from '../services/aiService';

export const AiAdminAnalyticsWidget: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.getAdminAnalytics('This Month');
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch AI Admin Analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch operational analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI Operational Intelligence Copilot
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Executive synthesis on monthly appointments, revenue, patient growth, and reorder alerts
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl transition"
          title="Refresh Operations Intelligence"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="py-10 text-center text-gray-500 flex flex-col items-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Aggregating platform metrics & generating executive synthesis...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Factual Platform Metrics Grid (Strictly DB data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">Appointments</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{data.metrics.totalAppointments}</span>
              <p className="text-[11px] text-gray-500 mt-1">{data.metrics.completedAppointments} completed</p>
            </div>

            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">Total Revenue</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${data.metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">${data.metrics.pendingRevenue.toFixed(2)} pending</p>
            </div>

            <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">Patient Population</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{data.metrics.totalPatients}</span>
              <p className="text-[11px] text-purple-600 dark:text-purple-300 mt-1">+{data.metrics.newPatientsThisMonth} new this month</p>
            </div>

            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">Inventory Reorders</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{data.metrics.lowStockItemsCount} low stock</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">{data.metrics.expiringItemsCount} expiring soon</p>
            </div>
          </div>

          {/* AI Operational Narrative Section */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white rounded-xl space-y-3 shadow-md">
            <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Executive Narrative Synthesis
              </span>
            </div>

            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
              {data.aiInterpretation.operationalOverview}
            </p>

            {data.aiInterpretation.actionableInsights.length > 0 && (
              <div className="pt-2 border-t border-indigo-800/40">
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
                  Actionable Operational Recommendations
                </span>
                <ul className="space-y-1 text-xs text-indigo-200">
                  {data.aiInterpretation.actionableInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mandatory Distinguishing Disclaimer */}
          <p className="text-[11px] text-gray-400 italic text-right">
            {data.aiInterpretation.disclaimer}
          </p>
        </div>
      ) : null}
    </div>
  );
};

