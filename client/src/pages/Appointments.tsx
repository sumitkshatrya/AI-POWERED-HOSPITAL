import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  PhoneCall,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

interface Appointment {
  id: string;
  slotStartTime: string;
  slotEndTime: string;
  appointmentDate: string;
  appointmentType: string;
  status: string;
  reasonForVisit?: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    phone: string;
    bloodGroup?: string;
  };
  doctor: {
    id: string;
    specialization: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  opdQueue?: {
    tokenNumber: number;
    queueStatus: string;
  } | null;
}

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    slotStartTime: '09:00',
    slotEndTime: '09:15',
    appointmentType: 'OPD_FIRST',
    reasonForVisit: '',
  });

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedBranchId, selectedDate]);

  const loadAuxData = async () => {
    try {
      const [hospRes, staffRes, patientRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/staff'),
        api.get('/patients'),
      ]);

      const hospList = hospRes.data.data.hospitals || [];
      if (hospList.length > 0) {
        const bRes = await api.get(`/hospitals/${hospList[0].id}/branches`);
        const bList = bRes.data.data.branches || [];
        setBranches(bList);
        if (bList.length > 0) {
          setSelectedBranchId(bList[0].id);
          setFormData((prev) => ({ ...prev, branchId: bList[0].id }));
        }
      }

      const docList = (staffRes.data.data.staff || []).filter((s: any) => s.role === 'DOCTOR');
      setDoctors(docList);

      const pList = patientRes.data.data.patients || [];
      setPatients(pList);
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments', {
        params: {
          branchId: selectedBranchId,
          date: selectedDate,
        },
      });
      setAppointments(res.data.data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/appointments', formData);
      setIsModalOpen(false);
      loadAppointments();
    } catch (err) {
      console.error('Create appointment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await api.post(`/appointments/${appointmentId}/check-in`);
      loadAppointments();
    } catch (err) {
      console.error('Check-in error:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-600" />
            OPD Appointments & Slot Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Schedule doctor consultations, track slot bookings, and execute receptionist check-in</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/appointments/calendar"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold transition text-sm border border-gray-200"
          >
            <CalendarIcon className="w-4 h-4 text-gray-600" />
            Calendar View
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-semibold transition text-sm shadow"
          >
            <Plus className="w-4 h-4" />
            Book New Appointment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-medium"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{appointments.length}</span> appointments for {selectedDate}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Time Slot</th>
                <th className="py-3.5 px-4">Patient Info</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Reason for Visit</th>
                <th className="py-3.5 px-4">Status & Token</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No appointments scheduled for selected branch and date.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-sky-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                      {app.slotStartTime} - {app.slotEndTime}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{app.patient?.firstName} {app.patient?.lastName}</div>
                      <div className="text-[11px] font-mono text-gray-500">{app.patient?.uhid}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">Dr. {app.doctor?.user?.firstName} {app.doctor?.user?.lastName}</div>
                      <div className="text-[11px] text-sky-700 font-medium">{app.doctor?.specialization}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                        {app.appointmentType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                      {app.reasonForVisit || 'Routine Consultation'}
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                          app.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'CHECKED_IN'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>

                      {app.opdQueue && (
                        <div className="text-[11px] font-bold text-rose-700">
                          Token #{app.opdQueue.tokenNumber} ({app.opdQueue.queueStatus})
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {app.status === 'SCHEDULED' ? (
                        <button
                          onClick={() => handleCheckIn(app.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 text-xs shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Check-in Patient
                        </button>
                      ) : (
                        <span className="text-gray-400 font-medium">Checked In</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-sky-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                Schedule OPD Appointment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Patient</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Doctor</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.doctorProfile?.id || d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization || 'Cardiology'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="09:30"
                    value={formData.slotStartTime}
                    onChange={(e) => setFormData({ ...formData, slotStartTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="09:45"
                    value={formData.slotEndTime}
                    onChange={(e) => setFormData({ ...formData, slotEndTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for Visit</label>
                <textarea
                  rows={2}
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                  placeholder="Chief complaints reported by patient..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow"
                >
                  Confirm Appointment Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

