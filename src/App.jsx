import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import { Patients } from "./components/views/Patients";
import { Doctors } from "./components/views/Doctors";
import { Appointments } from "./components/views/Appointments";
import { Billing } from "./components/views/Billing";
import { Settings } from "./components/views/Settings";
import { EmptyView } from "./components/views/EmptyView";
import { Odontograms } from "./components/views/Odontograms";
import { Prescriptions } from "./components/views/Prescriptions";
import { PatientQueue } from "./components/views/PatientQueue";
import PatientFormModal from "./components/PatientFormModal";
import DoctorFormModal from "./components/DoctorFormModal";
import Login from "./components/Login";
import Register from "./components/register";
import RegisterClinic from "./components/RegisterClinic";
import StoreManagement from "./context/store";
import FollowUp from "./components/views/follow-ip";
import { Staff } from "./components/views/Staff";
import { DoctorDetail } from "./components/views/DoctorDetail";
import { PatientDetail } from "./components/views/PatientDetail";
import { StaffDetail } from "./components/views/StaffDetail";
import { AppointmentDetail } from "./components/views/AppointmentDetail";
import { Enquiries } from "./components/views/Enquiries";
import Unauthorized from "./components/views/Unauthorized";
import { LabTracker } from "./components/views/LabTracker";
import MobileBottomNav from "./components/MobileBottomNav";
import RoleRoute from "./components/RoleRoute";
import { ROLES } from "./utils/rbac";

// ============================================================================
// 1. MAIN APPLICATION LAYOUT
// ============================================================================
const MainLayout = ({ 
  isPatientModalOpen, 
  closePatientModal, 
  isDoctorModalOpen, 
  closeDoctorModal, 
  openPatientModal, 
  openDoctorModal, 
  onLogout 
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden w-full relative bg-slate-50/60 selection:bg-cyan-500/25 selection:text-cyan-950">
      {/* Aesthetic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-100/40 via-slate-50/80 to-white/60 -z-10" />
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-cyan-50/40 to-transparent -z-10" />

      {/* Top Navigation Header */}
      <Header
        onLogout={onLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onAddPatient={openPatientModal}
        onAddDoctor={openDoctorModal}
      />

      {/* Main Body (Sidebar + Content Area) */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto w-full relative pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Reusable Modals */}
      <PatientFormModal isOpen={isPatientModalOpen} onClose={closePatientModal} />
      <DoctorFormModal isOpen={isDoctorModalOpen} onClose={closeDoctorModal} />
    </div>
  );
};

// ============================================================================
// 2. PROTECTED ROUTE WRAPPER
// ============================================================================
const ProtectedRoute = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// ============================================================================
// 3. ROOT COMPONENT
// ============================================================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const user = localStorage.getItem("user");
    const parsed = user ? JSON.parse(user) : null;
    const token =
      parsed?.token ||
      parsed?.data?.token ||
      parsed?.accessToken ||
      parsed?.data?.accessToken;
    return !!token;
  });

  // Global Modal State lifted to App so we can pass it to Routes
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const openPatientModal = () => setIsPatientModalOpen(true);
  const closePatientModal = () => setIsPatientModalOpen(false);

  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const openDoctorModal = () => setIsDoctorModalOpen(true);
  const closeDoctorModal = () => setIsDoctorModalOpen(false);

  return (
    <StoreManagement>
      {/* Global Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
            }
          />
          <Route
            path="/register-clinic"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <RegisterClinic onRegisterSuccess={() => setIsAuthenticated(true)} />
              )
            }
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route
              element={
                <MainLayout
                  isPatientModalOpen={isPatientModalOpen}
                  closePatientModal={closePatientModal}
                  isDoctorModalOpen={isDoctorModalOpen}
                  closeDoctorModal={closeDoctorModal}
                  openPatientModal={openPatientModal}
                  openDoctorModal={openDoctorModal}
                  onLogout={() => {
                    localStorage.removeItem("user");
                    setIsAuthenticated(false);
                  }}
                />
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onAddPatient={openPatientModal} onAddDoctor={openDoctorModal} />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Daily Clinic OPD Queue & Tokens: Admin, Doctor, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/queue" element={<PatientQueue />} />
              </Route>

              {/* Patients: Admin, Doctor, Staff */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF]} />}>
                <Route path="/patients" element={<Patients onAddPatient={openPatientModal} />} />
                <Route path="/patients/:id" element={<PatientDetail onEditPatient={openPatientModal} />} />
              </Route>

              {/* Doctors Directory: Admin, Doctor, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/doctors" element={<Doctors onAddDoctor={openDoctorModal} />} />
                <Route path="/doctors/:id" element={<DoctorDetail onEditDoctor={openDoctorModal} />} />
              </Route>

              {/* Staff Management: Admin, Staff (staff requires MANAGE_STAFF permission via rbac) */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} />}>
                <Route path="/staff" element={<Staff />} />
                <Route path="/staff/:id" element={<StaffDetail />} />
              </Route>

              {/* Admin-Only Management Modules */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="/settings" element={<Settings />} />
                <Route path="/website" element={<EmptyView title="Website Management" />} />
              </Route>

              {/* Appointments: All authenticated users */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/appointments/:id" element={<AppointmentDetail />} />
              </Route>

              {/* Prescriptions: Admin, Doctor, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/prescriptions" element={<Prescriptions />} />
              </Route>

              {/* Follow-Up: Admin, Doctor, Staff */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF]} />}>
                <Route path="/follow-up" element={<FollowUp />} />
              </Route>

              {/* Enquiries: Admin, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/enquiries" element={<Enquiries />} />
              </Route>

              {/* Enquiry follow-up: Admin, Staff */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} />}>
                <Route path="/enquiry-follow-up" element={<Enquiries />} />
              </Route>

              {/* Billing: Admin, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/billing" element={<Billing />} />
              </Route>

              <Route path="/treatments" element={<Navigate to="/dashboard" replace />} />

              {/* Skin Treatment Chart: Admin, Doctor, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/odontograms" element={<Odontograms />} />
              </Route>

              {/* Dental Lab Work Tracker: Admin, Doctor, Staff */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF]} />}>
                <Route path="/lab-tracker" element={<LabTracker />} />
              </Route>

              {/* Inventory: Admin, Staff */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} />}>
                <Route path="/inventory" element={<EmptyView title="Inventory" />} />
              </Route>

              {/* Test Reports: Admin, Doctor, Staff, Patient */}
              <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT]} />}>
                <Route path="/test-reports" element={<EmptyView title="Test Reports" />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreManagement>
  );
}

export default App;
