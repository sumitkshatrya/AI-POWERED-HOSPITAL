import React, { useEffect, useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Filter,
  Sliders,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { pharmacyService, Medicine, Supplier } from '../services/pharmacyService';

export const MedicineManagementPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [expiringSoonFilter, setExpiringSoonFilter] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [targetMedicine, setTargetMedicine] = useState<Medicine | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'GENERAL',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    minReorderLevel: 20,
    purchasePrice: 0,
    sellingPrice: 0,
    locationRack: '',
    supplierId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [medRes, suppList] = await Promise.all([
        pharmacyService.getMedicines({
          search,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          lowStock: lowStockFilter ? true : undefined,
          expiringSoon: expiringSoonFilter ? true : undefined,
          page,
          limit: 10,
        }),
        pharmacyService.getSuppliers(),
      ]);
      setMedicines(medRes.medicines);
      setTotalPages(medRes.pagination.totalPages || 1);
      setSuppliers(suppList);
    } catch (err) {
      console.error('Failed to load medicines list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, lowStockFilter, expiringSoonFilter, page]);

  const handleOpenCreateModal = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      brand: '',
      category: 'GENERAL',
      manufacturer: '',
      batchNumber: '',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      quantity: 100,
      minReorderLevel: 20,
      purchasePrice: 2.5,
      sellingPrice: 5.0,
      locationRack: 'Rack A-1',
      supplierId: suppliers[0]?.id || '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      genericName: med.genericName,
      brand: med.brand,
      category: med.category,
      manufacturer: med.manufacturer,
      batchNumber: med.batchNumber,
      expiryDate: new Date(med.expiryDate).toISOString().split('T')[0],
      quantity: med.quantity,
      minReorderLevel: med.minReorderLevel,
      purchasePrice: med.purchasePrice,
      sellingPrice: med.sellingPrice,
      locationRack: med.locationRack || '',
      supplierId: med.supplierId || '',
    });
    setShowModal(true);
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMedicine) {
        await pharmacyService.updateMedicine(editingMedicine.id, formData);
      } else {
        await pharmacyService.createMedicine(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save medicine');
    }
  };

  const handleOpenAdjustModal = (med: Medicine) => {
    setTargetMedicine(med);
    setNewQuantity(med.quantity);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMedicine) return;
    try {
      await pharmacyService.adjustStock(targetMedicine.id, {
        newQuantity,
        reason: adjustReason,
      });
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-7 h-7 text-emerald-600" />
            Pharmaceutical Medicine Master Catalog
          </h1>
          <p className="text-gray-600 text-sm">
            Manage medicine batch numbers, expiry dates, stock reorder levels, purchase/selling pricing
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Medicine
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search medicine name, generic name, brand, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="ANTIBIOTIC">Antibiotics</option>
            <option value="ANALGESIC">Analgesics & Pain</option>
            <option value="CARDIOVASCULAR">Cardiovascular</option>
            <option value="RESPIRATORY">Respiratory</option>
            <option value="DIABETES">Diabetes</option>
            <option value="GENERAL">General</option>
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-1.5 transition ${
              lowStockFilter
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock
          </button>

          <button
            onClick={() => setExpiringSoonFilter(!expiringSoonFilter)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-1.5 transition ${
              expiringSoonFilter
                ? 'bg-rose-100 border-rose-300 text-rose-900'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-600" /> Expiring Soon
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">Medicine & Generic</th>
                <th className="p-3">Brand & Manufacturer</th>
                <th className="p-3">Category</th>
                <th className="p-3">Batch & Rack</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Buy / Sell Price</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Loading medicine catalog...
                  </td>
                </tr>
              ) : medicines.length > 0 ? (
                medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.genericName}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900 font-medium">{m.brand}</div>
                      <div className="text-xs text-gray-500">{m.manufacturer}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      <div className="text-gray-900">{m.batchNumber}</div>
                      <div className="text-gray-400">{m.locationRack || 'No Rack'}</div>
                    </td>
                    <td className="p-3">
                      <div className={m.isExpired ? 'text-rose-600 font-bold' : 'text-gray-700'}>
                        {new Date(m.expiryDate).toLocaleDateString()}
                      </div>
                      {m.isExpired ? (
                        <span className="text-[10px] text-rose-600 font-bold">EXPIRED</span>
                      ) : m.isExpiringSoon ? (
                        <span className="text-[10px] text-amber-600 font-bold">Expires in {m.daysUntilExpiry}d</span>
                      ) : null}
                    </td>
                    <td className="p-3 text-right">
                      <div className={`font-bold ${m.isLowStock ? 'text-amber-600 font-extrabold' : 'text-gray-900'}`}>
                        {m.quantity}
                      </div>
                      <div className="text-xs text-gray-400">Min: {m.minReorderLevel}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-semibold text-emerald-600">${m.sellingPrice.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Cost: ${m.purchasePrice.toFixed(2)}</div>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => handleOpenAdjustModal(m)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded text-xs border border-amber-200 transition"
                      >
                        Adjust Stock
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No medicines match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-1 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-1 hover:bg-gray-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingMedicine ? 'Edit Medicine Master Record' : 'Add New Medicine to Pharmacy'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin 500mg Capsules"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin Trihydrate"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxil"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ANTIBIOTIC">Antibiotics</option>
                    <option value="ANALGESIC">Analgesics & Pain</option>
                    <option value="CARDIOVASCULAR">Cardiovascular</option>
                    <option value="RESPIRATORY">Respiratory</option>
                    <option value="DIABETES">Diabetes</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSK Pharma"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-99"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minReorderLevel}
                    onChange={(e) => setFormData({ ...formData, minReorderLevel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Location Rack</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-3"
                    value={formData.locationRack}
                    onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  {editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && targetMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Manual Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-gray-900">{targetMedicine.name}</p>
                <p className="text-xs text-gray-500">Current Stock: {targetMedicine.quantity} units</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">New Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Adjustment Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Restock order received, breakage, physical audit correction..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

