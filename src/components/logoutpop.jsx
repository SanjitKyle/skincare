import React, { useContext, useState } from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronRight, 
  Ticket, 
  LayoutDashboard, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building2, 
  X, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContextProvider } from '../context/store';
import { ROLE_DETAILS, ROLES } from '../utils/rbac';

function PopupModel({ onLogout, onClose }) {
  const navigate = useNavigate();
  const { currentUser, userRole, setUser, setIsAuthenticated } = useContext(ContextProvider);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const displayName = currentUser?.name || currentUser?.fullName || 'Clinic User';
  const email = currentUser?.email || 'admin@kydoc.com';
  const phone = currentUser?.phone || currentUser?.phoneNumber || 'Not provided';
  const clinicName = currentUser?.clinicName || 'Kydoc Skin Care Clinic';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || displayName.slice(0, 2).toUpperCase();

  const roleMeta = ROLE_DETAILS[userRole] || { 
    label: (userRole ? userRole.toUpperCase() : 'USER'), 
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Clinic Member'
  };

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      if (setUser) setUser(null);
      if (setIsAuthenticated) setIsAuthenticated(false);
      if (onLogout) onLogout();
      if (onClose) onClose();
    } finally {
      navigate('/login');
    }
  };

  return (
    <>
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute right-0 top-[calc(100%+8px)] w-80 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.22)] rounded-3xl overflow-hidden z-50 transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2"
      >
        {/* User Header Info Card */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-700 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-600/25 ring-2 ring-white">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm truncate capitalize">
                  {displayName}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {email}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-2xs ${roleMeta.badgeClass}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {roleMeta.label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 truncate">
                  &bull; Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Navigation Items */}
        <div className="p-2 flex flex-col gap-1">
          {/* 1. My Profile Modal Trigger */}
          <button 
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-cyan-50/70 group transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-2xs">
                <User size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors text-xs">
                  My Profile
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Account info & details
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 2. Clinic Dashboard */}
          <button 
            type="button"
            onClick={() => { 
              if (onClose) onClose(); 
              navigate('/dashboard'); 
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-50 group transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-2xs">
                <LayoutDashboard size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors text-xs">
                  Dashboard
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Clinic KPIs & performance
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Live OPD Queue */}
          <button 
            type="button"
            onClick={() => { 
              if (onClose) onClose(); 
              navigate('/queue'); 
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-50 group transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs">
                <Ticket size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors text-xs">
                  Live OPD Queue
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Patient tokens & waiting room
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 4. Clinic Settings (Admin or Authorized) */}
          {(userRole === ROLES.ADMIN || userRole === 'admin') && (
            <button 
              type="button"
              onClick={() => { 
                if (onClose) onClose(); 
                navigate('/settings'); 
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-50 group transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-2xs">
                  <Settings size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-xs">
                    Clinic Settings
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Configuration & preferences
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        {/* Sign Out Action Button */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/60">
          <button 
            type="button"
            onClick={handleLogout} 
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200/90 hover:border-rose-200 group transition-all cursor-pointer font-extrabold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <LogOut size={15} strokeWidth={2.5} />
              </div>
              <span className="tracking-tight">Sign Out / Log Out</span>
            </div>
            <span className="text-[10px] font-bold text-rose-400 group-hover:text-rose-600 uppercase tracking-wider">
              Exit
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👤 MY PROFILE DETAILS MODAL DIALOG                                         */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileModalOpen(false);
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/30 ring-4 ring-white/10 shrink-0">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight capitalize">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-200">
                      {roleMeta.label} Account
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info Fields */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Account Role
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    <span className="font-extrabold text-slate-900 capitalize">
                      {roleMeta.label}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Clinic Association
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span className="font-extrabold text-slate-900 truncate">
                      {clinicName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Contact Information
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-bold truncate">{email}</span>
                </div>

                {phone && phone !== 'Not provided' && (
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold">{phone}</span>
                  </div>
                )}
              </div>

              {/* Status and Description */}
              <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 text-cyan-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-black">Active User Session:</span> Your credentials and permissions are fully authenticated and synchronized with the Kydoc clinical database.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
              {(userRole === ROLES.ADMIN || userRole === 'admin') ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    if (onClose) onClose();
                    navigate('/settings');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Clinic Settings</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PopupModel;
