import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Thermometer,
  Layers,
  ArrowRight,
  Heart,
  FileCheck,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import {
  bloodBankService,
  BloodUnit,
  BloodDonor,
  BloodBankDashboardData,
} from '../services/bloodBankService';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodBankDashboardPage: React.FC = () => {
  const [dashData, setDashData] = useState<BloodBankDashboardData | null>(null);
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'donors'>('inventory');

  // Filters
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [componentFilter, setComponentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal 1: Register Donor
  const [isDonorModalOpen, setIsDonorModalOpen] = useState<boolean>(false);
  const [donorForm, setDonorForm] = useState({
    name: '',
    gender: 'MALE',
    age: 28,
    bloodGroup: 'O+',
    contactPhone: '',
    email: '',
    address: '',
    medicalNotes: 'Hemoglobin > 13.0 g/dL, fit for voluntary donation',
  });

  // Modal 2: Record Blood Intake / Unit
  const [isUnitModalOpen, setIsUnitModalOpen] = useState<boolean>(false);
  const [unitForm, setUnitForm] = useState({
    donorId: '',
    bloodGroup: 'O+',
    componentType: 'WHOLE_BLOOD',
    volumeMl: 450,
    collectionDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 35 days default
    storageLocation: 'Blood Refrigerator 1, Shelf A',
    storageTemperature: 4.0,
    testingStatus: 'PENDING',
    screeningNotes: 'Collected in citrate phosphate dextrose adenine (CPDA-1) bag',
  });

  // Modal 3: Screening Test Result
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [selectedUnitForTest, setSelectedUnitForTest] = useState<BloodUnit | null>(null);
  const [testForm, setTestForm] = useState({
    testingStatus: 'PASSED' as 'PASSED' | 'FAILED',
    screeningNotes: 'Non-reactive for HIV-1/2, HBV, HCV, Syphilis, and Malaria.',
  });

  // Modal 4: Reserve Unit
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [selectedUnitForReserve, setSelectedUnitForReserve] = useState<BloodUnit | null>(null);
  const [reserveForm, setReserveForm] = useState({
    patientId: '',
    reason: 'Scheduled surgical emergency reserve',
  });

  // Modal 5: Issue Unit (Crossmatch Verification)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [selectedUnitForIssue, setSelectedUnitForIssue] = useState<BloodUnit | null>(null);
  const [issueForm, setIssueForm] = useState({
    patientId: '',
    crossmatchResult: 'COMPATIBLE' as 'COMPATIBLE' | 'INCOMPATIBLE',
    issueNotes: 'Major and minor crossmatching compatible. Issued for immediate transfusion.',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dash, unitsList, donorsList] = await Promise.all([
        bloodBankService.getDashboard(),
        bloodBankService.getUnits({
          bloodGroup: bloodGroupFilter === 'ALL' ? undefined : bloodGroupFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          componentType: componentFilter === 'ALL' ? undefined : componentFilter,
          search: searchQuery || undefined,
        }),
        bloodBankService.getDonors(),
      ]);
      setDashData(dash);
      setUnits(unitsList);
      setDonors(donorsList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch blood bank inventory.');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data?.data || []);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchData();
    loadPatients();
  }, [bloodGroupFilter, statusFilter, componentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Register Donor Handler
  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorForm.name.trim() || !donorForm.contactPhone.trim()) {
      setError('Donor name and phone number are required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const donor = await bloodBankService.createDonor({
        name: donorForm.name,
        gender: donorForm.gender,
        age: Number(donorForm.age),
        bloodGroup: donorForm.bloodGroup,
        contactPhone: donorForm.contactPhone,
        email: donorForm.email || undefined,
        address: donorForm.address || undefined,
        medicalNotes: donorForm.medicalNotes || undefined,
      });

      setSuccessMsg(`Donor ${donor.name} (${donor.donorNumber}) registered successfully!`);
      setIsDonorModalOpen(false);
      setDonorForm({
        name: '',
        gender: 'MALE',
        age: 28,
        bloodGroup: 'O+',
        contactPhone: '',
        email: '',
        address: '',
        medicalNotes: 'Hemoglobin > 13.0 g/dL, fit for voluntary donation',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register blood donor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Unit / Intake Handler
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const newUnit = await bloodBankService.createUnit({
        donorId: unitForm.donorId || undefined,
        bloodGroup: unitForm.bloodGroup,
        componentType: unitForm.componentType,
        volumeMl: Number(unitForm.volumeMl),
        collectionDate: unitForm.collectionDate ? new Date(unitForm.collectionDate).toISOString() : undefined,
        expiryDate: new Date(unitForm.expiryDate).toISOString(),
        storageLocation: unitForm.storageLocation,
        storageTemperature: Number(unitForm.storageTemperature),
        testingStatus: unitForm.testingStatus,
        screeningNotes: unitForm.screeningNotes,
      });

      setSuccessMsg(`Blood Unit ${newUnit.unitNumber} (${newUnit.bloodGroup}) added to inventory!`);
      setIsUnitModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create blood unit.');
    } finally {
      setActionLoading(false);
    }
  };

  // Test Unit Handler
  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForTest) return;

    try {
      setActionLoading(true);
      setError(null);
      await bloodBankService.updateTest(selectedUnitForTest.id, {
        testingStatus: testForm.testingStatus,
        screeningNotes: testForm.screeningNotes,
      });

      setSuccessMsg(
        `Screening for unit ${selectedUnitForTest.unitNumber} marked as ${testForm.testingStatus}.`
      );
      setIsTestModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update infection screening status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reserve Unit Handler
  const handleReserveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForReserve || !reserveForm.patientId) {
      setError('Please select a recipient patient for reservation.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await bloodBankService.reserveUnit(selectedUnitForReserve.id, {
        patientId: reserveForm.patientId,
        reason: reserveForm.reason,
      });

      setSuccessMsg(`Unit ${selectedUnitForReserve.unitNumber} reserved for patient.`);
      setIsReserveModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reserve blood unit.');
    } finally {
      setActionLoading(false);
    }
  };

  // Issue Unit Handler
  const handleIssueUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForIssue) return;
    if (!issueForm.patientId) {
      setError('Please select a recipient patient.');
      return;
    }
    if (issueForm.crossmatchResult === 'INCOMPATIBLE') {
      setError('CRITICAL SAFETY PROTOCOL: Cannot issue blood unit with INCOMPATIBLE crossmatch result.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await bloodBankService.issueUnit(selectedUnitForIssue.id, {
        patientId: issueForm.patientId,
        crossmatchResult: issueForm.crossmatchResult,
        issueNotes: issueForm.issueNotes,
      });

      setSuccessMsg(`Blood unit ${selectedUnitForIssue.unitNumber} verified & issued successfully for transfusion.`);
      setIsIssueModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue blood unit.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RESERVED':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'ISSUED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EXPIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'DISCARDED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTestingBadge = (testing: string) => {
    switch (testing) {
      case 'PASSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const summary = dashData?.summary;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-rose-700 via-red-600 to-rose-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
              <Droplets className="w-8 h-8 text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Blood Bank & Transfusion Medicine</h1>
              <p className="text-rose-100 text-sm">
                Real-time 8-group stock telemetry, donor registry, pathogen screening & crossmatch verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUnitModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-rose-700 font-bold rounded-xl shadow hover:bg-rose-50 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-700" />
            <span>Blood Intake / New Unit</span>
          </button>
          <button
            onClick={() => setIsDonorModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-800/60 hover:bg-rose-800 text-white font-semibold rounded-xl border border-rose-400/40 shadow transition transform active:scale-95"
          >
            <Heart className="w-4 h-4 text-rose-200 fill-rose-200/50" />
            <span>Register Donor</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl shadow-sm text-rose-800">
          <div className="flex items-center space-x-3">
            <AlertOctagon className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl shadow-sm text-emerald-800">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 8-Blood-Group Availability Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-rose-600" />
            <span>Blood Group Availability Matrix</span>
          </h2>
          <span className="text-xs text-gray-500">Low stock alert threshold: &lt; 5 available units</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {BLOOD_GROUPS.map((bg) => {
            const count = summary?.bloodGroupStock[bg] || 0;
            const isLowStock = count < 5;
            return (
              <div
                key={bg}
                onClick={() => {
                  setBloodGroupFilter(bloodGroupFilter === bg ? 'ALL' : bg);
                }}
                className={`cursor-pointer rounded-2xl p-4 border transition transform hover:-translate-y-1 shadow-sm flex flex-col justify-between ${
                  bloodGroupFilter === bg
                    ? 'ring-2 ring-rose-600 border-rose-500 bg-rose-50'
                    : isLowStock
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-rose-700">{bg}</span>
                  {isLowStock ? (
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-rose-600 text-white animate-pulse">
                      Low
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                      Normal
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <div className="text-2xl font-extrabold text-gray-900">{count}</div>
                  <div className="text-[11px] text-gray-500 font-medium">Available Units</div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-right">
                  {bloodGroupFilter === bg ? 'Filter active' : 'Click to filter'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Counters */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Total Units</span>
            <span className="text-2xl font-black text-gray-900 mt-2">{summary.totalUnits}</span>
            <span className="text-[11px] text-gray-400 mt-1">All cataloged units</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-700">Available</span>
            <span className="text-2xl font-black text-emerald-600 mt-2">{summary.totalAvailable}</span>
            <span className="text-[11px] text-emerald-600 mt-1">Tested & unreserved</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-amber-700">Reserved</span>
            <span className="text-2xl font-black text-amber-600 mt-2">{summary.totalReserved}</span>
            <span className="text-[11px] text-amber-600 mt-1">Held for surgeries</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-blue-700">Issued</span>
            <span className="text-2xl font-black text-blue-600 mt-2">{summary.totalIssued}</span>
            <span className="text-[11px] text-blue-600 mt-1">Crossmatched & given</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-rose-700">Expired</span>
            <span className="text-2xl font-black text-rose-600 mt-2">{summary.totalExpired}</span>
            <span className="text-[11px] text-rose-600 mt-1">Requires safe disposal</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-yellow-200 bg-yellow-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-yellow-700">Testing Pending</span>
            <span className="text-2xl font-black text-yellow-600 mt-2">{summary.pendingTestingCount}</span>
            <span className="text-[11px] text-yellow-600 mt-1">Screening incomplete</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-purple-700">Donors</span>
            <span className="text-2xl font-black text-purple-600 mt-2">{summary.totalDonors}</span>
            <span className="text-[11px] text-purple-600 mt-1">Registered donors</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'inventory' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Blood Units Inventory ({units.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('donors')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'donors' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Blood Donors Directory ({donors.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search unit number, donor, or storage location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Group:</span>
                <select
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">All Groups</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="ISSUED">Issued</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="DISCARDED">Discarded</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Component:</span>
                <select
                  value={componentFilter}
                  onChange={(e) => setComponentFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">All Components</option>
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="PRBC">Packed Red Blood Cells (PRBC)</option>
                  <option value="PLATELETS">Platelets</option>
                  <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                  <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Blood Units Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Unit #</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Component & Volume</th>
                    <th className="px-4 py-3">Infection Screening</th>
                    <th className="px-4 py-3">Storage Location</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 text-xs">
                        {unit.unitNumber}
                        {unit.donor && (
                          <div className="text-[11px] text-gray-400 font-sans font-normal">
                            Donor: {unit.donor.name}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-sm font-black rounded-lg bg-rose-100 text-rose-800 border border-rose-200 inline-block">
                          {unit.bloodGroup}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-gray-900">{unit.componentType.replace('_', ' ')}</div>
                        <div className="text-gray-500 text-[11px]">{unit.volumeMl} mL</div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getTestingBadge(
                            unit.testingStatus
                          )}`}
                        >
                          {unit.testingStatus}
                        </span>
                        {unit.testingStatus === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedUnitForTest(unit);
                              setIsTestModalOpen(true);
                            }}
                            className="ml-2 text-xs text-rose-600 hover:underline font-semibold"
                          >
                            Update
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-gray-800">{unit.storageLocation}</div>
                        {unit.storageTemperature !== null && (
                          <div className="text-gray-400 text-[11px] flex items-center space-x-1">
                            <Thermometer className="w-3 h-3 text-blue-500" />
                            <span>{unit.storageTemperature}°C</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div
                          className={`font-medium ${
                            unit.isExpired || new Date(unit.expiryDate) < new Date()
                              ? 'text-rose-600 font-bold'
                              : 'text-gray-800'
                          }`}
                        >
                          {new Date(unit.expiryDate).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Coll: {new Date(unit.collectionDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(
                            unit.status
                          )}`}
                        >
                          {unit.status}
                        </span>
                        {unit.reservedForPatient && (
                          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                            For: {unit.reservedForPatient.firstName} {unit.reservedForPatient.lastName}
                          </div>
                        )}
                        {unit.issuedToPatient && (
                          <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                            To: {unit.issuedToPatient.firstName} {unit.issuedToPatient.lastName}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {unit.status === 'AVAILABLE' && unit.testingStatus === 'PASSED' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedUnitForReserve(unit);
                                  setIsReserveModalOpen(true);
                                }}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded"
                              >
                                Reserve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUnitForIssue(unit);
                                  setIsIssueModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm"
                              >
                                Issue
                              </button>
                            </>
                          )}

                          {unit.status === 'RESERVED' && (
                            <button
                              onClick={() => {
                                setSelectedUnitForIssue(unit);
                                if (unit.reservedForPatientId) {
                                  setIssueForm((prev) => ({ ...prev, patientId: unit.reservedForPatientId! }));
                                }
                                setIsIssueModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm"
                            >
                              Issue Reserved
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {units.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                        No blood units found matching your current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Registered Blood Donors</h3>
                <p className="text-xs text-gray-500">Voluntary blood donors registry and eligibility tracking</p>
              </div>
              <button
                onClick={() => setIsDonorModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
              >
                + Register Donor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Donor #</th>
                    <th className="px-4 py-3">Donor Name</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Age / Gender</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Eligibility</th>
                    <th className="px-4 py-3">Total Donations</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 text-xs">{donor.donorNumber}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-xs">{donor.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-extrabold rounded bg-rose-100 text-rose-800 border border-rose-200">
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {donor.age} yrs • {donor.gender}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-gray-800">{donor.contactPhone}</div>
                        {donor.email && <div className="text-[11px] text-gray-400">{donor.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            donor.eligibilityStatus === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {donor.eligibilityStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-800">
                        {donor._count?.donations || 0} collections
                      </td>
                      <td className="px-4 py-3 text-right">
                        {donor.eligibilityStatus === 'ELIGIBLE' && (
                          <button
                            onClick={() => {
                              setUnitForm((prev) => ({
                                ...prev,
                                donorId: donor.id,
                                bloodGroup: donor.bloodGroup,
                              }));
                              setIsUnitModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm"
                          >
                            Record Intake
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {donors.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No donors registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Register Blood Donor */}
      {isDonorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Heart className="w-6 h-6 text-rose-600 fill-rose-100" />
                <h3 className="text-lg font-bold text-gray-900">Register Blood Donor</h3>
              </div>
              <button onClick={() => setIsDonorModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDonor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Donor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Blood Group *</label>
                  <select
                    value={donorForm.bloodGroup}
                    onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 font-bold bg-white"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select
                    value={donorForm.gender}
                    onChange={(e) => setDonorForm({ ...donorForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={donorForm.age}
                    onChange={(e) => setDonorForm({ ...donorForm, age: parseInt(e.target.value) || 25 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={donorForm.contactPhone}
                    onChange={(e) => setDonorForm({ ...donorForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="donor@example.com"
                    value={donorForm.email}
                    onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Residential address..."
                  value={donorForm.address}
                  onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Medical Assessment</label>
                <textarea
                  rows={2}
                  value={donorForm.medicalNotes}
                  onChange={(e) => setDonorForm({ ...donorForm, medicalNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDonorModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 text-white font-bold text-sm rounded-lg hover:bg-rose-700 transition"
                >
                  {actionLoading ? 'Registering...' : 'Register Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Blood Intake / Unit */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Droplets className="w-6 h-6 text-rose-600" />
                <h3 className="text-lg font-bold text-gray-900">Record Blood Intake / Unit</h3>
              </div>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Registered Donor (Optional)
                </label>
                <select
                  value={unitForm.donorId}
                  onChange={(e) => {
                    const selectedD = donors.find((d) => d.id === e.target.value);
                    setUnitForm({
                      ...unitForm,
                      donorId: e.target.value,
                      bloodGroup: selectedD ? selectedD.bloodGroup : unitForm.bloodGroup,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">Direct / Voluntary Intake (No Donor Link)</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.bloodGroup} - {d.donorNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Blood Group *</label>
                  <select
                    value={unitForm.bloodGroup}
                    onChange={(e) => setUnitForm({ ...unitForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 font-bold bg-white"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Component *</label>
                  <select
                    value={unitForm.componentType}
                    onChange={(e) => setUnitForm({ ...unitForm, componentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 bg-white font-semibold"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="PRBC">Packed RBC (PRBC)</option>
                    <option value="PLATELETS">Platelets</option>
                    <option value="FFP">Fresh Frozen Plasma</option>
                    <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Volume (mL)</label>
                  <input
                    type="number"
                    value={unitForm.volumeMl}
                    onChange={(e) => setUnitForm({ ...unitForm, volumeMl: parseInt(e.target.value) || 450 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Collection Date</label>
                  <input
                    type="date"
                    value={unitForm.collectionDate}
                    onChange={(e) => setUnitForm({ ...unitForm, collectionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={unitForm.expiryDate}
                    onChange={(e) => setUnitForm({ ...unitForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={unitForm.storageLocation}
                    onChange={(e) => setUnitForm({ ...unitForm, storageLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Storage Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitForm.storageTemperature}
                    onChange={(e) => setUnitForm({ ...unitForm, storageTemperature: parseFloat(e.target.value) || 4.0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Screening Notes</label>
                <textarea
                  rows={2}
                  value={unitForm.screeningNotes}
                  onChange={(e) => setUnitForm({ ...unitForm, screeningNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 text-white font-bold text-sm rounded-lg hover:bg-rose-700 transition"
                >
                  {actionLoading ? 'Saving...' : 'Add Unit to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Screening Test Result */}
      {isTestModalOpen && selectedUnitForTest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Infection Screening Test</h3>
                <p className="text-xs text-gray-500">Unit: {selectedUnitForTest.unitNumber}</p>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Testing Status</label>
                <select
                  value={testForm.testingStatus}
                  onChange={(e) => setTestForm({ ...testForm, testingStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="PASSED">PASSED (Non-reactive / Safe for Transfusion)</option>
                  <option value="FAILED">FAILED (Reactive / Discard Protocol Triggered)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Screening Remarks & Lab Findings</label>
                <textarea
                  rows={3}
                  required
                  value={testForm.screeningNotes}
                  onChange={(e) => setTestForm({ ...testForm, screeningNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 text-white font-bold text-sm rounded-lg hover:bg-rose-700 transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Screening Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reserve Unit */}
      {isReserveModalOpen && selectedUnitForReserve && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reserve Blood Unit</h3>
                <p className="text-xs text-gray-500">
                  Unit: {selectedUnitForReserve.unitNumber} ({selectedUnitForReserve.bloodGroup})
                </p>
              </div>
              <button onClick={() => setIsReserveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReserveUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Patient *</label>
                <select
                  required
                  value={reserveForm.patientId}
                  onChange={(e) => setReserveForm({ ...reserveForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select recipient patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.uhid} - Blood: {p.bloodGroup || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reservation Reason</label>
                <input
                  type="text"
                  value={reserveForm.reason}
                  onChange={(e) => setReserveForm({ ...reserveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 text-white font-bold text-sm rounded-lg hover:bg-amber-700 transition"
                >
                  {actionLoading ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Issue Blood Unit (Crossmatch Verification) */}
      {isIssueModalOpen && selectedUnitForIssue && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-rose-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Issue Blood Unit & Crossmatch</h3>
                  <p className="text-xs text-gray-500">
                    Unit: {selectedUnitForIssue.unitNumber} ({selectedUnitForIssue.bloodGroup})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-0.5">
                <p className="font-bold">Strict Transfusion Safety Verification Required</p>
                <p>
                  Verify patient identity against wristband UHID and confirm negative antibody screen prior to dispensing.
                </p>
              </div>
            </div>

            <form onSubmit={handleIssueUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Recipient Patient *</label>
                <select
                  required
                  value={issueForm.patientId}
                  onChange={(e) => setIssueForm({ ...issueForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 font-semibold"
                >
                  <option value="">Select recipient patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.uhid} - Blood: {p.bloodGroup || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Crossmatch Compatibility Test *
                </label>
                <select
                  required
                  value={issueForm.crossmatchResult}
                  onChange={(e) => setIssueForm({ ...issueForm, crossmatchResult: e.target.value as any })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-rose-500 ${
                    issueForm.crossmatchResult === 'COMPATIBLE'
                      ? 'border-emerald-400 text-emerald-800'
                      : 'border-rose-500 text-rose-800'
                  }`}
                >
                  <option value="COMPATIBLE">COMPATIBLE (No Agglutination / Safe to Issue)</option>
                  <option value="INCOMPATIBLE">INCOMPATIBLE (Agglutination Detected / DO NOT ISSUE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Transfusion Issue Notes</label>
                <textarea
                  rows={2}
                  required
                  value={issueForm.issueNotes}
                  onChange={(e) => setIssueForm({ ...issueForm, issueNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || issueForm.crossmatchResult === 'INCOMPATIBLE'}
                  className={`px-5 py-2 text-white font-bold text-sm rounded-lg transition ${
                    issueForm.crossmatchResult === 'INCOMPATIBLE'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Issuing...' : 'Authorize & Dispense Blood Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

