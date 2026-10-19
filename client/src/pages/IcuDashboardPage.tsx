import React, { useEffect, useState } from 'react';
import {
  Activity,
  HeartPulse,
  Wind,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Bed as BedIcon,
  ShieldAlert,
  Clock,
  User,
  X,
} from 'lucide-react';
import {
  icuService,
  IcuDashboardData,
  IcuActivePatient,
  IcuMonitoringLog,
} from '../services/icuService';

export const IcuDashboardPage: React.FC = () => {
  const [data, setData] = useState<IcuDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Telemetry Modal
  const [selectedPatient, setSelectedPatient] = useState<IcuActivePatient | null>(null);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [telemetryForm, setTelemetryForm] = useState({
    heartRate: 75,
    systolicBp: 120,
    diastolicBp: 80,
    spo2: 98,
    respiratoryRate: 16,
    temperature: 37.0,
    ventilatorMode: 'NONE',
    fio2: 21,
    peep: 5,
    tidalVolume: 450,
    gcsScore: 15,
    telemetryNotes: '',
  });

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchIcuData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await icuService.getIcuDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ICU dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIcuData();
    const interval = setInterval(fetchIcuData, 15000); // 15s live refresh for ICU telemetry
    return () => clearInterval(interval);
  }, []);

  const handleOpenTelemetryModal = (p: IcuActivePatient) => {
    setSelectedPatient(p);
    const prev = p.latestTelemetry;
    if (prev) {
      setTelemetryForm({
        heartRate: prev.heartRate || 75,
        systolicBp: prev.systolicBp || 120,
        diastolicBp: prev.diastolicBp || 80,
        spo2: prev.spo2 || 98,
        respiratoryRate: prev.respiratoryRate || 16,
        temperature: prev.temperature || 37.0,
        ventilatorMode: prev.ventilatorMode || 'NONE',
        fio2: prev.fio2 || 21,
        peep: prev.peep || 5,
        tidalVolume: prev.tidalVolume || 450,
        gcsScore: prev.gcsScore || 15,
        telemetryNotes: '',
      });
    }
    setIsTelemetryModalOpen(true);
  };

  const handleRecordTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setActionLoading(true);
      const logged = await icuService.recordTelemetry(selectedPatient.admissionId, telemetryForm);
      setSuccessMsg(`Bedside telemetry recorded! Severity: ${logged.alertLevel}`);
      setIsTelemetryModalOpen(false);
      fetchIcuData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save telemetry data.');
    } finally {
      setActionLoading(false);
    }
  };

  const getAlertBadge = (level?: 'NORMAL' | 'WARNING' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse shadow-sm">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> CRITICAL ALERT
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> WARNING
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> STABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            MONITORING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 text-white p-6 rounded-xl shadow-md border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-rose-500 animate-pulse" />
            ICU Critical Care Command Center
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Real-time multi-parameter bedside telemetry, ventilator synchronization, and automated early-warning alerts.
          </p>
        </div>
        <button
          onClick={fetchIcuData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total ICU Beds</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{data.summary.totalIcuBeds}</div>
            <div className="text-xs text-indigo-600 font-medium mt-1">{data.summary.availableIcuBeds} Available</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupied Beds</div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-600">{data.summary.occupiedIcuBeds}</div>
            <div className="text-xs text-gray-400 mt-1">{data.summary.occupancyRate}% Occupancy</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Critical Alerts</div>
            <div className={`mt-2 text-3xl font-extrabold ${data.summary.criticalAlertsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
              {data.summary.criticalAlertsCount}
            </div>
            <div className="text-xs text-rose-500 font-medium mt-1">Requires immediate attention</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ventilator Support</div>
            <div className="mt-2 text-3xl font-extrabold text-sky-600">{data.summary.ventilatorPatientsCount}</div>
            <div className="text-xs text-sky-500 font-medium mt-1">Active mechanical ventilation</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bed Readiness</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">{data.summary.availableIcuBeds}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Ready for emergency intake</div>
          </div>
        </div>
      )}

      {/* Active ICU Patients Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-600" />
          Bedside Patient Telemetry Channels ({data?.activePatients.length || 0})
        </h2>

        {loading && !data ? (
          <div className="py-24 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
            Establishing live telemetry connections...
          </div>
        ) : !data || data.activePatients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
            <BedIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">All ICU Beds Vacant</h3>
            <p className="text-sm text-gray-500 mt-1">No critical care patients currently admitted in ICU.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.activePatients.map((patient) => {
              const tel = patient.latestTelemetry;
              const isVentilated = tel?.ventilatorMode && tel.ventilatorMode !== 'NONE';

              return (
                <div
                  key={patient.admissionId}
                  className={`bg-white rounded-xl shadow-sm border p-5 transition ${
                    tel?.alertLevel === 'CRITICAL'
                      ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/10'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Bed & Patient Header */}
                  <div className="flex items-start justify-between border-b pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xl text-gray-900 flex items-center gap-1.5">
                          <BedIcon className="w-5 h-5 text-indigo-600" />
                          {patient.bedNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-600">
                          {patient.wardName} {patient.roomNumber ? `• ${patient.roomNumber}` : ''}
                        </span>
                      </div>
                      <div className="font-bold text-base text-gray-900 mt-1">
                        {patient.patient.firstName} {patient.patient.lastName}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {patient.patient.uhid} • {patient.patient.gender} • Blood: {patient.patient.bloodGroup || 'Unknown'}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getAlertBadge(tel?.alertLevel)}
                      <button
                        onClick={() => handleOpenTelemetryModal(patient)}
                        className="inline-flex items-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Log Telemetry
                      </button>
                    </div>
                  </div>

                  {/* Vitals Telemetry Monitor Box */}
                  {tel ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">Heart Rate</div>
                          <div className={`text-xl font-black mt-0.5 ${tel.heartRate > 120 || tel.heartRate < 50 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                            {tel.heartRate}
                          </div>
                          <div className="text-[9px] text-gray-400">bpm</div>
                        </div>

                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">NIBP (mmHg)</div>
                          <div className={`text-sm font-black mt-1 ${tel.systolicBp < 90 || tel.systolicBp > 160 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                            {tel.systolicBp}/{tel.diastolicBp}
                          </div>
                          <div className="text-[9px] text-gray-400">MAP: {tel.meanArterialPressure || Math.round(tel.diastolicBp + (tel.systolicBp - tel.diastolicBp) / 3)}</div>
                        </div>

                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">SpO2</div>
                          <div className={`text-xl font-black mt-0.5 ${tel.spo2 < 92 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}`}>
                            {tel.spo2}%
                          </div>
                          <div className="text-[9px] text-gray-400">Saturation</div>
                        </div>

                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">Resp Rate</div>
                          <div className={`text-xl font-black mt-0.5 ${tel.respiratoryRate > 28 || tel.respiratoryRate < 10 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                            {tel.respiratoryRate}
                          </div>
                          <div className="text-[9px] text-gray-400">/min</div>
                        </div>

                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">Temp</div>
                          <div className={`text-xl font-black mt-0.5 ${tel.temperature > 38.5 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                            {tel.temperature}
                          </div>
                          <div className="text-[9px] text-gray-400">°C</div>
                        </div>

                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-500">GCS Score</div>
                          <div className={`text-xl font-black mt-0.5 ${tel.gcsScore && tel.gcsScore <= 8 ? 'text-rose-600 font-extrabold' : 'text-gray-900'}`}>
                            {tel.gcsScore || '-'}/15
                          </div>
                          <div className="text-[9px] text-gray-400">Neuro</div>
                        </div>
                      </div>

                      {/* Ventilator & Remarks strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-sky-50/50 rounded-lg border border-sky-100 text-xs">
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-sky-600" />
                          <span className="font-semibold text-gray-800">
                            Ventilator: {isVentilated ? `${tel.ventilatorMode} Mode` : 'Room Air / Spontaneous'}
                          </span>
                          {isVentilated && (
                            <span className="text-gray-600">
                              (FiO2: {tel.fio2}% | PEEP: {tel.peep} cmH2O)
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(tel.recordedAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {tel.telemetryNotes && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                          "{tel.telemetryNotes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-400 text-xs italic">
                      No telemetry recorded yet. Click "Log Telemetry" to connect vitals.
                    </div>
                  )}

                  {/* Attending & Reason Footer */}
                  <div className="mt-3 pt-3 border-t text-xs flex justify-between items-center text-gray-500">
                    <div>
                      <span className="font-medium text-gray-700">Admitting Reason:</span>{' '}
                      {patient.admissionReason}
                    </div>
                    {patient.doctor && (
                      <div>
                        Dr. {patient.doctor.user.firstName} {patient.doctor.user.lastName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Bedside Telemetry Modal */}
      {isTelemetryModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                Bedside Telemetry Logger - Bed {selectedPatient.bedNumber}
              </h3>
              <button onClick={() => setIsTelemetryModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleRecordTelemetry} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Heart Rate (bpm) *</label>
                  <input
                    type="number"
                    required
                    value={telemetryForm.heartRate}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, heartRate: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Systolic BP (mmHg) *</label>
                  <input
                    type="number"
                    required
                    value={telemetryForm.systolicBp}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, systolicBp: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Diastolic BP (mmHg) *</label>
                  <input
                    type="number"
                    required
                    value={telemetryForm.diastolicBp}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, diastolicBp: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">SpO2 (%) *</label>
                  <input
                    type="number"
                    required
                    value={telemetryForm.spo2}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, spo2: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Resp Rate (/min) *</label>
                  <input
                    type="number"
                    required
                    value={telemetryForm.respiratoryRate}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, respiratoryRate: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Temperature (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={telemetryForm.temperature}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Ventilator Mode</label>
                  <select
                    value={telemetryForm.ventilatorMode}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, ventilatorMode: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  >
                    <option value="NONE">None (Room Air / O2 Mask)</option>
                    <option value="SIMV">SIMV</option>
                    <option value="AC">AC (Assist-Control)</option>
                    <option value="CPAP">CPAP</option>
                    <option value="PSV">PSV</option>
                    <option value="BIPAP">BiPAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">FiO2 (%)</label>
                  <input
                    type="number"
                    min="21"
                    max="100"
                    value={telemetryForm.fio2}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, fio2: parseInt(e.target.value) || 21 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">GCS Score (3-15)</label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={telemetryForm.gcsScore}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, gcsScore: parseInt(e.target.value) || 15 })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Telemetry Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Desaturation event resolved post suctioning"
                  value={telemetryForm.telemetryNotes}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, telemetryNotes: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTelemetryModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {actionLoading ? 'Logging...' : 'Record Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default IcuDashboardPage;

