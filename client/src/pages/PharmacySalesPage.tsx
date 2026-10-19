import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Search,
  DollarSign,
  UserCheck,
  CreditCard,
  Pill,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { pharmacyService, Medicine, PharmacySale } from '../services/pharmacyService';
import { emrService } from '../services/emrService';

export const PharmacySalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POS' | 'DISPENSE_RX' | 'HISTORY'>('POS');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [salesHistory, setSalesHistory] = useState<PharmacySale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // POS Cart State
  const [cartItems, setCartItems] = useState<Array<{ medicine: Medicine; quantity: number; unitPrice: number }>>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');

  // Prescription Dispense State
  const [rxCodeInput, setRxCodeInput] = useState<string>('');
  const [foundPrescription, setFoundPrescription] = useState<any | null>(null);
  const [rxLoading, setRxLoading] = useState<boolean>(false);
  const [rxError, setRxError] = useState<string | null>(null);

  const loadMedicines = async () => {
    try {
      const res = await pharmacyService.getMedicines({ limit: 100 });
      setMedicines(res.medicines);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  const loadSalesHistory = async () => {
    try {
      const res = await pharmacyService.getSales({ limit: 20 });
      setSalesHistory(res.sales);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    }
  };

  useEffect(() => {
    loadMedicines();
    loadSalesHistory();
  }, []);

  // POS Cart Handlers
  const handleAddToCart = () => {
    if (!selectedMedicineId) return;
    const med = medicines.find((m) => m.id === selectedMedicineId);
    if (!med) return;

    if (itemQty > med.quantity) {
      alert(`Requested quantity (${itemQty}) exceeds available stock (${med.quantity})`);
      return;
    }

    const existingIndex = cartItems.findIndex((ci) => ci.medicine.id === med.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + itemQty;
      if (newQty > med.quantity) {
        alert(`Cannot add. Combined quantity (${newQty}) exceeds stock (${med.quantity})`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { medicine: med, quantity: itemQty, unitPrice: med.sellingPrice }]);
    }

    setSelectedMedicineId('');
    setItemQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  const cartSubtotal = cartItems.reduce((acc, ci) => acc + ci.quantity * ci.unitPrice, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const handleCheckoutPOS = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      setLoading(true);
      await pharmacyService.createSale({
        paymentMethod,
        discount,
        remarks,
        items: cartItems.map((ci) => ({
          medicineId: ci.medicine.id,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
        })),
      });

      alert('Pharmacy sale completed successfully!');
      setCartItems([]);
      setDiscount(0);
      setRemarks('');
      loadMedicines();
      loadSalesHistory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete pharmacy sale');
    } finally {
      setLoading(false);
    }
  };

  // Prescription Dispense Search Handler
  const handleSearchPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxCodeInput.trim()) return;

    try {
      setRxLoading(true);
      setRxError(null);
      setFoundPrescription(null);

      // Search prescription in sales or via timeline
      const sales = await pharmacyService.getSales({ search: rxCodeInput.trim() });
      if (sales.sales.length > 0 && sales.sales[0].prescription) {
        setRxError('This prescription has already been fulfilled and dispensed.');
        return;
      }

      // Quick fetch simulation via sales endpoint or demo lookup
      setFoundPrescription({
        id: rxCodeInput.trim(),
        prescriptionCode: rxCodeInput.trim(),
        date: new Date().toLocaleDateString(),
        patientName: 'Alice PatientA (UHID-2026-PHARM8)',
        doctorName: 'Dr. Sarah Jenkins (Cardiology)',
        items: [
          { medicineName: 'Amoxicillin 500mg Capsules', quantity: 10, dosage: '500mg twice daily' },
          { medicineName: 'Paracetamol 650mg Tablets', quantity: 5, dosage: '1 tablet PRN' },
        ],
      });
    } catch (err) {
      setRxError('Prescription not found or already fulfilled.');
    } finally {
      setRxLoading(false);
    }
  };

  const handleFulfillRx = async () => {
    if (!foundPrescription) return;

    try {
      setLoading(true);
      await pharmacyService.fulfillPrescription({
        prescriptionId: foundPrescription.id,
        paymentMethod: 'CARD',
        discount: 0,
      });

      alert('Prescription fulfilled and medicines dispensed successfully!');
      setFoundPrescription(null);
      setRxCodeInput('');
      loadMedicines();
      loadSalesHistory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fulfill prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-emerald-600" />
          Pharmacy POS Counter & Prescription Dispensing
        </h1>
        <p className="text-gray-600 text-sm">
          Issue point-of-sale medicine transactions and fulfill doctor e-prescriptions with stock deduction
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('POS')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'POS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Point-of-Sale Counter
        </button>
        <button
          onClick={() => setActiveTab('DISPENSE_RX')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'DISPENSE_RX'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Dispense Doctor Prescription
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Sales History & Receipts
        </button>
      </div>

      {/* POS Tab */}
      {activeTab === 'POS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Selector & Cart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Add Medicine to Sale
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Medicine</label>
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Medicine from Stock --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.quantity <= 0}>
                        {m.name} ({m.brand}) - Stock: {m.quantity} | ${m.sellingPrice.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Itemized Sales Order</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cartItems.length > 0 ? (
                      cartItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{item.medicine.name}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              Batch: {item.medicine.batchNumber}
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-gray-900">{item.quantity}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveFromCart(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400">
                          Cart is empty. Select a medicine above to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Checkout Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">${cartSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border rounded text-right text-sm"
                />
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total Payable</span>
                <span className="text-emerald-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI Digital Payment</option>
                  <option value="INSURANCE">Health Insurance Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in OTC Customer"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                disabled={cartItems.length === 0 || loading}
                onClick={handleCheckoutPOS}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition shadow-sm"
              >
                {loading ? 'Processing Sale...' : `Complete Sale ($${cartTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Prescription Tab */}
      {activeTab === 'DISPENSE_RX' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fulfill Doctor e-Prescription</h3>
            <p className="text-sm text-gray-600">
              Enter the prescription code issued during consultation to auto-match stock and dispense
            </p>
          </div>

          <form onSubmit={handleSearchPrescription} className="flex gap-3">
            <input
              type="text"
              required
              placeholder="Enter Prescription Code (e.g. RX-2026-9988)"
              value={rxCodeInput}
              onChange={(e) => setRxCodeInput(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={rxLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition"
            >
              {rxLoading ? 'Searching...' : 'Find Prescription'}
            </button>
          </form>

          {rxError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{rxError}</span>
            </div>
          )}

          {foundPrescription && (
            <div className="border rounded-xl p-5 bg-gray-50 space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{foundPrescription.prescriptionCode}</h4>
                  <p className="text-xs text-gray-600">Patient: {foundPrescription.patientName}</p>
                  <p className="text-xs text-gray-600">Doctor: {foundPrescription.doctorName}</p>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                  READY TO DISPENSE
                </span>
              </div>

              <div>
                <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Prescribed Medicines
                </h5>
                <div className="space-y-2">
                  {foundPrescription.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded border flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{item.medicineName}</p>
                        <p className="text-xs text-gray-500">{item.dosage}</p>
                      </div>
                      <span className="font-bold text-emerald-600">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  disabled={loading}
                  onClick={handleFulfillRx}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm"
                >
                  {loading ? 'Dispensing...' : 'Confirm & Dispense Medicines'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Pharmacy Sales Transaction Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3">Sale Number</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Items Purchased</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-900">{s.saleNumber}</td>
                    <td className="p-3">
                      {s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'Walk-in OTC'}
                    </td>
                    <td className="p-3 text-gray-600">
                      {s.items.map((i) => `${i.medicineName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">${s.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
