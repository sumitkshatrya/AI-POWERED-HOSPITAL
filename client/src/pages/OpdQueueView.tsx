import React, { useState, useEffect } from 'react';
import { Monitor, Clock, Users, HeartPulse, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface QueueItem {
  id: string;
  tokenNumber: number;
  queueStatus: string;
  patient: {
    firstName: string;
    lastName: string;
    uhid: string;
  };
  doctor: {
    specialization: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export const OpdQueueView: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/opd-queue');
      setQueue(res.data.data.queue || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPatients = queue.filter((q) => q.queueStatus === 'ENGAGED_WITH_DOCTOR');
  const waitingPatients = queue.filter((q) => q.queueStatus === 'WAITING');

  return (
    <div className="space-y-6">
      
      {/* Waiting Room Display Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Monitor className="w-7 h-7 text-sky-400" />
            <h1 className="text-2xl font-black tracking-tight">LIVE OPD QUEUE DISPLAY</h1>
          </div>
          <p className="text-xs text-sky-200 mt-1">Realtime token numbers & consultation room display board</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-300" />
            <span>Updated: {lastUpdated}</span>
          </div>
          <button
            onClick={loadQueue}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Consultation Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-500" />
            Currently In Consultation Room ({currentPatients.length})
          </h2>

          {currentPatients.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-xs text-gray-400 shadow-sm">
              No active consultations in progress.
            </div>
          ) : (
            currentPatients.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-md space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">NOW CALLING TOKEN</span>
                    <div className="text-5xl font-black mt-1">#{item.tokenNumber}</div>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                    ROOM 101
                  </span>
                </div>

                <div className="pt-3 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <p className="font-bold text-lg">{item.patient.firstName} {item.patient.lastName}</p>
                    <p className="text-xs text-emerald-100 font-mono">{item.patient.uhid}</p>
                  </div>
                  <p className="text-xs font-semibold text-right text-emerald-100">
                    Dr. {item.doctor.user.firstName} {item.doctor.user.lastName}
                    <span className="block text-[11px] opacity-80">{item.doctor.specialization}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Waiting Queue */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            Next Waiting Tokens ({waitingPatients.length})
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            {waitingPatients.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No waiting patients in queue.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {waitingPatients.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-2xl font-black text-sky-900 block">#{item.tokenNumber}</span>
                      <span className="text-xs font-bold text-gray-800">{item.patient.firstName} {item.patient.lastName}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">{item.patient.uhid}</span>
                    </div>

                    <span className="text-[10px] bg-sky-200/60 text-sky-900 font-semibold px-2 py-1 rounded">
                      WAITING
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

