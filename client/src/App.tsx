import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Hospitals } from './pages/Hospitals';
import { Branches } from './pages/Branches';
import { Departments } from './pages/Departments';
import { Staff } from './pages/Staff';
import { Profile } from './pages/Profile';
import { DoctorConsultation } from './pages/DoctorConsultation';
import { DoctorDirectory } from './pages/DoctorDirectory';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { Patients } from './pages/Patients';
import { EmrPatientPage } from './pages/EmrPatientPage';
import { Appointments } from './pages/Appointments';
import { AppointmentsCalendar } from './pages/AppointmentsCalendar';
import { OpdQueueView } from './pages/OpdQueueView';
import { OpdTokenDisplayScreen } from './components/OpdTokenDisplayScreen';
import { DoctorClinicalWorkspace } from './pages/DoctorClinicalWorkspace';
import { BillingInvoicesPage } from './pages/BillingInvoicesPage';
import { LabManagementPage } from './pages/LabManagementPage';
import { RadiologyDashboard } from './pages/RadiologyDashboard';
import { PharmacyDashboardPage } from './pages/PharmacyDashboardPage';
import { MedicineManagementPage } from './pages/MedicineManagementPage';
import { PharmacySalesPage } from './pages/PharmacySalesPage';
import { HospitalInventoryPage } from './pages/HospitalInventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { BedManagementPage } from './pages/BedManagementPage';
import { InpatientAdmissionsPage } from './pages/InpatientAdmissionsPage';
import { NursingDashboardPage } from './pages/NursingDashboardPage';
import { IcuDashboardPage } from './pages/IcuDashboardPage';
import { DischargeSummaryPage } from './pages/DischargeSummaryPage';
import { EmergencyDashboardPage } from './pages/EmergencyDashboardPage';
import { AmbulanceFleetPage } from './pages/AmbulanceFleetPage';
import { BloodBankDashboardPage } from './pages/BloodBankDashboardPage';
import { AccountantDashboardPage } from './pages/AccountantDashboardPage';
import { InsuranceDashboardPage } from './pages/InsuranceDashboardPage';
import { AnalyticsAndReportsPage } from './pages/AnalyticsAndReportsPage';
import { AdminAuditLogViewerPage } from './pages/AdminAuditLogViewerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AiAssistantChatBox } from './components/AiAssistantChatBox';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PublicNavbar } from './components/landing/PublicNavbar';
import { useAuth } from './context/AuthContext';
import { Role } from './types/auth';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PricingPage } from './pages/PricingPage';

export const App: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Root public pages (full bleed without app dashboard shell)
  if (location.pathname === '/' || location.pathname === '/landing') {
    return <LandingPage />;
  }
  if (location.pathname === '/about') {
    return <AboutPage />;
  }
  if (location.pathname === '/contact') {
    return <ContactPage />;
  }
  if (location.pathname === '/pricing') {
    return <PricingPage />;
  }

  // Standalone Public Auth Pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/opd-queue-display'].includes(location.pathname);
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/opd-queue-display" element={<OpdTokenDisplayScreen />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <Navbar /> : <PublicNavbar />}
      <div className="flex flex-1">
        {user && <Sidebar />}
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Public Doctor Directory & Profile Routes */}
            <Route path="/doctors" element={<DoctorDirectory />} />
            <Route path="/doctors/:id" element={<DoctorProfilePage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/consultation"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE]}>
                  <DoctorConsultation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-workspace"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE]}>
                  <DoctorClinicalWorkspace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.ACCOUNTANT, Role.PHARMACIST]}>
                  <BillingInvoicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accountant-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT]}>
                  <AccountantDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/insurance-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.ACCOUNTANT, Role.INSURANCE_STAFF]}>
                  <InsuranceDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lab-management"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.PATIENT]}>
                  <LabManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/radiology"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.RADIOLOGIST, Role.PATIENT]}>
                  <RadiologyDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.DOCTOR, Role.NURSE]}>
                  <PharmacyDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-medicines"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.DOCTOR, Role.NURSE]}>
                  <MedicineManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-sales"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.ACCOUNTANT]}>
                  <PharmacySalesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hospital-inventory"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST, Role.NURSE, Role.DOCTOR]}>
                  <HospitalInventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy-suppliers"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.PHARMACIST]}>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bed-management"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]}>
                  <BedManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ipd-admissions"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]}>
                  <InpatientAdmissionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nursing-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.NURSE, Role.DOCTOR]}>
                  <NursingDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/icu-dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE]}>
                  <IcuDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/discharge-summary"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT]}>
                  <DischargeSummaryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emergency"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]}>
                  <EmergencyDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ambulance"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.AMBULANCE_OPERATOR]}>
                  <AmbulanceFleetPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/blood-bank"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.BLOOD_BANK_STAFF]}>
                  <BloodBankDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.LAB_TECHNICIAN, Role.PATIENT]}>
                  <Patients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/:patientId/emr"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.LAB_TECHNICIAN, Role.PATIENT]}>
                  <EmrPatientPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE]}>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments/calendar"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE]}>
                  <AppointmentsCalendar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/opd-queue"
              element={
                <ProtectedRoute>
                  <OpdQueueView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hospitals"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]}>
                  <Hospitals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/branches"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN]}>
                  <Branches />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN]}>
                  <Departments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN]}>
                  <Staff />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics-reports"
              element={
                <ProtectedRoute>
                  <AnalyticsAndReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-assistant"
              element={<AiAssistantPage />}
            />

            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.BRANCH_ADMIN]}>
                  <AdminAuditLogViewerPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <AiAssistantChatBox />
    </div>
  );
};

export default App;


