import React, { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw, FileText, Activity, AlertTriangle, Pill, Calendar } from 'lucide-react';
import { aiService, PatientSummary } from '../services/aiService';

interface Props {
  patientId: string;
}

export const AiPatientSummaryCard: React.FC<Props> = ({ patientId }) => {
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getPatientSummary(patientId);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to fetch AI Patient Summary:', err);
      setError(err.response?.data?.message || 'Failed to generate AI Patient Summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [patientId]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-indigo-800/50 pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              AI Patient Synthesis
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                Clinical Copilot
              </span>
            </h3>
            <p className="text-xs text-indigo-200">
              Structured multi-record summary generated from EMR, Vitals, Labs & Encounters
            </p>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="p-2 bg-white/10 hover:bg-white/20 text-indigo-200 rounded-xl transition"
          title="Refresh AI Summary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Required Non-Autonomous Medical Disclaimer Banner */}
      <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-xs text-amber-200 font-medium">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>AI-generated summary — verify against the medical record.</span>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="py-8 text-center text-indigo-300 flex flex-col items-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Synthesizing clinical timeline & medical history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      ) : summary ? (
        <div className="space-y-4 text-sm text-indigo-100">
          <p className="bg-white/5 p-4 rounded-xl border border-white/10 leading-relaxed font-medium">
            {summary.summaryText}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Active Diagnoses
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-100">
                {summary.activeConditions.map((cond, i) => (
                  <li key={i}>{cond}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <Pill className="w-3.5 h-3.5 text-indigo-400" />
                Active Regimens
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-100">
                {summary.activeMedications.map((med, i) => (
                  <li key={i}>{med}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Allergies & Risk Factors
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-100">
                {summary.allergiesAndRiskFactors.map((alg, i) => (
                  <li key={i}>{alg}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Follow-ups & Investigations
              </span>
              <p className="text-indigo-200">{summary.recentInvestigationsSummary}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

