import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import {
  LayoutDashboard,
  Sparkles,
  Building,
  Users,
  Calendar,
  Stethoscope,
  UserCheck,
  Tv,
  CreditCard,
  FileText,
  TestTube,
  Activity,
  Pill,
  ShoppingCart,
  Package,
  Truck,
  Bed,
  ClipboardList,
  HeartPulse,
  FileCheck,
  Siren,
  Droplets,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
  { label: 'Analytics & Reports', path: '/analytics-reports', icon: BarChart3 },
  { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN] },
  { label: 'Doctor Directory', path: '/doctors', icon: Stethoscope },
  { label: 'Doctor Dashboard', path: '/doctor-dashboard', icon: LayoutDashboard, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR] },
  { label: 'Doctor Workspace', path: '/doctor/consultation', icon: Stethoscope, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE] },
  { label: 'Clinical Workspace', path: '/doctor-workspace', icon: FileText, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE] },
  { label: 'Hospitals', path: '/hospitals', icon: Building, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN] },
  { label: 'Branches', path: '/branches', icon: UserCheck, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN] },
  { label: 'Departments', path: '/departments', icon: Stethoscope, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN] },
  { label: 'Staff Directory', path: '/staff', icon: Users, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN] },
  { label: 'Patient Directory', path: '/patients', icon: Users, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.LAB_TECHNICIAN, Role.PATIENT] },
  { label: 'EMR History', path: '/patients', icon: FileText, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.LAB_TECHNICIAN, Role.PATIENT] },
  { label: 'Appointments', path: '/appointments', icon: Calendar, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE] },
  { label: 'Calendar View', path: '/appointments/calendar', icon: Calendar, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE] },
  { label: 'Live OPD Queue', path: '/opd-queue', icon: Calendar },
  { label: 'Queue Wall Display', path: '/opd-queue-display', icon: Tv },
  { label: 'Billing & Invoices', path: '/billing', icon: CreditCard, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.ACCOUNTANT, Role.PHARMACIST] },
  { label: 'Accountant Hub', path: '/accountant-dashboard', icon: CreditCard, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT] },
  { label: 'Insurance & Claims', path: '/insurance-dashboard', icon: FileCheck, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT, Role.INSURANCE_STAFF] },
  { label: 'Lab Management', path: '/lab-management', icon: TestTube, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.PATIENT] },
  { label: 'Radiology RIS', path: '/radiology', icon: Activity, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.RADIOLOGIST, Role.PATIENT] },
  { label: 'Pharmacy Overview', path: '/pharmacy-dashboard', icon: Pill, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.DOCTOR, Role.NURSE] },
  { label: 'Medicine Catalog', path: '/pharmacy-medicines', icon: Pill, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.DOCTOR, Role.NURSE] },
  { label: 'Pharmacy Sales POS', path: '/pharmacy-sales', icon: ShoppingCart, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.ACCOUNTANT] },
  { label: 'Hospital Inventory', path: '/hospital-inventory', icon: Package, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.NURSE, Role.DOCTOR] },
  { label: 'Suppliers', path: '/pharmacy-suppliers', icon: Truck, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST] },
  { label: 'Bed Management', path: '/bed-management', icon: Bed, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] },
  { label: 'Inpatient Admissions', path: '/ipd-admissions', icon: ClipboardList, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] },
  { label: 'Nursing Station', path: '/nursing-dashboard', icon: HeartPulse, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE, Role.DOCTOR] },
  { label: 'ICU Telemetry', path: '/icu-dashboard', icon: Activity, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE] },
  { label: 'Discharge Summaries', path: '/discharge-summary', icon: FileCheck, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT] },
  { label: 'Emergency ER', path: '/emergency', icon: Siren, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] },
  { label: 'Ambulance Fleet', path: '/ambulance', icon: Truck, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.AMBULANCE_OPERATOR] },
  { label: 'Blood Bank', path: '/blood-bank', icon: Droplets, roles: [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.BLOOD_BANK_STAFF] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const accessibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user.role === Role.SUPER_ADMIN || item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:block min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Scope</p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {user.role === Role.SUPER_ADMIN ? 'Global System Override' : user.hospital?.name || 'Standard Account'}
        </p>
      </div>

      <nav className="space-y-1">
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600 pl-2'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

