import React, { useState } from 'react';
import { Building2, Stethoscope, UserCheck, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlatformSection: React.FC = () => {
  type PlatformTab = 'hospital' | 'doctors' | 'patients' | 'operations';
  const [activeTab, setActiveTab] = useState<PlatformTab>('hospital');
  const navigate = useNavigate();

  const tabData = {
    hospital: {
      title: 'Hospital & Branch Administration',
      subtitle: 'Manage departments, staff, beds, billing, and multi-tenant operations.',
      highlights: [
        'Centralized multi-branch hospital setup & department hierarchy',
        'Real-time bed management, ward transfer & discharge tracking',
        'Staff management with granular role-based access permissions',
        'Comprehensive financial revenue analytics & cashier audit logs',
      ],
      metrics: [
        { label: 'Active Branches', value: '4 Managed' },
        { label: 'Bed Utilization', value: '94% Occupied' },
        { label: 'Billing Invoices', value: '$48,250 Today' },
      ],
    },
    doctors: {
      title: 'Doctor Clinical Workspace',
      subtitle: 'Manage appointments, consultations, prescriptions, and patient EMR.',
      highlights: [
        'Interactive OPD queue management with live token calling',
        'ICD-10 e-prescriptions & template-driven clinical notes',
        'Instant digital access to past medical history & lab investigations',
        'Integrated telemedicine video consultations & remote follow-ups',
      ],
      metrics: [
        { label: 'Consultations', value: '38 Completed' },
        { label: 'Prescriptions', value: '38 Issued' },
        { label: 'Avg Time / Patient', value: '9.5 Minutes' },
      ],
    },
    patients: {
      title: 'Patient Health Portal',
      subtitle: 'Book appointments, access records, reports, prescriptions, and bills.',
      highlights: [
        'Online doctor discovery & hassle-free slot booking',
        'Instant mobile access to lab reports & diagnostic imaging',
        'Digital medical timeline & e-prescription downloads',
        'Transparent billing breakdowns & online payment support',
      ],
      metrics: [
        { label: 'Patient Portal Users', value: '14,200 Registered' },
        { label: 'Online Bookings', value: '68% Direct' },
        { label: 'Patient Satisfaction', value: '98% Rating' },
      ],
    },
    operations: {
      title: 'Core Operations & Diagnostics',
      subtitle: 'Manage pharmacy, laboratory, emergency, IPD, and inventory.',
      highlights: [
        'Pathology LIS & Radiology RIS test order workflow',
        'Pharmacy POS inventory with expiry batch tracking & alerts',
        'Emergency triage queue, ambulance dispatch & ICU bed reserve',
        'Automated insurance claim documentation & submission',
      ],
      metrics: [
        { label: 'Lab Orders Today', value: '142 Processed' },
        { label: 'Pharmacy Stock', value: '99.2% Available' },
        { label: 'Emergency Response', value: '< 4 Min Triage' },
      ],
    },
  };

  const current = tabData[activeTab];
  const tabs: { id: PlatformTab; label: string; icon: typeof Building2 }[] = [
    { id: 'hospital', label: 'Hospital Admin', icon: Building2 },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: UserCheck },
    { id: 'operations', label: 'Operations', icon: Activity },
  ];

  return (
    <section id="platform" className="py-20 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Unified Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            One platform. Every healthcare workflow.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Tailored interfaces designed explicitly for hospital management, clinicians, patients, and operational desks.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-bold text-white">{current.title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{current.subtitle}</p>

            <div className="space-y-3 pt-2">
              {current.highlights.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                Explore {activeTab.toUpperCase()} Portal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live System Highlights</div>
            <div className="space-y-3">
              {current.metrics.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">{m.label}</span>
                  <span className="font-bold text-blue-400">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
