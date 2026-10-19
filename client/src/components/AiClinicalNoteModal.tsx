import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, X, FileEdit, ArrowRight } from 'lucide-react';
import { aiService, StructuredClinicalNote } from '../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApproveAndInsert: (structured: StructuredClinicalNote) => void;
}

export const AiClinicalNoteModal: React.FC<Props> = ({ isOpen, onClose, onApproveAndInsert }) => {
  const [rawNotes, setRawNotes] = useState('');
  const [structured, setStructured] = useState<StructuredClinicalNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await aiService.structureClinicalNotes(rawNotes);
      setStructured(result);
    } catch (err: any) {
      console.error('Failed to structure clinical notes:', err);
      setError(err.response?.data?.message || 'Failed to structure clinical notes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (structured) {
      onApproveAndInsert(structured);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8 space-y-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Clinical Note Copilot</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transform rough consultation shorthand into structured SOAP clinical segments
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleStructure} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
              Enter Rough Shorthand Notes
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. pt complains fever 3 days with cough, temp 101F, chest clear, rx paracetamol 500mg tid and warm gargles, follow up 5 days"
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !rawNotes.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Structure SOAP Notes</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* AI Structured Preview */}
        {structured && (
          <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Disclaimer */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{structured.disclaimer}</span>
            </div>

            {/* SOAP Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white block mb-0.5">Chief Complaint</span>
                <p className="text-gray-700 dark:text-gray-300">{structured.chiefComplaint}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white block mb-0.5">Reported Symptoms</span>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                  {structured.symptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white block mb-0.5">Physical Examination</span>
                <p className="text-gray-700 dark:text-gray-300">{structured.examination}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white block mb-0.5">Clinical Assessment</span>
                <p className="text-gray-700 dark:text-gray-300">{structured.assessment}</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block mb-1">Treatment Plan & Regimen</span>
              <ul className="list-disc list-inside text-indigo-800 dark:text-indigo-300 space-y-0.5">
                {structured.plan.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Doctor Review & Approval Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Doctor Review & Approve Notes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

