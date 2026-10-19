import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  TestTube,
  Bed,
  Pill,
  CreditCard,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';

export const JourneySection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState(0);

  const journeySteps = [
    {
      stepNumber: '01',
      title: 'Digital Patient Registration',
      shortTitle: 'Registration',
      category: 'Front Desk & Reception',
      icon: UserCheck,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description:
        'Instant digital onboarding creating a permanent Unique Healthcare ID (UHID). Medical records, verified contact data, emergency contacts, and insurance cards are securely indexed.',
      role: 'Receptionist / Front Desk',
      timeSaved: '12 Minutes Saved',
      keyTech: 'Multi-Tenant UHID Indexing • Encrypted Demographics',
      highlights: [
        'Automated UHID generation preventing duplicate charts',
        'National ID & Insurance policy card document scanner',
        'Direct patient portal activation with SMS login details',
      ],
    },
    {
      stepNumber: '02',
      title: 'Doctor Matching & Smart Booking',
      shortTitle: 'Appointments',
      category: 'Scheduling & Triage',
      icon: Calendar,
      color: 'from-indigo-600 to-sky-600',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      description:
        'Patients and call centers book appointments by symptoms, doctor availability, department, or procedure. Real-time calendar syncing prevents double-booking.',
      role: 'Patient / Receptionist',
      timeSaved: '8 Minutes Saved',
      keyTech: 'Dynamic Time-Slot Allocator • Automated SMS/Email Reminders',
      highlights: [
        'Multi-department directory with doctor fee transparency',
        'Telemedicine video link generation for remote consultations',
        'Automatic cancellation detection with instant waitlist refill',
      ],
    },
    {
      stepNumber: '03',
      title: 'Live OPD Queue & Wall Token Display',
      shortTitle: 'OPD Queue',
      category: 'Outpatient Triage',
      icon: Clock,
      color: 'from-sky-600 to-teal-600',
      badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      description:
        'Eliminate waiting room chaos with automated token numbering, real-time audio announcements, and dedicated full-screen TV wall displays in patient waiting areas.',
      role: 'Nursing Staff / Triage Station',
      timeSaved: '25 Minutes Saved in Lounge',
      keyTech: 'Socket.IO Real-Time Engine • Unattended Wall Display Mode',
      highlights: [
        'Full-screen token display screen requiring zero manual refresh',
        'Multi-doctor simultaneous calling with priority triage override',
        'Live queue status tracker viewable on patient smartphones',
      ],
    },
    {
      stepNumber: '04',
      title: 'AI-Augmented Clinical Consultation',
      shortTitle: 'Diagnosis & EHR',
      category: 'Physician Workspace',
      icon: Stethoscope,
      color: 'from-teal-600 to-emerald-600',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description:
        'Doctors examine patients within a distraction-free clinical EHR dashboard. AI assists by summarizing historical medical events, flagging drug allergies, and recommending ICD-10 codes.',
      role: 'Doctor / Medical Specialist',
      timeSaved: '15 Minutes Per Encounter',
      keyTech: 'Gemini AI Clinical Summarizer • Longitudinal EMR Timeline',
      highlights: [
        'Structured SOAP clinical notes (Subjective, Objective, Assessment, Plan)',
        'One-click access to past vitals, imaging scans, and lab histories',
        'Speech-to-text dictation and automatic prescription formulation',
      ],
    },
    {
      stepNumber: '05',
      title: 'Certified Digital e-Prescriptions',
      shortTitle: 'e-Prescription',
      category: 'Clinical Safety',
      icon: FileText,
      color: 'from-emerald-600 to-amber-600',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description:
        'Legible, digitally signed prescriptions routed directly to the in-house hospital pharmacy. Built-in drug interaction safety checks safeguard patient wellness.',
      role: 'Consulting Physician',
      timeSaved: '100% Prescription Legibility',
      keyTech: 'Rx Drug Interaction Engine • Digital Signature Validation',
      highlights: [
        'Automated dosage, duration, frequency, and meal instruction templates',
        'Instant contraindication alerts for known patient allergies',
        'QR code printed on prescription for quick pharmacy dispensing',
      ],
    },
    {
      stepNumber: '06',
      title: 'Diagnostic LIS Labs & RIS Radiology',
      shortTitle: 'Diagnostics',
      category: 'Laboratory & Imaging',
      icon: TestTube,
      color: 'from-amber-600 to-purple-600',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description:
        'Lab orders and imaging requests appear on technician workstations instantaneously. Direct analyzer syncing and DICOM viewing reduce turnaround times from hours to minutes.',
      role: 'Lab Technician / Radiologist',
      timeSaved: '45 Minutes Faster Results',
      keyTech: 'Barcode Specimen Tracking • DICOM PACS Integration',
      highlights: [
        'Specimen barcode label generation upon sample collection',
        'Critical value automatic SMS alerting to attending physicians',
        'Verified PDF lab reports attach automatically to patient EHR',
      ],
    },
    {
      stepNumber: '07',
      title: 'Inpatient IPD & Bed Management',
      shortTitle: 'Inpatient (IPD)',
      category: 'Inpatient Care',
      icon: Bed,
      color: 'from-purple-600 to-rose-600',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description:
        'Seamless transition from Emergency/OPD to Ward or ICU. Real-time visual bed layout, doctor rounds logging, nurse shift handovers, and Medication Administration Records (MAR).',
      role: 'Ward Doctor / Inpatient Nurse',
      timeSaved: '30 Minutes per Admission',
      keyTech: 'Interactive Ward Bed Map • Digital MAR Schedule Ticker',
      highlights: [
        'Visual floor plan showing available, occupied, and cleaning beds',
        'Medication administration schedule with missed dose alerts',
        'Electronic nursing notes and inter-shift physician handoffs',
      ],
    },
    {
      stepNumber: '08',
      title: 'Hospital Pharmacy POS & Inventory',
      shortTitle: 'Pharmacy',
      category: 'Medication Fulfillment',
      icon: Pill,
      color: 'from-rose-600 to-pink-600',
      badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      description:
        'Prescriptions arrive pre-filled at the pharmacy counter. Barcode verification prevents dispensing errors while real-time stock levels deplete automatically.',
      role: 'Hospital Pharmacist',
      timeSaved: '5 Minutes per Order Dispensed',
      keyTech: 'Barcode POS Dispensary • Automated Batch & Expiry Tracker',
      highlights: [
        'One-click fulfillment directly from doctor e-Prescription',
        'Automated reorder triggers for life-saving critical medicines',
        'Unified itemized checkout linked straight to central billing',
      ],
    },
    {
      stepNumber: '09',
      title: 'Unified Billing, Insurance & Discharge',
      shortTitle: 'Billing & Discharge',
      category: 'Financial & Discharge',
      icon: CreditCard,
      color: 'from-pink-600 to-blue-600',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description:
        'All bed charges, surgeries, pharmacy dispenses, and lab tests consolidate into a single itemized invoice. Direct TPA insurance submission and formal digital discharge summaries.',
      role: 'Accountant / Cashier / Attending Physician',
      timeSaved: '40 Minutes Faster Discharge',
      keyTech: 'Insurance TPA Gateway • Digital Discharge Summary Generator',
      highlights: [
        'Transparent itemized invoices with Cash, Card, UPI, and Insurance options',
        'Single-click download of signed Discharge Summary PDF document',
        'Automated follow-up appointment booking and medication schedule printout',
      ],
    },
  ];

  const current = journeySteps[selectedStep];
  const CurrentIcon = current.icon;

  return (
    <section id="journey" className="py-20 bg-slate-950 border-b border-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>End-to-End Care Continuum</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Complete Healthcare Journey, Unified.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            From the minute a patient schedules an appointment to their post-discharge follow-up, {brandConfig.name} connects every clinical interaction into one seamless digital workflow.
          </p>
        </div>

        {/* Horizontal Pipeline Steps Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          {journeySteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedStep(idx)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{step.stepNumber}. {step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Showcase Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Step Details Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${current.badgeColor}`}>
                  Step {current.stepNumber} of 09 • {current.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {current.timeSaved}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {current.title}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {current.description}
              </p>

              {/* Key Highlights Checkmarks */}
              <div className="space-y-2.5 pt-2">
                {current.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Roles & Tech Badges */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">Primary Clinical Role:</span>
                  <span className="text-white font-medium">{current.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">Key Platform Technology:</span>
                  <span className="text-sky-400 font-medium font-mono">{current.keyTech}</span>
                </div>
              </div>
            </div>

            {/* Step Visual Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5 text-center sm:text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      <CurrentIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Stage {current.stepNumber} Operational Flow</div>
                      <div className="text-[10px] text-slate-400">MediCore Integrated Hub</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Verified
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">Standard Patient Experience</span>
                    <p className="text-slate-200 font-medium leading-snug">
                      Automated digital flow with real-time audit trails and zero manual re-entry between departments.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">Inter-Department Connectivity</span>
                    <p className="text-slate-200 font-medium leading-snug">
                      Data generated in Stage {current.stepNumber} flows immediately into subsequent stages with instant role alerts.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedStep((prev) => (prev > 0 ? prev - 1 : journeySteps.length - 1))}
                    className="text-xs text-slate-400 hover:text-white transition py-1"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={() => setSelectedStep((prev) => (prev < journeySteps.length - 1 ? prev + 1 : 0))}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition py-1 flex items-center gap-1"
                  >
                    <span>Next: Stage {journeySteps[(selectedStep + 1) % journeySteps.length].stepNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Ready to streamline your patient pipeline with {brandConfig.name}?
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <span>Start Free Clinical Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/doctors')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
              >
                <span>Explore Doctors</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default JourneySection;

