import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Headphones,
  Server,
  FileCheck2,
} from 'lucide-react';
import { brandConfig } from '../config/brand';
import { PublicLayout } from '../layouts/PublicLayout';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    hospitalSize: '50-200 beds',
    role: 'Hospital Admin',
    inquiryType: 'Enterprise Demo',
    message: '',
    consent: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setErrorMessage('Please acknowledge the HIPAA data handling consent before submitting.');
      return;
    }
    setErrorMessage(null);
    setSubmitting(true);

    // Simulate sending dispatch to sales & customer liaison desk
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const supportChannels = [
    {
      title: 'Enterprise Hospital Sales',
      phone: brandConfig.phone,
      email: brandConfig.salesEmail,
      badge: 'Procurement',
      desc: 'Custom multi-branch tenant deployment, procurement quotes, and live guided demos.',
      icon: Building2,
    },
    {
      title: '24/7 Clinical & IT Support',
      phone: '+1 (800) 555-6334 (Ext. 2)',
      email: brandConfig.supportEmail,
      badge: '24/7 Active',
      desc: 'Technical assistance for hospital IT, LIS/RIS analyzer integration, and EMR troubleshooting.',
      icon: Headphones,
    },
    {
      title: 'Privacy & HIPAA Compliance',
      phone: '+1 (800) 555-6334 (Ext. 3)',
      email: brandConfig.complianceEmail,
      badge: 'Security Desk',
      desc: 'Business Associate Agreements (BAA), SOC 2 compliance certificates, and audit logs.',
      icon: ShieldCheck,
    },
    {
      title: 'Global Headquarters',
      phone: `${brandConfig.headquarters.city}, ${brandConfig.headquarters.state}`,
      email: brandConfig.headquarters.addressLine1,
      badge: 'Main Campus',
      desc: `${brandConfig.headquarters.suite}, ${brandConfig.headquarters.country}`,
      icon: MapPin,
    },
  ];

  return (
    <PublicLayout>
      <div className="space-y-16 py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Emergency Notice */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connect with {brandConfig.name}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            We are here to support your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              clinical operations.
            </span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Whether you are modernizing a single facility or deploying a 50-branch regional hospital network, our enterprise healthcare team is ready to assist.
          </p>

          {/* Emergency Hotline Notice */}
          <div className="mt-6 bg-red-950/40 border border-red-900/80 rounded-2xl p-4 text-left flex items-start gap-3.5 text-xs sm:text-sm shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-200">
              <span className="font-bold text-red-300 block">
                Urgent Patient or Clinical Trauma Dispatch:
              </span>
              <p className="text-slate-300 leading-relaxed">
                For urgent life-threatening patient emergencies, call your local emergency services (<strong>911</strong>) or our automated ambulance dispatch line immediately at{' '}
                <a href={`tel:${brandConfig.emergencyHotline.replace(/[^0-9+]/g, '')}`} className="underline font-bold text-red-300">
                  {brandConfig.emergencyHotline}
                </a>
                . This inquiry form is for administrative and enterprise platform inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Support Channels Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportChannels.map((channel, i) => {
            const Icon = channel.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {channel.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{channel.title}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-1">{channel.phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{channel.email}</p>
                </div>
                <p className="text-xs text-slate-400 pt-3 border-t border-slate-800/80 leading-relaxed">
                  {channel.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contact Form & Office Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Inquiry Form */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl">
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Send an Enterprise Inquiry
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Our healthcare deployment specialists typically respond within 2 to 4 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Inquiry Successfully Transmitted</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.firstName} {formData.lastName}</strong>. We have logged your request for <strong>{formData.organization}</strong>. A dedicated healthcare technical lead has been assigned to your case and will email you at <strong>{formData.email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      organization: '',
                      hospitalSize: '50-200 beds',
                      role: 'Hospital Admin',
                      inquiryType: 'Enterprise Demo',
                      message: '',
                      consent: false,
                    });
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@metrohealth.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Direct Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Hospital / Facility Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Metro Memorial Hospital"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Facility Bed Capacity</label>
                    <select
                      value={formData.hospitalSize}
                      onChange={(e) => setFormData({ ...formData, hospitalSize: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1-50 beds">1 – 50 Beds (Clinic / Community)</option>
                      <option value="50-200 beds">50 – 200 Beds (Mid-Size Hospital)</option>
                      <option value="200-500 beds">200 – 500 Beds (Tertiary Care Center)</option>
                      <option value="500+ beds">500+ Beds (Multi-Branch Health Network)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Your Clinical / Admin Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hospital Admin">Hospital Administrator / CEO</option>
                      <option value="Medical Director">Medical Director / CMO</option>
                      <option value="IT Director">Chief Information Officer (CIO / IT)</option>
                      <option value="Doctor">Attending Physician / Specialist</option>
                      <option value="Pharmacy / Lab Head">Pharmacy / Laboratory Director</option>
                      <option value="Other">Other Healthcare Professional</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nature of Inquiry</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Enterprise Demo">Schedule Enterprise Product Walkthrough</option>
                      <option value="Pricing Quote">Request Multi-Branch Pricing Proposal</option>
                      <option value="Technical Support">Technical & Analyzer Support</option>
                      <option value="Compliance">HIPAA & Security Validation</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Project Requirements or Scope *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your hospital system, current EMR pain points, or specific branch locations..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed">
                    I acknowledge that {brandConfig.name} will handle my corporate contact details in compliance with HIPAA BAA and SOC 2 security protocols.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Transmitting to Healthcare Team...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Department Directory & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>Department Direct Directory</span>
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                {brandConfig.departments.map((dept, idx) => (
                  <div key={idx} className="py-3.5 first:pt-1 last:pb-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{dept.name}</span>
                      <span className="font-mono text-blue-400 font-semibold">{dept.phone}</span>
                    </div>
                    <p className="text-slate-400">{dept.description}</p>
                    <p className="text-slate-500 text-[11px] font-mono">{dept.hours}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Enterprise SLA & Uptime Guarantee</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hospital emergency departments cannot afford downtime. All {brandConfig.name} enterprise tiers come with guaranteed 99.99% multi-region failover uptime SLAs and 15-minute critical incident response times.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-blue-400">
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span>Signed Business Associate Agreement (BAA) Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ContactPage;

