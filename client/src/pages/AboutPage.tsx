import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  HeartPulse,
  Brain,
  ShieldCheck,
  Building2,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Stethoscope,
  Clock,
  Database,
  BarChart3,
  Server,
} from 'lucide-react';
import { brandConfig } from '../config/brand';
import { PublicLayout } from '../layouts/PublicLayout';

export const AboutPage: React.FC = () => {
  const values = [
    {
      title: 'Human-Centered Clinical AI',
      desc: 'Our AI never replaces physicians; it accelerates them. By removing administrative EHR burdens, doctors regain quality time at patient bedsides.',
      icon: Brain,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Zero Data Silos',
      desc: 'Unifying OPD, IPD, Diagnostics (LIS/RIS), Pharmacy, and Billing into a single live relational ecosystem with instant cross-department data sharing.',
      icon: Database,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Patient Safety & Precision',
      desc: 'Automated drug contraindication warnings, duplicate prescription alerts, and predictive deterioration flags safeguarding every clinical workflow.',
      icon: HeartPulse,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Zero-Trust HIPAA Security',
      desc: 'End-to-end encryption at rest and in transit, strict multi-tenant boundary isolation, role-based access control, and complete immutable audit logging.',
      icon: Lock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  const leadershipTeam = [
    {
      name: 'Dr. Siddharth Kshatriya, MD, FACS',
      role: 'Chief Medical Officer & Founder',
      credentials: 'Johns Hopkins Medical Fellow | 20+ Yrs Clinical Surgery',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      bio: 'Leading surgeon and healthcare visionary dedicated to eliminating hospital administrative burnout through intelligent software automation.',
    },
    {
      name: 'Dr. Elena Rostova, PhD',
      role: 'Head of Clinical AI Research',
      credentials: 'Stanford AI Lab | Health Informatics Specialist',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      bio: 'Pioneering neural diagnostic assistance models that reduce critical trauma triage response latency by over 75%.',
    },
    {
      name: 'Marcus Vance',
      role: 'VP of Hospital Systems & Security',
      credentials: 'MIT Computer Science | Ex-Epic / Cerner Architect',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      bio: 'Expert in high-availability hospital cloud infrastructure, HIPAA compliance frameworks, and real-time medical telemetry pipelines.',
    },
    {
      name: 'Sarah Chen, MHA',
      role: 'Director of Hospital Operations',
      credentials: 'Harvard Health Management | Former Metro Hospital Admin',
      image: 'https://images.unsplash.com/photo-1594824813590-48a562ef6d87?auto=format&fit=crop&q=80&w=400',
      bio: 'Specialized in multi-branch outpatient queuing optimization, bed capacity forecasting, and rapid insurance pre-authorizations.',
    },
  ];

  const milestones = [
    { year: '2023', title: 'Platform Inception', desc: 'Engineered the core multi-tenant hospital EMR architecture with real-time OPD token queuing.' },
    { year: '2024', title: 'Clinical AI Launch', desc: 'Introduced AI Assistant Copilot, automated radiology analysis support, and instant prescription generation.' },
    { year: '2025', title: 'Enterprise Expansion', desc: 'Scaled to 140+ connected hospitals, achieving 99.4% AI triage accuracy across 2.5 million patient visits.' },
    { year: '2026', title: 'Next-Gen Ecosystem', desc: 'Integrated automated ambulance fleet dispatch, smart ICU telemetry tracking, and instant insurance claims processing.' },
  ];

  return (
    <PublicLayout>
      <div className="space-y-24 py-12 sm:py-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About {brandConfig.name}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Transforming hospitals with{' '}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                intelligent clinical technology.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {brandConfig.description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/30"
              >
                <span>Deploy at Your Hospital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition"
              >
                <span>Schedule an Enterprise Demo</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Impact Numbers Banner */}
        <section className="bg-slate-900 border-y border-slate-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {brandConfig.metrics.hospitalsConnected}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Hospitals & Health Networks</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">
                  {brandConfig.metrics.patientsServed}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Patient Encounters Managed</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                  {brandConfig.metrics.aiAccuracy}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">AI Clinical Decision Accuracy</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400 tracking-tight">
                  {brandConfig.metrics.uptimeSla}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">High-Availability Uptime SLA</p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Our Principles</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built by clinicians, for clinicians.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Healthcare systems shouldn't fight with clunky legacy software. Every component of {brandConfig.name} is optimized for speed, precision, and patient empathy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition space-y-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${v.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{v.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Architecture & AI Engine Highlight */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800 px-3 py-1 rounded-full">
                  Full Hospital Lifecycle
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  One Unified Healthcare Operating System
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Traditional hospitals use 8 to 12 disconnected software vendors — separate systems for appointment booking, OPD tokens, EHR records, ICU monitors, lab testing, pharmacy inventory, and billing invoices.
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {brandConfig.name} unifies every point of care into a single synchronized platform, cutting patient wait times by 60% and eliminating billing leakage.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Real-time OPD token queue walls synced with clinician workspaces</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Automated Bed & Ward telemetry with immediate ICU transfer alerts</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Instant insurance pre-authorization and integrated invoice generation</span>
                  </div>
                </div>
              </div>

              {/* Milestones / Timeline */}
              <div className="space-y-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Platform Evolution</span>
                </h3>
                <div className="space-y-4">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-900 last:border-b-0 last:pb-0">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono font-bold shrink-0">
                        {m.year}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Executive & Clinical Board
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Guided by experienced surgeons, clinical informatics researchers, and enterprise healthcare architects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadershipTeam.map((member, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden hover:border-slate-700 transition flex flex-col"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-52 object-cover object-top"
                />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{member.name}</h3>
                    <p className="text-xs font-semibold text-blue-400">{member.role}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{member.credentials}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications and Compliance */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Global Regulatory Standards & Trust
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                {brandConfig.name} is audited continuously against international data security and healthcare privacy standards.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {brandConfig.certifications.map((cert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to modernize your healthcare operations?
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Join leading hospital networks running their administrative, clinical, and diagnostic operations on {brandConfig.name}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition shadow-lg"
              >
                Start Free Hospital Onboarding
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3.5 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 text-white border border-blue-400/40 font-semibold text-sm transition"
              >
                Contact Healthcare Sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AboutPage;

