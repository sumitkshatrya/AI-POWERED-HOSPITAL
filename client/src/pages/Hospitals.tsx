import React, { useEffect, useState } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Hospital } from '../types/hospital';
import { Building2, Plus, Search, Edit3, Trash2, Globe, Phone, Mail, ShieldAlert, CheckCircle } from 'lucide-react';

const parseFacilitiesList = (fac: any): string[] => {
  if (!fac) return [];
  if (Array.isArray(fac)) return fac.map(String);
  if (typeof fac === 'string') {
    try {
      const parsed = JSON.parse(fac);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return fac.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export const Hospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    emergencyContact: '',
    workingHours: '24/7 Emergency & OPD',
    facilities: 'Emergency, ICU, Radiology, Pharmacy, Laboratory',
    taxId: '',
  });

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalService.getHospitals(search);
      setHospitals(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch hospital records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [search]);

  const handleOpenModal = (hospital?: Hospital) => {
    if (hospital) {
      setEditingHospital(hospital);
      setFormData({
        name: hospital.name || '',
        code: hospital.code || '',
        contactEmail: hospital.contactEmail || '',
        contactPhone: hospital.contactPhone || '',
        address: hospital.address || '',
        website: hospital.website || '',
        emergencyContact: hospital.emergencyContact || '',
        workingHours: hospital.workingHours || '24/7 Emergency & OPD',
        facilities: parseFacilitiesList(hospital.facilities).join(', '),
        taxId: hospital.taxId || '',
      });
    } else {
      setEditingHospital(null);
      setFormData({
        name: '',
        code: `HOSP_${Date.now().toString().slice(-4)}`,
        contactEmail: '',
        contactPhone: '',
        address: '',
        website: '',
        emergencyContact: '',
        workingHours: '24/7 Emergency & OPD',
        facilities: 'Emergency, ICU, Radiology, Pharmacy, Laboratory',
        taxId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        facilities: formData.facilities.split(',').map((f) => f.trim()).filter(Boolean),
      };

      if (editingHospital) {
        await hospitalService.updateHospital(editingHospital.id, payload);
      } else {
        await hospitalService.createHospital(payload);
      }
      setIsModalOpen(false);
      loadHospitals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save hospital network details.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deactivate hospital network '${name}'?`)) {
      try {
        await hospitalService.deleteHospital(id);
        loadHospitals();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to deactivate hospital.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-sky-600" />
            Hospital Networks
          </h1>
          <p className="text-sm text-gray-500">Manage healthcare tenant organizations, identity, facilities, and contact points.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Onboard New Hospital
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by hospital name, registration code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent"></div>
          <p className="mt-2 text-sm">Loading hospital network registry...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Hospitals */}
      {!loading && !error && hospitals.length === 0 && (
        <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No hospital networks found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((h) => (
          <div key={h.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                    {h.code}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{h.name}</h2>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {h.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {h.contactEmail}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {h.contactPhone}
                </p>
                {h.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <a href={h.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline truncate">
                      {h.website}
                    </a>
                  </p>
                )}
              </div>

              {/* Facilities tags */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Facilities</p>
                <div className="flex flex-wrap gap-1">
                  {parseFacilitiesList(h.facilities).map((fac, idx) => (
                    <span key={idx} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics & Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="font-semibold text-gray-900">{h._count?.branches || 0}</span> Branches |{' '}
                <span className="font-semibold text-gray-900">{h._count?.users || 0}</span> Staff
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(h)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-sky-600"
                  title="Edit Hospital"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(h.id, h.name)}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                  title="Deactivate Hospital"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingHospital ? 'Edit Hospital Network' : 'Onboard Hospital Network'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingHospital}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Line</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Facilities (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
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
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg"
                >
                  Save Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

