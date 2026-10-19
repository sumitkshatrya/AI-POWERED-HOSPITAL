import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { Building, ShieldCheck, CheckCircle2, Lock, Users, Activity, FileText } from 'lucide-react';
import { AiAdminAnalyticsWidget } from '../components/AiAdminAnalyticsWidget';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTHENTICATED AS {user.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.firstName} {user.lastName}!
            </h1>
            <p className="mt-2 text-sky-100 text-sm max-w-2xl">
              Hospital Management Platform &bull; Active Tenant Scope:{' '}
              <span className="font-bold underline decoration-sky-400">
                {user.hospital ? user.hospital.name : 'Platform Wide (Super Admin)'}
              </span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-right">
            <p className="text-xs text-sky-200 uppercase font-semibold">Security Level</p>
            <p className="text-lg font-bold text-white flex items-center justify-end space-x-1 mt-1">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Isolated</span>
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">User Identity</p>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-3">{user.firstName}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Role</p>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-3">{user.role}</p>
          <p className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
            RBAC Enforced
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital Tenant</p>
            <Building className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 mt-3 truncate">
            {user.hospital ? user.hospital.name : 'Global Super Admin'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {user.hospital ? `Code: ${user.hospital.code}` : 'Cross-tenant access enabled'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session Status</p>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-3 flex items-center space-x-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>ACTIVE</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">HTTP-Only Cookie Protected</p>
        </div>
      </div>

      {/* AI Admin Operational Intelligence Copilot */}
      {[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN].includes(user.role) && (
        <AiAdminAnalyticsWidget />
      )}

      {/* Multi-Tenancy Security Assurance Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Backend Security & Multi-Tenant Isolation Status</span>
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          All data requests for this session are strictly constrained on the backend API layer. Resources belonging to other hospitals or branches are blocked via backend middleware isolation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500">JWT Token Security:</span>
            <p className="font-bold text-gray-800 mt-1">Signed & Verified on every API call</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500">Cross-Hospital Isolation:</span>
            <p className="font-bold text-emerald-700 mt-1">Backend Enforced (HTTP 403 Block)</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500">Audit Log Record:</span>
            <p className="font-bold text-gray-800 mt-1">Active for current session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

