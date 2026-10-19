import React from 'react';
import {
  Stethoscope, Users, Calendar, Clock, Bed, TestTube, Pill, CreditCard,
  Siren, Droplets, Video, BarChart3, Activity, Package, ShieldAlert, Bot, FileText
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    { title: 'Doctor Management', desc: 'Profiles, schedules, availability calendars, and performance analytics.', icon: Stethoscope },
    { title: 'Patient Management', desc: 'Centralized medical profiles, timelines, and unified EMR history.', icon: Users },
    { title: 'Appointments & Scheduling', desc: 'Online slot booking, rescheduling, status tracking, and automated reminders.', icon: Calendar },
    { title: 'OPD Queue Management', desc: 'Patient registration, token generation, live queue displays, and consultation.', icon: Clock },
    { title: 'IPD & Bed Allocation', desc: 'Admissions, ward/bed transfers, nursing logs, ICU monitoring, and discharge.', icon: Bed },
    { title: 'Laboratory (LIS)', desc: 'Test ordering, sample collection tracking, automated lab results, and reports.', icon: TestTube },
    { title: 'Radiology (RIS)', desc: 'DICOM imaging orders, scan status tracking, and radiologist report verification.', icon: Activity },
    { title: 'Pharmacy & Inventory', desc: 'Prescription processing, batch expiry tracking, supplier POs, and POS billing.', icon: Pill },
    { title: 'Billing & Invoicing', desc: 'Invoices, partial payments, refund processing, cashier logs, and insurance.', icon: CreditCard },
    { title: 'Emergency Care & Triage', desc: 'Emergency registration, red-flag triage, ambulance dispatch, and ICU reserve.', icon: Siren },
    { title: 'Blood Bank Management', desc: 'Blood donor logs, cross-matching, unit inventory, and issue tracking.', icon: Droplets },
    { title: 'Telemedicine', desc: 'HD video consultations, digital prescription sharing, and virtual follow-ups.', icon: Video },
    { title: 'Real-time Analytics', desc: 'Hospital operational dashboards, bed occupancy trends, and revenue metrics.', icon: BarChart3 },
    { title: 'Hospital Inventory', desc: 'Stock requisitions, re-order alerts, vendor management, and audit tracking.', icon: Package },
    { title: 'Insurance & Claims', desc: 'Third-party administrator (TPA) tracking, pre-auth, and claim settlements.', icon: FileText },
    { title: 'Security Audit Logs', desc: 'HIPAA/GDPR compliance logging, role-based access, and system event audits.', icon: ShieldAlert },
    { title: 'AI Clinical Assistant', desc: 'Automated patient summaries, clinical draft notes, and lab report explanations.', icon: Bot },
  ];

  return (
    <section id="features" className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Comprehensive Suite
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything your healthcare organization needs.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Designed to digitize and automate every clinical, administrative, and diagnostic workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/40 transition hover:bg-slate-900/80 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition">{feat.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
