import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  FileDown,
  User,
  Bed as BedIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Stethoscope,
  Pill,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  ipdService,
  AdmissionRecord,
  DischargeSummary,
} from '../services/ipdService';

interface MedicationRow {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export const DischargeSummaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedAdmissionId = searchParams.get('admissionId');

  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>(preselectedAdmissionId || '');
  const [admission, setAdmission] = useState<AdmissionRecord | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Discharge Form State
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState<string>('');
  const [treatmentSummary, setTreatmentSummary] = useState<string>('');
  const [proceduresDone, setProceduresDone] = useState<string>('');
  const [conditionAtDischarge, setConditionAtDischarge] = useState<string>('IMPROVED');
  const [dietaryInstructions, setDietaryInstructions] = useState<string>('Low sodium, high protein diet with adequate hydration.');
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [followUpInstructions, setFollowUpInstructions] = useState<string>('Return to OPD clinic in 1 week or immediately if fever or shortness of breath reoccurs.');

  const [medications, setMedications] = useState<MedicationRow[]>([
    {
      medicineName: 'Amoxicillin + Clavulanic Acid 625mg',
      dosage: '1 tab',
      frequency: 'BD (Twice daily)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'Take after meals',
    },
    {
      medicineName: 'Paracetamol 650mg',
      dosage: '1 tab',
      frequency: 'SOS (As needed for pain/fever)',
      duration: '3 days',
      route: 'Oral',
      instructions: 'Take with food',
    },
  ]);

  const [finalizedSummary, setFinalizedSummary] = useState<DischargeSummary | null>(null);

