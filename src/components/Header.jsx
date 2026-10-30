import React, { useContext, useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Ticket, Plus, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PopupModel from './logoutpop';
import { ContextProvider } from '../context/store';
import { ROLES } from '../utils/rbac';
import { loadQueueFromStorage, saveQueueToStorage, QUEUE_STATUS } from '../services/queueStorage';
import { getQueueTokens } from '../services/queue';
import { IssueTokenModal } from './queue/IssueTokenModal';

const Header = ({ onLogout, onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userRole, hasPermission, token } = useContext(ContextProvider);

  const canIssueToken = userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (userRole === ROLES.STAFF && (hasPermission ? (hasPermission('ISSUE_TOKEN') || hasPermission('MANAGE_QUEUE') || hasPermission('CREATE_PATIENT') || hasPermission('CREATE_APPOINTMENT')) : true));

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHeaderIssueModalOpen, setIsHeaderIssueModalOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const profileContainerRef = useRef(null);

  // Sync live waiting count from queue (both localStorage and live server)
  useEffect(() => {
    let isMounted = true;

    const syncFromStorage = () => {
      try {
        const q = loadQueueFromStorage();
        const count = q.filter((i) => i.status === QUEUE_STATUS.WAITING).length;
        if (isMounted) setWaitingCount(count);
      } catch (e) {
        if (isMounted) setWaitingCount(0);
      }
    };

    const fetchServerCount = async () => {
      if (!token) return;
      try {
        const res = await getQueueTokens({ limit: 100 }, token);
        const tokens = Array.isArray(res?.tokens)
          ? res.tokens
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (tokens.length > 0 && isMounted) {
          const liveWaiting = tokens.filter((i) => i.status === QUEUE_STATUS.WAITING).length;
          setWaitingCount(liveWaiting);
        }
      } catch (e) {
        // storage count already set
      }
    };

    syncFromStorage();
    fetchServerCount();

    // Listen to local queue updates without re-firing network requests
    window.addEventListener('clinicQueueUpdated', syncFromStorage);
    const interval = setInterval(() => {
      if (isMounted) {
        syncFromStorage();
        fetchServerCount();
      }
    }, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener('clinicQueueUpdated', syncFromStorage);
      clearInterval(interval);
    };
  }, [token]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role details with distinct colors and glowing status dots
  const ROLE_CONFIG = {
    [ROLES.ADMIN]: {
      label: 'Admin',
      sublabel: 'System Administrator',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/80',
      dotClass: 'bg-violet-500 shadow-sm shadow-violet-500/50',
    },
    [ROLES.DOCTOR]: {
      label: 'Doctor',
      sublabel: 'Specialist Physician',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotClass: 'bg-emerald-500 shadow-sm shadow-emerald-500/50',
    },
    [ROLES.STAFF]: {
      label: 'Staff',
      sublabel: 'Clinic Operations',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dotClass: 'bg-sky-500 shadow-sm shadow-sky-500/50',
    },
    [ROLES.PATIENT]: {
      label: 'Patient',
      sublabel: 'Patient Portal',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      dotClass: 'bg-cyan-500 shadow-sm shadow-cyan-500/50',
    },
  };

  const roleMeta = ROLE_CONFIG[userRole] || {
    label: userRole || 'User',
    sublabel: 'Member',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  const displayName = currentUser?.name || currentUser?.fullName || 'Clinic User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 px-2.5 sm:px-6 sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-1 sm:gap-4">
      {/* ========================================================================= */}
      {/* LEFT: Mobile Toggle + Modern Brand Logo                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button 
          onClick={onToggleMobileSidebar}
          className="p-1.5 sm:p-2 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-xl transition-all md:hidden cursor-pointer border border-transparent hover:border-cyan-100"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Mark */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group select-none pr-1.5 sm:pr-6 border-r-0 sm:border-r border-slate-200/80 h-9 shrink-0"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-cyan-600/25 ring-2 ring-cyan-50 transition-all duration-300 group-hover:scale-105">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[220px]">
            <span className="text-xs sm:text-base font-black tracking-tight text-slate-900 leading-tight truncate">
              {currentUser?.clinicName || (
                <>
                  Ky<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">doc</span>
                </>
              )}
            </span>
            {currentUser?.clinicName && (
              <span className="text-[10px] font-bold text-teal-600 truncate hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
                Skin Clinic Management
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE: Quick OPD Token Queue Navigation & Live Monitor                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Token Queue Navigation Tab */}
        <button
          onClick={() => navigate('/queue')}
          className={`group flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
            location.pathname === '/queue'
              ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-600 shadow-sm shadow-cyan-600/25 ring-2 ring-cyan-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-cyan-700 border-slate-200/90 shadow-2xs hover:border-cyan-200'
          }`}
          title="Open Daily Clinic OPD & Live Patient Queue"
        >
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            location.pathname === '/queue' ? 'bg-white/20 text-white' : 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100'
          }`}>
            <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="hidden sm:inline font-extrabold tracking-tight">Live OPD Queue</span>
            <span className="sm:hidden font-extrabold text-xs tracking-tight">OPD</span>
            {waitingCount > 0 ? (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                location.pathname === '/queue'
                  ? 'bg-white/25 text-white'
                  : 'bg-amber-100 text-amber-800 border border-amber-200/70'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">{waitingCount} Waiting</span>
                <span className="sm:hidden">{waitingCount}</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                location.pathname === '/queue'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">All Clear</span>
                <span className="sm:hidden">Clear</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Elevated User Profile Card                                          */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div ref={profileContainerRef} className="relative">
          <div 
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:pl-3 sm:pr-2 rounded-2xl hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 transition-all duration-200 cursor-pointer select-none group shadow-xs shrink-0"
          >
            {/* Distinct Role Badge */}
            <div className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${roleMeta.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dotClass}`} />
              {roleMeta.label}
            </div>

            {/* User Name & Details */}
            <div className="hidden md:flex flex-col text-right leading-tight">
              <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-600 transition-colors truncate max-w-[130px] capitalize">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 capitalize">
                {roleMeta.sublabel}
              </span>
            </div>

            {/* Avatar with Online Pulse */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-700 to-teal-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-600/20 ring-2 ring-white">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Smooth Chevron Indicator */}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* User Profile Modal Drawer */}
          {isProfileOpen && (
            <PopupModel onLogout={onLogout} onClose={() => setIsProfileOpen(false)} />
          )}
        </div>
      </div>

      {/* Global Issue Token Modal triggered from Header */}
      <IssueTokenModal
        isOpen={isHeaderIssueModalOpen}
        onClose={() => setIsHeaderIssueModalOpen(false)}
        onTokenCreated={(newToken) => {
          const current = loadQueueFromStorage();
          saveQueueToStorage([newToken, ...current]);
          navigate('/queue');
        }}
        currentQueue={loadQueueFromStorage()}
      />
    </header>
  );
};

export default Header;
