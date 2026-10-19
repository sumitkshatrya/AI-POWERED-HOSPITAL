import React, { useEffect, useState } from 'react';
import {
  Pill,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Search,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Building2,
} from 'lucide-react';
import { pharmacyService, PharmacyDashboardStats, Medicine } from '../services/pharmacyService';
import { Link } from 'react-router-dom';

export const PharmacyDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<PharmacyDashboardStats | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ALERTS' | 'INVENTORY'>('OVERVIEW');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load pharmacy dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicinesList = async () => {
    try {
      const res = await pharmacyService.getMedicines({
        search,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        page,
        limit: 10,
      });
      setMedicines(res.medicines);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchMedicinesList();
  }, [search, categoryFilter, page]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-7 h-7 text-emerald-600" />
            Pharmacy & Inventory Command Center
          </h1>
          <p className="text-gray-600 text-sm">
            Real-time stock tracking, expiration alerts, POS sales, and prescription dispensing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/pharmacy-sales"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            POS & Dispensing
          </Link>
          <Link
            to="/pharmacy-medicines"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Manage Medicines
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Medicines</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.summary.totalMedicines || 0}</h3>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Active Catalog</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats?.summary.lowStockCount || 0}</h3>
            <span className="text-xs text-amber-700 font-medium mt-1 inline-block">Reorder Required</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiring / Expired</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {(stats?.summary.expiringCount || 0) + (stats?.summary.expiredCount || 0)}
            </h3>
            <span className="text-xs text-rose-700 font-medium mt-1 inline-block">
              {stats?.summary.expiredCount || 0} Expired Now
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Sales</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ${(stats?.summary.todaysSalesAmount || 0).toFixed(2)}
            </h3>
            <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
              {stats?.summary.todaysSalesCount || 0} Transactions
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Prescriptions</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{stats?.summary.pendingPrescriptionsCount || 0}</h3>
            <span className="text-xs text-purple-600 font-medium mt-1 inline-block">Awaiting Dispense</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'OVERVIEW'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ALERTS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Critical Stock & Expiry Alerts ({stats?.alerts.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'INVENTORY'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Quick Medicine Search
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Inventory Transactions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Recent Inventory Stock Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="p-3">Item / Medicine</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Change</th>
                    <th className="p-3 text-right">New Stock</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {tx.medicine?.name || tx.inventoryItem?.name || 'General Item'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              tx.transactionType === 'PURCHASE_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.transactionType === 'SALE_OUT' || tx.transactionType === 'DISPENSED_OUT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            tx.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-700">{tx.newQuantity}</td>
                        <td className="p-3 text-gray-600">
                          {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'System'}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No inventory transactions recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Action Cards & Quick Links */}
          <div className="space-y-4">
            <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                POS & Dispensing Hub
              </h3>
              <p className="text-emerald-200 text-sm">
                Fulfill e-prescriptions, issue pharmacy sales, and record automatic invoice payments.
              </p>
              <Link
                to="/pharmacy-sales"
                className="inline-block w-full py-2.5 text-center bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg text-sm transition"
              >
                Open POS Counter
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Hospital Inventory & PPE
              </h3>
              <p className="text-gray-600 text-sm">
                Track medical equipment, surgical supplies, PPE, syringes, gloves, and masks.
              </p>
              <Link
                to="/hospital-inventory"
                className="inline-block w-full py-2 text-center border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-lg text-sm transition"
              >
                View Hospital Inventory
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-700" />
                Suppliers & Procurement
              </h3>
              <p className="text-gray-600 text-sm">
                Manage pharmaceutical distributors and purchase orders.
              </p>
              <Link
                to="/pharmacy-suppliers"
                className="inline-block w-full py-2 text-center border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg text-sm transition"
              >
                Supplier Directory
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'ALERTS' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Active Inventory Warning Alerts
          </h3>

          {stats?.alerts && stats.alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border flex items-start justify-between gap-3 ${
                    alert.type === 'EXPIRED'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : alert.type === 'LOW_STOCK'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          alert.type === 'EXPIRED'
                            ? 'bg-rose-200 text-rose-900'
                            : alert.type === 'LOW_STOCK'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {alert.type.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-sm">{alert.medicineName}</h4>
                    </div>
                    <p className="text-xs opacity-90">{alert.message}</p>
                    <p className="text-xs font-mono">Batch: {alert.batchNumber}</p>
                  </div>
                  <Link
                    to="/pharmacy-medicines"
                    className="text-xs font-semibold underline hover:no-underline flex-shrink-0"
                  >
                    Action
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">All stock levels and expiry dates are optimal!</p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Search Tab */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine name, generic, brand, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="ANTIBIOTIC">Antibiotic</option>
              <option value="ANALGESIC">Analgesic</option>
              <option value="CARDIOVASCULAR">Cardiovascular</option>
              <option value="RESPIRATORY">Respiratory</option>
              <option value="DIABETES">Diabetes</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Brand / Manufacturer</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Stock Qty</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.genericName}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900">{m.brand}</div>
                      <div className="text-xs text-gray-500">{m.manufacturer}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-700">{m.batchNumber}</td>
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
                    <td className="p-3 text-right font-bold text-gray-900">
                      <span className={m.isLowStock ? 'text-amber-600 font-extrabold' : ''}>{m.quantity}</span>
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-900">${m.sellingPrice.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          m.isExpired
                            ? 'bg-rose-100 text-rose-800'
                            : m.isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.isExpired ? 'EXPIRED' : m.isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
      )}
    </div>
  );
};

