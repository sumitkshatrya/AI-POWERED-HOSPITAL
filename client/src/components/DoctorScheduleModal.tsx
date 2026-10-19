import React, { useState, useEffect } from 'react';
import { DoctorScheduleData, appointmentService } from '../services/appointmentService';

interface Props {
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const DoctorScheduleModal: React.FC<Props> = ({ doctorId, isOpen, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workingDays, setWorkingDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [maxAppointmentsPerDay, setMaxAppointmentsPerDay] = useState(20);
  const [allowOnline, setAllowOnline] = useState(true);

  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaves, setLeaves] = useState<Array<{ id?: string; fromDate: string; toDate: string; reason?: string }>>([]);

  const [holidayDate, setHolidayDate] = useState('');
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && doctorId) {
      loadSchedule();
    }
  }, [isOpen, doctorId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.getDoctorSchedule(doctorId);
      if (data) {
        setWorkingDays(data.workingDays || []);
        setStartTime(data.startTime || '09:00');
        setEndTime(data.endTime || '17:00');
        setBreakStartTime(data.breakStartTime || '13:00');
        setBreakEndTime(data.breakEndTime || '14:00');
        setSlotDurationMinutes(data.slotDurationMinutes || 30);
        setMaxAppointmentsPerDay(data.maxAppointmentsPerDay || 20);
        setAllowOnline(data.allowOnline ?? true);
        setLeaves(data.leaves || []);
        setHolidays(data.holidays || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schedule config.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const addLeave = () => {
    if (!leaveFrom || !leaveTo) return;
    setLeaves([...leaves, { fromDate: leaveFrom, toDate: leaveTo, reason: leaveReason }]);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
  };

  const removeLeave = (index: number) => {
    setLeaves(leaves.filter((_, i) => i !== index));
  };

  const addHoliday = () => {
    if (!holidayDate || holidays.includes(holidayDate)) return;
    setHolidays([...holidays, holidayDate]);
    setHolidayDate('');
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await appointmentService.updateDoctorSchedule(doctorId, {
        workingDays,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        slotDurationMinutes: Number(slotDurationMinutes),
        maxAppointmentsPerDay: Number(maxAppointmentsPerDay),
        allowOnline,
        leaves,
        holidays,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Doctor Schedule & Availability Setup</h2>
            <p className="text-xs text-gray-500">Configure working hours, breaks, slot length, leaves & holidays</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading schedule...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Working Days */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => {
                  const active = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Hours & Break Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Shift Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Shift End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Break Start Time</label>
                <input
                  type="time"
                  value={breakStartTime}
                  onChange={e => setBreakStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Break End Time</label>
                <input
                  type="time"
                  value={breakEndTime}
                  onChange={e => setBreakEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Duration, Max Appointments & Online Check */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slot Duration (Mins)</label>
                <select
                  value={slotDurationMinutes}
                  onChange={e => setSlotDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max Daily Appts</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxAppointmentsPerDay}
                  onChange={e => setMaxAppointmentsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={allowOnline}
                    onChange={e => setAllowOnline(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Enable Online Video
                </label>
              </div>
            </div>

            {/* Doctor Leaves Management */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Manage Doctor Leaves</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="date"
                  value={leaveFrom}
                  onChange={e => setLeaveFrom(e.target.value)}
                  className="px-2 py-1.5 border rounded text-xs"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={leaveTo}
                  onChange={e => setLeaveTo(e.target.value)}
                  className="px-2 py-1.5 border rounded text-xs"
                  placeholder="To Date"
                />
                <input
                  type="text"
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="Reason (Vacation...)"
                  className="px-2 py-1.5 border rounded text-xs"
                />
              </div>
              <button
                type="button"
                onClick={addLeave}
                className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-900 transition"
              >
                + Add Leave Period
              </button>

              {leaves.length > 0 && (
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                  {leaves.map((l, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded text-xs border border-gray-200">
                      <span>🌴 <strong>{l.fromDate}</strong> to <strong>{l.toDate}</strong> {l.reason && `(${l.reason})`}</span>
                      <button type="button" onClick={() => removeLeave(i)} className="text-red-500 font-bold hover:text-red-700">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Holidays Management */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Holidays & Closures</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="px-3 py-1.5 border rounded text-xs"
                />
                <button
                  type="button"
                  onClick={addHoliday}
                  className="px-3 py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-gray-900 transition"
                >
                  + Add Holiday
                </button>
              </div>

              {holidays.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {holidays.map(h => (
                    <span key={h} className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1.5">
                      📅 {h}
                      <button type="button" onClick={() => removeHoliday(h)} className="font-bold hover:text-red-900">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="border-t border-gray-200 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow"
              >
                {saving ? 'Saving...' : 'Save Schedule Config'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

