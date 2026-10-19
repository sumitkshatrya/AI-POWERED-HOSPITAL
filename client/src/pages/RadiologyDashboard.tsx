import React, { useEffect, useState } from 'react';
import {
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Eye,
  FileText,
  X,
  Filter,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { radiologyService, RadiologyOrder } from '../services/radiologyService';

export const RadiologyDashboard: React.FC = () => {
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isDicomModalOpen, setIsDicomModalOpen] = useState<boolean>(false);

  const [findings, setFindings] = useState<string>('');
  const [impression, setImpression] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchWorklist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await radiologyService.getWorklist({
        imagingType: modalityFilter === 'ALL' ? undefined : modalityFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load radiology worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, [modalityFilter, statusFilter]);

  const handleSchedule = async (id: string) => {
    try {
      const scheduledTime = new Date(Date.now() + 3600000).toISOString();
      await radiologyService.scheduleScan(id, scheduledTime);
      fetchWorklist();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule scan');
    }
  };

  const handleCompleteScan = async (id: string) => {
    try {
      await radiologyService.completeScan(id, 4);
      fetchWorklist();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete scan');
    }
  };

  const openReportModal = (order: RadiologyOrder) => {
    setSelectedOrder(order);
    setFindings(order.findings || '');
    setImpression(order.impression || '');
    setRecommendations(order.recommendations || '');
    setIsReportModalOpen(true);
  };

  const openDicomViewer = (order: RadiologyOrder) => {
    setSelectedOrder(order);
    setIsDicomModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setSubmitting(true);
      await radiologyService.draftReport(selectedOrder.id, findings, impression, recommendations);
      setIsReportModalOpen(false);
      fetchWorklist();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save radiology report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReport = async (id: string) => {
    try {
      await radiologyService.verifyReport(id, 'Verified by Radiologist');
      fetchWorklist();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify radiology report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-600">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Radiology Information System (RIS)</h1>
            <p className="text-sm text-gray-500">
              Modality worklist, scan scheduling, DICOM / PACS web viewer & radiologist reporting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorklist}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors shadow-sm"
          >
            Refresh Worklist ({orders.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search accession #, patient name, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWorklist()}
            className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 border"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-semibold text-gray-700">Modality:</span>
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="text-xs border-gray-300 rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500 border"
            >
              <option value="ALL">All Modalities</option>
              <option value="XRAY">X-Ray</option>
              <option value="CT_SCAN">CT Scan</option>
              <option value="MRI">MRI</option>
              <option value="ULTRASOUND">Ultrasound</option>
              <option value="MAMMOGRAM">Mammogram</option>
              <option value="PET_SCAN">PET Scan</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border-gray-300 rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500 border"
            >
              <option value="ALL">All Statuses</option>
              <option value="ORDERED">Ordered</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SCAN_COMPLETED">Scan Completed</option>
              <option value="REPORT_DRAFTED">Report Drafted</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Worklist Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4">Accession & Modality</th>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Body Part & Urgency</th>
                <th className="p-4">DICOM Study UID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No radiology scans found matching filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded text-xs font-bold">
                          {order.imagingType}
                        </span>
                        <span>{order.accessionNumber || order.orderNumber}</span>
                      </div>
                      <div className="text-xs font-normal text-gray-500 mt-1">
                        Ordered: {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-gray-900">
                        {order.patient.firstName} {order.patient.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        UHID: {order.patient.uhid} • {order.patient.gender}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-gray-800">{order.bodyPart}</div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          order.urgency === 'STAT'
                            ? 'bg-rose-100 text-rose-800'
                            : order.urgency === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.urgency}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-1 ${
                          order.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'REPORT_DRAFTED'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'SCAN_COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.studyInstanceUid && (
                        <div className="text-[11px] font-mono text-gray-500 truncate max-w-xs" title={order.studyInstanceUid}>
                          UID: {order.studyInstanceUid}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {order.status === 'ORDERED' && (
                        <button
                          onClick={() => handleSchedule(order.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
                        >
                          Schedule Scan
                        </button>
                      )}

                      {order.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCompleteScan(order.id)}
                          className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-700 shadow-sm"
                        >
                          Complete Scan
                        </button>
                      )}

                      {(order.status === 'SCAN_COMPLETED' || order.status === 'REPORT_DRAFTED') && (
                        <button
                          onClick={() => openReportModal(order)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 shadow-sm"
                        >
                          Draft Report
                        </button>
                      )}

                      {order.status === 'REPORT_DRAFTED' && (
                        <button
                          onClick={() => handleVerifyReport(order.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm"
                        >
                          Verify
                        </button>
                      )}

                      {order.studyInstanceUid && (
                        <button
                          onClick={() => openDicomViewer(order)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-sm inline-flex items-center gap-1"
                        >
                          <Monitor className="w-3.5 h-3.5" /> DICOM PACS
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Radiologist Report Entry Modal */}
      {isReportModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" /> Radiologist Findings & Report: {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-900 flex justify-between items-center">
                <span>
                  Patient: <strong>{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</strong> (UHID: {selectedOrder.patient.uhid})
                </span>
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                  {selectedOrder.imagingType} - {selectedOrder.bodyPart}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Radiological Findings *
                </label>
                <textarea
                  rows={4}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Enter detailed radiological findings..."
                  className="w-full text-sm border-gray-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Clinical Impression
                </label>
                <textarea
                  rows={2}
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Summarize diagnosis / impression..."
                  className="w-full text-sm border-gray-300 rounded-lg p-2.5 border focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Recommendations
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. No immediate radiological follow-up required"
                  className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Draft Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DICOM PACS Web Viewer Modal Preview */}
      {isDicomModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950 bg-opacity-95 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-800 overflow-hidden text-white">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-lg">OHIF Web PACS DICOM Viewer</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Study UID: {selectedOrder.studyInstanceUid}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDicomModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Simulated DICOM Image Viewport */}
              <div className="bg-black rounded-xl border border-slate-800 h-80 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 text-xs font-mono text-cyan-400 space-y-1">
                  <div>Patient: {selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</div>
                  <div>Modality: {selectedOrder.imagingType}</div>
                  <div>Accession: {selectedOrder.accessionNumber}</div>
                </div>

                <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-500">
                  Series: 1/{selectedOrder.dicomSeriesCount || 4} • Window/Level: Soft Tissue
                </div>

                <Activity className="w-24 h-24 text-slate-800 animate-pulse" />
                <p className="text-slate-400 text-sm font-semibold mt-2">
                  DICOM Imaging Web Viewer Viewport Stream Active
                </p>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-4">
                <span>PACS Server Status: Connected (WADO-RS / STOW-RS Enabled)</span>
                <a
                  href={selectedOrder.pacsViewerUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Open Full Screen PACS Viewer <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

