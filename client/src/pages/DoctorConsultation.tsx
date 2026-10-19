import React, { useState, useEffect } from 'react';
import {
  Users,
  HeartPulse,
  Activity,
  FileText,
  Pill,
  CheckCircle2,
  PhoneCall,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { PrescriptionModal } from '../components/PrescriptionModal';

interface QueueItem {
  id: string;
  tokenNumber: number;
  queueStatus: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
  };
  appointment: {
    id: string;
    appointmentType: string;
    reasonForVisit?: string;
  };
  doctor?: {
    id?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route: string;
  instructions: string;
}

const COMMON_ICD10 = [
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'R07.9', description: 'Chest pain, unspecified' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'M54.5', description: 'Low back pain, unspecified' },
];

export const DoctorConsultation: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'SOAP' | 'VITALS' | 'ICD10' | 'PRESCRIPTION' | 'EMR'>('SOAP');

  // Consultation Form State
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Vitals State
  const [vitals, setVitals] = useState({
    systolicBp: 120,
    diastolicBp: 80,
    pulseRate: 72,
    temperature: 98.6,
    spo2: 98,
    weightKg: 70,
    heightCm: 172,
  });

  // ICD-10 Search State
  const [icdSearch, setIcdSearch] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{ code: string; description: string; type: 'PRIMARY' | 'SECONDARY' }>>([]);

  // Prescription Items State
  const [prescriptions, setPrescriptions] = useState<MedicineItem[]>([
    { medicineName: 'Paracetamol 500mg', dosage: '500 mg', frequency: '1-0-1', durationDays: 5, route: 'ORAL', instructions: 'Take after meals' },
  ]);
  const [adviceInstructions, setAdviceInstructions] = useState('');

  // EMR Timeline State
  const [emrTimeline, setEmrTimeline] = useState<any[]>([]);

  // Prescription Modal State
  const [issuedPrescription, setIssuedPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/opd-queue');
      const queueData = res.data.data.queue || [];
      setQueue(queueData);

      const engaged = queueData.find((q: QueueItem) => q.queueStatus === 'ENGAGED_WITH_DOCTOR');
      if (engaged) {
        selectPatientForConsultation(engaged);
      } else if (queueData.length > 0 && !activePatient) {
        selectPatientForConsultation(queueData[0]);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPatientForConsultation = (item: QueueItem) => {
    setActivePatient(item);
    setChiefComplaints(item.appointment.reasonForVisit || 'Routine Consultation');
    loadEmrTimeline(item.patient.id);
  };

  const loadEmrTimeline = async (patientId: string) => {
    try {
      const res = await api.get(`/patients/${patientId}/emr`);
      setEmrTimeline(res.data.data.timeline || []);
    } catch {
      setEmrTimeline([]);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await api.post('/opd-queue/call-next', {});
      if (res.data.data.currentPatient) {
        selectPatientForConsultation(res.data.data.currentPatient);
      }
      loadQueue();
    } catch (err) {
      console.error('Call next error:', err);
    }
  };

  const handleAddDiagnosis = (diag: { code: string; description: string }) => {
    if (!selectedDiagnoses.some((d) => d.code === diag.code)) {
      setSelectedDiagnoses([...selectedDiagnoses, { ...diag, type: selectedDiagnoses.length === 0 ? 'PRIMARY' : 'SECONDARY' }]);
    }
  };

  const handleRemoveDiagnosis = (code: string) => {
    setSelectedDiagnoses(selectedDiagnoses.filter((d) => d.code !== code));
  };

  const handleAddMedicine = () => {
    setPrescriptions([
      ...prescriptions,
      { medicineName: '', dosage: '500 mg', frequency: '1-0-1', durationDays: 5, route: 'ORAL', instructions: '' },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineItem, val: any) => {
    const copy = [...prescriptions];
    copy[index] = { ...copy[index], [field]: val };
    setPrescriptions(copy);
  };

  const calculateBmi = () => {
    if (vitals.heightCm > 0 && vitals.weightKg > 0) {
      const hM = vitals.heightCm / 100;
      return (vitals.weightKg / (hM * hM)).toFixed(1);
    }
    return '0.0';
  };

  const handleCompleteConsultation = async () => {
    if (!activePatient) return;
    try {
      setLoading(true);

      const payload = {
        appointmentId: activePatient.appointment.id,
        patientId: activePatient.patient.id,
        doctorId: activePatient.doctor?.id || '00000000-0000-0000-0000-000000000000',
        chiefComplaints: chiefComplaints || 'General Consultation',
        clinicalFindings,
        vitals: {
          ...vitals,
          bmi: parseFloat(calculateBmi()),
        },
        diagnosisCodes: selectedDiagnoses,
        soapNotes: { subjective, objective, assessment, plan },
        prescription: {
          adviceInstructions,
          items: prescriptions.filter((p) => p.medicineName.trim() !== ''),
        },
      };

      const res = await api.post('/consultations', payload);
      const c = res.data.data.consultation;

      setIssuedPrescription({
        prescriptionCode: c.prescription?.prescriptionCode || 'RX-2026-LIVE',
        createdAt: new Date().toISOString(),
        adviceInstructions: adviceInstructions || 'Rest, fluid intake, and follow medication schedule.',
        doctorName: `Dr. ${c.doctor?.user?.firstName || 'David'} ${c.doctor?.user?.lastName || 'DoctorA1'}`,
        specialization: c.doctor?.specialization || 'Cardiology Specialist',
        departmentName: 'Cardiology',
        licenseNumber: c.doctor?.licenseNumber || 'MD-2026-9901',
        patientName: `${activePatient.patient.firstName} ${activePatient.patient.lastName}`,
        patientUhid: activePatient.patient.uhid,
        patientAgeGender: `${activePatient.patient.gender}, DOB: ${new Date(activePatient.patient.dateOfBirth).toLocaleDateString()}`,
        patientBloodGroup: activePatient.patient.bloodGroup || 'O+',
        vitalsSummary: `BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg | Pulse: ${vitals.pulseRate} bpm | SpO2: ${vitals.spo2}% | BMI: ${calculateBmi()}`,
        diagnosisSummary: selectedDiagnoses.map((d) => `${d.code} (${d.description})`).join(', ') || 'General OPD Examination',
        items: c.prescription?.items || prescriptions,
      });

      setIsModalOpen(true);
      loadQueue();
    } catch (err) {
      console.error('Consultation completion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonArray = (jsonStr?: string): string[] => {
    if (!jsonStr) return [];
    try {
      const arr = JSON.parse(jsonStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Patient Queue Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-sky-600" />
            Doctor Consultation Workspace
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Streamlined clinical OPD workflow, SOAP recorder & e-Prescription builder</p>
        </div>

        <button
          onClick={handleCallNext}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition text-sm shadow-md disabled:opacity-50"
        >
          <PhoneCall className="w-4 h-4" />
          Call Next Patient
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Live OPD Queue */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Live OPD Queue ({queue.length})
            </h3>
            <button onClick={loadQueue} className="text-[11px] text-sky-600 hover:underline">Refresh</button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {queue.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No patients waiting in queue</p>
            ) : (
              queue.map((item) => {
                const isActive = activePatient?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => selectPatientForConsultation(item)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
                        : 'bg-gray-50/60 border-gray-100 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                        #{item.tokenNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          item.queueStatus === 'ENGAGED_WITH_DOCTOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.queueStatus === 'ENGAGED_WITH_DOCTOR' ? 'In Consultation' : 'Waiting'}
                      </span>
                    </div>

                    <div className="mt-2">
                      <p className="font-bold text-gray-900 text-sm">{item.patient.firstName} {item.patient.lastName}</p>
                      <p className="text-[11px] font-mono text-sky-800">{item.patient.uhid}</p>
                    </div>

                    {item.appointment.reasonForVisit && (
                      <p className="text-[11px] text-gray-500 mt-1 truncate">
                        Reason: {item.appointment.reasonForVisit}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Consultation Workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {activePatient ? (
            <>
              {/* Active Patient Context Banner */}
              <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold">{activePatient.patient.firstName} {activePatient.patient.lastName}</h2>
                      <span className="bg-sky-500/30 text-sky-200 text-xs font-mono px-2.5 py-1 rounded-full border border-sky-400/30">
                        {activePatient.patient.uhid}
                      </span>
                    </div>
                    <p className="text-xs text-sky-200 mt-1">
                      Gender: {activePatient.patient.gender} | Blood: {activePatient.patient.bloodGroup || 'O+'} | Token: #{activePatient.tokenNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-semibold">
                      Reason: {activePatient.appointment.reasonForVisit || 'OPD Checkup'}
                    </span>
                  </div>
                </div>

                {/* Allergies Alert Pill */}
                {parseJsonArray(activePatient.patient.allergies).length > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-rose-500/20 text-rose-200 px-3 py-1.5 rounded-lg border border-rose-500/30">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">Allergies Alert:</span>
                    <span>{parseJsonArray(activePatient.patient.allergies).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Consultation Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('SOAP')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'SOAP'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  SOAP Notes
                </button>

                <button
                  onClick={() => setActiveTab('VITALS')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'VITALS'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Vitals Log
                </button>

                <button
                  onClick={() => setActiveTab('ICD10')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'ICD10'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  ICD-10 Diagnosis ({selectedDiagnoses.length})
                </button>

                <button
                  onClick={() => setActiveTab('PRESCRIPTION')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'PRESCRIPTION'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  e-Prescription Builder ({prescriptions.length})
                </button>

                <button
                  onClick={() => setActiveTab('EMR')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'EMR'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Past EMR History ({emrTimeline.length})
                </button>
              </div>

              {/* Tab 1: SOAP Notes */}
              {activeTab === 'SOAP' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subjective (Patient Reported Symptoms)</label>
                      <textarea
                        rows={3}
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        placeholder="Patient reports 3-day history of shortness of breath..."
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Objective (Clinical Examination)</label>
                      <textarea
                        rows={3}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Expiratory wheeze present in chest auscultation..."
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assessment (Clinical Impression)</label>
                      <textarea
                        rows={3}
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        placeholder="Acute mild asthma exacerbation..."
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plan (Treatment & Followup)</label>
                      <textarea
                        rows={3}
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        placeholder="Prescribed bronchodilator inhaler. Review in 7 days..."
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Vitals */}
              {activeTab === 'VITALS' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={vitals.systolicBp}
                        onChange={(e) => setVitals({ ...vitals, systolicBp: parseInt(e.target.value) || 120 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={vitals.diastolicBp}
                        onChange={(e) => setVitals({ ...vitals, diastolicBp: parseInt(e.target.value) || 80 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pulse Rate (bpm)</label>
                      <input
                        type="number"
                        value={vitals.pulseRate}
                        onChange={(e) => setVitals({ ...vitals, pulseRate: parseInt(e.target.value) || 72 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">SpO2 (%)</label>
                      <input
                        type="number"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: parseInt(e.target.value) || 98 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 98.6 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={vitals.weightKg}
                        onChange={(e) => setVitals({ ...vitals, weightKg: parseFloat(e.target.value) || 70 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={vitals.heightCm}
                        onChange={(e) => setVitals({ ...vitals, heightCm: parseFloat(e.target.value) || 172 })}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Calculated BMI</label>
                      <div className="w-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-lg p-2.5">
                        {calculateBmi()} kg/m²
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: ICD-10 Diagnosis */}
              {activeTab === 'ICD10' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search ICD-10 diagnostic codes or descriptions..."
                      value={icdSearch}
                      onChange={(e) => setIcdSearch(e.target.value)}
                      className="w-full pl-9 text-xs border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Selected Diagnoses */}
                  {selectedDiagnoses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700 uppercase">Selected Diagnoses:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDiagnoses.map((d) => (
                          <span
                            key={d.code}
                            className="text-xs bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium"
                          >
                            <span className="font-bold font-mono">{d.code}</span> - {d.description} ({d.type})
                            <button onClick={() => handleRemoveDiagnosis(d.code)} className="hover:text-rose-900">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Select Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Common Clinical ICD-10 Codes:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {COMMON_ICD10.filter((c) =>
                        icdSearch === ''
                          ? true
                          : c.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
                            c.description.toLowerCase().includes(icdSearch.toLowerCase())
                      ).map((item) => (
                        <div
                          key={item.code}
                          onClick={() => handleAddDiagnosis(item)}
                          className="p-2.5 border border-gray-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <span className="font-bold text-sky-800 font-mono mr-2">{item.code}</span>
                            <span className="text-gray-700">{item.description}</span>
                          </div>
                          <Plus className="w-4 h-4 text-sky-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: e-Prescription Builder */}
              {activeTab === 'PRESCRIPTION' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Pill className="w-4 h-4 text-sky-600" />
                      Prescribed Medicines List
                    </h3>
                    <button
                      onClick={handleAddMedicine}
                      className="flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sky-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Medicine
                    </button>
                  </div>

                  {/* Medicine Items List */}
                  <div className="space-y-3">
                    {prescriptions.map((med, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Medicine Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Amoxicillin 500mg"
                              value={med.medicineName}
                              onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Dosage</label>
                            <input
                              type="text"
                              placeholder="500 mg / 2 puffs"
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Frequency</label>
                            <div className="flex items-center gap-1">
                              {['1-0-1', '1-1-1', '1-0-0', '0-0-1', 'PRN'].map((freq) => (
                                <button
                                  key={freq}
                                  type="button"
                                  onClick={() => handleMedicineChange(idx, 'frequency', freq)}
                                  className={`text-[10px] font-semibold px-2 py-1 rounded transition ${
                                    med.frequency === freq
                                      ? 'bg-sky-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {freq}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Duration (Days)</label>
                            <input
                              type="number"
                              value={med.durationDays}
                              onChange={(e) => handleMedicineChange(idx, 'durationDays', parseInt(e.target.value) || 1)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Route</label>
                            <select
                              value={med.route}
                              onChange={(e) => handleMedicineChange(idx, 'route', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                            >
                              <option value="ORAL">ORAL</option>
                              <option value="IV">IV</option>
                              <option value="TOPICAL">TOPICAL</option>
                              <option value="INHALATION">INHALATION</option>
                              <option value="SUBLINGUAL">SUBLINGUAL</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder="Special instructions..."
                              value={med.instructions}
                              onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                            />

                            {prescriptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(idx)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">General Care & Dietary Advice</label>
                    <textarea
                      rows={2}
                      value={adviceInstructions}
                      onChange={(e) => setAdviceInstructions(e.target.value)}
                      placeholder="Drink warm water, avoid cold exposure..."
                      className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: EMR History */}
              {activeTab === 'EMR' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    Patient EMR History Timeline
                  </h3>

                  {emrTimeline.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No historical consultation records found for this patient.</p>
                  ) : (
                    <div className="space-y-4">
                      {emrTimeline.map((item, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-sky-800">{new Date(item.date).toLocaleDateString()}</span>
                            <span className="font-medium text-gray-600">{item.doctorName} ({item.specialization})</span>
                          </div>

                          <p className="text-xs text-gray-800 font-semibold">Chief Complaints: {item.chiefComplaints}</p>
                          {item.clinicalFindings && <p className="text-xs text-gray-600">Findings: {item.clinicalFindings}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button
                  onClick={handleCompleteConsultation}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition text-sm shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Finish Consultation & Issue e-Prescription
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl text-center shadow-sm border border-gray-100 space-y-3">
              <Users className="w-12 h-12 text-sky-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No Patient Selected</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Select a patient from the OPD queue on the left or click "Call Next Patient" to start consultation.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Printable Prescription Modal */}
      <PrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prescription={issuedPrescription}
      />
    </div>
  );
};

