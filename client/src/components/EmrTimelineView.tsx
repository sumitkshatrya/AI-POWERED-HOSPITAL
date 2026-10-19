import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Pill,
  TestTube,
  FileDown,
  Calendar,
  User,
  Stethoscope,
  Filter,
  CheckCircle,
  FolderOpen,
} from 'lucide-react';
import { EmrTimelineItem } from '../services/emrService';
import { documentService } from '../services/documentService';

interface EmrTimelineViewProps {
  timeline: EmrTimelineItem[];
  onUploadClick: () => void;
}

export const EmrTimelineView: React.FC<EmrTimelineViewProps> = ({ timeline, onUploadClick }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTimeline = timeline.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VITALS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PRESCRIPTION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LAB_ORDER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RADIOLOGY':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'DOCUMENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'VITALS':
        return <Activity className="w-4 h-4 text-emerald-600" />;
      case 'PRESCRIPTION':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'LAB_ORDER':
        return <TestTube className="w-4 h-4 text-amber-600" />;
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-rose-600" />;
      default:
        return <FolderOpen className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleDownloadPrescription = (id: string) => {
    const rawBase = (import.meta as any).env?.VITE_API_URL;
    const baseURL = rawBase && rawBase.trim() !== '' ? rawBase.replace(/\/+$/, '') : '/api/v1';
    window.open(`${baseURL}/prescriptions/${id}/pdf`, '_blank');
  };

  const handleDownloadDocument = (documentId: string) => {
    const url = documentService.downloadDocumentUrl(documentId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filter Medical Record:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 border p-1.5"
          >
            <option value="ALL">All Timeline Events ({timeline.length})</option>
            <option value="CONSULTATION">OPD Consultations</option>
            <option value="VITALS">Vitals Records</option>
            <option value="PRESCRIPTION">e-Prescriptions</option>
            <option value="LAB_ORDER">Lab Orders</option>
            <option value="DOCUMENT">Uploaded Documents</option>
          </select>
        </div>

        <button
          onClick={onUploadClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <FileText className="w-4 h-4" /> Upload Medical Doc
        </button>
      </div>

      {/* Timeline Stream */}
      {filteredTimeline.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-700">No Medical Records Found</h4>
          <p className="text-sm text-gray-500 mt-1">
            No events match the selected timeline filter.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 space-y-6 py-2">
          {filteredTimeline.map((item) => (
            <div key={item.id} className="relative pl-6 md:pl-8 group">
              {/* Timeline Marker Icon */}
              <div className="absolute -left-3 top-1.5 bg-white border-2 border-indigo-400 rounded-full p-1 shadow-sm group-hover:scale-110 transition-transform">
                {getTypeIcon(item.type)}
              </div>

              {/* Record Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getBadgeStyle(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                    <h4 className="font-semibold text-gray-800 text-base">{item.title}</h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.date).toLocaleString()}</span>
                  </div>
                </div>

                {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}

                {/* Specific Record Details */}
                {item.type === 'CONSULTATION' && (
                  <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {item.details.chiefComplaints && (
                      <div>
                        <span className="font-semibold text-gray-700">Chief Complaints: </span>
                        <span className="text-gray-600">{item.details.chiefComplaints}</span>
                      </div>
                    )}
                    {item.details.clinicalFindings && (
                      <div>
                        <span className="font-semibold text-gray-700">Clinical Findings: </span>
                        <span className="text-gray-600">{item.details.clinicalFindings}</span>
                      </div>
                    )}
                    {item.details.treatmentPlan && (
                      <div>
                        <span className="font-semibold text-gray-700">Treatment Plan: </span>
                        <span className="text-gray-600">{item.details.treatmentPlan}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'VITALS' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    {item.details.bp && (
                      <div className="bg-white p-2 rounded border border-emerald-100">
                        <span className="text-gray-500 block">BP</span>
                        <span className="font-semibold text-emerald-700">{item.details.bp}</span>
                      </div>
                    )}
                    {item.details.pulseRate && (
                      <div className="bg-white p-2 rounded border border-emerald-100">
                        <span className="text-gray-500 block">Heart Rate</span>
                        <span className="font-semibold text-emerald-700">{item.details.pulseRate} bpm</span>
                      </div>
                    )}
                    {item.details.temperature && (
                      <div className="bg-white p-2 rounded border border-emerald-100">
                        <span className="text-gray-500 block">Temp</span>
                        <span className="font-semibold text-emerald-700">{item.details.temperature} °F</span>
                      </div>
                    )}
                    {item.details.spo2 && (
                      <div className="bg-white p-2 rounded border border-emerald-100">
                        <span className="text-gray-500 block">SpO2</span>
                        <span className="font-semibold text-emerald-700">{item.details.spo2}%</span>
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'PRESCRIPTION' && (
                  <div className="space-y-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-purple-900">
                        RX Code: {item.details.prescriptionCode}
                      </span>
                      <button
                        onClick={() => handleDownloadPrescription(item.id)}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1.5 shadow-sm"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Download e-Prescription PDF
                      </button>
                    </div>

                    {item.details.items && item.details.items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-700 bg-white rounded border border-purple-100">
                          <thead className="bg-purple-100 text-purple-900">
                            <tr>
                              <th className="p-2">Medicine</th>
                              <th className="p-2">Dosage</th>
                              <th className="p-2">Frequency</th>
                              <th className="p-2">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.details.items.map((med: any, idx: number) => (
                              <tr key={idx} className="border-t border-purple-50">
                                <td className="p-2 font-medium">{med.medicineName}</td>
                                <td className="p-2">{med.dosage}</td>
                                <td className="p-2">{med.frequency}</td>
                                <td className="p-2">{med.durationDays} days</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'DOCUMENT' && (
                  <div className="flex items-center justify-between bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-rose-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-800 block">
                          {item.details.fileName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Type: {item.details.documentType} • Size: {(item.details.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(item.id)}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Secure Stream Download
                    </button>
                  </div>
                )}

                {/* Doctor / Metadata Footer */}
                {item.doctorName && (
                  <div className="pt-2 text-xs text-gray-500 flex items-center gap-1 border-t border-gray-50">
                    <User className="w-3.5 h-3.5" />
                    <span>Attending: {item.doctorName}</span>
                    {item.departmentName && <span>({item.departmentName})</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