  // Load admissions dropdown
  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        const list = await ipdService.getAdmissions();
        setAdmissions(list);
        if (!selectedAdmissionId && list.length > 0) {
          setSelectedAdmissionId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAdmissions();
  }, []);

  // Load admission details
  useEffect(() => {
    if (!selectedAdmissionId) return;
    const fetchAdmissionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ipdService.getAdmissionById(selectedAdmissionId);
        setAdmission(data);
        if (data.initialDiagnosis && !dischargeDiagnosis) {
          setDischargeDiagnosis(data.initialDiagnosis);
        }
        if (data.dischargeSummary) {
          setFinalizedSummary(data.dischargeSummary);
          setDischargeDiagnosis(data.dischargeSummary.dischargeDiagnosis);
          setTreatmentSummary(data.dischargeSummary.treatmentSummary);
          setProceduresDone(data.dischargeSummary.proceduresDone || '');
          setConditionAtDischarge(data.dischargeSummary.conditionAtDischarge);
          if (data.dischargeSummary.dischargeMedications) {
            setMedications(data.dischargeSummary.dischargeMedications as any);
          }
          if (data.dischargeSummary.dietaryInstructions) {
            setDietaryInstructions(data.dischargeSummary.dietaryInstructions);
          }
          if (data.dischargeSummary.followUpInstructions) {
            setFollowUpInstructions(data.dischargeSummary.followUpInstructions);
          }
        } else {
          setFinalizedSummary(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load admission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissionDetails();
  }, [selectedAdmissionId]);

  const handleAddMedicationRow = () => {
    setMedications([
      ...medications,
      {
        medicineName: '',
        dosage: '1 dose',
        frequency: 'OD (Once daily)',
        duration: '5 days',
        route: 'Oral',
        instructions: 'After meals',
      },
    ]);
  };

  const handleRemoveMedicationRow = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleUpdateMedication = (idx: number, field: keyof MedicationRow, value: string) => {
    const updated = [...medications];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedications(updated);
  };

  const handleFinalizeDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admission) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await ipdService.finalizeDischarge(admission.id, {
        dischargeDiagnosis,
        treatmentSummary,
        proceduresDone,
        conditionAtDischarge,
        dischargeMedications: medications.filter((m) => m.medicineName.trim() !== ''),
        dietaryInstructions,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        followUpInstructions,
      });

      setFinalizedSummary(res.dischargeSummary);
      setAdmission(res.admission);
      setSuccessMsg(`Patient successfully discharged! Bed #${admission.bed?.bedNumber} freed to CLEANING.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to finalize discharge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!admission) return;
    try {
      setActionLoading(true);
      await ipdService.downloadDischargePdf(
        admission.id,
        `Discharge_Summary_${admission.patient.uhid}_${admission.admissionNumber}.pdf`
      );
      setSuccessMsg('Discharge summary PDF downloaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download discharge summary PDF.');
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
            <FileCheck className="w-7 h-7 text-emerald-600" />
            Patient Discharge Summary & Documentation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Author clinical discharge summaries, formulate home prescription plans, and stream signed PDF documents.
          </p>
        </div>

        {finalizedSummary && (
          <button
            onClick={handleDownloadPdf}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download Signed PDF
          </button>
        )}
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

      {/* Patient Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Select Admission:
        </label>
        <select
          value={selectedAdmissionId}
          onChange={(e) => setSelectedAdmissionId(e.target.value)}
          className="w-full max-w-lg text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          {admissions.map((adm) => (
            <option key={adm.id} value={adm.id}>
              {adm.patient.firstName} {adm.patient.lastName} ({adm.patient.uhid}) - {adm.admissionNumber} [{adm.status}]
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading admission details...</div>
      ) : admission ? (
        <div className="space-y-6">
          {/* Patient Demographics & Admission Banner */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient Details</div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {admission.patient.firstName} {admission.patient.lastName}
              </div>
              <div className="text-xs text-indigo-600 font-mono mt-0.5">
                UHID: {admission.patient.uhid}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {admission.patient.gender} • Blood: {admission.patient.bloodGroup || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admission Details</div>
              <div className="text-sm font-medium text-gray-800 mt-1">
                {admission.admissionNumber}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Admitted: {new Date(admission.admissionDate).toLocaleDateString()}
              </div>
              <div className="mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                  admission.status === 'ADMITTED' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {admission.status}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bed & Location</div>
              <div className="text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                <BedIcon className="w-4 h-4 text-indigo-600" />
                Bed {admission.bed?.bedNumber} ({admission.bed?.roomNumber || 'Room'})
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{admission.ward?.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">Rate: ${admission.bed?.dailyRate}/day</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attending Physician</div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                Dr. {admission.doctor?.user.firstName} {admission.doctor?.user.lastName}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{admission.doctor?.specialization}</div>
              <div className="text-xs text-gray-400 mt-0.5">{admission.doctor?.user.email}</div>
            </div>
          </div>

          {/* Discharge Summary Form */}
          <form onSubmit={handleFinalizeDischarge} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Clinical Discharge Summary Form
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete all clinical details before final discharge. Discharging automatically releases the bed.
                </p>
              </div>

              {finalizedSummary && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> FINALIZED & SIGNED
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Discharge Diagnosis *
                </label>
                <textarea
                  rows={2}
                  required
                  disabled={!!finalizedSummary}
                  placeholder="Final clinical diagnosis (e.g. Acute exacerbation of COPD resolved, community acquired pneumonia)"
                  value={dischargeDiagnosis}
                  onChange={(e) => setDischargeDiagnosis(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Condition at Discharge *
                </label>
                <select
                  value={conditionAtDischarge}
                  disabled={!!finalizedSummary}
                  onChange={(e) => setConditionAtDischarge(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50 mb-2"
                >
                  <option value="IMPROVED">IMPROVED (Clinically stabilized)</option>
                  <option value="RECOVERED">RECOVERED (Full symptom resolution)</option>
                  <option value="STABLE">STABLE (Maintenance condition)</option>
                  <option value="CRITICAL">CRITICAL (Transferred to external tertiary care)</option>
                  <option value="AGAINST_MEDICAL_ADVICE">LAMA (Left Against Medical Advice)</option>
                  <option value="DECEASED">DECEASED</option>
                </select>

                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Procedures & Interventions Performed
                </label>
                <input
                  type="text"
                  disabled={!!finalizedSummary}
                  placeholder="e.g. Bronchoscopy, IV antibiotic course, Chest physiotherapy"
                  value={proceduresDone}
                  onChange={(e) => setProceduresDone(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Summary of Treatment & Hospital Course *
              </label>
              <textarea
                rows={4}
                required
                disabled={!!finalizedSummary}
                placeholder="Describe patient's clinical presentation, investigations, interventions administered, response to therapy, and discharge readiness..."
                value={treatmentSummary}
                onChange={(e) => setTreatmentSummary(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 disabled:bg-gray-50"
              />
            </div>

            {/* Discharge Medications Builder */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-indigo-600" />
                    Discharge Medications & Home Prescriptions
                  </h4>
                  <p className="text-xs text-gray-500">
                    Prescription medicines to be continued by the patient post-discharge.
                  </p>
                </div>
                {!finalizedSummary && (
                  <button
                    type="button"
                    onClick={handleAddMedicationRow}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                    <tr>
                      <th className="p-2">Medicine Name</th>
                      <th className="p-2">Dosage</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2">Route</th>
                      <th className="p-2">Instructions</th>
                      {!finalizedSummary && <th className="p-2 text-right">Remove</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medications.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            disabled={!!finalizedSummary}
                            placeholder="Medicine name"
                            value={row.medicineName}
                            onChange={(e) => handleUpdateMedication(idx, 'medicineName', e.target.value)}
                            className="w-full border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={!!finalizedSummary}
                            placeholder="Dosage"
                            value={row.dosage}
                            onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                            className="w-24 border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={!!finalizedSummary}
                            placeholder="Frequency"
                            value={row.frequency}
                            onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                            className="w-32 border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={!!finalizedSummary}
                            placeholder="Duration"
                            value={row.duration}
                            onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                            className="w-24 border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={!!finalizedSummary}
                            placeholder="Route"
                            value={row.route}
                            onChange={(e) => handleUpdateMedication(idx, 'route', e.target.value)}
                            className="w-20 border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={!!finalizedSummary}
                            placeholder="Special instructions"
                            value={row.instructions}
                            onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                            className="w-full border rounded p-1 text-xs disabled:bg-gray-50"
                          />
                        </td>
                        {!finalizedSummary && (
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicationRow(idx)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Follow-up & Diet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Dietary & Activity Advice
                </label>
                <textarea
                  rows={2}
                  disabled={!!finalizedSummary}
                  value={dietaryInstructions}
                  onChange={(e) => setDietaryInstructions(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Next Follow-up Date & Instructions
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    disabled={!!finalizedSummary}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg p-2 disabled:bg-gray-50"
                  />
                </div>
                <input
                  type="text"
                  disabled={!!finalizedSummary}
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {finalizedSummary ? (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={actionLoading}
                  className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download Discharge Summary PDF
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Processing Discharge...' : 'Finalize Discharge & Release Bed'}
                </button>
              )}
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
export default DischargeSummaryPage;

