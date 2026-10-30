import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  UsersRound,
  Phone,
  PhoneCall,
  Mail,
  MailCheck,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Building,
  Briefcase,
  KeyRound,
  CheckCircle2,
  Edit,
  Trash2,
  Clock,
  Loader2,
  Sparkles,
  Shield
} from 'lucide-react';
import { getStaff, updateStaff, deleteStaff } from '../../services/staff';
import { toast } from 'react-toastify';
import { ContextProvider } from '../../context/store';
import {
  PERMISSION_GROUPS,
  STAFF_ROLE_PRESETS,
  getAllPermissions
} from '../../utils/rbac';
import { QuickPermissionsModal, GROUP_ICONS } from './Staff';

const statusStyle = {
  ACTIVE:     "border-emerald-200 bg-emerald-50 text-emerald-700",
  ON_LEAVE:   "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED:  "border-red-200 bg-red-50 text-red-700",
  TERMINATED: "border-slate-200 bg-slate-100 text-slate-500",
};

export const StaffDetail = ({ onEditStaff }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useContext(ContextProvider) || {};
  const canManageStaff = hasPermission ? Boolean(hasPermission('MANAGE_STAFF')) : false;

  const [staff, setStaff] = useState(location.state?.staff || null);
  const [loading, setLoading] = useState(!staff);
  const [permModalOpen, setPermModalOpen] = useState(false);

  const getToken = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.token || user?.data?.token || user?.accessToken || user?.data?.accessToken || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!staff || String(staff._id) !== String(id)) {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      getStaff(token)
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || [];
          const found = list.find((s) => String(s._id) === String(id));
          if (found) setStaff(found);
        })
        .catch((err) => {
          console.error('Failed to load staff details', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, staff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
        <span className="text-sm font-medium">Loading staff details...</span>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-cyan-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff & Access
        </button>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <UsersRound className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Staff Member Not Found</h3>
          <p className="text-xs text-slate-500 mb-4">The staff records could not be found or have been deleted.</p>
          <button
            onClick={() => navigate('/staff')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-cyan-700 transition-all cursor-pointer"
          >
            Return to Staff List
          </button>
        </div>
      </div>
    );
  }

  const initials = typeof staff?.fullName === 'string' && staff.fullName.trim()
    ? staff.fullName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  const joinedDate = staff?.dateOfJoining && !Number.isNaN(new Date(staff.dateOfJoining).getTime())
    ? new Date(staff.dateOfJoining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const activePermissions = Array.isArray(staff?.permissions) ? staff.permissions : [];
  const norm = (p) => String(p || '').toUpperCase().replace(/[\s-]+/g, '_').trim();

  const allTotalPerms = useMemo(() => getAllPermissions().length, []);
  const matchedPreset = useMemo(() => {
    return STAFF_ROLE_PRESETS.find((preset) => {
      if (preset.permissions.length !== activePermissions.length) return false;
      return preset.permissions.every((p) => activePermissions.some((ap) => norm(ap) === norm(p)));
    });
  }, [activePermissions]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete staff member ${staff.fullName}?`)) return;
    try {
      const token = getToken();
      await deleteStaff(token, staff._id);
      toast.success("Staff member deleted.");
      navigate('/staff');
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete staff.");
    }
  };

  const handleEdit = () => {
    if (onEditStaff) {
      onEditStaff(staff);
    } else {
      navigate('/staff', { state: { editTarget: staff } });
    }
  };

  const handleSavePermissions = async (staffId, newPerms) => {
    try {
      const token = getToken();
      await updateStaff(token, staffId, { permissions: newPerms });
      toast.success("Staff privileges updated successfully!");
      setStaff((prev) => (prev ? { ...prev, permissions: newPerms } : prev));
      try {
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
        if (
          currentUser?.staffId === staffId ||
          currentUser?.id === staffId ||
          currentUser?._id === staffId
        ) {
          currentUser.permissions = newPerms;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update privileges.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-12">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-1.5 text-slate-700 hover:text-cyan-600 font-bold text-xs cursor-pointer transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Staff</span>
          <span className="sm:hidden">Back</span>
        </button>

        <h1 className="text-sm font-black text-slate-900 tracking-tight">Staff Profile</h1>

        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          #{(staff._id || '').slice(-6)}
        </span>
      </div>

      <div className="p-3.5 sm:p-5 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5">
        {/* Modern Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          {/* Subtle Top Gradient Banner */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 relative p-4 sm:p-6 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                Staff Profile
              </span>
              {matchedPreset && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-violet-800 shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-600" /> {matchedPreset.badge}
                </span>
              )}
            </div>

            {joinedDate && (
              <p className="text-[11px] text-cyan-100 font-semibold bg-black/15 px-3 py-1 rounded-full backdrop-blur-xs">
                Joined {joinedDate}
              </p>
            )}
          </div>

          {/* Profile Details Container */}
          <div className="p-4 sm:p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <div className="flex items-end gap-3.5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cyan-100 text-cyan-800 border-4 border-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-lg shadow-cyan-900/10">
                  {initials}
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                      {staff.fullName}
                    </h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusStyle[staff.status] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {staff.status?.replace(/_/g, ' ') || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                    {staff.designation || 'Staff Member'} &bull; <span className="text-slate-700">{staff.department || 'General'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              {canManageStaff && (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => setPermModalOpen(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5 text-violet-600" />
                    <span>Privileges</span>
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-cyan-600/20 cursor-pointer active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
              {staff.phoneNumber ? (
                <a
                  href={`tel:${staff.phoneNumber}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                      <p className="text-xs font-extrabold text-slate-800 truncate">{staff.phoneNumber}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 group-hover:bg-emerald-100">
                    Call
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Phone className="w-4 h-4" /> No phone provided
                </div>
              )}

              {staff.email ? (
                <a
                  href={`mailto:${staff.email}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/70 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="text-xs font-extrabold text-slate-800 truncate">{staff.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 group-hover:bg-blue-100">
                    Email
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Mail className="w-4 h-4" /> No email provided
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Role */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Role</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate">
              {staff.employment || '—'}
            </p>
          </div>

          {/* Department */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Department</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Building className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate">
              {staff.department || 'General'}
            </p>
          </div>

          {/* Employment Type */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Type</span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate">
              {staff.employmentType?.replace(/_/g, ' ') || 'Full Time'}
            </p>
          </div>

          {/* Permissions */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Privileges</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-base sm:text-lg font-black text-slate-900">
                {activePermissions.length} <span className="text-xs font-semibold text-slate-400">/ {allTotalPerms}</span>
              </p>
              <span className="text-[11px] font-bold text-emerald-700">
                {Math.round((activePermissions.length / (allTotalPerms || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Section: Contact Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Contact Details</h3>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Phone */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Phone</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">{staff.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              {staff.phoneNumber && (
                <a
                  href={`tel:${staff.phoneNumber}`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>

            {/* Email */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Email</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">{staff.email || 'Not provided'}</p>
                </div>
              </div>
              {staff.email && (
                <a
                  href={`mailto:${staff.email}`}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <MailCheck className="w-3.5 h-3.5" /> Email
                </a>
              )}
            </div>

            {/* Designation & Department */}
            <div className="p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Work Area</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5 leading-relaxed">
                  {staff.designation || 'Staff Member'} — {staff.department || 'General'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Emergency Contact */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Emergency Contact</h3>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>

          <div className="p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Contact Person</p>
                <p className="font-extrabold text-slate-800 text-sm">
                  {staff.emergencyContact?.name || '—'}
                  {staff.emergencyContact?.relation && (
                    <span className="text-xs text-slate-500 font-medium ml-1.5">
                      ({staff.emergencyContact.relation})
                    </span>
                  )}
                </p>
              </div>

              {staff.emergencyContact?.phone && (
                <a
                  href={`tel:${staff.emergencyContact.phone}`}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>

            {staff.emergencyContact?.phone && (
              <p className="text-[11px] font-semibold text-slate-500">Phone: {staff.emergencyContact.phone}</p>
            )}
          </div>
        </div>

        {/* Section: Granted Permissions Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  System Permissions & Access
                </h3>
                {matchedPreset && (
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-600" /> {matchedPreset.badge} Template
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Active capabilities granted to this staff account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-full">
                {activePermissions.length} of {allTotalPerms} enabled ({Math.round((activePermissions.length / (allTotalPerms || 1)) * 100)}%)
              </span>
              {canManageStaff && (
                <button
                  onClick={() => setPermModalOpen(true)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shadow-violet-600/20 active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5" /> Quick Manage Privileges
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PERMISSION_GROUPS.map((group) => {
              const grantedInGroup = group.perms.filter((p) => activePermissions.some((ap) => norm(ap) === norm(p.id)));
              const GroupIcon = GROUP_ICONS[group.id] || Shield;
              return (
                <div key={group.id} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center shrink-0">
                        <GroupIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                          {group.label}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{group.description}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      grantedInGroup.length === group.perms.length
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : grantedInGroup.length > 0
                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {grantedInGroup.length} / {group.perms.length} active
                    </span>
                  </div>

                  <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white">
                    {group.perms.map((perm) => {
                      const hasPerm = activePermissions.some((ap) => norm(ap) === norm(perm.id));
                      let badgeCls = 'bg-sky-50 text-sky-700 border-sky-200';
                      if (perm.action === 'create') badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (perm.action === 'edit') badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (perm.action === 'delete') badgeCls = 'bg-rose-50 text-rose-700 border-rose-200';
                      if (perm.action === 'manage') badgeCls = 'bg-violet-50 text-violet-700 border-violet-200';

                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-colors ${
                            hasPerm
                              ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950 font-bold'
                              : 'bg-slate-50/40 border-slate-100 text-slate-400 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {hasPerm ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <span className="truncate">{perm.label}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded border shrink-0 ${badgeCls}`}>
                            {perm.action}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Permissions Modal */}
      <QuickPermissionsModal
        isOpen={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        staff={staff}
        onSave={handleSavePermissions}
      />
    </div>
  );
};
export default StaffDetail;

