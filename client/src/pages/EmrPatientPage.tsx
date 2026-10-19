import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Activity,
  FileText,
  AlertCircle,
  Calendar,
  Heart,
  Droplet,
  Shield,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { emrService, EmrTimelineResponse } from '../services/emrService';
import { EmrTimelineView } from '../components/EmrTimelineView';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { AiPatientSummaryCard } from '../components/AiPatientSummaryCard';

export const EmrPatientPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [emrData, setEmrData] = useState<EmrTimelineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const fetchEmr = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await emrService.getPatientEmrTimeline(patientId);
      setEmrData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load EMR patient timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmr();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !emrData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-semibold">Error Loading Electronic Medical Record</h3>
              <p className="text-sm">{error || 'Patient EMR data could not be retrieved.'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/patients')}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const { patient, timeline, summary } = emrData;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" /> Electronic Medical Record (EMR)
            </h1>
            <p className="text-sm text-gray-500">
              Chronological clinical history, prescriptions, vitals & diagnostic reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmr}
            className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* AI Patient Summary Synthesis */}
      <AiPatientSummaryCard patientId={patient.id} />

      {/* Patient Summary Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-indigo-700/50 pb-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl border-2 border-indigo-400">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1">
                <span className="bg-indigo-800/60 px-2.5 py-0.5 rounded font-mono">
                  UHID: {patient.uhid}
                </span>
                <span className="bg-indigo-800/60 px-2.5 py-0.5 rounded font-mono">
                  MRN: {patient.mrn}
                </span>
                <span>
                  {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {patient.bloodGroup && (
              <div className="bg-indigo-800/40 px-3 py-1.5 rounded-lg border border-indigo-700/50 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="text-xs text-indigo-300 block">Blood Group</span>
                  <span className="font-semibold text-white">{patient.bloodGroup}</span>
                </div>
              </div>
            )}
            <div className="bg-indigo-800/40 px-3 py-1.5 rounded-lg border border-indigo-700/50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs text-indigo-300 block">Status</span>
                <span className="font-semibold text-emerald-300">Active Patient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          {patient.allergies && (
            <div className="bg-rose-950/40 border border-rose-800/50 p-3 rounded-xl text-rose-200">
              <span className="font-semibold text-rose-400 block mb-0.5">Known Allergies:</span>
              <p>{patient.allergies}</p>
            </div>
          )}
          {patient.existingConditions && (
            <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl text-amber-200">
              <span className="font-semibold text-amber-400 block mb-0.5">Pre-existing Conditions:</span>
              <p>{patient.existingConditions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Consultations</span>
          <span className="text-lg font-bold text-blue-600">{summary.consultationsCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Vitals Logs</span>
          <span className="text-lg font-bold text-emerald-600">{summary.vitalsCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Prescriptions</span>
          <span className="text-lg font-bold text-purple-600">{summary.prescriptionsCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Lab Orders</span>
          <span className="text-lg font-bold text-amber-600">{summary.labOrdersCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Radiology</span>
          <span className="text-lg font-bold text-cyan-600">{summary.radiologyCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-xs text-gray-500 block">Documents</span>
          <span className="text-lg font-bold text-rose-600">{summary.documentsCount}</span>
        </div>
      </div>

      {/* Main EMR Timeline */}
      <EmrTimelineView timeline={timeline} onUploadClick={() => setIsUploadOpen(true)} />

      {/* Document Upload Modal */}
      {patientId && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          patientId={patientId}
          onUploadSuccess={fetchEmr}
        />
      )}
    </div>
  );
};

