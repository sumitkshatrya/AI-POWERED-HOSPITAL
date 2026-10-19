import React, { useState, useEffect } from 'react';
import { AppointmentData, appointmentService } from '../services/appointmentService';
import { doctorService, DoctorListItem } from '../services/doctorService';
import { PatientBookingWizard } from '../components/PatientBookingWizard';
import { DoctorScheduleModal } from '../components/DoctorScheduleModal';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

export const AppointmentsCalendar: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === Role.DOCTOR;
  const isAdminOrStaff = user?.role === Role.SUPER_ADMIN || user?.role === Role.HOSPITAL_ADMIN || user?.role === Role.BRANCH_ADMIN || user?.role === Role.RECEPTIONIST;

  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Modals state
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentData | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('09:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('09:30');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, viewMode, selectedDoctorFilter, selectedStatusFilter]);

  const loadDoctors = async () => {
    try {
      const res = await doctorService.getDoctors({ limit: 50 });
      setDoctors(res.doctors);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate = selectedDate;
      let endDate = selectedDate;

      if (viewMode === 'WEEK') {
        const curr = new Date(selectedDate);
        const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        const lastDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else if (viewMode === 'MONTH') {
        const curr = new Date(selectedDate);
        const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
        const lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      }

      const data = await appointmentService.getAppointments({
        startDate: viewMode !== 'DAY' ? startDate : undefined,
        endDate: viewMode !== 'DAY' ? endDate : undefined,
        date: viewMode === 'DAY' ? selectedDate : undefined,
        doctorId: selectedDoctorFilter || undefined,
        status: selectedStatusFilter || undefined,
      });

      setAppointments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await appointmentService.checkIn(id);
      loadAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (reason === null) return;
    try {
      await appointmentService.cancelAppointment(id, reason);
      loadAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    try {
      await appointmentService.rescheduleAppointment(rescheduleTarget.id, {
        appointmentDate: rescheduleDate,
        slotStartTime: rescheduleStartTime,
        slotEndTime: rescheduleEndTime,
      });
      setRescheduleTarget(null);
      loadAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Reschedule failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">Confirmed</span>;
      case 'CHECKED_IN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">Checked-In</span>;
      case 'IN_CONSULTATION':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">In Consultation</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments & Calendar</h1>
          <p className="text-xs text-gray-500">Manage doctor schedules, slot availability, and patient appointments</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(isDoctor || isAdminOrStaff) && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition"
            >
              ⚙️ Doctor Availability Config
            </button>
          )}

          <button
            onClick={() => setIsBookingWizardOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-md flex items-center gap-2"
          >
            <span>+</span> Book New Appointment
          </button>
        </div>
      </div>

      {/* Filters & View Switches */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <select
            value={selectedDoctorFilter}
            onChange={e => setSelectedDoctorFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Calendar View Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('DAY')}
            className={`px-4 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'DAY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('WEEK')}
            className={`px-4 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'WEEK' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('MONTH')}
            className={`px-4 py-1.5 rounded-lg font-bold transition ${
              viewMode === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Main Calendar View Area */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading appointments schedule...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <div className="text-4xl">📅</div>
          <h3 className="text-lg font-bold text-gray-800">No Appointments Scheduled</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            There are no appointments found for the selected date range and filter criteria.
          </p>
          <button
            onClick={() => setIsBookingWizardOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition"
          >
            Schedule Appointment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Patient Details</th>
                  <th className="py-3.5 px-4">Doctor & Specialty</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {appointments.map(app => (
                  <tr key={app.id} className="hover:bg-blue-50/20 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      <div>{app.appointmentDate?.split('T')[0]}</div>
                      <div className="text-blue-600 font-semibold">{app.slotStartTime} - {app.slotEndTime}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{app.patient?.firstName} {app.patient?.lastName}</div>
                      <div className="text-[11px] text-gray-500">UHID: {app.patient?.uhid} • 📞 {app.patient?.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">Dr. {app.doctor?.user?.firstName} {app.doctor?.user?.lastName}</div>
                      <div className="text-[11px] text-blue-600">{app.doctor?.specialization}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold uppercase text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {app.appointmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {app.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCheckIn(app.id)}
                          className="px-2.5 py-1 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition"
                        >
                          Check In
                        </button>
                      )}

                      {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => {
                              setRescheduleTarget(app);
                              setRescheduleDate(app.appointmentDate?.split('T')[0]);
                            }}
                            className="px-2.5 py-1 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="px-2 py-1 text-red-600 hover:text-red-800 font-medium transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Wizard Modal */}
      <PatientBookingWizard
        isOpen={isBookingWizardOpen}
        onClose={() => setIsBookingWizardOpen(false)}
        onSuccess={() => loadAppointments()}
      />

      {/* Doctor Schedule Setup Modal */}
      <DoctorScheduleModal
        doctorId={selectedDoctorFilter || doctors[0]?.id || ''}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSaved={() => loadAppointments()}
      />

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Reschedule Appointment</h3>
            <p className="text-xs text-gray-500">
              Rescheduling appointment for <strong>{rescheduleTarget.patient?.firstName} {rescheduleTarget.patient?.lastName}</strong>
            </p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={e => setRescheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={e => setRescheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setRescheduleTarget(null)} className="px-4 py-2 border rounded text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
