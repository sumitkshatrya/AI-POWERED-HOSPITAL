import React, { useState } from 'react';
import { Stethoscope, UserCheck, Users, Pill, TestTube, CreditCard, Building2, User, CheckCircle2 } from 'lucide-react';

export const RolesSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState(0);

  const roles = [
    {
      name: 'Chief Doctor',
      icon: Stethoscope,
      capabilities: [
        'OPD Consultation queue & token calling',
        'ICD-10 e-prescriptions & clinical notes',
        'EMR medical history & allergy flags',
        'Pathology & Radiology test ordering',
        'Telemedicine video consultations',
      ],
    },
    {
      name: 'Head Nurse',
      icon: UserCheck,
      capabilities: [
        'Vitals recording & pre-consultation triage',
        'Inpatient ward bed transfer & nursing logs',
        'Medication administration record (MAR)',
        'ICU critical care flowsheets',
      ],
    },
    {
      name: 'Front Desk Receptionist',
      icon: Users,
      capabilities: [
        'Patient registration & UHID generation',
        'Doctor appointment scheduling & token printing',
        'Wall display queue management',
        'Visitor pass issue & desk check-in',
      ],
    },
    {
      name: 'Pharmacist',
      icon: Pill,
      capabilities: [
        'Doctor e-prescription verification',
        'POS medication billing & receipt generation',
        'Batch inventory, expiry alerts & supplier POs',
        'Narcotics & controlled drug logs',
      ],
    },
    {
      name: 'Lab Technician / Pathologist',
      icon: TestTube,
      capabilities: [
        'Sample collection barcode tracking',
        'Analyzer integration & LIS test entry',
        'Pathologist report signature & PDF generation',
        'Critical panic value alerts to clinicians',
      ],
    },
    {
      name: 'Billing Accountant',
      icon: CreditCard,
      capabilities: [
        'OPD, IPD, & Pharmacy invoice consolidation',
        'Insurance pre-authorization & TPA claims',
        'Daily cashier collection & audit reports',
        'Refunds, discounts & payment gateway logs',
      ],
    },
    {
      name: 'Hospital Administrator',
      icon: Building2,
      capabilities: [
        'Multi-branch hospital configuration',
        'Department staff provisioning & role permissions',
        'Real-time bed occupancy & revenue dashboard',
        'HIPAA / GDPR audit log inspection',
      ],
    },
    {
      name: 'Patient',
      icon: User,
      capabilities: [
        'Doctor search & online appointment booking',
        'Digital access to lab reports & prescriptions',
        'Medical timeline & past consultation history',
        'Online bill payment & receipt downloads',
      ],
    },
  ];

  const current = roles[selectedRole];

  return (
    <section id="roles" className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Role-Based Workflows
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for every healthcare role.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Tailored dashboard permissions and purpose-built screens for every member of your medical and operational staff.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
            {roles.map((r, idx) => {
              const Icon = r.icon;
              const isActive = selectedRole === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedRole(idx)}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">{r.name}</span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                {React.createElement(current.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{current.name}</h3>
                <p className="text-xs text-blue-400 font-medium">Core Capabilities & Module Access</p>
              </div>
            </div>

            <div className="space-y-3">
              {current.capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
