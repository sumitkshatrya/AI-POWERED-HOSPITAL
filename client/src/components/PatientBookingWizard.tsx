import React, { useState, useEffect } from 'react';
import { appointmentService, AvailableSlot } from '../services/appointmentService';
import { doctorService, DoctorListItem } from '../services/doctorService';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Props {
  initialDoctorId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PatientBookingWizard: React.FC<Props> = ({ initialDoctorId, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isReceptionistOrAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.HOSPITAL_ADMIN || user?.role === Role.BRANCH_ADMIN || user?.role === Role.NURSE;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data selections
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [appointmentType, setAppointmentType] = useState<'OPD' | 'FOLLOW_UP' | 'VIDEO' | 'EMERGENCY'>('OPD');
  const [reasonForVisit, setReasonForVisit] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctors.find(d => d.id === selectedDoctorId);
      if (doc) setSelectedDoctor(doc);
    }
  }, [selectedDoctorId, doctors]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadSlots(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const doctorRes = await doctorService.getDoctors({ limit: 50 });
      setDoctors(doctorRes.doctors);

      if (initialDoctorId) {
        setSelectedDoctorId(initialDoctorId);
      } else if (doctorRes.doctors.length > 0) {
        setSelectedDoctorId(doctorRes.doctors[0].id);
      }

      if (isReceptionistOrAdmin) {
        const patientRes = await api.get('/patients', { params: { limit: 100 } });
        const pList = patientRes.data.data.patients || [];
        setPatients(pList);
        if (pList.length > 0) {
          setSelectedPatientId(pList[0].id);
          setSelectedPatient(pList[0]);
        }
      } else {
        const patientRes = await api.get('/patients/me/record');
        const pRecord = patientRes.data.data.patient;
        if (pRecord) {
          setSelectedPatientId(pRecord.id);
          setSelectedPatient(pRecord);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load booking initial data.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (docId: string, dateStr: string) => {
    try {
      setSlotsLoading(true);
      setSelectedSlot(null);
      const res = await appointmentService.getAvailableSlots(docId, dateStr);
      setAvailableSlots(res.slots || []);
    } catch (err: any) {
      console.error('Failed to load slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handlePatientChange = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find(item => item.id === pId);
    if (p) setSelectedPatient(p);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctorId || !selectedPatientId || !selectedSlot) return;

    try {
      setLoading(true);
      setError(null);

      await appointmentService.createAppointment({
        branchId: selectedDoctor?.branch?.id || 'BRANCH_A1',
        hospitalId: selectedDoctor?.hospital?.id,
        departmentId: selectedDoctor?.department?.id,
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        slotStartTime: selectedSlot.slotStartTime,
        slotEndTime: selectedSlot.slotEndTime,
        appointmentType,
        reasonForVisit,
        fee: selectedDoctor?.fee || 50.0,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to complete appointment booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header & Steps progress bar */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
            <p className="text-xs text-gray-500">Step {step} of 4: {
              step === 1 ? 'Select Doctor & Specialty' :
              step === 2 ? 'Choose Date & Time Slot' :
              step === 3 ? 'Patient & Visit Details' : 'Review & Confirmation'
            }</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between my-4 px-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-blue-600 text-white shadow' :
                step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step === s ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                {s === 1 ? 'Doctor' : s === 2 ? 'Slot' : s === 3 ? 'Patient' : 'Confirm'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: Select Doctor */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Select Doctor</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {doctors.map(doc => {
                const selected = doc.id === selectedDoctorId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 transition ${
                      selected ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={doc.photo} alt={doc.name} className="w-12 h-12 rounded-full object-cover border" />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{doc.name}</h4>
                      <p className="text-xs text-blue-600 font-medium">{doc.specialization}</p>
                      <p className="text-[11px] text-gray-500">{doc.qualification} • ${doc.fee}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-4">
              <button
                disabled={!selectedDoctorId}
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Next: Choose Slot →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Date & Available Time Slot */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-xs text-gray-500">Doctor:</span>
                <p className="font-semibold text-sm text-gray-900">{selectedDoctor?.name}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Select Date:</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Available Time Slots ({selectedDate})
              </label>
              {slotsLoading ? (
                <div className="py-8 text-center text-xs text-gray-500">Checking doctor availability...</div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-sm text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                  Doctor is not available on this date (Holiday/Leave/Non-working day). Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.slotStartTime === slot.slotStartTime;
                    return (
                      <button
                        key={idx}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center border transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : slot.available
                            ? 'bg-white text-gray-800 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30'
                            : slot.reason === 'BREAK'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-75'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                        }`}
                      >
                        <span>{slot.slotStartTime} - {slot.slotEndTime}</span>
                        {!slot.available && <span className="text-[10px] uppercase font-normal">{slot.reason}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm text-gray-700">← Back</button>
              <button
                disabled={!selectedSlot || !selectedSlot.available}
                onClick={() => setStep(3)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Next: Patient Details →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Patient Selection & Visit Reason */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {isReceptionistOrAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Patient (Receptionist Override)</label>
                <select
                  value={selectedPatientId}
                  onChange={e => handlePatientChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.uhid})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-700 font-medium">Booking Patient:</span>
                <p className="font-bold text-sm text-blue-950">{selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.uhid})</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Consultation Type</label>
                <select
                  value={appointmentType}
                  onChange={e => setAppointmentType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="FOLLOW_UP">Follow-up Visit</option>
                  <option value="VIDEO">Online Video Consultation</option>
                  <option value="EMERGENCY">Emergency Visit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Fee</label>
                <input
                  type="text"
                  readOnly
                  value={`$${selectedDoctor?.fee || 50.0}`}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-700 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Visit / Symptoms</label>
              <textarea
                rows={3}
                value={reasonForVisit}
                onChange={e => setReasonForVisit(e.target.value)}
                placeholder="Describe your health symptoms or reason for visit..."
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button onClick={() => setStep(2)} className="px-4 py-2 border rounded-lg text-sm text-gray-700">← Back</button>
              <button
                disabled={!selectedPatientId}
                onClick={() => setStep(4)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Next: Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Confirmation */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <h4 className="font-bold text-gray-900 border-b pb-2 text-sm">Appointment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Doctor:</span>
                  <p className="font-semibold text-gray-900">{selectedDoctor?.name}</p>
                  <p className="text-gray-500">{selectedDoctor?.specialization}</p>
                </div>
                <div>
                  <span className="text-gray-500">Patient:</span>
                  <p className="font-semibold text-gray-900">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                  <p className="text-gray-500">UHID: {selectedPatient?.uhid}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date & Slot:</span>
                  <p className="font-semibold text-gray-900">{selectedDate}</p>
                  <p className="text-blue-600 font-bold">{selectedSlot?.slotStartTime} - {selectedSlot?.slotEndTime}</p>
                </div>
                <div>
                  <span className="text-gray-500">Type & Fee:</span>
                  <p className="font-semibold text-gray-900">{appointmentType}</p>
                  <p className="text-green-600 font-bold">${selectedDoctor?.fee || 50.0}</p>
                </div>
              </div>
              {reasonForVisit && (
                <div className="text-xs pt-2 border-t">
                  <span className="text-gray-500">Symptoms / Notes:</span>
                  <p className="text-gray-800 italic">{reasonForVisit}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button onClick={() => setStep(3)} className="px-4 py-2 border rounded-lg text-sm text-gray-700">← Back</button>
              <button
                disabled={loading}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 shadow-md transition"
              >
                {loading ? 'Booking...' : 'Confirm & Schedule Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
