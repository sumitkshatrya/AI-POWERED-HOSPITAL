import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  User,
  Navigation,
  Activity,
  MapPin,
  Clock,
  Radio,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Gauge,
  Compass,
} from 'lucide-react';
import {
  ambulanceService,
  Ambulance,
  AmbulanceDispatch,
  AmbulanceFleetSummary,
} from '../services/ambulanceService';
import api from '../services/api';

export const AmbulanceFleetPage: React.FC = () => {
  const [fleetSummary, setFleetSummary] = useState<AmbulanceFleetSummary | null>(null);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [dispatches, setDispatches] = useState<AmbulanceDispatch[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'vehicles' | 'dispatches'>('vehicles');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Register Vehicle Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    model: 'Mercedes Sprinter ICU',
    ambulanceType: 'ALS',
    driverName: '',
    driverPhone: '',
    currentLocation: 'Hospital Base Station Bay 1',
    equipmentText: 'Oxygen Cylinder, Defibrillator, Cardiac Monitor, Portable Ventilator, Stretcher',
  });

  // Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchForm, setDispatchForm] = useState({
    ambulanceId: '',
    callerName: '',
    callerPhone: '',
    pickupLocation: '',
    destinationLocation: 'Hospital Emergency Department (ER)',
    emergencyDescription: '',
    priority: 'HIGH',
    patientId: '',
  });

  // Update Status / GPS Telemetry Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [telemetryForm, setTelemetryForm] = useState({
    status: 'AVAILABLE',
    currentLocation: '',
    latitude: 28.6139,
    longitude: 77.209,
    speed: 0,
    heading: 0,
  });

  // Dispatch Progression Modal
  const [isDispatchProgressModalOpen, setIsDispatchProgressModalOpen] = useState<boolean>(false);
  const [selectedDispatch, setSelectedDispatch] = useState<AmbulanceDispatch | null>(null);
  const [dispatchProgressForm, setDispatchProgressForm] = useState({
    status: 'EN_ROUTE' as 'ASSIGNED' | 'EN_ROUTE' | 'AT_LOCATION' | 'TRANSPORTING' | 'COMPLETED' | 'CANCELLED',
    paramedicNotes: '',
    latitude: 28.6139,
    longitude: 77.209,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehiclesRes, dispatchesRes] = await Promise.all([
        ambulanceService.getVehicles({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          ambulanceType: typeFilter === 'ALL' ? undefined : typeFilter,
          search: searchQuery || undefined,
        }),
        ambulanceService.getDispatches(),
      ]);
      setFleetSummary(vehiclesRes.summary);
      setAmbulances(vehiclesRes.ambulances);
      setDispatches(dispatchesRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ambulance fleet data.');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data?.data || []);
    } catch {
      // Non-critical if fails
    }
  };

  useEffect(() => {
    fetchData();
    loadPatients();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber.trim() || !vehicleForm.driverName.trim() || !vehicleForm.driverPhone.trim()) {
      setError('Vehicle number, driver name, and phone are mandatory.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const equipmentArray = vehicleForm.equipmentText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await ambulanceService.createVehicle({
        vehicleNumber: vehicleForm.vehicleNumber,
        model: vehicleForm.model,
        ambulanceType: vehicleForm.ambulanceType,
        driverName: vehicleForm.driverName,
        driverPhone: vehicleForm.driverPhone,
        currentLocation: vehicleForm.currentLocation,
        equipment: equipmentArray,
      });

      setSuccessMsg(`Ambulance ${vehicleForm.vehicleNumber} registered successfully into fleet!`);
      setIsRegisterModalOpen(false);
      setVehicleForm({
        vehicleNumber: '',
        model: 'Mercedes Sprinter ICU',
        ambulanceType: 'ALS',
        driverName: '',
        driverPhone: '',
        currentLocation: 'Hospital Base Station Bay 1',
        equipmentText: 'Oxygen Cylinder, Defibrillator, Cardiac Monitor, Portable Ventilator, Stretcher',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.callerName.trim() || !dispatchForm.callerPhone.trim() || !dispatchForm.pickupLocation.trim()) {
      setError('Caller name, caller phone, and pickup location are mandatory for dispatch.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const created = await ambulanceService.createDispatch({
        ambulanceId: dispatchForm.ambulanceId || undefined,
        callerName: dispatchForm.callerName,
        callerPhone: dispatchForm.callerPhone,
        pickupLocation: dispatchForm.pickupLocation,
        destinationLocation: dispatchForm.destinationLocation,
        emergencyDescription: dispatchForm.emergencyDescription,
        priority: dispatchForm.priority,
        patientId: dispatchForm.patientId || undefined,
      });

      setSuccessMsg(`Emergency dispatch ${created.dispatchNumber} created successfully!`);
      setIsDispatchModalOpen(false);
      setDispatchForm({
        ambulanceId: '',
        callerName: '',
        callerPhone: '',
        pickupLocation: '',
        destinationLocation: 'Hospital Emergency Department (ER)',
        emergencyDescription: '',
        priority: 'HIGH',
        patientId: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch ambulance.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (ambulance: Ambulance) => {
    setSelectedAmbulance(ambulance);
    setTelemetryForm({
      status: ambulance.status,
      currentLocation: ambulance.currentLocation || '',
      latitude: ambulance.latitude || 28.6139,
      longitude: ambulance.longitude || 77.209,
      speed: ambulance.speed || 0,
      heading: ambulance.heading || 0,
    });
    setIsStatusModalOpen(true);
  };

  const handleUpdateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmbulance) return;

    try {
      setActionLoading(true);
      setError(null);
      await ambulanceService.updateVehicleStatus(selectedAmbulance.id, {
        status: telemetryForm.status,
        currentLocation: telemetryForm.currentLocation,
        latitude: Number(telemetryForm.latitude),
        longitude: Number(telemetryForm.longitude),
        speed: Number(telemetryForm.speed),
        heading: Number(telemetryForm.heading),
      });

      setSuccessMsg(`Vehicle ${selectedAmbulance.vehicleNumber} status & GPS telemetry updated.`);
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vehicle telemetry.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDispatchProgressModal = (dispatch: AmbulanceDispatch) => {
    setSelectedDispatch(dispatch);
    const nextStatusMap: Record<string, any> = {
      ASSIGNED: 'EN_ROUTE',
      EN_ROUTE: 'AT_LOCATION',
      AT_LOCATION: 'TRANSPORTING',
      TRANSPORTING: 'COMPLETED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    };
    setDispatchProgressForm({
      status: nextStatusMap[dispatch.status] || dispatch.status,
      paramedicNotes: dispatch.paramedicNotes || '',
      latitude: dispatch.ambulance?.latitude || 28.6139,
      longitude: dispatch.ambulance?.longitude || 77.209,
    });
    setIsDispatchProgressModalOpen(true);
  };

  const handleUpdateDispatchProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    try {
      setActionLoading(true);
      setError(null);
      await ambulanceService.updateDispatchStatus(selectedDispatch.id, {
        status: dispatchProgressForm.status,
        paramedicNotes: dispatchProgressForm.paramedicNotes,
        latitude: Number(dispatchProgressForm.latitude),
        longitude: Number(dispatchProgressForm.longitude),
      });

      setSuccessMsg(`Dispatch ${selectedDispatch.dispatchNumber} updated to ${dispatchProgressForm.status}.`);
      setIsDispatchProgressModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update dispatch progress.');
    } finally {
      setActionLoading(false);
    }
  };

  const getAmbulanceStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ASSIGNED':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'EN_ROUTE':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'AT_LOCATION':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'TRANSPORTING':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 text-white font-semibold';
      case 'MEDIUM':
        return 'bg-yellow-400 text-gray-900 font-semibold';
      case 'LOW':
        return 'bg-emerald-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const parseEquipment = (eq?: string | null): string[] => {
    if (!eq) return [];
    try {
      const parsed = JSON.parse(eq);
      return Array.isArray(parsed) ? parsed : [eq];
    } catch {
      return eq.split(',').map((s) => s.trim());
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Ambulance Fleet & Emergency Dispatch</h1>
              <p className="text-red-100 text-sm">
                Real-time rapid deployment, vehicle telemetry tracking & paramedic dispatch routing
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-red-600 font-bold rounded-xl shadow hover:bg-red-50 transition transform active:scale-95"
          >
            <Radio className="w-4 h-4 text-red-600 animate-ping" />
            <span>New Emergency Dispatch</span>
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-700/60 hover:bg-red-700 text-white font-semibold rounded-xl border border-red-400/40 shadow transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition"
            title="Refresh Fleet"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl shadow-sm text-rose-800">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
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

      {/* Fleet Telemetry Summary Cards */}
      {fleetSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Total Fleet</span>
            <span className="text-2xl font-black text-gray-900 mt-2">{fleetSummary.total}</span>
            <span className="text-[11px] text-gray-400 mt-1">Vehicles enrolled</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-700">Available</span>
            <span className="text-2xl font-black text-emerald-600 mt-2">{fleetSummary.available}</span>
            <span className="text-[11px] text-emerald-600 mt-1">Ready for dispatch</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-sky-200 bg-sky-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-sky-700">Assigned</span>
            <span className="text-2xl font-black text-sky-600 mt-2">{fleetSummary.assigned}</span>
            <span className="text-[11px] text-sky-600 mt-1">Allocated to call</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-blue-700">En Route</span>
            <span className="text-2xl font-black text-blue-600 mt-2">{fleetSummary.enRoute}</span>
            <span className="text-[11px] text-blue-600 mt-1">Transit to scene</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-purple-700">At Scene</span>
            <span className="text-2xl font-black text-purple-600 mt-2">{fleetSummary.atLocation}</span>
            <span className="text-[11px] text-purple-600 mt-1">On-site stabilization</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-amber-700">Transporting</span>
            <span className="text-2xl font-black text-amber-600 mt-2">{fleetSummary.transporting}</span>
            <span className="text-[11px] text-amber-600 mt-1">Transit to Hospital</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase text-red-700">Maintenance</span>
            <span className="text-2xl font-black text-red-600 mt-2">{fleetSummary.maintenance}</span>
            <span className="text-[11px] text-red-600 mt-1">Service / Off-road</span>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'vehicles'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Fleet Vehicles ({ambulances.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('dispatches')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'dispatches'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Active Dispatches ({dispatches.length})</span>
        </button>
      </div>

      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search vehicle number, driver, model, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="EN_ROUTE">En Route</option>
                  <option value="AT_LOCATION">At Location</option>
                  <option value="TRANSPORTING">Transporting</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Ambulance Types</option>
                  <option value="ALS">Advanced Life Support (ALS)</option>
                  <option value="BLS">Basic Life Support (BLS)</option>
                  <option value="MOBILE_ICU">Mobile ICU</option>
                  <option value="PATIENT_TRANSPORT">Patient Transport</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((amb) => {
              const eqList = parseEquipment(amb.equipment);
              return (
                <div
                  key={amb.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-5 h-5 text-red-600" />
                          <h3 className="font-extrabold text-lg text-gray-900">{amb.vehicleNumber}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{amb.model || 'Standard Ambulance'}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getAmbulanceStatusBadge(
                          amb.status
                        )}`}
                      >
                        {amb.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Category</span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {amb.ambulanceType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Driver</span>
                        <span className="text-xs font-medium text-gray-800 flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{amb.driverName}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Contact</span>
                        <a
                          href={`tel:${amb.driverPhone}`}
                          className="text-xs font-semibold text-red-600 hover:underline flex items-center space-x-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{amb.driverPhone}</span>
                        </a>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Location</span>
                        <span className="text-xs text-right text-gray-700 max-w-[180px] truncate flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{amb.currentLocation || 'Base Station'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Equipment Tags */}
                    {eqList.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                          Onboard Equipment
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {eqList.map((eq, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GPS Telemetry snippet */}
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Gauge className="w-3.5 h-3.5 text-red-500" />
                        <span>{amb.speed ?? 0} km/h</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Compass className="w-3.5 h-3.5 text-blue-500" />
                        <span>Heading {amb.heading ?? 0}°</span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {amb.lastGpsPingAt
                          ? new Date(amb.lastGpsPingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'No GPS Ping'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center space-x-2">
                    <button
                      onClick={() => openStatusModal(amb)}
                      className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Update Status & GPS</span>
                    </button>
                    {amb.status === 'AVAILABLE' && (
                      <button
                        onClick={() => {
                          setDispatchForm((prev) => ({ ...prev, ambulanceId: amb.id }));
                          setIsDispatchModalOpen(true);
                        }}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                      >
                        Dispatch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {ambulances.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-gray-700">No Ambulances Found</h4>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or register a new vehicle.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Emergency Dispatches Stream</h3>
                <p className="text-xs text-gray-500">Live tracker of dispatched emergency rescue units</p>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
              >
                + Create Dispatch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Dispatch #</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Caller & Emergency</th>
                    <th className="px-4 py-3">Route (Pickup → Drop)</th>
                    <th className="px-4 py-3">Assigned Vehicle</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Timeline</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispatches.map((disp) => (
                    <tr key={disp.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 text-xs">
                        {disp.dispatchNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase ${getPriorityBadge(disp.priority)}`}>
                          {disp.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 text-xs">{disp.callerName}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{disp.callerPhone}</span>
                        </div>
                        <div className="text-xs text-rose-600 font-medium truncate max-w-xs mt-0.5">
                          {disp.emergencyDescription}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-gray-800 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span>{disp.pickupLocation}</span>
                        </div>
                        <div className="text-gray-500 flex items-center space-x-1 mt-0.5">
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span>{disp.destinationLocation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {disp.ambulance ? (
                          <div>
                            <div className="font-bold text-gray-900">{disp.ambulance.vehicleNumber}</div>
                            <div className="text-gray-500 text-[11px]">{disp.ambulance.driverName}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getAmbulanceStatusBadge(
                            disp.status
                          )}`}
                        >
                          {disp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>
                          Assigned: {new Date(disp.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {disp.completedAt && (
                          <div className="text-emerald-600 font-medium">
                            Done: {new Date(disp.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {disp.status !== 'COMPLETED' && disp.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openDispatchProgressModal(disp)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm"
                          >
                            Update Stage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dispatches.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No active or past dispatches recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Register Vehicle */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Truck className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">Register Ambulance Vehicle</h3>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Vehicle License Plate / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-01-AMB-9988"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ambulance Type</label>
                  <select
                    value={vehicleForm.ambulanceType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, ambulanceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="ALS">Advanced Life Support (ALS)</option>
                    <option value="BLS">Basic Life Support (BLS)</option>
                    <option value="MOBILE_ICU">Mobile ICU</option>
                    <option value="PATIENT_TRANSPORT">Patient Transport</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver Phone *</label>
                  <input
                    type="tel"
                    required
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Station / Base Location</label>
                <input
                  type="text"
                  value={vehicleForm.currentLocation}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, currentLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Onboard Equipment (comma separated)
                </label>
                <textarea
                  rows={2}
                  value={vehicleForm.equipmentText}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, equipmentText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
                >
                  {actionLoading ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Emergency Dispatch */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Radio className="w-6 h-6 text-red-600 animate-pulse" />
                <h3 className="text-lg font-bold text-gray-900">Initiate Emergency Dispatch</h3>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Assign Ambulance (Optional / Auto-assign)
                </label>
                <select
                  value={dispatchForm.ambulanceId}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, ambulanceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">Auto-assign best available ambulance</option>
                  {ambulances
                    .filter((a) => a.status === 'AVAILABLE')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.vehicleNumber} ({a.ambulanceType} - {a.driverName})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Caller Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / Bystander"
                    value={dispatchForm.callerName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, callerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Caller Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={dispatchForm.callerPhone}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, callerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pickup Location *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, landmark, intersection..."
                  value={dispatchForm.pickupLocation}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, pickupLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Destination Facility</label>
                <input
                  type="text"
                  value={dispatchForm.destinationLocation}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, destinationLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Emergency Priority</label>
                  <select
                    value={dispatchForm.priority}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white font-bold"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Threat)</option>
                    <option value="HIGH">HIGH (Urgent)</option>
                    <option value="MEDIUM">MEDIUM (Semi-Urgent)</option>
                    <option value="LOW">LOW (Non-Urgent Transfer)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Known Patient (Optional)
                  </label>
                  <select
                    value={dispatchForm.patientId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">Unknown / Walk-in / External</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.uhid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Emergency Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Chest pain, difficulty breathing, vehicle rollover accident..."
                  value={dispatchForm.emergencyDescription}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, emergencyDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
                >
                  {actionLoading ? 'Dispatching...' : 'Dispatch Rescue Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Telemetry & Status */}
      {isStatusModalOpen && selectedAmbulance && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Vehicle Telemetry & Status</h3>
                <p className="text-xs text-gray-500">{selectedAmbulance.vehicleNumber}</p>
              </div>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTelemetry} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Status</label>
                <select
                  value={telemetryForm.status}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="AVAILABLE">AVAILABLE (At Base)</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="EN_ROUTE">EN ROUTE (Responding)</option>
                  <option value="AT_LOCATION">AT LOCATION (On Scene)</option>
                  <option value="TRANSPORTING">TRANSPORTING (To Hospital)</option>
                  <option value="COMPLETED">COMPLETED (Mission Finished)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Out of Service)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Location Description</label>
                <input
                  type="text"
                  value={telemetryForm.currentLocation}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, currentLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 uppercase">
                  <Navigation className="w-4 h-4 text-red-500" />
                  <span>Simulate Live GPS Telemetry</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={telemetryForm.latitude}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, latitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={telemetryForm.longitude}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, longitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Speed (km/h)</label>
                    <input
                      type="number"
                      value={telemetryForm.speed}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, speed: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Heading (deg)</label>
                    <input
                      type="number"
                      value={telemetryForm.heading}
                      onChange={(e) => setTelemetryForm({ ...telemetryForm, heading: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Dispatch Progression */}
      {isDispatchProgressModalOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Update Dispatch Progress</h3>
                <p className="text-xs text-gray-500">{selectedDispatch.dispatchNumber}</p>
              </div>
              <button onClick={() => setIsDispatchProgressModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDispatchProgress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Next Operational Stage</label>
                <select
                  value={dispatchProgressForm.status}
                  onChange={(e) => setDispatchProgressForm({ ...dispatchProgressForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="EN_ROUTE">EN ROUTE (Heading to scene)</option>
                  <option value="AT_LOCATION">AT LOCATION (On Scene with Patient)</option>
                  <option value="TRANSPORTING">TRANSPORTING (Returning to Hospital)</option>
                  <option value="COMPLETED">COMPLETED (Patient Handed over to ER)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Paramedic / EMT Notes</label>
                <textarea
                  rows={3}
                  placeholder="Patient vitals on scene, interventions administered (IV, Oxygen, CPR, Defib)..."
                  value={dispatchProgressForm.paramedicNotes}
                  onChange={(e) => setDispatchProgressForm({ ...dispatchProgressForm, paramedicNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchProgressModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
                >
                  {actionLoading ? 'Updating...' : 'Update Dispatch Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

