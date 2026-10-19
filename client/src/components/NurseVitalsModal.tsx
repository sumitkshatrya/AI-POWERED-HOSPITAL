import React, { useState } from 'react';
import { X, Activity, Save } from 'lucide-react';
import { vitalsService, VitalsRecord } from '../services/vitalsService';

interface Props {
  patientId: string;
  appointmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NurseVitalsModal: React.FC<Props> = ({ patientId, appointmentId, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    temperature: '',
    spO2: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    bloodGlucose: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto calculated BMI
  const weightNum = parseFloat(formData.weight);
  const heightNum = parseFloat(formData.height);
  let calculatedBmi: string | null = null;

  if (!isNaN(weightNum) && !isNaN(heightNum) && heightNum > 0) {
    const hMeters = heightNum / 100;
    calculatedBmi = (weightNum / (hMeters * hMeters)).toFixed(2);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: Partial<VitalsRecord> = {
        patientId,
        appointmentId,
        bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic) : undefined,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        spO2: formData.spO2 ? parseFloat(formData.spO2) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        bloodGlucose: formData.bloodGlucose ? parseFloat(formData.bloodGlucose) : undefined,
        notes: formData.notes || undefined,
      };

      await vitalsService.recordVitals(payload);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record vitals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-lg">Nurse Triage: Record Vitals</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {/* Blood Pressure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BP Systolic (mmHg)</label>
              <input
                type="number"
                name="bpSystolic"
                value={formData.bpSystolic}
                onChange={handleChange}
                placeholder="120"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BP Diastolic (mmHg)</label>
              <input
                type="number"
                name="bpDiastolic"
                value={formData.bpDiastolic}
                onChange={handleChange}
                placeholder="80"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* HR & Temp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleChange}
                placeholder="72"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                placeholder="98.6"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SpO2 & Resp Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
              <input
                type="number"
                step="0.1"
                name="spO2"
                value={formData.spO2}
                onChange={handleChange}
                placeholder="98"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate (/min)</label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleChange}
                placeholder="16"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Weight, Height, BMI */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="70"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="175"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BMI (Calculated)</label>
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-blue-600">
                {calculatedBmi || '---'}
              </div>
            </div>
          </div>

          {/* Blood Glucose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              name="bloodGlucose"
              value={formData.bloodGlucose}
              onChange={handleChange}
              placeholder="100"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes / Complaints</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Patient reports mild headache..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border text-slate-600 rounded-lg text-sm hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium flex items-center space-x-1 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Vitals'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

