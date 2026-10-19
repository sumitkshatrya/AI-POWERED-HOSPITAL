import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, FileText, ArrowRight } from 'lucide-react';

export const DoctorExperience: React.FC = () => {
  const navigate = useNavigate();

  const schedule = [
    { time: '09:00 AM', name: 'Rahul Sharma', type: 'Follow-up', status: 'Completed' },
    { time: '09:30 AM', name: 'Priya Singh', type: 'Consultation', status: 'In Progress' },
    { time: '10:00 AM', name: 'Amit Kumar', type: 'New Patient', status: 'Waiting' },
    { time: '10:30 AM', name: 'Anita Verma', type: 'Routine Checkup', status: 'Scheduled' },
  ];

  return (
    <section className="py-20 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Clinical Efficiency
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Give doctors more time for patients.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Streamlined clinical workspace built to minimize administrative clicks and maximize direct clinician-patient consultation time.
          </p>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Today's OPD Schedule</span>
              </div>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded">4 Appointments</span>
            </div>

            <div className="space-y-2.5">
              {schedule.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                    slot.status === 'In Progress'
                      ? 'bg-blue-600/15 border-blue-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{slot.time}</span>
                    <div>
                      <div className="font-semibold text-white">{slot.name}</div>
                      <div className="text-[10px] text-slate-400">{slot.type}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      slot.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : slot.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Patient: Priya Singh (31, Female)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">EMR #PAT-8842</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="text-[10px] text-slate-400">Blood Pressure</div>
                <div className="font-bold text-white mt-0.5">120/80 mmHg</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="text-[10px] text-slate-400">Heart Rate</div>
                <div className="font-bold text-white mt-0.5">72 bpm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="text-[10px] text-slate-400">SpO2</div>
                <div className="font-bold text-emerald-400 mt-0.5">99% Normal</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="text-[10px] text-slate-400">Body Temp</div>
                <div className="font-bold text-white mt-0.5">98.6 °F</div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1">
                <FileText className="w-4 h-4" /> Medical History & Flagged Allergies
              </div>
              <p>• History of mild asthma; no hospitalizations in past 12 months.</p>
              <p>• <strong className="text-white">Active Medications:</strong> Salbutamol Inhaler PRN.</p>
              <p>• <strong className="text-red-400">Penicillin Allergy:</strong> Flagged in red banner across EMR.</p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">e-Prescription & LIS orders linked automatically</span>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                Explore Doctor Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
