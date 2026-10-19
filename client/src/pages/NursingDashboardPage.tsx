import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Bed as BedIcon,
  Plus,
  RefreshCw,
  X,
  Sparkles,
  Calendar,
  Thermometer,
  Activity,
} from 'lucide-react';
import { ipdService, AdmissionRecord, NursingNote, MedicationMAR } from '../services/ipdService';

export const NursingDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'MAR'>('PATIENTS');
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [mars, setMars] = useState<MedicationMAR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vitals & Shift Note Modal
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState<boolean>(false);
  const [nursingNotesList, setNursingNotesList] = useState<NursingNote[]>([]);
  const [noteForm, setNoteForm] = useState({
    shift: 'MORNING' as 'MORNING' | 'EVENING' | 'NIGHT',
    vitalsBp: '120/80',
    vitalsPulse: 72,
    vitalsTemp: 36.8,
    vitalsSpo2: 98,
    vitalsResp: 16,
    carePlan: '',
    interventions: '',
    patientMood: 'Calm, cooperative',
  });

  // MAR Modal
  const [isScheduleMarModalOpen, setIsScheduleMarModalOpen] = useState<boolean>(false);
  const [marForm, setMarForm] = useState({
    admissionId: '',
    medicineName: '',
    dosage: '',
    route: 'ORAL',
    frequency: 'TDS (3 times/day)',
    scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    notes: '',
  });

  // Action Administer Dose
  const [selectedMar, setSelectedMar] = useState<MedicationMAR | null>(null);
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState<boolean>(false);
  const [administerStatus, setAdministerStatus] = useState<'GIVEN' | 'MISSED' | 'HELD'>('GIVEN');
  const [administerNotes, setAdministerNotes] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'PATIENTS') {
        const data = await ipdService.getAdmissions({ status: 'ADMITTED' });
        setAdmissions(data);
      } else {
        const marData = await ipdService.getMarSchedules();
        setMars(marData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load nursing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenVitalsModal = async (adm: AdmissionRecord) => {
    setSelectedAdmission(adm);
    setIsVitalsModalOpen(true);
    try {
      const notes = await ipdService.getNursingNotes(adm.id);
      setNursingNotesList(notes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      setActionLoading(true);
      const created = await ipdService.createNursingNote(selectedAdmission.id, noteForm);
      setNursingNotesList([created, ...nursingNotesList]);
      setSuccessMsg(`Vitals & shift note recorded for ${selectedAdmission.patient.firstName}!`);
      setNoteForm({
        shift: 'MORNING',
        vitalsBp: '120/80',
        vitalsPulse: 72,
        vitalsTemp: 36.8,
        vitalsSpo2: 98,
        vitalsResp: 16,
        carePlan: '',
        interventions: '',
        patientMood: 'Calm, resting',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save nursing note.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await ipdService.scheduleMedicationMAR(marForm.admissionId, {
        medicineName: marForm.medicineName,
        dosage: marForm.dosage,
        route: marForm.route,
        frequency: marForm.frequency,
        scheduledTime: new Date(marForm.scheduledTime).toISOString(),
        notes: marForm.notes,
      });
      setSuccessMsg(`Scheduled medication dose on MAR successfully!`);
      setIsScheduleMarModalOpen(false);
      setMarForm({
        admissionId: '',
        medicineName: '',
        dosage: '',
        route: 'ORAL',
        frequency: 'TDS (3 times/day)',
        scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule medication on MAR.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdministerDose = async () => {
    if (!selectedMar) return;
    try {
      setActionLoading(true);
      await ipdService.updateMarStatus(selectedMar.id, {
        status: administerStatus,
        notes: administerNotes,
      });
      setSuccessMsg(`Medication dose marked as ${administerStatus}!`);
      setIsAdministerModalOpen(false);
      setSelectedMar(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update dose status.');
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
            <HeartPulse className="w-7 h-7 text-rose-600" />
            Nursing Station & MAR Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bedside vitals monitoring, nursing shift notes, care plans, and Medication Administration Records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (admissions.length === 0) {
                ipdService.getAdmissions({ status: 'ADMITTED' }).then(setAdmissions);
              }
              setIsScheduleMarModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Dose (MAR)
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

      {/* Tab Controls */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-xl">
        <button
          onClick={() => setActiveTab('PATIENTS')}
          className={`py-4 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'PATIENTS'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BedIcon className="w-4 h-4" />
          Active Inpatients & Vitals
        </button>
        <button
          onClick={() => setActiveTab('MAR')}
          className={`py-4 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'MAR'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pill className="w-4 h-4" />
          Medication Administration Schedule (MAR)
        </button>
      </div>

      {/* Tab 1: Inpatient Vitals & Care */}
      {activeTab === 'PATIENTS' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400">Loading admitted patients...</div>
          ) : admissions.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <HeartPulse className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">No active admitted patients</p>
              <p className="text-sm text-gray-400 mt-1">All hospital beds are currently vacant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b text-xs uppercase font-medium">
                  <tr>
                    <th className="px-5 py-3">Bed / Room</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Attending Doctor</th>
                    <th className="px-5 py-3">Admission Reason</th>
                    <th className="px-5 py-3">Latest Vitals</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {admissions.map((adm) => {
                    const latestNote = adm.nursingNotes && adm.nursingNotes.length > 0 ? adm.nursingNotes[0] : null;

                    return (
                      <tr key={adm.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <BedIcon className="w-4 h-4 text-indigo-600" />
                            {adm.bed?.bedNumber}
                          </div>
                          <div className="text-xs text-gray-500">{adm.ward?.name}</div>
                          <div className="text-[11px] text-gray-400">Room: {adm.bed?.roomNumber || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {adm.patient.firstName} {adm.patient.lastName}
                          </div>
                          <div className="text-xs text-indigo-600 font-mono">{adm.patient.uhid}</div>
                          <div className="text-xs text-gray-400">{adm.patient.gender} | {adm.patient.bloodGroup || 'Blood: N/A'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-800">
                            Dr. {adm.doctor?.user.firstName} {adm.doctor?.user.lastName}
                          </div>
                          <div className="text-xs text-gray-400">{adm.doctor?.specialization}</div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-medium text-gray-800 truncate">{adm.admissionReason}</div>
                          <div className="text-xs text-gray-400 truncate">{adm.initialDiagnosis || '-'}</div>
                        </td>
                        <td className="px-5 py-4">
                          {latestNote ? (
                            <div className="text-xs space-y-0.5">
                              <div><span className="font-medium">BP:</span> {latestNote.vitalsBp || '-'} | <span className="font-medium">HR:</span> {latestNote.vitalsPulse || '-'} bpm</div>
                              <div><span className="font-medium">SpO2:</span> {latestNote.vitalsSpo2 || '-'}% | <span className="font-medium">Temp:</span> {latestNote.vitalsTemp || '-'}°C</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No vitals logged yet</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenVitalsModal(adm)}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
                          >
                            <Activity className="w-3.5 h-3.5 mr-1" />
                            Vitals & Care Note
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: MAR Schedules */}
      {activeTab === 'MAR' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400">Loading MAR schedule...</div>
          ) : mars.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Pill className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">No scheduled medications on MAR</p>
              <p className="text-sm text-gray-400 mt-1">Schedule medications to administer on shift.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b text-xs uppercase font-medium">
                  <tr>
                    <th className="px-5 py-3">Scheduled Time</th>
                    <th className="px-5 py-3">Medicine & Dosage</th>
                    <th className="px-5 py-3">Route / Frequency</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Administration Info</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {mars.map((mar) => (
                    <tr key={mar.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(mar.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(mar.scheduledTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{mar.medicineName}</div>
                        <div className="text-xs text-gray-500">Dose: {mar.dosage}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-gray-800">{mar.route}</div>
                        <div className="text-xs text-gray-400">{mar.frequency}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            mar.status === 'GIVEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mar.status === 'SCHEDULED'
                              ? 'bg-amber-100 text-amber-800'
                              : mar.status === 'MISSED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {mar.status === 'GIVEN' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {mar.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {mar.administeredTime ? (
                          <>
                            <div className="text-gray-800">
                              Administered: {new Date(mar.administeredTime).toLocaleTimeString()}
                            </div>
                            <div className="text-gray-400">{mar.notes || 'No notes'}</div>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Pending administration</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {mar.status === 'SCHEDULED' && (
                          <button
                            onClick={() => {
                              setSelectedMar(mar);
                              setAdministerStatus('GIVEN');
                              setAdministerNotes('');
                              setIsAdministerModalOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Administer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Vitals & Nursing Shift Notes Modal */}
      {isVitalsModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                Bedside Vitals & Nursing Shift Note - {selectedAdmission.patient.firstName}{' '}
                {selectedAdmission.patient.lastName} (Bed {selectedAdmission.bed?.bedNumber})
              </h3>
              <button onClick={() => setIsVitalsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              <form onSubmit={handleRecordVitals} className="bg-rose-50/40 p-4 rounded-xl border border-rose-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-gray-800">Record Shift Vitals & Interventions</h4>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mr-2">Shift:</label>
                    <select
                      value={noteForm.shift}
                      onChange={(e: any) => setNoteForm({ ...noteForm, shift: e.target.value })}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="MORNING">Morning Shift</option>
                      <option value="EVENING">Evening Shift</option>
                      <option value="NIGHT">Night Shift</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">BP (mmHg)</label>
                    <input
                      type="text"
                      value={noteForm.vitalsBp}
                      onChange={(e) => setNoteForm({ ...noteForm, vitalsBp: e.target.value })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={noteForm.vitalsPulse}
                      onChange={(e) => setNoteForm({ ...noteForm, vitalsPulse: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={noteForm.vitalsTemp}
                      onChange={(e) => setNoteForm({ ...noteForm, vitalsTemp: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">SpO2 (%)</label>
                    <input
                      type="number"
                      value={noteForm.vitalsSpo2}
                      onChange={(e) => setNoteForm({ ...noteForm, vitalsSpo2: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Resp (/min)</label>
                    <input
                      type="number"
                      value={noteForm.vitalsResp}
                      onChange={(e) => setNoteForm({ ...noteForm, vitalsResp: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Nursing Care Plan</label>
                  <input
                    type="text"
                    placeholder="e.g. Turn patient q2h, maintain semi-fowler position, incentive spirometry"
                    value={noteForm.carePlan}
                    onChange={(e) => setNoteForm({ ...noteForm, carePlan: e.target.value })}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Interventions Performed</label>
                    <input
                      type="text"
                      placeholder="e.g. Wound dressing changed, IV cannula flushed"
                      value={noteForm.interventions}
                      onChange={(e) => setNoteForm({ ...noteForm, interventions: e.target.value })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Patient Mood / Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. Alert, oriented x3, resting comfortably"
                      value={noteForm.patientMood}
                      onChange={(e) => setNoteForm({ ...noteForm, patientMood: e.target.value })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                  >
                    Save Shift Note
                  </button>
                </div>
              </form>

              {/* History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-800">Recent Nursing Notes ({nursingNotesList.length})</h4>
                {nursingNotesList.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No notes recorded yet.</p>
                ) : (
                  nursingNotesList.map((n) => (
                    <div key={n.id} className="p-3 border rounded-lg text-xs space-y-1 bg-white">
                      <div className="flex justify-between text-gray-500 font-medium">
                        <span className="font-semibold text-rose-700">{n.shift} SHIFT</span>
                        <span>{new Date(n.noteDate).toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-gray-800">
                        BP: {n.vitalsBp || '-'} | Pulse: {n.vitalsPulse || '-'} bpm | SpO2: {n.vitalsSpo2 || '-'}% | Temp: {n.vitalsTemp || '-'}°C
                      </div>
                      {n.carePlan && <div><span className="font-medium text-gray-600">Care Plan:</span> {n.carePlan}</div>}
                      {n.interventions && <div><span className="font-medium text-gray-600">Interventions:</span> {n.interventions}</div>}
                      {n.patientMood && <div className="italic text-gray-500">Condition: {n.patientMood}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsVitalsModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule MAR Modal */}
      {isScheduleMarModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-600" />
                Schedule Medication Dose (MAR)
              </h3>
              <button onClick={() => setIsScheduleMarModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleScheduleMar} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Admitted Patient *</label>
                <select
                  required
                  value={marForm.admissionId}
                  onChange={(e) => setMarForm({ ...marForm, admissionId: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Admitted Patient</option>
                  {admissions.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.patient.firstName} {adm.patient.lastName} (Bed {adm.bed?.bedNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceftriaxone / Paracetamol IV"
                  value={marForm.medicineName}
                  onChange={(e) => setMarForm({ ...marForm, medicineName: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1g / 500mg"
                    value={marForm.dosage}
                    onChange={(e) => setMarForm({ ...marForm, dosage: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={marForm.route}
                    onChange={(e) => setMarForm({ ...marForm, route: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="ORAL">Oral</option>
                    <option value="IV">Intravenous (IV)</option>
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="SUBCUTANEOUS">Subcutaneous</option>
                    <option value="INHALATION">Inhalation</option>
                    <option value="TOPICAL">Topical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={marForm.scheduledTime}
                  onChange={(e) => setMarForm({ ...marForm, scheduledTime: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Infuse over 30 mins, check BP prior to dose"
                  value={marForm.notes}
                  onChange={(e) => setMarForm({ ...marForm, notes: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleMarModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administer Dose Modal */}
      {isAdministerModalOpen && selectedMar && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Administer Medication Dose
              </h3>
              <button onClick={() => setIsAdministerModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg text-xs space-y-1 text-emerald-900 border border-emerald-200">
              <div><span className="font-semibold">Medicine:</span> {selectedMar.medicineName} ({selectedMar.dosage})</div>
              <div><span className="font-semibold">Route:</span> {selectedMar.route}</div>
              <div><span className="font-semibold">Scheduled For:</span> {new Date(selectedMar.scheduledTime).toLocaleString()}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Administration Status</label>
                <select
                  value={administerStatus}
                  onChange={(e: any) => setAdministerStatus(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="GIVEN">GIVEN (Successfully Administered)</option>
                  <option value="HELD">HELD (Clinical reason / physician order)</option>
                  <option value="MISSED">MISSED (Patient unavailable / refused)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nurse Clinical Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Infused via IV pump, vitals checked pre & post"
                  value={administerNotes}
                  onChange={(e) => setAdministerNotes(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAdministerModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdministerDose}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Verify & Record Dose'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default NursingDashboardPage;

