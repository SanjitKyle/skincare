import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, Pill, 
  Clock, Stethoscope, Ticket
} from 'lucide-react';
import { ContextProvider } from '../context/store';
import { canAccessRoute, ROLES } from '../utils/rbac';

const MobileBottomNav = () => {
  const { userRole, currentUser } = useContext(ContextProvider);

  const rawNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'queue', label: 'Queue', icon: Ticket, path: '/queue' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/patients' },
    { id: 'appointments', label: 'Appts', icon: CalendarDays, path: '/appointments' },
    { id: 'prescriptions', label: 'Rx', icon: Pill, path: '/prescriptions' },
  ];

  const primaryNavItems = rawNavItems.filter((item) => canAccessRoute(item.path, userRole, currentUser));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around safe-bottom">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 relative group min-w-[54px] ${
              isActive 
                ? 'text-cyan-600 scale-105' 
                : 'text-slate-400 hover:text-slate-700 active:scale-95'
            }`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-cyan-50 text-cyan-600 shadow-2xs' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? 'font-black text-cyan-700' : 'text-slate-500 font-semibold'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
