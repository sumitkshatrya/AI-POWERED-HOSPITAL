import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, ArrowRight, Stethoscope, RefreshCw } from 'lucide-react';
import { aiService, SpecialtyNavigation } from '../services/aiService';

interface AiSpecialtyNavigatorWidgetProps {
  onSelectSpecialty?: (specialty: string) => void;
}

export const AiSpecialtyNavigatorWidget: React.FC<AiSpecialtyNavigatorWidgetProps> = ({ onSelectSpecialty }) => {
  const [symptomQuery, setSymptomQuery] = useState('');
  const [result, setResult] = useState<{ navigation: SpecialtyNavigation; matchingDepartments: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await aiService.navigateSpecialty(symptomQuery.trim());
      setResult(data);
    } catch (err: any) {
      console.error('Specialty navigation error:', err);
      setError(err.response?.data?.message || 'Failed to navigate specialty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            AI Specialty & Doctor Navigator
            <Sparkles className="w-4 h-4 text-blue-500" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Describe your symptoms or treatment need (e.g., knee surgery, heart pain, skin rash) to find the right specialist
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder='e.g. "Severe knee joint pain", "Bypass surgery", "Skin rash with itching", "Migraine"'
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !symptomQuery.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center space-x-2 shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Find Specialist</span>
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Navigation Results */}
      {result && (
        <div className="space-y-3 pt-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
          {/* Disclaimer */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{result.navigation.disclaimer}</span>
          </div>

          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Recommended Specialist
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {result.navigation.suggestedSpecialty}
                </span>
              </div>
              {onSelectSpecialty && (
                <button
                  type="button"
                  onClick={() => onSelectSpecialty(result.navigation.suggestedSpecialty)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  Show {result.navigation.suggestedSpecialty} Doctors <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-gray-800 dark:text-gray-200 font-medium text-xs leading-relaxed">
              {result.navigation.explanation}
            </p>

            <div className="pt-1 flex flex-wrap gap-1.5">
              {result.navigation.matchingKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[11px] font-semibold rounded-md">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

