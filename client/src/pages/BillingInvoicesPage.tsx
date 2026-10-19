import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, FileText, CheckCircle, Clock, Eye, X } from 'lucide-react';
import { billingService, Invoice } from '../services/billingService';

export const BillingInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchInvoices = async () => {
    try {
      const data = await billingService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      await billingService.payInvoice(selectedInvoice.id, paymentMethod);
      setMsg(`Invoice ${selectedInvoice.invoiceNumber} paid successfully!`);
      setPaymentModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-slate-500 text-sm">Itemized patient invoices, consultation fees, lab orders & pharmacy payments</p>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600 font-bold text-xs uppercase">Dismiss</button>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Invoice #</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Total Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-blue-600 font-mono">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 font-medium">
                  {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Patient'}
                  <span className="block text-xs text-slate-400">UHID: {inv.patient?.uhid}</span>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs">{inv.items ? inv.items.length : 0} items</td>
                <td className="px-4 py-3 font-bold text-slate-900">${inv.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {inv.paymentStatus === 'PAID' ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>PAID</span>
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>UNPAID</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {inv.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setPaymentModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {invoices.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                  No billing invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && !paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h2 className="font-bold text-lg text-slate-900">Invoice {selectedInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-500">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Itemized Table */}
            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="min-w-full divide-y">
                <thead className="bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-medium">{item.description}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-base text-slate-900 border-t">
              <span>Total Amount:</span>
              <span className="text-emerald-600">${selectedInvoice.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 border rounded-lg text-sm">
                Close
              </button>
              {selectedInvoice.paymentStatus !== 'PAID' && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                >
                  Process Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h2 className="font-bold text-lg text-slate-900">Collect Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Invoice Amount Due:</p>
              <div className="text-3xl font-black text-emerald-600">${selectedInvoice.totalAmount.toFixed(2)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border rounded-lg text-sm bg-white"
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="INSURANCE">Insurance Claim</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={processing}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center space-x-1"
              >
                <CreditCard className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Confirm Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

