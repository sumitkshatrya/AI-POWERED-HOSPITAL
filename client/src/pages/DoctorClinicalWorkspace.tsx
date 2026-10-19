import React, { useEffect, useState } from 'react';
import { User, FileText, Stethoscope, TestTube, CreditCard, Save, CheckCircle, Plus, Trash2, Phone, Calendar } from 'lucide-react';
import api from '../services/api';
import { VitalsHistoryChart } from '../components/VitalsHistoryChart';
import { VitalsRecord, vitalsService } from '../services/vitalsService';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotStartTime: string;
  reasonForVisit: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string;
    allergies: string;
    chronicConditions: string;
    medicalHistory: string;
    currentMedication: string;
  };
}

export const DoctorClinicalWorkspace: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);

  const [activeTab, setActiveTab] = useState<'summary' | 'vitals' | 'consultation' | 'prescription' | 'labs'>('consultation');

  // Consultation Form
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [assessment, setAssessment] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followupDate, setFollowupDate] = useState('');

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<Array<{ medicineName: string; dosage: string; frequency: string; durationDays: number; route: 'ORAL' | 'IV' | 'TOPICAL'; quantity: number; instructions: string }>>([
    { medicineName: 'Amlodipine 5mg', dosage: '5mg', frequency: '1-0-0', durationDays: 14, route: 'ORAL', quantity: 14, instructions: 'After food' },
  ]);

  // Lab Orders
  const [labOrders, setLabOrders] = useState<Array<{ testName: string; testCode: string; specimenType: string; price: number }>>([
    { testName: 'Lipid Profile', testCode: 'LIPID-01', specimenType: 'BLOOD', price: 60 },
  ]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchQueueAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      const list: Appointment[] = res.data.data.appointments || [];
      const engagedOrCheckedIn = list.filter((a) => a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION' || a.status === 'SCHEDULED');
      setAppointments(engagedOrCheckedIn);

      if (engagedOrCheckedIn.length > 0 && !selectedAppt) {
        selectAppointment(engagedOrCheckedIn[0]);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  const selectAppointment = async (appt: Appointment) => {
    setSelectedAppt(appt);
    setChiefComplaints(appt.reasonForVisit || '');

    try {
      const v = await vitalsService.getPatientVitalsHistory(appt.patientId);
      setVitalsHistory(v);
    } catch (e) {
      setVitalsHistory([]);
    }
  };

  useEffect(() => {
    fetchQueueAppointments();
  }, []);

  const handleAddMedicine = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicineName: '', dosage: '1 tablet', frequency: '1-0-1', durationDays: 7, route: 'ORAL', quantity: 14, instructions: '' },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const handleAddLabTest = () => {
    setLabOrders([...labOrders, { testName: '', testCode: 'LAB-TEST', specimenType: 'BLOOD', price: 50 }]);
  };

  const handleRemoveLabTest = (idx: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  const handleSaveDraft = async () => {
    if (!selectedAppt) return;
    setSaving(true);
    setMsg('');

    try {
      await api.post('/consultations', {
        appointmentId: selectedAppt.id,
        patientId: selectedAppt.patientId,
        doctorId: selectedAppt.doctorId,
        chiefComplaints: chiefComplaints || 'Consultation in progress',
        clinicalFindings,
        examinationNotes,
        assessment,
        treatmentPlan,
        followupDate: followupDate || undefined,
        isDraft: true,
        status: 'DRAFT',
      });
      setMsg('Draft saved successfully.');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedAppt) return;
    setSaving(true);
    setMsg('');

    try {
      await api.post('/consultations', {
        appointmentId: selectedAppt.id,
        patientId: selectedAppt.patientId,
        doctorId: selectedAppt.doctorId,
        chiefComplaints: chiefComplaints || 'Routine OPD Consultation',
        clinicalFindings,
        examinationNotes,
        assessment,
        treatmentPlan,
        followupDate: followupDate || undefined,
        isDraft: false,
        status: 'FINAL',
        prescription: {
          adviceInstructions: 'Take prescribed medicines on time.',
          items: prescriptionItems.filter((m) => m.medicineName.trim() !== ''),
        },
        labOrders: labOrders.filter((l) => l.testName.trim() !== ''),
      });

      setMsg('Clinical consultation finalized. e-Prescription & Invoice auto-generated!');
      fetchQueueAppointments();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to finalize consultation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Clinical Workspace</h1>
          <p className="text-slate-500 text-sm">Consultation, e-Prescription, Lab Test Orders & Billing Triage</p>
        </div>

        {selectedAppt && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg text-sm hover:bg-slate-100 font-medium flex items-center space-x-1.5 shadow-sm"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-semibold flex items-center space-x-1.5 shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalize & Issue Record</span>
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-medium flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-blue-600 font-bold text-xs uppercase">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient Queue Sidebar */}
        <div className="bg-white border rounded-xl p-4 shadow-sm h-fit">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Today's Patient Queue</h2>
          <div className="space-y-2">
            {appointments.map((appt) => {
              const isSelected = selectedAppt?.id === appt.id;
              return (
                <div
                  key={appt.id}
                  onClick={() => selectAppointment(appt)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {appt.slotStartTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">UHID: {appt.patient.uhid}</p>
                  <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                    {appt.reasonForVisit || 'OPD Checkup'}
                  </span>
                </div>
              );
            })}

            {appointments.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-6">No waiting patients.</p>
            )}
          </div>
        </div>

        {/* Main Workspace Area */}
        {selectedAppt ? (
          <div className="lg:col-span-3 bg-white border rounded-xl p-6 shadow-sm space-y-6">
            {/* Patient Header Summary Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2.5 rounded-lg text-white font-bold text-lg">
                  {selectedAppt.patient.firstName[0]}
                  {selectedAppt.patient.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedAppt.patient.firstName} {selectedAppt.patient.lastName}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-300 mt-0.5">
                    <span>UHID: {selectedAppt.patient.uhid}</span>
                    <span>•</span>
                    <span>{selectedAppt.patient.gender}</span>
                    <span>•</span>
                    <span>Blood Group: {selectedAppt.patient.bloodGroup || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Allergies</span>
                <span className="text-amber-300 font-semibold">{selectedAppt.patient.allergies || 'None reported'}</span>
              </div>
            </div>

            {/* Workspace Navigation Tabs */}
            <div className="flex border-b border-slate-200 text-sm font-medium space-x-6">
              {[
                { id: 'consultation', label: 'Clinical Documentation', icon: Stethoscope },
                { id: 'vitals', label: 'Nurse Vitals', icon: FileText },
                { id: 'prescription', label: 'e-Prescription', icon: Plus },
                { id: 'labs', label: 'Lab Orders', icon: TestTube },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
                      isActive ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Clinical Documentation */}
            {activeTab === 'consultation' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chief Complaints</label>
                  <textarea
                    value={chiefComplaints}
                    onChange={(e) => setChiefComplaints(e.target.value)}
                    rows={2}
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Patient describes headaches, fatigue, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Findings & Exam Notes</label>
                    <textarea
                      value={examinationNotes}
                      onChange={(e) => setExaminationNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="BP 125/82, HR 76. Chest clear..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assessment & ICD-10 Diagnosis</label>
                    <textarea
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      rows={3}
                      className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Stage 1 Essential Hypertension (ICD-10: I10)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Treatment Plan & Advice</label>
                  <textarea
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    rows={3}
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Low salt diet, regular morning walk, avoid stress..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Vitals History */}
            {activeTab === 'vitals' && <VitalsHistoryChart vitalsHistory={vitalsHistory} />}

            {/* Tab 3: e-Prescription */}
            {activeTab === 'prescription' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Prescribed Medicines</h3>
                  <button
                    onClick={handleAddMedicine}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-slate-50 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                        value={item.medicineName}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].medicineName = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="flex-1 p-2 border rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        value={item.dosage}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].dosage = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="w-24 p-2 border rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (1-0-1)"
                        value={item.frequency}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].frequency = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="w-24 p-2 border rounded text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Days"
                        value={item.durationDays}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].durationDays = parseInt(e.target.value) || 1;
                          setPrescriptionItems(updated);
                        }}
                        className="w-16 p-2 border rounded text-xs"
                      />
                      <button
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Lab Test Orders */}
            {activeTab === 'labs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Laboratory Investigations</h3>
                  <button
                    onClick={handleAddLabTest}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order Lab Test</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {labOrders.map((lab, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-slate-50 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Test Name (e.g. Complete Blood Count)"
                        value={lab.testName}
                        onChange={(e) => {
                          const updated = [...labOrders];
                          updated[idx].testName = e.target.value;
                          setLabOrders(updated);
                        }}
                        className="flex-1 p-2 border rounded text-xs"
                      />
                      <select
                        value={lab.specimenType}
                        onChange={(e) => {
                          const updated = [...labOrders];
                          updated[idx].specimenType = e.target.value;
                          setLabOrders(updated);
                        }}
                        className="p-2 border rounded text-xs bg-white"
                      >
                        <option value="BLOOD">BLOOD</option>
                        <option value="URINE">URINE</option>
                        <option value="SWAB">SWAB</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                      <button
                        onClick={() => handleRemoveLabTest(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white border rounded-xl p-12 text-center text-slate-500">
            Select a patient from the queue to start consultation.
          </div>
        )}
      </div>
    </div>
  );
};

