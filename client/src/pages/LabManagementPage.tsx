import React, { useEffect, useState } from 'react';
import {
  TestTube,
  FlaskConical,
  Search,
  Plus,
  CheckCircle2,
  FileText,
  AlertCircle,
  FileDown,
  UserCheck,
  Barcode,
  X,
  Filter,
} from 'lucide-react';
import { labService, LabOrder, LabCatalogItem } from '../services/labService';

export const LabManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CATALOG'>('ORDERS');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [catalog, setCatalog] = useState<LabCatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [resultInputs, setResultInputs] = useState<Record<string, { value: string; flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' }>>({});
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'ORDERS') {
        const data = await labService.getLabOrders({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchQuery || undefined,
        });
        setOrders(data);
      } else {
        const catData = await labService.getLabCatalog({ search: searchQuery || undefined });
        setCatalog(catData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load laboratory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, [activeTab, statusFilter]);

  const handleCollectSample = async (orderId: string) => {
    try {
      await labService.collectSample(orderId);
      fetchLabData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to collect sample');
    }
  };

  const openResultModal = (order: LabOrder) => {
    setSelectedOrder(order);
    const initialInputs: Record<string, { value: string; flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' }> = {};
    order.items.forEach((item) => {
      initialInputs[item.id] = {
        value: item.resultValue || '',
        flag: item.flag || 'NORMAL',
      };
    });
    setResultInputs(initialInputs);
    setRemarks(order.remarks || '');
    setIsResultModalOpen(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setSubmitting(true);
      const itemsPayload = selectedOrder.items.map((item) => ({
        itemId: item.id,
        resultValue: resultInputs[item.id]?.value || '12.0',
        flag: resultInputs[item.id]?.flag || 'NORMAL',
      }));

      await labService.enterResults(selectedOrder.id, itemsPayload, remarks);
      setIsResultModalOpen(false);
      fetchLabData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save test results.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReport = async (orderId: string) => {
    try {
      await labService.verifyOrder(orderId, 'Verified and locked by Pathologist');
      fetchLabData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify lab report.');
    }
  };

  const handleDownloadPdf = (orderId: string) => {
    const url = labService.getLabReportPdfUrl(orderId);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laboratory Information System (LIS)</h1>
            <p className="text-sm text-gray-500">
              Sample tracking, result entry with reference range evaluation, pathologist verification & e-Reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'ORDERS' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lab Worklist ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'CATALOG' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Test Catalog
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, patient name, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLabData()}
            className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 border"
          />
        </div>

        {activeTab === 'ORDERS' && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border-gray-300 rounded-lg p-2 focus:ring-amber-500 focus:border-amber-500 border"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="ORDERED">Ordered (Sample Pending)</option>
              <option value="SAMPLE_COLLECTED">Sample Collected (In Lab)</option>
              <option value="COMPLETED">Results Entered (Pending Verification)</option>
              <option value="VERIFIED">Verified & Finalized</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : activeTab === 'ORDERS' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4">Order # & Date</th>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Investigations</th>
                <th className="p-4">Status & Barcode</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No lab orders found matching current filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-gray-900">
                      <div>{order.orderNumber}</div>
                      <div className="text-xs font-normal text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
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
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-xs flex items-center gap-2">
                            <span className="font-medium text-gray-800">{item.testName}</span>
                            {item.flag && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.flag === 'HIGH' || item.flag === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.flag === 'LOW'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.flag} ({item.resultValue || 'N/A'})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'COMPLETED'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'SAMPLE_COLLECTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.sampleBarcode && (
                        <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-gray-400" />
                          <span>{order.sampleBarcode}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {order.status === 'ORDERED' && (
                        <button
                          onClick={() => handleCollectSample(order.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
                        >
                          Collect Sample
                        </button>
                      )}

                      {(order.status === 'SAMPLE_COLLECTED' || order.status === 'COMPLETED') && (
                        <button
                          onClick={() => openResultModal(order)}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 shadow-sm"
                        >
                          Enter Results
                        </button>
                      )}

                      {order.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleVerifyReport(order.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm"
                        >
                          Verify & Lock
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPdf(order.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 border border-gray-300"
                        title="Download e-Report PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 inline mr-1" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Test Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                <div>
                  <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {item.testCode}
                  </span>
                  <h4 className="font-bold text-gray-900 text-base mt-1">{item.testName}</h4>
                </div>
                <span className="text-sm font-bold text-emerald-700">${item.price.toFixed(2)}</span>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <span className="font-semibold text-gray-700">Category: </span>
                  {item.category}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Specimen / Tube: </span>
                  {item.specimenType} ({item.containerType})
                </div>
                {item.referenceRangeMin !== null && (
                  <div>
                    <span className="font-semibold text-gray-700">Ref. Range: </span>
                    {item.referenceRangeMin} - {item.referenceRangeMax} {item.unit}
                  </div>
                )}
                {item.description && <p className="text-gray-500 italic pt-1">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Entry Modal */}
      {isResultModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-600" /> Enter Lab Results: {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setIsResultModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResults} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 flex justify-between items-center">
                <span>
                  Patient: <strong>{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</strong> (UHID: {selectedOrder.patient.uhid})
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">
                  {selectedOrder.sampleBarcode}
                </span>
              </div>

              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm">{item.testName}</span>
                      <span className="text-xs text-gray-500 font-mono">{item.testCode}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Result Value</label>
                        <input
                          type="text"
                          required
                          value={resultInputs[item.id]?.value || ''}
                          onChange={(e) =>
                            setResultInputs({
                              ...resultInputs,
                              [item.id]: { ...resultInputs[item.id], value: e.target.value },
                            })
                          }
                          placeholder="e.g. 14.5"
                          className="w-full text-sm border-gray-300 rounded-lg p-2 border"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Abnormal Flag</label>
                        <select
                          value={resultInputs[item.id]?.flag || 'NORMAL'}
                          onChange={(e) =>
                            setResultInputs({
                              ...resultInputs,
                              [item.id]: {
                                ...resultInputs[item.id],
                                flag: e.target.value as any,
                              },
                            })
                          }
                          className="w-full text-sm border-gray-300 rounded-lg p-2 border"
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="HIGH">HIGH (Elevated)</option>
                          <option value="LOW">LOW (Decreased)</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Pathologist Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter clinical notes or test interpretation..."
                  className="w-full text-sm border-gray-300 rounded-lg p-2 border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving Results...' : 'Save & Submit Results'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

