import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MediCore</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Healthcare Management, Connected. One intelligent, multi-tenant platform empowering hospitals, clinicians, diagnostic labs, pharmacies, and patients.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise-Grade Security Architecture</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Platform & Features</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/#platform" className="hover:text-white transition">Hospital Management</a></li>
              <li><a href="/#features" className="hover:text-white transition">Doctor Clinical Workspace</a></li>
              <li><a href="/#features" className="hover:text-white transition">OPD & Token Queue Wall</a></li>
              <li><a href="/#features" className="hover:text-white transition">IPD & Bed Allocation</a></li>
              <li><a href="/#features" className="hover:text-white transition">LIS & RIS Diagnostics</a></li>
              <li><a href="/#features" className="hover:text-white transition">Pharmacy & POS Inventory</a></li>
              <li><a href="/#ai" className="hover:text-white transition">AI Clinical Assistant</a></li>
            </ul>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Solutions & Roles</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/doctors" className="hover:text-white transition">Doctor Directory</Link></li>
              <li><a href="/#about" className="hover:text-white transition">About MediCore</a></li>
              <li><a href="/#contact" className="hover:text-white transition">Contact & Sales</a></li>
              <li><a href="/#pricing" className="hover:text-white transition">Subscription Plans</a></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Account Registration</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Connect With Us</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@medicore-health.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+1 (800) 555-MEDICORE</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Healthcare Plaza, Suite 400, Tech Park, CA 94107</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediCore Healthcare Platforms Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <a href="/#security" className="hover:text-slate-400 transition">Security Overview</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
