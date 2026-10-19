import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService, AdminAnalyticsResponse } from '../services/analyticsService';
import { reportsService, ReportDataResponse } from '../services/reportsService';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Bed,
  AlertTriangle,
  Pill,
  TestTube,
  Shield,
  Filter,
  RefreshCw,
  Building,
} from 'lucide-react';

export const AnalyticsAndReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<string>('30_DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsResponse | null>(null);

  // Reports state
  const [selectedModule, setSelectedModule] = useState<string>('PATIENTS');
  const [reportData, setReportData] = useState<ReportDataResponse | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'csv' | 'pdf' | null>(null);
  const [reportError, setReportError] = useState<string>('');

  const reportModules = [
    { id: 'PATIENTS', label: 'Patients', icon: Users },
    { id: 'DOCTORS', label: 'Doctors & Staff Roster', icon: Shield },
    { id: 'APPOINTMENTS', label: 'OPD Appointments', icon: Calendar },
    { id: 'REVENUE', label: 'Revenue & Billing', icon: DollarSign },
    { id: 'PHARMACY', label: 'Pharmacy Inventory', icon: Pill },
    { id: 'LABS', label: 'Laboratory Orders', icon: TestTube },
    { id: 'BEDS', label: 'Bed Occupancy', icon: Bed },
    { id: 'EMERGENCY', label: 'Emergency Visits', icon: AlertTriangle },
    { id: 'BLOOD_BANK', label: 'Blood Bank Units', icon: Building },
    { id: 'INSURANCE', label: 'Insurance Claims', icon: Shield },
    { id: 'STAFF', label: 'User Staff Directory', icon: Users },
  ];

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await analyticsService.getAdminAnalytics(timeframe, startDate, endDate);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchReport = async () => {
    setLoadingReport(true);
    setReportError('');
    try {
      const data = await reportsService.getReportData(selectedModule, timeframe);
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to fetch report data:', err);
      setReportError(err.response?.data?.message || 'Failed to load report data');
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '')) {
      fetchAnalytics();
    }
  }, [timeframe, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [selectedModule, timeframe]);

  const handleDownloadCsv = async () => {
    setDownloadingFormat('csv');
    try {
      await reportsService.downloadCsv(selectedModule, timeframe);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download CSV');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingFormat('pdf');
    try {
      await reportsService.downloadPdf(selectedModule, timeframe);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const metrics = analyticsData?.kpis || analyticsData?.metrics;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-semibold text-sky-300 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span>EXECUTIVE ANALYTICS & INTELLIGENCE REPORTING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Analytics & Operational Reports
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-3xl">
              Real-time KPIs, revenue trends, occupancy metrics, and automated executive CSV/PDF exports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
          <Filter className="w-4 h-4 text-sky-600" />
          <span>Analytics Timeframe:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: '7_DAYS', label: '7 Days' },
            { id: '30_DAYS', label: '30 Days' },
            { id: '3_MONTHS', label: '3 Months' },
            { id: '6_MONTHS', label: '6 Months' },
            { id: '1_YEAR', label: '1 Year' },
            { id: 'CUSTOM', label: 'Custom' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === tf.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {timeframe === 'CUSTOM' && (
          <div className="flex items-center space-x-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}
      </div>

      {/* Admin KPI Cards Grid */}
      {['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '') && (
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <span>Operational Key Performance Indicators (KPIs)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Patients KPI */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Patient Volume</span>
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <p className="text-3xl font-black text-gray-900">{metrics?.totalPatients ?? 0}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>New: <strong className="text-emerald-600">+{metrics?.newPatients ?? 0}</strong></span>
                <span>Returning: <strong>{metrics?.returningPatients ?? 0}</strong></span>
              </div>
            </div>

            {/* OPD Appointments KPI */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">OPD Appointments</span>
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-gray-900">{metrics?.totalAppointments ?? 0}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Completed: <strong className="text-emerald-600">{metrics?.completedAppointments ?? metrics?.completedAppts ?? 0}</strong></span>
                <span>No-shows: <strong className="text-amber-600">{metrics?.noShowCount ?? metrics?.noShowAppts ?? 0}</strong></span>
              </div>
            </div>

            {/* Financial Revenue KPI */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Revenue Collected</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">
                ${(metrics?.grossRevenue ?? metrics?.revenueTotal ?? 0).toFixed(2)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Unpaid Invoices: <strong className="text-rose-600">${(metrics?.pendingRevenue ?? metrics?.unpaidInvoicesTotal ?? 0).toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Bed Occupancy KPI */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Bed Occupancy Rate</span>
                <Bed className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-black text-violet-700">
                  {metrics?.bedOccupancyRate ?? metrics?.bedOccupancyPercentage ?? 0}%
                </p>
                <span className="text-xs text-gray-500">
                  ({metrics?.occupiedBeds ?? 0} / {metrics?.totalBeds ?? 0} Beds)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, metrics?.bedOccupancyRate ?? metrics?.bedOccupancyPercentage ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Generator & Export Module */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              <span>Executive Reports & Streaming Exports</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select an operational module to view data, export CSV datasets, or stream executive PDF reports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadCsv}
              disabled={downloadingFormat === 'csv' || loadingReport}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{downloadingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingFormat === 'pdf' || loadingReport}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Module Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {reportModules.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod.id)}
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  isSelected
                    ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/20'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-gray-400'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Report Preview Header */}
        {reportError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{reportError}</span>
          </div>
        ) : loadingReport ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
            <span>Loading executive report data...</span>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* KPI Summaries for Module */}
            <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl flex flex-wrap items-center gap-6">
              <div>
                <span className="text-xs text-sky-600 font-bold uppercase tracking-wider">Report Title</span>
                <p className="text-base font-extrabold text-sky-950 mt-0.5">{reportData.reportTitle}</p>
              </div>

              {reportData.kpiSummary?.map((kpi, i) => (
                <div key={i} className="border-l border-sky-200 pl-4">
                  <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Data Table Preview */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                  <thead className="bg-gray-800 text-white font-bold uppercase tracking-wider">
                    <tr>
                      {reportData.headers.map((h, i) => (
                        <th key={i} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={reportData.headers.length} className="px-4 py-8 text-center text-gray-400">
                          No records found for this module and timeframe.
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

