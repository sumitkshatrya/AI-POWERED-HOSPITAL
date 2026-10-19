import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  X,
  FileCheck,
  Ban,
  Eye,
  Paperclip,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  insuranceService,
  InsuranceClaim,
  PatientInsurance,
  InsuranceDashboardSummary,
  ClaimDocument,
} from '../services/insuranceService';
import { billingService, Invoice } from '../services/billingService';
import api from '../services/api';

export const InsuranceDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<InsuranceDashboardSummary | null>(null);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [policies, setPolicies] = useState<PatientInsurance[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'POLICIES'>('CLAIMS');

  // Filters & search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);
  const [isAdjudicateModalOpen, setIsAdjudicateModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [viewClaimDetails, setViewClaimDetails] = useState<InsuranceClaim | null>(null);

  // New Claim Form
  const [claimForm, setClaimForm] = useState({
    patientId: '',
    insuranceId: '',
    invoiceId: '',
    treatmentDescription: '',
    diagnosis: '',
    claimedAmount: 0,
    status: 'SUBMITTED' as 'DRAFT' | 'SUBMITTED',
    documents: [] as ClaimDocument[],
  });

  const [docForm, setDocForm] = useState({ name: '', url: '', type: 'Medical Bill' });

  // New Policy Form
  const [policyForm, setPolicyForm] = useState({
    patientId: '',
    provider: '',
    policyNumber: '',
    policyHolderName: '',
    coverageAmount: 10000,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    copayPercentage: 10,
    deductible: 250,
    status: 'ACTIVE',
    notes: '',
  });

  // Adjudication Form
  const [adjudicateForm, setAdjudicateForm] = useState({
    status: 'APPROVED' as 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED',
    approvedAmount: 0,
    settledAmount: 0,
    adjudicationNotes: '',
    denialReason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, claimsData, policiesData, patientsRes, invoicesData] = await Promise.all([
        insuranceService.getDashboardSummary(),
        insuranceService.getClaims(),
        insuranceService.getPolicies(),
        api.get('/patients'),
        billingService.getInvoices(),
      ]);

      setSummary(sumData);
      setClaims(claimsData || []);
      setPolicies(policiesData || []);
      setPatients(patientsRes.data.data?.patients || patientsRes.data?.patients || []);
      setInvoices(invoicesData || []);
    } catch (err: any) {
      console.error('Failed to load insurance dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Add supporting document to new claim
  const handleAddDocument = () => {
    if (!docForm.name.trim() || !docForm.url.trim()) return;
    setClaimForm((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          name: docForm.name.trim(),
          url: docForm.url.trim(),
          type: docForm.type,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }));
    setDocForm({ name: '', url: '', type: 'Medical Bill' });
  };

  const handleRemoveDocument = (idx: number) => {
    setClaimForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== idx),
    }));
  };

  // Submit New Claim
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.patientId || !claimForm.insuranceId || claimForm.claimedAmount <= 0) {
      alert('Please fill out patient, insurance policy, and claimed amount');
      return;
    }

    setActionLoading(true);
    try {
      await insuranceService.createClaim({
        patientId: claimForm.patientId,
        insuranceId: claimForm.insuranceId,
        invoiceId: claimForm.invoiceId || undefined,
        treatmentDescription: claimForm.treatmentDescription || 'Inpatient / Outpatient Care',
        diagnosis: claimForm.diagnosis || undefined,
        claimedAmount: Number(claimForm.claimedAmount),
        status: claimForm.status,
        documents: claimForm.documents,
      });

      showNotification('Insurance claim successfully filed and registered');
      setIsNewClaimModalOpen(false);
      setClaimForm({
        patientId: '',
        insuranceId: '',
        invoiceId: '',
        treatmentDescription: '',
        diagnosis: '',
        claimedAmount: 0,
        status: 'SUBMITTED',
        documents: [],
      });
      fetchData();
    } catch (err: any) {
      console.error('Create claim error:', err);
      alert(err.response?.data?.message || 'Failed to create insurance claim');
    } finally {
      setActionLoading(false);
    }
  };

  // Register New Policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.patientId || !policyForm.provider.trim() || !policyForm.policyNumber.trim()) {
      alert('Please fill out all required policy fields');
      return;
    }

    setActionLoading(true);
    try {
      await insuranceService.createPolicy({
        ...policyForm,
        coverageAmount: Number(policyForm.coverageAmount),
        copayPercentage: Number(policyForm.copayPercentage),
        deductible: Number(policyForm.deductible),
      });

      showNotification('Insurance policy registered successfully');
      setIsNewPolicyModalOpen(false);
      setPolicyForm({
        patientId: '',
        provider: '',
        policyNumber: '',
        policyHolderName: '',
        coverageAmount: 10000,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        copayPercentage: 10,
        deductible: 250,
        status: 'ACTIVE',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      console.error('Create policy error:', err);
      alert(err.response?.data?.message || 'Failed to register insurance policy');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Adjudication
  const handleOpenAdjudication = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setAdjudicateForm({
      status: claim.status === 'DRAFT' || claim.status === 'SUBMITTED' ? 'UNDER_REVIEW' : 'APPROVED',
      approvedAmount: claim.approvedAmount > 0 ? claim.approvedAmount : claim.claimedAmount,
      settledAmount: claim.settledAmount > 0 ? claim.settledAmount : claim.claimedAmount,
      adjudicationNotes: claim.adjudicationNotes || '',
      denialReason: claim.denialReason || '',
    });
    setIsAdjudicateModalOpen(true);
  };

  // Submit Adjudication
  const handleAdjudicateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setActionLoading(true);
    try {
      await insuranceService.adjudicateClaim(selectedClaim.id, {
        status: adjudicateForm.status,
        approvedAmount: adjudicateForm.status === 'APPROVED' || adjudicateForm.status === 'SETTLED' ? Number(adjudicateForm.approvedAmount) : undefined,
        settledAmount: adjudicateForm.status === 'SETTLED' ? Number(adjudicateForm.settledAmount) : undefined,
        adjudicationNotes: adjudicateForm.adjudicationNotes || undefined,
        denialReason: adjudicateForm.status === 'REJECTED' ? adjudicateForm.denialReason : undefined,
      });

      showNotification(`Claim ${selectedClaim.claimNumber} transitioned to ${adjudicateForm.status}`);
      setIsAdjudicateModalOpen(false);
      setSelectedClaim(null);
      fetchData();
    } catch (err: any) {
      console.error('Adjudication error:', err);
      alert(err.response?.data?.message || 'Failed to adjudicate claim');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Claims
  const filteredClaims = claims.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const patName = `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.toLowerCase();
    const matchesSearch =
      c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patName.includes(searchQuery.toLowerCase()) ||
      (c.patient?.uhid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.insurance?.provider || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.insurance?.policyNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Policies
  const filteredPolicies = policies.filter((p) => {
    const patName = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();
    return (
      patName.includes(searchQuery.toLowerCase()) ||
      p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.patient?.uhid || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Settled
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Approved
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Under Review
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Submitted
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Draft
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            <Ban className="w-3.5 h-3.5 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  // Helper to parse documents JSON
  const parseDocuments = (docsStr?: string | null): ClaimDocument[] => {
    if (!docsStr) return [];
    try {
      return JSON.parse(docsStr);
    } catch {
      return [];
    }
  };

  // Selected patient's policies for claim modal
  const patientAvailablePolicies = policies.filter(
    (p) => p.patientId === claimForm.patientId && p.status === 'ACTIVE'
  );

  // Selected patient's invoices for claim modal
  const patientAvailableInvoices = invoices.filter(
    (inv) => inv.patientId === claimForm.patientId
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-300 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Health Insurance & TPA Claims</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Insurance & Adjudication Hub</h1>
          <p className="text-blue-200 text-sm mt-1">
            Track policy coverage, submit claims, adjudicate payouts, and auto-settle inpatient/OPD invoices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewPolicyModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-xl shadow-sm transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>New Policy</span>
          </button>
          <button
            onClick={() => setIsNewClaimModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-700/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>File Claim</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition backdrop-blur-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-3 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* KPI Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Claims</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary?.totalClaims ?? 0}
          </div>
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <span className="text-blue-600 font-semibold">{summary?.submittedCount ?? 0}</span> submitted,{' '}
            <span className="text-amber-600 font-semibold">{summary?.underReviewCount ?? 0}</span> reviewing
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Claimed</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${summary ? summary.totalClaimedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-purple-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            <span>Gross Insurance Volume</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Amount</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            ${summary ? summary.totalApprovedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-indigo-500">
            <span>{summary?.approvedCount ?? 0} claims approved</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Payouts</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${summary ? summary.totalSettledAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-600">
            <span>{summary?.settledCount ?? 0} claims auto-credited to invoices</span>
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center space-x-2 border-b md:border-b-0 pb-2 md:pb-0 border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('CLAIMS')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'CLAIMS'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Claims Adjudication Pipeline</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {claims.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('POLICIES')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'POLICIES'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Patient Policies</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {policies.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'CLAIMS' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SETTLED">Settled</option>
                <option value="REJECTED">Rejected</option>
                <option value="DRAFT">Draft</option>
              </select>
            )}

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'CLAIMS' ? 'Search claim #, patient, policy...' : 'Search policy #, patient, provider...'}
                className="text-xs sm:text-sm pl-9 pr-4 py-2 w-48 sm:w-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Claims Pipeline */}
        {activeTab === 'CLAIMS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Claim ID</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Insurance Provider</th>
                  <th className="px-5 py-3.5">Treatment / Diagnosis</th>
                  <th className="px-5 py-3.5 text-right">Claimed</th>
                  <th className="px-5 py-3.5 text-right">Approved / Settled</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>No insurance claims found matching your filter criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition">
                      <td className="px-5 py-4 font-mono font-medium text-gray-900 dark:text-white">
                        {claim.claimNumber}
                        <div className="text-xs text-gray-400 font-sans mt-0.5">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {claim.patient?.firstName} {claim.patient?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          UHID: {claim.patient?.uhid}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {claim.insurance?.provider}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Pol: {claim.insurance?.policyNumber}
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="truncate font-medium text-gray-800 dark:text-gray-200">
                          {claim.treatmentDescription}
                        </div>
                        {claim.diagnosis && (
                          <div className="text-xs text-gray-400 truncate">
                            Dx: {claim.diagnosis}
                          </div>
                        )}
                        {claim.invoice && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            Inv: {claim.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-white">
                        ${claim.claimedAmount.toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {claim.settledAmount > 0 ? (
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${claim.settledAmount.toFixed(2)}
                          </div>
                        ) : claim.approvedAmount > 0 ? (
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">
                            ${claim.approvedAmount.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Pending</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {renderStatusBadge(claim.status)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setViewClaimDetails(claim)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="View Full Claim Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {claim.status !== 'SETTLED' && claim.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleOpenAdjudication(claim)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg text-xs font-semibold transition"
                            >
                              Adjudicate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Registered Patient Policies */}
        {activeTab === 'POLICIES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5">Policy Number</th>
                  <th className="px-5 py-3.5">Patient / Holder</th>
                  <th className="px-5 py-3.5">Insurance Provider</th>
                  <th className="px-5 py-3.5 text-right">Coverage Limit</th>
                  <th className="px-5 py-3.5 text-center">Copay / Deductible</th>
                  <th className="px-5 py-3.5">Validity Period</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>No insurance policies registered yet.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((pol) => (
                    <tr key={pol.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition">
                      <td className="px-5 py-4 font-mono font-medium text-gray-900 dark:text-white">
                        {pol.policyNumber}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {pol.patient?.firstName} {pol.patient?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Holder: {pol.policyHolderName} (UHID: {pol.patient?.uhid})
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-blue-600 dark:text-blue-400">
                        {pol.provider}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-white">
                        ${pol.coverageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 text-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {pol.copayPercentage}% copay
                        </span>
                        {pol.deductible > 0 && (
                          <div className="text-gray-400 font-mono">Ded: ${pol.deductible}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        <div>From: {new Date(pol.validFrom).toLocaleDateString()}</div>
                        <div>To: {new Date(pol.validTo).toLocaleDateString()}</div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            pol.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {pol.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: FILE NEW INSURANCE CLAIM */}
      {/* ==================================================== */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">File New Insurance Claim</h3>
              </div>
              <button
                onClick={() => setIsNewClaimModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4 mt-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Patient *
                </label>
                <select
                  required
                  value={claimForm.patientId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const pol = policies.find((p) => p.patientId === pid && p.status === 'ACTIVE');
                    setClaimForm((prev) => ({
                      ...prev,
                      patientId: pid,
                      insuranceId: pol ? pol.id : '',
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (UHID: {p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Insurance Policy Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Insurance Policy *
                </label>
                <select
                  required
                  value={claimForm.insuranceId}
                  onChange={(e) => setClaimForm({ ...claimForm, insuranceId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select Insurance Policy</option>
                  {patientAvailablePolicies.map((pol) => (
                    <option key={pol.id} value={pol.id}>
                      {pol.provider} - Policy #{pol.policyNumber} (Max Coverage: ${pol.coverageAmount})
                    </option>
                  ))}
                  {claimForm.patientId && patientAvailablePolicies.length === 0 && (
                    <option value="" disabled>
                      No active policy found for this patient. Please register a policy first.
                    </option>
                  )}
                </select>
              </div>

              {/* Linked Invoice (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Linked Invoice (Optional)
                </label>
                <select
                  value={claimForm.invoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    const foundInv = invoices.find((i) => i.id === invId);
                    setClaimForm((prev) => ({
                      ...prev,
                      invoiceId: invId,
                      claimedAmount: foundInv ? foundInv.totalAmount : prev.claimedAmount,
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                >
                  <option value="">None / Direct Reimbursement</option>
                  {patientAvailableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Inv #{inv.invoiceNumber} - ${inv.totalAmount.toFixed(2)} ({inv.paymentStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Treatment Description & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Treatment Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inpatient Appendectomy Surgery"
                    value={claimForm.treatmentDescription}
                    onChange={(e) => setClaimForm({ ...claimForm, treatmentDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Primary Diagnosis / ICD-10
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Appendicitis (K35.80)"
                    value={claimForm.diagnosis}
                    onChange={(e) => setClaimForm({ ...claimForm, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Claimed Amount & Initial Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Claimed Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={claimForm.claimedAmount}
                    onChange={(e) => setClaimForm({ ...claimForm, claimedAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Submission Mode
                  </label>
                  <select
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value as 'DRAFT' | 'SUBMITTED' })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  >
                    <option value="SUBMITTED">Submit Immediately to TPA</option>
                    <option value="DRAFT">Save as Draft</option>
                  </select>
                </div>
              </div>

              {/* Attached Supporting Documents */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-750">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                    Supporting Documents / Proof
                  </span>
                </div>

                {claimForm.documents.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {claimForm.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">{doc.name}</span>
                          <span className="text-gray-400 font-mono">({doc.type})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Doc Title (e.g. Discharge Summary)"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="URL (https://storage...)"
                    value={docForm.url}
                    onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold text-gray-800 dark:text-gray-200 rounded-lg transition"
                  >
                    Add Doc
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>File Claim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: REGISTER PATIENT INSURANCE POLICY */}
      {/* ==================================================== */}
      {isNewPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Register Patient Insurance Policy</h3>
              </div>
              <button
                onClick={() => setIsNewPolicyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 mt-4">
              {/* Patient */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Patient *
                </label>
                <select
                  required
                  value={policyForm.patientId}
                  onChange={(e) => {
                    const pat = patients.find((p) => p.id === e.target.value);
                    setPolicyForm({
                      ...policyForm,
                      patientId: e.target.value,
                      policyHolderName: pat ? `${pat.firstName} ${pat.lastName}` : '',
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (UHID: {p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider & Policy Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Insurance Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Star Health, Blue Cross"
                    value={policyForm.provider}
                    onChange={(e) => setPolicyForm({ ...policyForm, provider: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="POL-XXXX-XXXX"
                    value={policyForm.policyNumber}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Policy Holder & Total Coverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Policy Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={policyForm.policyHolderName}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyHolderName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Coverage Limit ($) *
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    required
                    value={policyForm.coverageAmount}
                    onChange={(e) => setPolicyForm({ ...policyForm, coverageAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    required
                    value={policyForm.validFrom}
                    onChange={(e) => setPolicyForm({ ...policyForm, validFrom: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    required
                    value={policyForm.validTo}
                    onChange={(e) => setPolicyForm({ ...policyForm, validTo: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Copay & Deductible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Copay Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={policyForm.copayPercentage}
                    onChange={(e) => setPolicyForm({ ...policyForm, copayPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Deductible ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={policyForm.deductible}
                    onChange={(e) => setPolicyForm({ ...policyForm, deductible: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsNewPolicyModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Register Policy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADJUDICATE CLAIM */}
      {/* ==================================================== */}
      {isAdjudicateModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adjudicate Insurance Claim</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Claim #{selectedClaim.claimNumber}
                </p>
              </div>
              <button
                onClick={() => setIsAdjudicateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Brief */}
            <div className="my-4 p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Patient:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {selectedClaim.patient?.firstName} {selectedClaim.patient?.lastName} ({selectedClaim.patient?.uhid})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Provider & Policy:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedClaim.insurance?.provider} - #{selectedClaim.insurance?.policyNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Original Claimed:</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  ${selectedClaim.claimedAmount.toFixed(2)}
                </span>
              </div>
              {selectedClaim.invoice && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-mono">
                  <span>Linked Invoice:</span>
                  <span>#{selectedClaim.invoice.invoiceNumber} (${selectedClaim.invoice.totalAmount.toFixed(2)})</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAdjudicateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Adjudication Decision *
                </label>
                <select
                  value={adjudicateForm.status}
                  onChange={(e) =>
                    setAdjudicateForm({
                      ...adjudicateForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900 dark:text-white"
                >
                  <option value="UNDER_REVIEW">UNDER REVIEW (TPA Clinical Evaluation)</option>
                  <option value="APPROVED">APPROVED (Authorize Covered Payout)</option>
                  <option value="SETTLED">SETTLED (Disburse & Credit Invoice)</option>
                  <option value="REJECTED">REJECTED (Deny Claim)</option>
                </select>
              </div>

              {adjudicateForm.status === 'APPROVED' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Approved Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedClaim.claimedAmount}
                    required
                    value={adjudicateForm.approvedAmount}
                    onChange={(e) =>
                      setAdjudicateForm({ ...adjudicateForm, approvedAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Original Claimed: ${selectedClaim.claimedAmount.toFixed(2)}
                  </p>
                </div>
              )}

              {adjudicateForm.status === 'SETTLED' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Settlement Payout Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={adjudicateForm.settledAmount}
                    onChange={(e) =>
                      setAdjudicateForm({ ...adjudicateForm, settledAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Settling will automatically update linked invoice status to PAID/PARTIAL!
                  </p>
                </div>
              )}

              {adjudicateForm.status === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Denial Reason *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide justification for denial (e.g. Pre-existing condition exclusion, missing clinical documents)"
                    value={adjudicateForm.denialReason}
                    onChange={(e) => setAdjudicateForm({ ...adjudicateForm, denialReason: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Adjudication Notes / Audit Remark
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional internal remarks..."
                  value={adjudicateForm.adjudicationNotes}
                  onChange={(e) => setAdjudicateForm({ ...adjudicateForm, adjudicationNotes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAdjudicateModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Adjudication</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: VIEW FULL CLAIM DETAILS */}
      {/* ==================================================== */}
      {viewClaimDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Claim #{viewClaimDetails.claimNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewClaimDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-xl">
                <div>
                  <span className="text-xs text-gray-400 block">Status</span>
                  {renderStatusBadge(viewClaimDetails.status)}
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Created At</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {new Date(viewClaimDetails.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Patient</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {viewClaimDetails.patient?.firstName} {viewClaimDetails.patient?.lastName}
                  </span>
                  <span className="block text-xs text-gray-500 font-mono">UHID: {viewClaimDetails.patient?.uhid}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Insurance Provider</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {viewClaimDetails.insurance?.provider}
                  </span>
                  <span className="block text-xs text-gray-500 font-mono">Pol: {viewClaimDetails.insurance?.policyNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Treatment & Diagnosis
                </span>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {viewClaimDetails.treatmentDescription}
                </p>
                {viewClaimDetails.diagnosis && (
                  <p className="text-xs text-gray-500 mt-1">Diagnosis: {viewClaimDetails.diagnosis}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl text-center">
                <div>
                  <span className="text-xs text-gray-500 block">Claimed</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    ${viewClaimDetails.claimedAmount.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Approved</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    ${viewClaimDetails.approvedAmount.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Settled</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    ${viewClaimDetails.settledAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {viewClaimDetails.denialReason && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 block mb-0.5">
                    Denial Reason:
                  </span>
                  <p className="text-xs text-red-600 dark:text-red-300">{viewClaimDetails.denialReason}</p>
                </div>
              )}

              {viewClaimDetails.adjudicationNotes && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Adjudication Notes
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                    {viewClaimDetails.adjudicationNotes}
                  </p>
                </div>
              )}

              {/* Supporting Documents list */}
              {parseDocuments(viewClaimDetails.documents).length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Attached Documents
                  </span>
                  <div className="space-y-1.5">
                    {parseDocuments(viewClaimDetails.documents).map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-gray-700 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{doc.name}</span>
                          <span className="text-gray-400">({doc.type})</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setViewClaimDetails(null)}
                className="px-5 py-2 text-sm font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDashboardPage;

