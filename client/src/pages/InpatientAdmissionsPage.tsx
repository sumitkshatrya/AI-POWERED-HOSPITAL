import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRightLeft,
  FileCheck,
  Stethoscope,
  Activity,
  Bed as BedIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  Eye,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ipdService, AdmissionRecord, DoctorRound } from '../services/ipdService';
import { bedService, Ward, Bed } from '../services/bedService';
import api from '../services/api';

export const InpatientAdmissionsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ADMITTED');
  const [wardFilter, setWardFilter] = useState<string>('ALL');

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState<boolean>(false);
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    doctorId: '',
    wardId: '',
    bedId: '',
    admissionReason: '',
    initialDiagnosis: '',
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferAdmission, setTransferAdmission] = useState<AdmissionRecord | null>(null);
  const [transferForm, setTransferForm] = useState({
    newWardId: '',
    newBedId: '',
    reason: '',
  });

  const [isRoundsModalOpen, setIsRoundsModalOpen] = useState<boolean>(false);
  const [selectedAdmissionForRounds, setSelectedAdmissionForRounds] = useState<AdmissionRecord | null>(null);
  const [rounds, setRounds] = useState<DoctorRound[]>([]);
  const [newRoundForm, setNewRoundForm] = useState({
    clinicalNotes: '',
    treatmentOrders: '',
    roundFee: 50,
  });

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ipdService.getAdmissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        wardId: wardFilter === 'ALL' ? undefined : wardFilter,
        search: searchQuery || undefined,
      });
      setAdmissions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admissions.');
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const [wardsRes, doctorsRes, patientsRes] = await Promise.all([
        bedService.getWards(),
        api.get('/doctors').catch(() => ({ data: { data: [] } })),
        api.get('/patients').catch(() => ({ data: { data: [] } })),
      ]);
      setWards(wardsRes);
      setDoctors(doctorsRes.data.data?.doctors || doctorsRes.data.data || []);
      setPatients(patientsRes.data.data?.patients || patientsRes.data.data || []);
    } catch (err) {
      console.error('Error loading supporting data', err);
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, wardFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdmissions();
  };

  // Load available beds whenever ward changes in Admit modal
  const handleAdmitWardChange = async (wardId: string) => {
    setAdmitForm((prev) => ({ ...prev, wardId, bedId: '' }));
    if (!wardId) {
      setAvailableBeds([]);
      return;
    }
    try {
      const matrix = await bedService.getBedsMatrix({ wardId, status: 'AVAILABLE' });
      setAvailableBeds(matrix.beds);
    } catch (err) {
      console.error('Error fetching available beds', err);
    }
  };

  // Load available beds for transfer
  const handleTransferWardChange = async (wardId: string) => {
    setTransferForm((prev) => ({ ...prev, newWardId: wardId, newBedId: '' }));
    if (!wardId) {
      setAvailableBeds([]);
      return;
    }
    try {
      const matrix = await bedService.getBedsMatrix({ wardId, status: 'AVAILABLE' });
      setAvailableBeds(matrix.beds);
    } catch (err) {
      console.error('Error fetching transfer beds', err);
    }
  };

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const newAdm = await ipdService.createAdmission(admitForm);
      setSuccessMsg(`Patient admitted successfully under admission #${newAdm.admissionNumber}! Bed locked.`);
      setIsAdmitModalOpen(false);
      setAdmitForm({
        patientId: '',
        doctorId: '',
        wardId: '',
        bedId: '',
        admissionReason: '',
        initialDiagnosis: '',
      });
      fetchAdmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to admit patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAdmission) return;
    try {
      setActionLoading(true);
      setError(null);
      await ipdService.transferBed(transferAdmission.id, transferForm);
      setSuccessMsg(`Patient transferred successfully to new bed!`);
      setIsTransferModalOpen(false);
      setTransferAdmission(null);
      fetchAdmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to transfer patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRounds = async (adm: AdmissionRecord) => {
    setSelectedAdmissionForRounds(adm);
    setIsRoundsModalOpen(true);
    try {
      const data = await ipdService.getDoctorRounds(adm.id);
      setRounds(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForRounds) return;
    try {
      setActionLoading(true);
      const created = await ipdService.createDoctorRound(selectedAdmissionForRounds.id, newRoundForm);
      setRounds([created, ...rounds]);
      setNewRoundForm({ clinicalNotes: '', treatmentOrders: '', roundFee: 50 });
      setSuccessMsg('Clinical round notes recorded successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record round.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Inpatient Admissions (IPD)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage patient admissions, bed allocations, inter-ward transfers, and clinical rounds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/bed-management"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <BedIcon className="w-4 h-4 mr-2 text-indigo-600" />
            Bed Matrix
          </Link>
          <button
            onClick={() => {
              setAvailableBeds([]);
              setIsAdmitModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Admit Patient
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

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by UHID, patient name, or admission #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Ward</label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              <option value="ALL">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              <option value="ALL">All Statuses</option>
              <option value="ADMITTED">Active Admitted</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading admissions...</div>
        ) : admissions.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-900">No inpatient admissions found</p>
            <p className="text-sm text-gray-400 mt-1">Admit a patient to initiate IPD tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b text-xs uppercase font-medium">
                <tr>
                  <th className="px-5 py-3">Admission # / Date</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Ward & Bed</th>
                  <th className="px-5 py-3">Attending Doctor</th>
                  <th className="px-5 py-3">Reason / Diagnosis</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{adm.admissionNumber}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(adm.admissionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {adm.patient.firstName} {adm.patient.lastName}
                      </div>
                      <div className="text-xs text-indigo-600 font-mono">{adm.patient.uhid}</div>
                      <div className="text-xs text-gray-400">{adm.patient.gender}, {adm.patient.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800 flex items-center gap-1">
                        <BedIcon className="w-3.5 h-3.5 text-gray-400" />
                        Bed {adm.bed?.bedNumber || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{adm.ward?.name}</div>
                      <div className="text-[11px] text-gray-400">Room: {adm.bed?.roomNumber || '-'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        Dr. {adm.doctor?.user.firstName} {adm.doctor?.user.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{adm.doctor?.specialization || 'Attending'}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-medium text-gray-800 truncate">{adm.admissionReason}</div>
                      <div className="text-xs text-gray-400 truncate">{adm.initialDiagnosis || '-'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          adm.status === 'ADMITTED'
                            ? 'bg-rose-100 text-rose-800'
                            : adm.status === 'DISCHARGED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenRounds(adm)}
                          title="Doctor Rounds"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Stethoscope className="w-4 h-4" />
                        </button>

                        {adm.status === 'ADMITTED' && (
                          <>
                            <button
                              onClick={() => {
                                setTransferAdmission(adm);
                                setTransferForm({ newWardId: '', newBedId: '', reason: '' });
                                setAvailableBeds([]);
                                setIsTransferModalOpen(true);
                              }}
                              title="Transfer Bed"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <Link
                              to={`/discharge-summary?admissionId=${adm.id}`}
                              title="Discharge Patient"
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Admit Patient to IPD
              </h3>
              <button onClick={() => setIsAdmitModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAdmitPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attending Doctor *</label>
                <select
                  required
                  value={admitForm.doctorId}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.firstName || d.firstName} {d.user?.lastName || d.lastName} (
                      {d.specialization || 'Doctor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Ward *</label>
                  <select
                    required
                    value={admitForm.wardId}
                    onChange={(e) => handleAdmitWardChange(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Ward</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Available Bed *</label>
                  <select
                    required
                    disabled={!admitForm.wardId}
                    value={admitForm.bedId}
                    onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                  >
                    <option value="">
                      {availableBeds.length === 0 ? 'No beds available' : 'Select Bed'}
                    </option>
                    {availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} ({b.roomNumber || 'Ward'} - ${b.dailyRate}/d)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Admission *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute exacerbation of COPD, post-operative monitoring"
                  value={admitForm.admissionReason}
                  onChange={(e) => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Initial Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="Initial clinical impressions and provisional ICD-10 diagnosis..."
                  value={admitForm.initialDiagnosis}
                  onChange={(e) => setAdmitForm({ ...admitForm, initialDiagnosis: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Transfer Modal */}
      {isTransferModalOpen && transferAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                Transfer Patient Bed
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg text-xs space-y-1 text-amber-900 border border-amber-200">
              <div>
                <span className="font-semibold">Patient:</span> {transferAdmission.patient.firstName}{' '}
                {transferAdmission.patient.lastName} ({transferAdmission.patient.uhid})
              </div>
              <div>
                <span className="font-semibold">Current Bed:</span> {transferAdmission.bed?.bedNumber}{' '}
                ({transferAdmission.ward?.name})
              </div>
            </div>

            <form onSubmit={handleTransferBed} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Target Ward *</label>
                <select
                  required
                  value={transferForm.newWardId}
                  onChange={(e) => handleTransferWardChange(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Bed *</label>
                <select
                  required
                  disabled={!transferForm.newWardId}
                  value={transferForm.newBedId}
                  onChange={(e) => setTransferForm({ ...transferForm, newBedId: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
                >
                  <option value="">
                    {availableBeds.length === 0 ? 'No beds available' : 'Select Bed'}
                  </option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.roomNumber || 'Ward'} - ${b.dailyRate}/d)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upgraded to ICU for respiratory failure / Step-down to General"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Rounds Modal */}
      {isRoundsModalOpen && selectedAdmissionForRounds && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Doctor Rounds - {selectedAdmissionForRounds.patient.firstName}{' '}
                {selectedAdmissionForRounds.patient.lastName} ({selectedAdmissionForRounds.admissionNumber})
              </h3>
              <button onClick={() => setIsRoundsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Record new round */}
              <form onSubmit={handleCreateRound} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-semibold text-sm text-gray-800">Add Clinical Round Note</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Clinical Observation *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Patient progress, chest auscultation, wound status..."
                    value={newRoundForm.clinicalNotes}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, clinicalNotes: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Treatment Orders / Plan</label>
                    <input
                      type="text"
                      placeholder="e.g. Continue IV antibiotics, taper O2 support"
                      value={newRoundForm.treatmentOrders}
                      onChange={(e) => setNewRoundForm({ ...newRoundForm, treatmentOrders: e.target.value })}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Round Fee ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={newRoundForm.roundFee}
                      onChange={(e) =>
                        setNewRoundForm({ ...newRoundForm, roundFee: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                  >
                    Save Round
                  </button>
                </div>
              </form>

              {/* Existing rounds */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-800">Rounds History ({rounds.length})</h4>
                {rounds.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No rounds recorded yet.</p>
                ) : (
                  rounds.map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg text-xs space-y-1 bg-white">
                      <div className="flex justify-between text-gray-500 font-medium">
                        <span>
                          Dr. {r.doctor?.user.firstName} {r.doctor?.user.lastName}
                        </span>
                        <span>{new Date(r.roundDate).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-900 font-medium">{r.clinicalNotes}</div>
                      {r.treatmentOrders && (
                        <div className="text-indigo-600">Order: {r.treatmentOrders}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRoundsModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InpatientAdmissionsPage;

