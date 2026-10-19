import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Phone,
  Mail,
  MapPin,
  X,
  UserCheck,
} from 'lucide-react';
import { pharmacyService, Supplier } from '../services/pharmacyService';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getSuppliers({ search });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setFormData({
      name: supp.name,
      contactPerson: supp.contactPerson || '',
      phone: supp.phone,
      email: supp.email || '',
      address: supp.address || '',
      taxId: supp.taxId || '',
      status: supp.status,
    });
    setShowModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await pharmacyService.updateSupplier(editingSupplier.id, formData);
      } else {
        await pharmacyService.createSupplier(formData);
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-gray-700" />
            Pharmaceutical & Inventory Suppliers Directory
          </h1>
          <p className="text-gray-600 text-sm">
            Maintain verified medical manufacturers, wholesale distributors, and vendor contracts
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search supplier name, code, contact person, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            Loading supplier directory...
          </div>
        ) : suppliers.length > 0 ? (
          suppliers.map((supp) => (
            <div
              key={supp.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{supp.name}</h3>
                  <span className="text-xs font-mono text-gray-500">{supp.code}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    supp.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {supp.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {supp.contactPerson && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span>{supp.contactPerson}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{supp.phone}</span>
                </div>
                {supp.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{supp.email}</span>
                  </div>
                )}
                {supp.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{supp.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Medicines: {supp._count?.medicines || 0}</span>
                <button
                  onClick={() => handleOpenEditModal(supp)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Supplier
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-xl border">
            No suppliers found in directory.
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingSupplier ? 'Edit Supplier Record' : 'Add New Pharmaceutical Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pfizer Global Pharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. David Miller"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1-800-555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tax / GST ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TAX-PF-998877"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Office Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, city, state..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

