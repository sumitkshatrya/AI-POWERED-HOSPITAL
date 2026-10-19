import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Heart,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Operational Status Banner */}
        <div className="mb-12 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-white font-bold">{brandConfig.name} Operational Cloud:</span>{' '}
              <span className="text-emerald-400">All 14 Clinical Nodes Operational</span> •{' '}
              <span className="text-slate-400 font-mono">Uptime SLA: {brandConfig.metrics.uptimeSla}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>2.5M+ Patients Served</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">{brandConfig.metrics.activeDoctors} Verified Clinicians</span>
          </div>
        </div>

        {/* Multi-Column Main Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          
          {/* Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-white tracking-tight">{brandConfig.name}</span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider -mt-1 uppercase">
                  {brandConfig.tagline}
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {brandConfig.description}
            </p>

            {/* Certification Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
              {brandConfig.certifications.slice(0, 3).map((cert, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{cert}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Column 1: Platform Capabilities */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Platform Systems</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {brandConfig.footerNav.platform.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-white transition flex items-center justify-between group">
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Solutions by Role */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">
              Clinical Solutions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/doctors" className="hover:text-white transition text-sky-400 font-medium">
                  Doctor Directory
                </Link>
              </li>
              {brandConfig.footerNav.solutions.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-white transition flex items-center justify-between group">
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className="hover:text-white transition text-slate-300">
                  Staff & Doctor Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Emergency Information */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">
              Connect & Support
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Emergency 24/7 Hotline</span>
                  <a href={`tel:${brandConfig.emergencyHotline}`} className="text-white font-bold hover:text-red-400 transition font-mono">
                    {brandConfig.emergencyHotline}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Toll-Free Inquiries</span>
                  <a href={`tel:${brandConfig.phone}`} className="text-slate-300 hover:text-white transition font-mono">
                    {brandConfig.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Support Desk</span>
                  <a href={`mailto:${brandConfig.supportEmail}`} className="text-slate-300 hover:text-white transition">
                    {brandConfig.supportEmail}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Global Headquarters</span>
                  <span className="text-slate-400 leading-tight block">
                    {brandConfig.headquarters.addressLine1}, {brandConfig.headquarters.city}, {brandConfig.headquarters.state} {brandConfig.headquarters.zipCode}
                  </span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Specialized Department Contacts Strip */}
        <div className="mb-12 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {brandConfig.departments.map((dept, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
              <div className="font-bold text-xs text-white">{dept.name}</div>
              <div className="text-[11px] text-blue-400 font-mono">{dept.email}</div>
              <div className="text-[10px] text-slate-500">{dept.hours}</div>
            </div>
          ))}
        </div>

        {/* Bottom Legal, Privacy & Copyright Strip */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="/#security" className="hover:text-slate-400 transition">Security Overview</a>
            <Link to="/about" className="hover:text-slate-400 transition">About Us</Link>
            <Link to="/pricing" className="hover:text-slate-400 transition">Pricing Plans</Link>
            <Link to="/contact" className="hover:text-slate-400 transition">Contact Sales</Link>
            <Link to="/login" className="hover:text-slate-400 transition">Portal Sign In</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;

