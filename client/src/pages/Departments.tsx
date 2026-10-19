import React, { useEffect, useState } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Department } from '../types/hospital';
import { Stethoscope, Plus, Sparkles, UserCheck, ShieldAlert, Edit3 } from 'lucide-react';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    services: 'OPD Consultation, Emergency Trauma, Diagnostics, Inpatient Care',
    workingHours: '08:00 AM - 08:00 PM',
  });

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalService.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch clinical departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      await hospitalService.seedDefaultDepartments();
      await loadDepartments();
      alert('Default 14 clinical departments successfully seeded!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to seed default departments.');
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        services: (dept.services || []).join(', '),
        workingHours: dept.workingHours || '08:00 AM - 08:00 PM',
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        code: `DEP_${Date.now().toString().slice(-4)}`,
        description: '',
        services: 'OPD Consultation, Emergency Trauma, Diagnostics, Inpatient Care',
        workingHours: '08:00 AM - 08:00 PM',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        services: formData.services.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingDept) {
        await hospitalService.updateDepartment(editingDept.id, payload);
      } else {
        await hospitalService.createDepartment(payload);
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save department details.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-sky-600" />
            Clinical Departments
          </h1>
          <p className="text-sm text-gray-500">Configure medical specialties, department heads, clinical services, and staffing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Seeding Defaults...' : 'Auto-Seed 14 Default Departments'}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Department
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent"></div>
          <p className="mt-2 text-sm">Loading clinical departments...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3">
          <p className="text-gray-600 font-medium">No clinical departments configured for this branch.</p>
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Click here to seed default departments (Cardiology, Neurology, Pediatrics...)
          </button>
        </div>
      )}

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((d) => (
          <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                    {d.code}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{d.name}</h2>
                </div>
                <button
                  onClick={() => handleOpenModal(d)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-sky-600"
                  title="Edit Department"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {d.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{d.description}</p>}

              {/* Head Doctor Badge */}
              <div className="mt-4 p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2 text-xs">
                <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Head of Department</span>
                  <span className="font-semibold text-gray-800">
                    {d.headDoctor ? `Dr. ${d.headDoctor.firstName} ${d.headDoctor.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Services List */}
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Services</p>
                <div className="flex flex-wrap gap-1">
                  {(d.services || []).map((srv, idx) => (
                    <span key={idx} className="text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{d.workingHours || '08:00 AM - 08:00 PM'}</span>
              <span className="font-semibold text-gray-900">{d._count?.users || 0} Assigned Staff</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingDept ? 'Edit Department' : 'Add Clinical Department'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingDept}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Services Offered (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

