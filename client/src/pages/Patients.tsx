import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  HeartPulse,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';

interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: string;
}

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientForEmr, setSelectedPatientForEmr] = useState<Patient | null>(null);
  const [emrTimeline, setEmrTimeline] = useState<any[]>([]);

  // Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicConditions: '',
  });

  useEffect(() => {
    loadPatients();
  }, [search]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients', { params: { search } });
      setPatients(res.data.data.patients || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map((s) => s.trim()) : [],
      };
      await api.post('/patients', payload);
      setIsModalOpen(false);
      loadPatients();
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEmrTimeline = async (patient: Patient) => {
    setSelectedPatientForEmr(patient);
    try {
      const res = await api.get(`/patients/${patient.id}/emr`);
      setEmrTimeline(res.data.data.timeline || []);
    } catch (err) {
      console.error('Failed to fetch EMR timeline:', err);
    }
  };

  const parseJsonArray = (str?: string): string[] => {
    if (!str) return [];
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            Patient Directory & EMR Registry
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage patient onboarding, UHIDs, demographics, and clinical timeline history</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-semibold transition text-sm shadow"
        >
          <Plus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
        <Search className="w-5 h-5 absolute left-5 top-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by UHID, First Name, Last Name, or Phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">UHID</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Gender & DOB</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No registered patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-sky-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800">{p.uhid}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{p.firstName} {p.lastName}</td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {p.gender} | {new Date(p.dateOfBirth).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                        {p.bloodGroup || 'O+'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-gray-800">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {p.phone}
                      </div>
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {p.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      <span className="font-semibold block">{p.emergencyContactName}</span>
                      <span className="text-[11px] text-gray-500">{p.emergencyContactPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEmrTimeline(p)}
                        className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" /> EMR History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-sky-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Register New Patient Record
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Known Allergies (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Penicillin, Peanuts"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Chronic Conditions (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Hypertension, Diabetes"
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
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
                  Save & Assign UHID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMR Timeline Drawer Modal */}
      {selectedPatientForEmr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-sky-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  EMR Medical History Timeline
                </h3>
                <p className="text-xs text-sky-200">
                  {selectedPatientForEmr.firstName} {selectedPatientForEmr.lastName} ({selectedPatientForEmr.uhid})
                </p>
              </div>
              <button onClick={() => setSelectedPatientForEmr(null)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {emrTimeline.length === 0 ? (
                <p className="text-center py-10 text-gray-400">No past clinical consultation records found.</p>
              ) : (
                emrTimeline.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-800 text-sm">{new Date(item.date).toLocaleDateString()}</span>
                      <span className="font-medium text-gray-700">{item.doctorName} ({item.specialization})</span>
                    </div>

                    <p className="font-semibold text-gray-900">Chief Complaints: {item.chiefComplaints}</p>
                    {item.clinicalFindings && <p className="text-gray-700">Findings: {item.clinicalFindings}</p>}

                    {item.prescription?.items && (
                      <div className="pt-2 border-t border-gray-200 space-y-1">
                        <span className="font-bold text-gray-800 block">Prescribed Medicines:</span>
                        <div className="flex flex-wrap gap-2">
                          {item.prescription.items.map((m: any, mIdx: number) => (
                            <span key={mIdx} className="bg-sky-100 text-sky-900 font-medium px-2.5 py-1 rounded-md text-[11px]">
                              {m.medicineName} - {m.dosage} ({m.frequency})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

