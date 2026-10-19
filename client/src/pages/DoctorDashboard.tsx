import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService, DoctorDashboardMetrics } from '../services/doctorService';
import { Calendar, Users, Activity, Clock, DollarSign, Stethoscope, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DoctorDashboardMetrics | null>(null);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorService.getDoctorDashboard();
      setMetrics(data.metrics);
      setRecentPatients(data.recentPatients);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load doctor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500 font-medium animate-pulse">Loading Doctor Dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 max-w-5xl mx-auto bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2 text-sky-200">
            Clinical Practitioner Workspace
          </span>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Doctor Clinical Dashboard</h1>
          <p className="text-sky-100 text-xs sm:text-sm mt-1">Real-time OPD queue oversight, appointment statistics, and consultation history.</p>
        </div>

        <button
          onClick={() => navigate('/doctor/consultation')}
          className="px-5 py-2.5 bg-white text-sky-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:bg-sky-50 transition-colors flex items-center space-x-2 flex-shrink-0"
        >
          <Stethoscope className="w-4 h-4 text-sky-600" />
          <span>Launch Consultation Workspace</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Today's OPD Appointments</span>
            <span className="text-2xl font-black text-gray-900">{metrics?.todayAppointments || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Pending OPD Queue</span>
            <span className="text-2xl font-black text-gray-900">{metrics?.pendingConsultations || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Total Unique Patients</span>
            <span className="text-2xl font-black text-gray-900">{metrics?.totalPatients || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Follow-ups Conducted</span>
            <span className="text-2xl font-black text-gray-900">{metrics?.followUps || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Upcoming Appointments</span>
            <span className="text-2xl font-black text-gray-900">{metrics?.upcomingAppointments || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Total Practice Revenue</span>
            <span className="text-2xl font-black text-gray-900">${metrics?.revenue || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent OPD Patient Consultations</h2>
            <p className="text-xs text-gray-500">Overview of recent patient check-ins and appointments</p>
          </div>

          <button
            onClick={() => navigate('/patients')}
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center"
          >
            <span>View All Patients Directory</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">UHID & MRN</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Appointment Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {recentPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                    No recent appointments logged today.
                  </td>
                </tr>
              ) : (
                recentPatients.map((item) => (
                  <tr key={item.appointmentId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {item.patient?.uhid}
                      <span className="block text-[10px] text-gray-400 font-normal">{item.patient?.mrn}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.patient?.firstName} {item.patient?.lastName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.patient?.phone}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{item.patient?.bloodGroup || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{item.slotTime}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'CHECKED_IN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/consultation`)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[11px] transition-colors"
                      >
                        Consult
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

