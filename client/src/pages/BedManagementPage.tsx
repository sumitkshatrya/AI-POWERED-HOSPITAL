import React, { useEffect, useState } from 'react';
import {
  Bed as BedIcon,
  Plus,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Wrench,
  Clock,
  User,
  X,
  Layers,
} from 'lucide-react';
import { bedService, Ward, Bed, BedMatrixSummary } from '../services/bedService';

export const BedManagementPage: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [summary, setSummary] = useState<BedMatrixSummary>({
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    cleaningBeds: 0,
    maintenanceBeds: 0,
    reservedBeds: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');

  // Modals
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newBedStatus, setNewBedStatus] = useState<string>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState<string>('');

  const [isNewWardModalOpen, setIsNewWardModalOpen] = useState<boolean>(false);
  const [wardForm, setWardForm] = useState({
    name: '',
    code: '',
    category: 'GENERAL',
    floor: '1st Floor',
    totalBeds: 10,
    dailyRate: 100,
    description: '',
  });

  const [isNewBedModalOpen, setIsNewBedModalOpen] = useState<boolean>(false);
  const [bedForm, setBedForm] = useState({
    wardId: '',
    bedNumber: '',
    roomNumber: '',
    category: 'GENERAL',
    dailyRate: 100,
    features: '',
  });

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [matrixData, wardsData] = await Promise.all([
        bedService.getBedsMatrix({
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          wardId: selectedWardId === 'ALL' ? undefined : selectedWardId,
        }),
        bedService.getWards(),
      ]);
      setBeds(matrixData.beds);
      setSummary(matrixData.summary);
      setWards(wardsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bed data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus, selectedWardId]);

  const handleUpdateStatus = async () => {
    if (!selectedBed) return;
    try {
      setActionLoading(true);
      await bedService.updateBedStatus(selectedBed.id, newBedStatus, statusNotes);
      setSuccessMsg(`Bed ${selectedBed.bedNumber} status updated to ${newBedStatus}.`);
      setIsStatusModalOpen(false);
      setSelectedBed(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bed status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await bedService.createWard(wardForm);
      setSuccessMsg(`Ward '${wardForm.name}' created with ${wardForm.totalBeds} beds!`);
      setIsNewWardModalOpen(false);
      setWardForm({
        name: '',
        code: '',
        category: 'GENERAL',
        floor: '1st Floor',
        totalBeds: 10,
        dailyRate: 100,
        description: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ward.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await bedService.createBed(bedForm);
      setSuccessMsg(`Bed '${bedForm.bedNumber}' added successfully!`);
      setIsNewBedModalOpen(false);
      setBedForm({
        wardId: '',
        bedNumber: '',
        roomNumber: '',
        category: 'GENERAL',
        dailyRate: 100,
        features: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100';
      case 'OCCUPIED':
        return 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100';
      case 'RESERVED':
        return 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100';
      case 'CLEANING':
        return 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100';
      case 'MAINTENANCE':
        return 'bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Available
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
            <User className="w-3 h-3 mr-1" /> Occupied
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" /> Reserved
          </span>
        );
      case 'CLEANING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
            <Sparkles className="w-3 h-3 mr-1" /> Cleaning
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            <Wrench className="w-3 h-3 mr-1" /> Maintenance
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BedIcon className="w-7 h-7 text-indigo-600" />
            Inpatient Bed & Ward Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time visual bed availability matrix, occupancy tracking, and hospital ward operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewWardModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <Building className="w-4 h-4 mr-2 text-gray-500" />
            New Ward
          </button>
          <button
            onClick={() => setIsNewBedModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Single Bed
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> {error}
          </span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beds</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{summary.totalBeds}</div>
          <div className="text-xs text-indigo-600 font-medium mt-1">{wards.length} Wards active</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{summary.availableBeds}</div>
          <div className="text-xs text-gray-400 mt-1">Ready for admission</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{summary.occupiedBeds}</div>
          <div className="text-xs text-rose-500 font-medium mt-1">{summary.occupancyRate}% Occupancy</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cleaning</div>
          <div className="mt-2 text-2xl font-bold text-sky-600">{summary.cleaningBeds}</div>
          <div className="text-xs text-gray-400 mt-1">Sanitization in progress</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</div>
          <div className="mt-2 text-2xl font-bold text-purple-600">{summary.maintenanceBeds}</div>
          <div className="text-xs text-gray-400 mt-1">Repair/Inspections</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{summary.reservedBeds}</div>
          <div className="text-xs text-gray-400 mt-1">Pre-op / Booked</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Ward</label>
            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Wards ({wards.length})</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="SEMI_PRIVATE">Semi-Private</option>
              <option value="PRIVATE">Private</option>
              <option value="ICU">ICU (Intensive Care)</option>
              <option value="NICU">NICU</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 transition"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh Matrix
        </button>
      </div>

      {/* Visual Bed Matrix */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
          Loading bed matrix...
        </div>
      ) : beds.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
          <BedIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-900">No beds found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your filters or create a new ward to generate inpatient beds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {beds.map((bed) => {
            const isOccupied = bed.status === 'OCCUPIED';
            const admission = bed.admissions && bed.admissions.length > 0 ? bed.admissions[0] : null;

            return (
              <div
                key={bed.id}
                onClick={() => {
                  setSelectedBed(bed);
                  setNewBedStatus(bed.status);
                  setIsStatusModalOpen(true);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition transform hover:-translate-y-0.5 shadow-xs flex flex-col justify-between ${getStatusColor(
                  bed.status
                )}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base tracking-wide">{bed.bedNumber}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/70">
                      {bed.category}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{bed.ward?.name || 'Ward'}</span>
                  </div>

                  {bed.roomNumber && (
                    <div className="text-[11px] text-gray-500">Room: {bed.roomNumber}</div>
                  )}

                  {isOccupied && admission ? (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 text-xs">
                      <div className="font-semibold text-rose-900 truncate">
                        {admission.patient.firstName} {admission.patient.lastName}
                      </div>
                      <div className="text-[10px] text-rose-700 font-mono">
                        {admission.patient.uhid}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 text-[11px]">
                  <div>{getStatusBadge(bed.status)}</div>
                  <div className="font-medium text-gray-700">${bed.dailyRate}/d</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bed Status & Detail Modal */}
      {isStatusModalOpen && selectedBed && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-indigo-600" />
                Bed Details - {selectedBed.bedNumber}
              </h3>
              <button
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedBed(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Ward:</span>
                <span className="font-medium text-gray-800">{selectedBed.ward?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium text-gray-800">{selectedBed.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Room:</span>
                <span className="font-medium text-gray-800">{selectedBed.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Charge:</span>
                <span className="font-medium text-gray-800">${selectedBed.dailyRate} / day</span>
              </div>
            </div>

            {selectedBed.status === 'OCCUPIED' && selectedBed.admissions?.[0] ? (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-rose-900 text-sm">Admitted Patient:</div>
                <div>
                  <span className="font-medium">Name:</span> {selectedBed.admissions[0].patient.firstName}{' '}
                  {selectedBed.admissions[0].patient.lastName}
                </div>
                <div>
                  <span className="font-medium">UHID:</span> {selectedBed.admissions[0].patient.uhid}
                </div>
                <div>
                  <span className="font-medium">Admission #:</span>{' '}
                  {selectedBed.admissions[0].admissionNumber}
                </div>
                <div>
                  <span className="font-medium">Attending Doctor:</span> Dr.{' '}
                  {selectedBed.admissions[0].doctor?.user.firstName}{' '}
                  {selectedBed.admissions[0].doctor?.user.lastName}
                </div>
                <div className="text-rose-600 font-medium pt-1">
                  * Note: To release this bed, proceed to patient discharge or bed transfer.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Change Bed Status</label>
                <select
                  value={newBedStatus}
                  onChange={(e) => setNewBedStatus(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for new patient)</option>
                  <option value="CLEANING">CLEANING (Housekeeping / sanitization)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Repair / broken / equipment check)</option>
                  <option value="RESERVED">RESERVED (Hold for incoming patient)</option>
                </select>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Housekeeping / Maintenance Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Deep sanitized and linens changed by Nurse Nancy"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedBed(null);
                }}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedBed.status !== 'OCCUPIED' && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Updating...' : 'Save Status'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Ward Modal */}
      {isNewWardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                Create New Hospital Ward
              </h3>
              <button onClick={() => setIsNewWardModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateWard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ward Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surgical Recovery Ward 4B"
                    value={wardForm.name}
                    onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ward Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WARD-SURG-4B"
                    value={wardForm.code}
                    onChange={(e) => setWardForm({ ...wardForm, code: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={wardForm.category}
                    onChange={(e) => setWardForm({ ...wardForm, category: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="GENERAL">General</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="PRIVATE">Private</option>
                    <option value="ICU">ICU</option>
                    <option value="NICU">NICU</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 4th Floor"
                    value={wardForm.floor}
                    onChange={(e) => setWardForm({ ...wardForm, floor: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Auto Beds (1-20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={wardForm.totalBeds}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, totalBeds: parseInt(e.target.value) || 1 })
                    }
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Daily Bed Rate ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={wardForm.dailyRate}
                  onChange={(e) =>
                    setWardForm({ ...wardForm, dailyRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional details or medical facilities in this ward..."
                  value={wardForm.description}
                  onChange={(e) => setWardForm({ ...wardForm, description: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewWardModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Creating...' : 'Create Ward & Generate Beds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Bed Modal */}
      {isNewBedModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add Individual Bed
              </h3>
              <button onClick={() => setIsNewBedModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBed} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assign to Ward *</label>
                <select
                  required
                  value={bedForm.wardId}
                  onChange={(e) => {
                    const w = wards.find((x) => x.id === e.target.value);
                    setBedForm({
                      ...bedForm,
                      wardId: e.target.value,
                      category: w?.category || 'GENERAL',
                      dailyRate: w?.dailyRate || 100,
                    });
                  }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bed Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICU-04"
                    value={bedForm.bedNumber}
                    onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={bedForm.roomNumber}
                    onChange={(e) => setBedForm({ ...bedForm, roomNumber: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={bedForm.category}
                    onChange={(e) => setBedForm({ ...bedForm, category: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="GENERAL">General</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="PRIVATE">Private</option>
                    <option value="ICU">ICU</option>
                    <option value="NICU">NICU</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Daily Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bedForm.dailyRate}
                    onChange={(e) =>
                      setBedForm({ ...bedForm, dailyRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewBedModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Adding...' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BedManagementPage;

