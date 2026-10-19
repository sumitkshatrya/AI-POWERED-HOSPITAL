import React, { useEffect, useState } from 'react';
import {
  Siren,
  AlertOctagon,
  Clock,
  HeartPulse,
  User,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Stethoscope,
  Activity,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  emergencyService,
  EmergencyVisit,
  EmergencyDashboardData,
} from '../services/emergencyService';
import api from '../services/api';

export const EmergencyDashboardPage: React.FC = () => {
  const [data, setData] = useState<EmergencyDashboardData | null>(null);
  const [visits, setVisits] = useState<EmergencyVisit[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [triageFilter, setTriageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fast Registration Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isUnknownPatient, setIsUnknownPatient] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    patientId: '',
    unknownPatientName: 'Unknown Trauma Patient',
    gender: 'MALE',
    ageEstimate: 30,
    emergencyType: 'TRAUMA',
    chiefComplaint: '',
    heartRate: 80,
    systolicBp: 120,
    diastolicBp: 80,
    spo2: 98,
    respiratoryRate: 16,
    temperature: 37.0,
    gcsScore: 15,
    triageLevel: 'HIGH',
    triageNotes: '',
    assignedDoctorId: '',
  });

  // Triage Update Modal
  const [selectedVisitForTriage, setSelectedVisitForTriage] = useState<EmergencyVisit | null>(null);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState<boolean>(false);
  const [newTriageLevel, setNewTriageLevel] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');
  const [triageNotes, setTriageNotes] = useState<string>('');

  // Status Change Modal
  const [selectedVisitForStatus, setSelectedVisitForStatus] = useState<EmergencyVisit | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('STABILIZED');
  const [dischargeNotes, setDischargeNotes] = useState<string>('');

  const fetchEmergencyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, visitsList] = await Promise.all([
        emergencyService.getDashboard(),
        emergencyService.getVisits({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          triageLevel: triageFilter === 'ALL' ? undefined : triageFilter,
          search: searchQuery || undefined,
        }),
      ]);
      setData(dashData);
      setVisits(visitsList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch emergency department data.');
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get('/patients').catch(() => ({ data: { data: [] } })),
        api.get('/doctors').catch(() => ({ data: { data: [] } })),
      ]);
      setPatients(patientsRes.data.data?.patients || patientsRes.data.data || []);
      setDoctors(doctorsRes.data.data?.doctors || doctorsRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    fetchEmergencyData();
  }, [statusFilter, triageFilter]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const created = await emergencyService.createVisit({
        patientId: !isUnknownPatient ? registerForm.patientId : undefined,
        unknownPatientName: isUnknownPatient ? registerForm.unknownPatientName : undefined,
        gender: isUnknownPatient ? registerForm.gender : undefined,
        ageEstimate: isUnknownPatient ? registerForm.ageEstimate : undefined,
        emergencyType: registerForm.emergencyType,
        chiefComplaint: registerForm.chiefComplaint,
        initialVitals: {
          heartRate: registerForm.heartRate,
          systolicBp: registerForm.systolicBp,
          diastolicBp: registerForm.diastolicBp,
          spo2: registerForm.spo2,
          respiratoryRate: registerForm.respiratoryRate,
          temperature: registerForm.temperature,
          gcsScore: registerForm.gcsScore,
        },
        triageLevel: registerForm.triageLevel,
        triageNotes: registerForm.triageNotes,
        assignedDoctorId: registerForm.assignedDoctorId || undefined,
      });

      setSuccessMsg(`Emergency visit registered (#${created.visitNumber})! Triage: ${created.triageLevel}`);
      setIsRegisterModalOpen(false);
      setRegisterForm({
        patientId: '',
        unknownPatientName: 'Unknown Trauma Patient',
        gender: 'MALE',
        ageEstimate: 30,
        emergencyType: 'TRAUMA',
        chiefComplaint: '',
        heartRate: 80,
        systolicBp: 120,
        diastolicBp: 80,
        spo2: 98,
        respiratoryRate: 16,
        temperature: 37.0,
        gcsScore: 15,
        triageLevel: 'HIGH',
        triageNotes: '',
        assignedDoctorId: '',
      });
      fetchEmergencyData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register emergency visit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTriageSubmit = async () => {
    if (!selectedVisitForTriage) return;
    try {
      setActionLoading(true);
      await emergencyService.updateTriage(selectedVisitForTriage.id, {
        triageLevel: newTriageLevel,
        triageNotes,
        clinicalVerification: true,
      });
      setSuccessMsg(`Triage level verified as ${newTriageLevel}!`);
      setIsTriageModalOpen(false);
      setSelectedVisitForTriage(null);
      fetchEmergencyData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update triage level.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatusSubmit = async () => {
    if (!selectedVisitForStatus) return;
    try {
      setActionLoading(true);
      await emergencyService.updateStatus(selectedVisitForStatus.id, {
        status: newStatus as any,
        dischargeNotes: newStatus === 'DISCHARGED' ? dischargeNotes : undefined,
      });
      setSuccessMsg(`Patient status transitioned to ${newStatus}!`);
      setIsStatusModalOpen(false);
      setSelectedVisitForStatus(null);
      fetchEmergencyData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTriageBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-sm">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> CRITICAL (Level 1)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> HIGH (Level 2)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            MEDIUM (Level 3)
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            LOW (Level 4)
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">CRITICAL</span>;
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">ACTIVE INTAKE</span>;
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">WAITING</span>;
      case 'STABILIZED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800">STABILIZED</span>;
      case 'ADMITTED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">ADMITTED TO WARD</span>;
      case 'DISCHARGED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">DISCHARGED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-rose-900 text-white p-6 rounded-xl shadow-md border border-rose-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Siren className="w-7 h-7 text-rose-400 animate-bounce" />
            Emergency Department (ER / ED) & Triage Station
          </h1>
          <p className="text-sm text-rose-200 mt-1">
            Rapid patient intake, multi-tier clinical triage verification, resuscitation bays, and emergency bed coordination.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Fast ER Registration
          </button>
        </div>
      </div>

      {/* Mandatory Clinical Decision Support Disclaimer Banner */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] block text-amber-800">
            Mandatory Clinical Decision Support Notice
          </span>
          <p className="mt-0.5">
            Triage categorization is clinical decision support and does not constitute independent medical advice. Final triage priority, clinical pathway, and treatment orders must be verified by authorized emergency medical personnel.
          </p>
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

      {/* Overview Stat Counters */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Critical</div>
            <div className={`mt-2 text-3xl font-black ${data.summary.criticalVisits > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
              {data.summary.criticalVisits}
            </div>
            <div className="text-[11px] text-rose-500 font-medium mt-1">Level 1 Red Code</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Waiting Intake</div>
            <div className="mt-2 text-3xl font-extrabold text-amber-600">{data.summary.waitingVisits}</div>
            <div className="text-[11px] text-gray-400 mt-1">Pending triage/doctor</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active In ER</div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-600">{data.summary.activeVisits}</div>
            <div className="text-[11px] text-gray-400 mt-1">Under acute care</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stabilized</div>
            <div className="mt-2 text-3xl font-extrabold text-sky-600">{data.summary.stabilizedVisits}</div>
            <div className="text-[11px] text-sky-600 font-medium mt-1">Vitals controlled</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admitted IPD</div>
            <div className="mt-2 text-3xl font-extrabold text-purple-600">{data.summary.admittedVisits}</div>
            <div className="text-[11px] text-gray-400 mt-1">Transferred to ward/ICU</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Intake</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">{data.summary.todayRegistrations}</div>
            <div className="text-[11px] text-gray-400 mt-1">{data.summary.dischargedVisits} Discharged</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="ALL">All ER Statuses</option>
              <option value="CRITICAL">Critical</option>
              <option value="WAITING">Waiting</option>
              <option value="ACTIVE">Active Intake</option>
              <option value="STABILIZED">Stabilized</option>
              <option value="ADMITTED">Admitted</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Triage Level</label>
            <select
              value={triageFilter}
              onChange={(e) => setTriageFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="ALL">All Triage Levels</option>
              <option value="CRITICAL">Critical (Level 1)</option>
              <option value="HIGH">High (Level 2)</option>
              <option value="MEDIUM">Medium (Level 3)</option>
              <option value="LOW">Low (Level 4)</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchEmergencyData}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-rose-600 transition"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* Emergency Visits Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading emergency department intake...</div>
        ) : visits.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Siren className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-900">No emergency cases in this view</p>
            <p className="text-sm text-gray-400 mt-1">Click "Fast ER Registration" to intake incoming emergencies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b text-xs uppercase font-medium">
                <tr>
                  <th className="px-5 py-3">Visit # / Arrival</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Type & Complaint</th>
                  <th className="px-5 py-3">Triage</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Doctor</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {visits.map((v) => {
                  let parsedVitals: any = null;
                  try {
                    if (v.initialVitals) parsedVitals = JSON.parse(v.initialVitals);
                  } catch (e) {}

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-gray-50/80 transition ${
                        v.triageLevel === 'CRITICAL' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{v.visitNumber}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(v.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {v.patient ? (
                          <>
                            <div className="font-bold text-gray-900">
                              {v.patient.firstName} {v.patient.lastName}
                            </div>
                            <div className="text-xs text-indigo-600 font-mono">{v.patient.uhid}</div>
                            <div className="text-xs text-gray-400">
                              {v.patient.gender} • Blood: {v.patient.bloodGroup || 'N/A'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-rose-900 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-rose-600" />
                              {v.unknownPatientName}
                            </div>
                            <div className="text-xs text-rose-600 font-medium">Unidentified Walk-in</div>
                            <div className="text-xs text-gray-400">{v.gender || 'Unknown'}, ~{v.ageEstimate || 30} yrs</div>
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {v.emergencyType}
                        </span>
                        <div className="font-medium text-gray-800 text-xs mt-1 truncate">
                          {v.chiefComplaint}
                        </div>
                        {parsedVitals && (
                          <div className="text-[11px] font-mono text-gray-500 mt-1">
                            HR:{parsedVitals.heartRate} BP:{parsedVitals.systolicBp}/{parsedVitals.diastolicBp} SpO2:{parsedVitals.spo2}%
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {getTriageBadge(v.triageLevel)}
                        {v.triageNotes && (
                          <div className="text-[11px] text-gray-500 italic mt-1 truncate max-w-xs">
                            "{v.triageNotes}"
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(v.status)}
                      </td>

                      <td className="px-5 py-4">
                        {v.assignedDoctor ? (
                          <div className="text-xs font-medium text-gray-800">
                            Dr. {v.assignedDoctor.user.firstName} {v.assignedDoctor.user.lastName}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedVisitForTriage(v);
                              setNewTriageLevel(v.triageLevel);
                              setTriageNotes(v.triageNotes || '');
                              setIsTriageModalOpen(true);
                            }}
                            title="Verify / Change Triage"
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedVisitForStatus(v);
                              setNewStatus(v.status);
                              setDischargeNotes(v.dischargeNotes || '');
                              setIsStatusModalOpen(true);
                            }}
                            title="Transition Status / Discharge"
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fast ER Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Siren className="w-5 h-5 text-rose-600" />
                Fast Emergency Intake
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isUnknownPatient}
                    onChange={(e) => setIsUnknownPatient(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  Unidentified / Trauma Walk-in (John/Jane Doe)
                </label>
              </div>

              {!isUnknownPatient ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={registerForm.patientId}
                    onChange={(e) => setRegisterForm({ ...registerForm, patientId: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">Select Existing Patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.uhid})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary ID Name *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.unknownPatientName}
                      onChange={(e) => setRegisterForm({ ...registerForm, unknownPatientName: e.target.value })}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Age</label>
                    <input
                      type="number"
                      value={registerForm.ageEstimate}
                      onChange={(e) => setRegisterForm({ ...registerForm, ageEstimate: parseInt(e.target.value) || 30 })}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Type *</label>
                  <select
                    value={registerForm.emergencyType}
                    onChange={(e) => setRegisterForm({ ...registerForm, emergencyType: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  >
                    <option value="TRAUMA">Trauma / Accident</option>
                    <option value="CARDIAC">Cardiac Emergency</option>
                    <option value="RESPIRATORY">Respiratory Distress</option>
                    <option value="STROKE">Acute Stroke</option>
                    <option value="BURNS">Severe Burns</option>
                    <option value="POISONING">Poisoning / Toxicity</option>
                    <option value="PEDIATRIC">Pediatric Emergency</option>
                    <option value="GENERAL">General Acute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned ER Doctor</label>
                  <select
                    value={registerForm.assignedDoctorId}
                    onChange={(e) => setRegisterForm({ ...registerForm, assignedDoctorId: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.firstName || d.firstName} {d.user?.lastName || d.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unresponsive post high-impact fall, severe dyspnea"
                  value={registerForm.chiefComplaint}
                  onChange={(e) => setRegisterForm({ ...registerForm, chiefComplaint: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>

              {/* Vitals Grid */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-700">Initial Vitals</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block">HR (bpm)</label>
                    <input
                      type="number"
                      value={registerForm.heartRate}
                      onChange={(e) => setRegisterForm({ ...registerForm, heartRate: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">BP (sys/dia)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="Sys"
                        value={registerForm.systolicBp}
                        onChange={(e) => setRegisterForm({ ...registerForm, systolicBp: parseInt(e.target.value) || 0 })}
                        className="w-1/2 text-xs border rounded p-1.5 bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Dia"
                        value={registerForm.diastolicBp}
                        onChange={(e) => setRegisterForm({ ...registerForm, diastolicBp: parseInt(e.target.value) || 0 })}
                        className="w-1/2 text-xs border rounded p-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">SpO2 (%)</label>
                    <input
                      type="number"
                      value={registerForm.spo2}
                      onChange={(e) => setRegisterForm({ ...registerForm, spo2: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">GCS (3-15)</label>
                    <input
                      type="number"
                      min="3"
                      max="15"
                      value={registerForm.gcsScore}
                      onChange={(e) => setRegisterForm({ ...registerForm, gcsScore: parseInt(e.target.value) || 15 })}
                      className="w-full text-xs border rounded p-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Triage Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Triage Level</label>
                  <select
                    value={registerForm.triageLevel}
                    onChange={(e) => setRegisterForm({ ...registerForm, triageLevel: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  >
                    <option value="CRITICAL">CRITICAL (Level 1 Red)</option>
                    <option value="HIGH">HIGH (Level 2 Orange)</option>
                    <option value="MEDIUM">MEDIUM (Level 3 Yellow)</option>
                    <option value="LOW">LOW (Level 4 Green)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Triage Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Pale, diaphoretic, immediate airway check"
                    value={registerForm.triageNotes}
                    onChange={(e) => setRegisterForm({ ...registerForm, triageNotes: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {actionLoading ? 'Registering...' : 'Complete Emergency Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Triage Update Modal */}
      {isTriageModalOpen && selectedVisitForTriage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                Clinical Triage Verification
              </h3>
              <button onClick={() => setIsTriageModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
              <div><span className="font-semibold">Visit:</span> {selectedVisitForTriage.visitNumber}</div>
              <div><span className="font-semibold">Patient:</span> {selectedVisitForTriage.unknownPatientName || `${selectedVisitForTriage.patient?.firstName} ${selectedVisitForTriage.patient?.lastName}`}</div>
              <div><span className="font-semibold">Chief Complaint:</span> {selectedVisitForTriage.chiefComplaint}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Verified Triage Level *</label>
                <select
                  value={newTriageLevel}
                  onChange={(e: any) => setNewTriageLevel(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                >
                  <option value="CRITICAL">CRITICAL (Level 1 Red - Resuscitation)</option>
                  <option value="HIGH">HIGH (Level 2 Orange - Emergent)</option>
                  <option value="MEDIUM">MEDIUM (Level 3 Yellow - Urgent)</option>
                  <option value="LOW">LOW (Level 4 Green - Non-urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Triage Notes</label>
                <textarea
                  rows={3}
                  placeholder="Clinical assessment rationale, shock index, mental status, immediate interventions..."
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg text-[11px] text-amber-800 border border-amber-200">
                Notice: Clinical staff authorization required. Triage classification is assistive decision support.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsTriageModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTriageSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Confirm Triage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Status Modal */}
      {isStatusModalOpen && selectedVisitForStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-indigo-600" />
                Transition Patient Status
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                >
                  <option value="ACTIVE">ACTIVE (Under ER evaluation)</option>
                  <option value="CRITICAL">CRITICAL (Resuscitation underway)</option>
                  <option value="STABILIZED">STABILIZED (Vitals stabilized)</option>
                  <option value="ADMITTED">ADMITTED (Transferred to IPD)</option>
                  <option value="DISCHARGED">DISCHARGED (Discharged from ER)</option>
                </select>
              </div>

              {newStatus === 'DISCHARGED' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discharge Notes *</label>
                  <textarea
                    rows={3}
                    placeholder="Discharge condition, treatment administered, home medications and precautions..."
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatusSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {actionLoading ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmergencyDashboardPage;

