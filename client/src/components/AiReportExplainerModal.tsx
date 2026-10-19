import React, { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw, X, BookOpen, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { aiService, ReportExplanation } from '../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    reportId?: string;
    reportTitle: string;
    reportCategory: 'LABORATORY' | 'RADIOLOGY';
    findings: string;
    impression?: string;
  };
}

export const AiReportExplainerModal: React.FC<Props> = ({ isOpen, onClose, reportData }) => {
  const [explanation, setExplanation] = useState<ReportExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reportData.reportTitle && reportData.findings) {
      setLoading(true);
      setError(null);
      aiService
        .explainReport(reportData)
        .then((res) => setExplanation(res))
        .catch((err: any) => {
          console.error('Failed to explain report:', err);
          setError(err.response?.data?.message || 'Failed to generate plain-language report explanation');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, reportData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Report Copilot</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Plain-language breakdown of medical terminology & diagnostic findings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Translating medical terminology into plain language...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        ) : explanation ? (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Mandatory Non-Diagnostic Disclaimer */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-semibold">{explanation.disclaimer}</span>
            </div>

            {/* Plain Language Summary */}
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              {explanation.plainLanguageSummary}
            </div>

            {/* Medical Terminology Explanations */}
            {explanation.explainedTerminology.length > 0 && (
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  Key Medical Terms Explained
                </span>
                <div className="space-y-2">
                  {explanation.explainedTerminology.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 text-xs">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.term}: </span>
                      <span className="text-gray-700 dark:text-gray-300">{item.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Guidance */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">Recommended Action:</span>
              <p className="text-emerald-800 dark:text-emerald-200">{explanation.recommendedNextSteps}</p>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition"
              >
                Close Explanation
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

