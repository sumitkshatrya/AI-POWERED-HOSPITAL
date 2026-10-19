import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, HelpCircle, ShieldCheck, ArrowRight, Sparkles, Building2, Headphones, Activity } from 'lucide-react';
import { PublicLayout } from '../layouts/PublicLayout';
import { PricingSection } from '../components/landing/PricingSection';
import { DemoModal } from '../components/landing/DemoModal';
import { brandConfig } from '../config/brand';

export const PricingPage: React.FC = () => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const navigate = useNavigate();

  const comparisonCategories = [
    {
      name: 'Clinical & EMR Management',
      features: [
        { name: 'Doctor Profiles & Specialties', clinic: 'Up to 5', hospital: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'OPD Token Queue Wall & Real-time Displays', clinic: true, hospital: true, enterprise: true },
        { name: 'Electronic Medical Records (EMR) & History', clinic: true, hospital: true, enterprise: true },
        { name: 'e-Prescriptions & Clinical Notes', clinic: true, hospital: true, enterprise: true },
        { name: 'IPD Inpatient Admission & Bed Allocation', clinic: false, hospital: true, enterprise: true },
        { name: 'ICU Telemetry & Automated Risk Alarms', clinic: false, hospital: true, enterprise: true },
        { name: 'Ambulance & Trauma Fleet Dispatch', clinic: false, hospital: true, enterprise: true },
      ],
    },
    {
      name: 'Diagnostics & Operations',
      features: [
        { name: 'Pathology Lab Management (LIS) & Barcoding', clinic: false, hospital: true, enterprise: true },
        { name: 'Radiology RIS Workflow & DICOM Viewer Link', clinic: false, hospital: true, enterprise: true },
        { name: 'Blood Bank Inventory & Cross-Matching', clinic: false, hospital: true, enterprise: true },
        { name: 'Pharmacy POS & Barcode Inventory Stock', clinic: false, hospital: true, enterprise: true },
        { name: 'Hospital Procurement & Supplier Invoices', clinic: false, hospital: true, enterprise: true },
      ],
    },
    {
      name: 'Artificial Intelligence & Insights',
      features: [
        { name: 'Clinical AI Copilot Assistant', clinic: 'Basic', hospital: 'Full Copilot', enterprise: 'Custom Model' },
        { name: 'Automated ICD-10 & Diagnosis Suggestions', clinic: true, hospital: true, enterprise: true },
        { name: 'Real-time Triage & Emergency Severity Scoring', clinic: false, hospital: true, enterprise: true },
        { name: 'Executive Hospital Analytics & Occupancy Reports', clinic: false, hospital: true, enterprise: true },
      ],
    },
    {
      name: 'Infrastructure & Security',
      features: [
        { name: 'Multi-Tenant Logical Isolation', clinic: true, hospital: true, enterprise: true },
        { name: 'Multi-Branch Hospital Networking', clinic: false, hospital: true, enterprise: true },
        { name: 'HIPAA Business Associate Agreement (BAA)', clinic: true, hospital: true, enterprise: true },
        { name: 'Immutable Audit Logging & Access Tracking', clinic: false, hospital: true, enterprise: true },
        { name: 'Uptime SLA Guarantee', clinic: '99.9%', hospital: '99.95%', enterprise: '99.99%' },
        { name: 'Dedicated Engineering & Compliance SLA', clinic: 'Email Support', hospital: 'Priority 24/7', enterprise: 'Dedicated Lead' },
      ],
    },
  ];

  return (
    <PublicLayout>
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      
      <div className="py-12 space-y-20">
        {/* Pricing Cards Section */}
        <PricingSection onOpenDemo={() => setDemoModalOpen(true)} />

        {/* Feature Comparison Table */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Compare Platform Capabilities
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A comprehensive breakdown of features included across each deployment tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-bold text-white">Capability</th>
                  <th className="py-4 px-6 text-center font-bold text-white">Clinic Essentials</th>
                  <th className="py-4 px-6 text-center font-bold text-blue-400">Hospital Pro</th>
                  <th className="py-4 px-6 text-center font-bold text-white">Enterprise Network</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {comparisonCategories.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-slate-950/60 font-semibold text-white">
                      <td colSpan={4} className="py-3 px-6 text-xs text-blue-400 uppercase tracking-wider">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feat, featIdx) => (
                      <tr key={featIdx} className="hover:bg-slate-850 transition">
                        <td className="py-3.5 px-6 font-medium text-slate-200">{feat.name}</td>
                        <td className="py-3.5 px-6 text-center">
                          {typeof feat.clinic === 'boolean' ? (
                            feat.clinic ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-xs font-semibold text-slate-300">{feat.clinic}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-center bg-blue-950/20">
                          {typeof feat.hospital === 'boolean' ? (
                            feat.hospital ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-xs font-semibold text-blue-300">{feat.hospital}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          {typeof feat.enterprise === 'boolean' ? (
                            feat.enterprise ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-xs font-semibold text-indigo-300">{feat.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Enterprise Security Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enterprise Assurance</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Need a custom on-premise or hybrid deployment?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We work directly with health ministries, tertiary hospitals, and university medical centers requiring isolated private cloud instances, custom HL7 interfaces, and local data residency compliance.
              </p>
            </div>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shrink-0 shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <span>Talk with Healthcare Solutions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PricingPage;

