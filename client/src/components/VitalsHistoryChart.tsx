import React from 'react';
import { VitalsRecord } from '../services/vitalsService';
import { Heart, Activity, Scale, Droplet } from 'lucide-react';

interface Props {
  vitalsHistory: VitalsRecord[];
}

export const VitalsHistoryChart: React.FC<Props> = ({ vitalsHistory }) => {
  if (!vitalsHistory || vitalsHistory.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border">
        No recorded vitals history found for this patient.
      </div>
    );
  }

  const latest = vitalsHistory[0];

  return (
    <div className="space-y-4">
      {/* Latest Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50/60 border border-red-100 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-red-600 text-xs font-bold uppercase mb-1">
            <Heart className="w-3.5 h-3.5" />
            <span>Blood Pressure</span>
          </div>
          <div className="text-lg font-bold text-red-950">
            {latest.bpSystolic && latest.bpDiastolic ? `${latest.bpSystolic}/${latest.bpDiastolic}` : '---'}
          </div>
          <span className="text-[11px] text-red-600">mmHg</span>
        </div>

        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-blue-600 text-xs font-bold uppercase mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Heart Rate</span>
          </div>
          <div className="text-lg font-bold text-blue-950">{latest.heartRate || '---'}</div>
          <span className="text-[11px] text-blue-600">bpm</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold uppercase mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>BMI (Body Mass)</span>
          </div>
          <div className="text-lg font-bold text-emerald-950">{latest.bmi || '---'}</div>
          <span className="text-[11px] text-emerald-600">
            {latest.weight && latest.height ? `${latest.weight}kg / ${latest.height}cm` : ''}
          </span>
        </div>

        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-amber-600 text-xs font-bold uppercase mb-1">
            <Droplet className="w-3.5 h-3.5" />
            <span>Glucose / SpO2</span>
          </div>
          <div className="text-lg font-bold text-amber-950">
            {latest.spO2 ? `${latest.spO2}%` : '---'}
          </div>
          <span className="text-[11px] text-amber-600">
            {latest.bloodGlucose ? `${latest.bloodGlucose} mg/dL` : ''}
          </span>
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">BP</th>
              <th className="px-3 py-2 text-left">HR</th>
              <th className="px-3 py-2 text-left">Temp</th>
              <th className="px-3 py-2 text-left">SpO2</th>
              <th className="px-3 py-2 text-left">Weight</th>
              <th className="px-3 py-2 text-left">BMI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {vitalsHistory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2 font-bold text-red-600">
                  {item.bpSystolic && item.bpDiastolic ? `${item.bpSystolic}/${item.bpDiastolic}` : '---'}
                </td>
                <td className="px-3 py-2">{item.heartRate ? `${item.heartRate} bpm` : '---'}</td>
                <td className="px-3 py-2">{item.temperature ? `${item.temperature}°F` : '---'}</td>
                <td className="px-3 py-2">{item.spO2 ? `${item.spO2}%` : '---'}</td>
                <td className="px-3 py-2">{item.weight ? `${item.weight} kg` : '---'}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">{item.bmi || '---'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

