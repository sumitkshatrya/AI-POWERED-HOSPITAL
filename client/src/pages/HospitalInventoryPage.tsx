import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  MinusCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Syringe,
  Box,
  Layers,
} from 'lucide-react';
import { hospitalInventoryService, HospitalInventoryItem } from '../services/hospitalInventoryService';
import { pharmacyService, Supplier } from '../services/pharmacyService';

export const HospitalInventoryPage: React.FC = () => {
  const [items, setItems] = useState<HospitalInventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<HospitalInventoryItem | null>(null);

  const [showConsumeModal, setShowConsumeModal] = useState<boolean>(false);
  const [targetItem, setTargetItem] = useState<HospitalInventoryItem | null>(null);
  const [consumeQty, setConsumeQty] = useState<number>(1);
  const [consumeNotes, setConsumeNotes] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    category: 'CONSUMABLES' as any,
    unitOfMeasure: 'PIECES',
    quantity: 0,
    reorderLevel: 50,
    unitCost: 0,
    locationRoom: 'Central Supply - Shelf A',
    supplierId: '',
    status: 'IN_STOCK' as any,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, suppList] = await Promise.all([
        hospitalInventoryService.getInventoryItems({
          search,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          lowStock: lowStockOnly ? true : undefined,
          page,
          limit: 10,
        }),
        pharmacyService.getSuppliers(),
      ]);
      setItems(invRes.items);
      setTotalPages(invRes.pagination.totalPages || 1);
      setSuppliers(suppList);
    } catch (err) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, lowStockOnly, page]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      itemCode: `INV-${Date.now().toString().slice(-6)}`,
      category: 'CONSUMABLES',
      unitOfMeasure: 'PIECES',
      quantity: 100,
      reorderLevel: 25,
      unitCost: 10.0,
      locationRoom: 'Central Store - Room 102',
      supplierId: suppliers[0]?.id || '',
      status: 'IN_STOCK',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: HospitalInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      itemCode: item.itemCode,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost,
      locationRoom: item.locationRoom || '',
      supplierId: item.supplierId || '',
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await hospitalInventoryService.updateInventoryItem(editingItem.id, formData);
      } else {
        await hospitalInventoryService.createInventoryItem(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save inventory item');
    }
  };

  const handleOpenConsumeModal = (item: HospitalInventoryItem) => {
    setTargetItem(item);
    setConsumeQty(1);
    setConsumeNotes('');
    setShowConsumeModal(true);
  };

  const handleSaveConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) return;
    try {
      await hospitalInventoryService.consumeInventoryItem(targetItem.id, {
        quantity: consumeQty,
        notes: consumeNotes,
      });
      setShowConsumeModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record consumption');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Hospital Equipment, PPE & Consumable Inventory
          </h1>
          <p className="text-gray-600 text-sm">
            Track medical equipment, surgical supplies, PPE, syringes, gloves, masks, and stock reorder levels
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Inventory Item
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 gap-2">
        {[
          { label: 'All Inventory', value: 'ALL' },
          { label: 'Medical Equipment', value: 'MEDICAL_EQUIPMENT' },
          { label: 'Surgical Supplies', value: 'SURGICAL_SUPPLIES' },
          { label: 'Consumables', value: 'CONSUMABLES' },
          { label: 'PPE', value: 'PPE' },
          { label: 'Syringes', value: 'SYRINGES' },
          { label: 'Gloves', value: 'GLOVES' },
          { label: 'Masks', value: 'MASKS' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setCategoryFilter(tab.value);
              setPage(1);
            }}
            className={`pb-3 px-3 text-xs md:text-sm font-semibold transition border-b-2 ${
              categoryFilter === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search item name, code, room location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-1.5 transition ${
            lowStockOnly
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Show Low / Out of Stock Only
        </button>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">Item Name & Code</th>
                <th className="p-3">Category</th>
                <th className="p-3">UOM</th>
                <th className="p-3">Location Room</th>
                <th className="p-3 text-right">Unit Cost</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Loading hospital inventory items...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.itemCode}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{item.unitOfMeasure}</td>
                    <td className="p-3 text-gray-600">{item.locationRoom || 'Unassigned Store'}</td>
                    <td className="p-3 text-right font-semibold text-gray-900">${item.unitCost.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div
                        className={`font-bold ${
                          item.status === 'OUT_OF_STOCK'
                            ? 'text-rose-600'
                            : item.status === 'LOW_STOCK'
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.quantity}
                      </div>
                      <div className="text-xs text-gray-400">Reorder: {item.reorderLevel}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'IN_STOCK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'LOW_STOCK'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'OUT_OF_STOCK'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => handleOpenConsumeModal(item)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-xs border border-indigo-200 transition"
                      >
                        Consume Qty
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
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
                    No hospital inventory items found.
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

      {/* Add / Edit Inventory Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingItem ? 'Edit Inventory Item Record' : 'Add New Hospital Inventory Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterile Syringes 5ml (Box of 100)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
                    <option value="SURGICAL_SUPPLIES">Surgical Supplies</option>
                    <option value="CONSUMABLES">Consumables</option>
                    <option value="PPE">PPE</option>
                    <option value="SYRINGES">Syringes</option>
                    <option value="GLOVES">Gloves</option>
                    <option value="MASKS">Masks</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    placeholder="PIECES, BOXES, PACKS, PAIRS, SETS"
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Storage Room / Shelf</label>
                  <input
                    type="text"
                    placeholder="e.g. ICU Store - Cabinet 4"
                    value={formData.locationRoom}
                    onChange={(e) => setFormData({ ...formData, locationRoom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  {editingItem ? 'Update Item' : 'Save Inventory Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consume Item Modal */}
      {showConsumeModal && targetItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Record Consumable Usage</h3>
              <button onClick={() => setShowConsumeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsume} className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-gray-900">{targetItem.name}</p>
                <p className="text-xs text-gray-500">
                  Current Stock: {targetItem.quantity} {targetItem.unitOfMeasure}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Quantity Consumed *</label>
                <input
                  type="number"
                  min="1"
                  max={targetItem.quantity}
                  required
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Usage Department / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Issued 5 boxes of PPE masks to OT Surgery Team..."
                  value={consumeNotes}
                  onChange={(e) => setConsumeNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowConsumeModal(false)}
                  className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  Record Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

