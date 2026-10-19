import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Bed,
  Siren,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TestTube,
  Pill,
  Activity,
  Droplets,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';

export const HospitalOperationsSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'wards' | 'pharmacy' | 'diagnostics'>('overview');

  const keyMetrics = [
    { label: 'Registered Patients', value: '1,420 Active', icon: Users, color: 'text-blue-400', badge: '+18% MoM' },
    { label: 'Today Appointments', value: '128 Scheduled', icon: Calendar, color: 'text-teal-400', badge: '12 Doctors' },
    { label: 'IPD Bed Occupancy', value: '94% (42/45 Beds)', icon: Bed, color: 'text-amber-400', badge: '3 ICU Free' },
    { label: 'Emergency Triage', value: '2 Active Trauma', icon: Siren, color: 'text-red-400', badge: 'High Priority' },
    { label: 'Daily Collection', value: '$48,250', icon: CreditCard, color: 'text-emerald-400', badge: '98% Cleared' },
    { label: 'Pending Insurance', value: '14 Claims', icon: AlertTriangle, color: 'text-purple-400', badge: 'Under Review' },
  ];

  const wardOccupancies = [
    { name: 'Cardiology Ward (C-101)', total: 10, occupied: 9, percentage: 90, status: 'Near Capacity', color: 'bg-blue-500' },
    { name: 'Intensive Care Unit (ICU)', total: 8, occupied: 8, percentage: 100, status: 'Full (Critical)', color: 'bg-red-500' },
    { name: 'General Medical Ward A', total: 15, occupied: 12, percentage: 80, status: 'Normal Flow', color: 'bg-emerald-500' },
    { name: 'Surgical Recovery Unit', total: 12, occupied: 11, percentage: 92, status: 'Fast Turnover', color: 'bg-amber-500' },
  ];

  const pharmacyAlerts = [
    { name: 'Amoxicillin 500mg (Antibiotic)', stock: '1,450 Units', status: 'Optimal', tagColor: 'text-emerald-400 bg-emerald-500/10' },
    { name: 'Insulin Glargine 100IU/ml', stock: '14 Pens', status: 'Reorder Warning', tagColor: 'text-amber-400 bg-amber-500/10' },
    { name: 'Paracetamol 650mg (Analgesic)', stock: '3,200 Tablets', status: 'Optimal', tagColor: 'text-emerald-400 bg-emerald-500/10' },
    { name: 'Enoxaparin 40mg Injection', stock: '8 Vials', status: 'Critically Low', tagColor: 'text-red-400 bg-red-500/10' },
    { name: 'Cefixime 200mg Capsules', stock: '410 Units', status: 'Normal', tagColor: 'text-blue-400 bg-blue-500/10' },
  ];

  const diagnosticQueues = [
    { test: 'Complete Blood Count (CBC)', dept: 'Hematology LIS', turnaround: '25 Mins', status: 'Running Automated Analyzer' },
    { test: 'Chest CT Scan (High-Resolution)', dept: 'Radiology RIS', turnaround: '40 Mins', status: 'Scan Completed • Radiologist Verifying' },
    { test: 'Liver Function Panel (LFT)', dept: 'Biochemistry LIS', turnaround: '35 Mins', status: 'Report Drafted & Approved' },
    { test: 'Cardiac MRI with Contrast', dept: 'Radiology RIS', turnaround: '60 Mins', status: 'Scheduled for 11:30 AM' },
  ];

  return (
    <section id="operations" className="py-20 bg-slate-950 border-b border-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Hospital Operations Command Center</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Total Operational Visibility in Real-Time.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Eliminate communication breakdowns between clinical departments. Monitor bed availability, outpatient queues, pharmacy stock levels, lab diagnostics, and revenue metrics from one unified screen.
          </p>
        </div>

        {/* 6 High-Level Key Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
          {keyMetrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2 relative overflow-hidden group shadow-lg"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] font-medium leading-tight">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="text-lg font-extrabold text-white tracking-tight">{m.value}</div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-sky-400">{m.badge}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive View Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Command Overview' },
            { id: 'wards', label: 'Wards & Bed Allocations' },
            { id: 'pharmacy', label: 'Pharmacy & Stock Alerts' },
            { id: 'diagnostics', label: 'LIS & RIS Diagnostic Queues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display Area */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* View 1: Overview Grid */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: IPD Bed Utilization */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Bed className="w-4 h-4 text-blue-400" /> Bed Allocation
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">94% Occupied</span>
                </div>
                <div className="space-y-3 text-xs">
                  {wardOccupancies.slice(0, 3).map((w, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>{w.name}</span>
                        <span className="text-white font-semibold">{w.occupied}/{w.total} Beds</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Pharmacy Inventory Status */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-400" /> Pharmacy Inventory
                  </h4>
                  <span className="text-[11px] text-amber-400 font-mono">1 Auto-Reorder</span>
                </div>
                <div className="space-y-2 text-xs">
                  {pharmacyAlerts.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-300 truncate pr-2">{p.name.split('(')[0]}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 ${p.tagColor}`}>
                        {p.stock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Diagnostic Throughput */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-purple-400" /> Lab & Radiology
                  </h4>
                  <span className="text-[11px] text-blue-400 font-mono">24/28 Ready</span>
                </div>
                <div className="space-y-2 text-xs">
                  {diagnosticQueues.slice(0, 3).map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-200">
                        <span className="truncate pr-2">{d.test}</span>
                        <span className="text-blue-400 font-mono shrink-0">{d.turnaround}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{d.status}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* View 2: Wards Detail */}
          {activeTab === 'wards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Full Inpatient Bed & Admission Telemetry</h3>
                <span className="text-xs text-slate-400">Total Capacity: 45 Beds across 4 Specialized Units</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wardOccupancies.map((w, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{w.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {w.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Occupied Beds: <strong className="text-white">{w.occupied}</strong> / {w.total}</span>
                      <span>Rate: <strong className="text-white">{w.percentage}%</strong></span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View 3: Pharmacy Detail */}
          {activeTab === 'pharmacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Central Dispensary & Critical Drug Formulary</h3>
                <span className="text-xs text-slate-400">Integrated Barcode POS & Low-Stock Alerts</span>
              </div>
              <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {pharmacyAlerts.map((p, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/60 transition">
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Automated batch expiration tracking active</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{p.stock}</div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-0.5 ${p.tagColor}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View 4: Diagnostics Detail */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">LIS Laboratory & RIS Radiology Integrated Queue</h3>
                <span className="text-xs text-slate-400">DICOM / HL7 Interoperability Enabled</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosticQueues.map((d, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{d.test}</span>
                      <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {d.turnaround}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                        {d.dept}
                      </span>
                      <span>{d.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Callout Banner */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Multi-branch clinical sync active across all operational nodes with 256-bit HIPAA compliance.</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 shrink-0"
            >
              <span>Access Clinical Command Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HospitalOperationsSection;

