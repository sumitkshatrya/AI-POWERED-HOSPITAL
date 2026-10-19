import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Volume2, Users, Clock, ArrowRight, Activity } from 'lucide-react';
import api from '../services/api';

interface QueueItem {
  id: string;
  tokenNumber: number;
  queueStatus: string;
  patient: {
    firstName: string;
    lastName: string;
    uhid: string;
  };
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export const OpdTokenDisplayScreen: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentCalling, setCurrentCalling] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/opd-queue');
      const items: QueueItem[] = res.data.data.queue || [];
      setQueue(items);

      const calling = items.find((i) => i.queueStatus === 'ENGAGED_WITH_DOCTOR');
      setCurrentCalling(calling || null);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const socketUrl = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('opd:queue-updated', () => {
      fetchQueue();
    });

    socket.on('opd:patient-called', (data: { tokenNumber: number; patientName: string }) => {
      // Audio chime announcement simulation
      try {
        const msg = new SpeechSynthesisUtterance(`Token number ${data.tokenNumber}, ${data.patientName}, please proceed to consultation room.`);
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.log('Speech synthesis unsupported');
      }
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const waitingList = queue.filter((i) => i.queueStatus === 'WAITING');
  const nextToken = waitingList[0];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">OPD PATIENT QUEUE DISPLAY</h1>
            <p className="text-sm text-slate-400">Real-time Live Token Status Wall</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-sm">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calling Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/60 to-slate-800 border-2 border-blue-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-widest flex items-center space-x-1">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            <span>NOW CALLING</span>
          </div>

          {currentCalling ? (
            <>
              <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-2">NOW CONSULTING</span>
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200 tracking-tight my-4">
                #{currentCalling.tokenNumber.toString().padStart(3, '0')}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {currentCalling.patient.firstName} {currentCalling.patient.lastName}
              </h2>
              <p className="text-slate-300 text-sm bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                UHID: {currentCalling.patient.uhid}
              </p>
            </>
          ) : (
            <div className="py-12">
              <span className="text-6xl font-black text-slate-600 block mb-3">---</span>
              <p className="text-slate-400 font-medium">Waiting for doctor to call next patient...</p>
            </div>
          )}
        </div>

        {/* Next & Queue Sidebar */}
        <div className="flex flex-col space-y-6">
          {/* Next Token Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">NEXT IN LINE</span>
              {nextToken ? (
                <>
                  <span className="text-3xl font-extrabold text-emerald-200">
                    #{nextToken.tokenNumber.toString().padStart(3, '0')}
                  </span>
                  <p className="text-sm font-medium text-slate-300">
                    {nextToken.patient.firstName} {nextToken.patient.lastName}
                  </p>
                </>
              ) : (
                <span className="text-sm text-slate-500">No waiting patients</span>
              )}
            </div>
            <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-500/40 text-emerald-400">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>

          {/* Waiting List */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
                <Users className="w-4 h-4 text-blue-400" />
                <span>WAITING LIST</span>
              </div>
              <span className="bg-blue-950 text-blue-300 border border-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {waitingList.length} Patient{waitingList.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
              {waitingList.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="bg-slate-800 text-blue-400 font-bold px-2.5 py-1 rounded-lg text-sm border border-slate-700">
                      #{item.tokenNumber.toString().padStart(3, '0')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {item.patient.firstName} {item.patient.lastName}
                      </p>
                      <p className="text-xs text-slate-400">UHID: {item.patient.uhid}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium">
                    Waiting
                  </span>
                </div>
              ))}

              {waitingList.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-8">No patients waiting in queue.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
