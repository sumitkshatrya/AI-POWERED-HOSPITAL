import React from 'react';
import { ShieldCheck, Lock, Key, FileText, Database, Server } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    { title: 'Role-Based Access Control', desc: 'Granular role permissions (Doctor, Nurse, Receptionist, Accountant, Admin) preventing unauthorized data visibility.', icon: Key },
    { title: 'Multi-Tenant Isolation', desc: 'Strict logical database separation between hospital accounts and branch locations.', icon: Database },
    { title: 'Secure Authentication', desc: 'JWT token handling with refresh rotation, HTTP-only cookie support, and password hashing.', icon: Lock },
    { title: 'System Audit Logging', desc: 'Comprehensive event tracking for sensitive clinical record edits, prescription issues, and billing overrides.', icon: FileText },
    { title: 'Controlled Documents', desc: 'Encrypted document storage with access logging for sensitive diagnostic lab reports and medical history.', icon: ShieldCheck },
    { title: 'Encrypted Communication', desc: 'TLS/SSL transport encryption for all REST API endpoints and real-time Socket.io channels.', icon: Server },
  ];

  return (
    <section id="security" className="py-20 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Security
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Healthcare data deserves serious protection.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3">
            Designed with privacy and security in mind — protecting patient privacy, safeguarding clinical records, and enforcing strict tenant boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{sec.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
