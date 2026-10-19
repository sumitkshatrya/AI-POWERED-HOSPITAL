import React, { useEffect, useState } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Branch } from '../types/hospital';
import { useAuth } from '../context/AuthContext';
import { Building, Plus, MapPin, Phone, Mail, Clock, CheckCircle2, Edit3, Trash2, ShieldAlert } from 'lucide-react';

export const Branches: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeBranchId, setActiveBranchId] = useState<string | null>(user?.branchId || null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    contactEmail: '',
    contactPhone: '',
    workingHours: '24/7 OPD & Emergency Services',
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalService.getBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hospital branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        state: branch.state || '',
        postalCode: branch.postalCode || '',
        country: branch.country || 'USA',
        contactEmail: branch.contactEmail || '',
        contactPhone: branch.contactPhone || '',
        workingHours: branch.workingHours || '24/7 OPD & Emergency Services',
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: `BR_${Date.now().toString().slice(-4)}`,
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
        contactEmail: '',
        contactPhone: '',
        workingHours: '24/7 OPD & Emergency Services',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await hospitalService.updateBranch(editingBranch.id, formData);
      } else {
        await hospitalService.createBranch(formData);
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save branch information.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deactivate branch '${name}'?`)) {
      try {
        await hospitalService.deleteBranch(id);
        loadBranches();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to deactivate branch.');
      }
    }
  };

  const handleSwitchBranch = (branch: Branch) => {
    setActiveBranchId(branch.id);
    localStorage.setItem('activeBranchId', branch.id);
    alert(`Switched active context to ${branch.name}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-7 h-7 text-sky-600" />
            Branch Operations
          </h1>
          <p className="text-sm text-gray-500">Manage multi-location hospital branches, emergency units, and active workspace scope.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Hospital Branch
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent"></div>
          <p className="mt-2 text-sm">Loading hospital branch records...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No branches registered for this hospital network yet.</p>
        </div>
      )}

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => {
          const isSelected = activeBranchId === b.id;

          return (
            <div
              key={b.id}
              className={`bg-white rounded-xl shadow-sm border ${
                isSelected ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-gray-200'
              } p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                      {b.code}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">{b.name}</h2>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Scope
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchBranch(b)}
                      className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-sky-50 hover:text-sky-700 text-gray-600 rounded-full transition-colors"
                    >
                      Switch To Branch
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>{b.address}, {b.city}, {b.state} {b.postalCode} ({b.country})</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {b.contactEmail}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {b.contactPhone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {b.workingHours}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{b._count?.departments || 0}</span> Departments |{' '}
                  <span className="font-semibold text-gray-900">{b._count?.users || 0}</span> Active Staff
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(b)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-sky-600"
                    title="Edit Branch"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                    title="Deactivate Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingBranch ? 'Edit Hospital Branch' : 'Add New Hospital Branch'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBranch}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
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
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

