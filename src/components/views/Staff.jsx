import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Edit,
  Eye,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UsersRound,
  X,
  Sparkles,
  Check,
  Download,
  Shield,
  Ticket,
  Truck,
  Calendar,
  Activity,
  MessageSquare,
  Clock,
  Settings,
  Receipt,
  Users,
  Filter,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../../services/staff";
import { toast } from "react-toastify";
import { ContextProvider } from "../../context/store";
import {
  PERMISSION_GROUPS,
  STAFF_ROLE_PRESETS,
  getAllPermissions,
  getPresetByRole,
} from "../../utils/rbac";

// ─── Token helper ─────────────────────────────────────────────────────────────
const getToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return (
      user?.token ||
      user?.data?.token ||
      user?.accessToken ||
      user?.data?.accessToken ||
      ""
    );
  } catch {
    return "";
  }
};

// ─── Schema enums (exact values from backend) ─────────────────────────────────
const EMPLOYMENT_ROLES = ["NURSE", "RECEPTIONIST", "ADMIN", "TECHNICIAN", "BILLING"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"];
const STATUS_OPTIONS   = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];

// ─── Icon Map for Module Categories ──────────────────────────────────────────
export const GROUP_ICONS = {
  patients: Users,
  appointments: Calendar,
  queue: Ticket,
  treatments: Sparkles,
  billing: Receipt,
  lab_tracker: Truck,
  odontogram: Activity,
  enquiries: MessageSquare,
  followups: Clock,
  operations: Settings,
};

// ─── Style maps ───────────────────────────────────────────────────────────────
const statusStyle = {
  ACTIVE:     "border-emerald-200 bg-emerald-50 text-emerald-700",
  ON_LEAVE:   "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED:  "border-red-200 bg-red-50 text-red-700",
  TERMINATED: "border-slate-200 bg-slate-100 text-slate-500",
};

const employmentStyle = {
  NURSE:        "border-teal-200 bg-teal-50 text-teal-700",
  RECEPTIONIST: "border-sky-200 bg-sky-50 text-sky-700",
  ADMIN:        "border-violet-200 bg-violet-50 text-violet-700",
  TECHNICIAN:   "border-amber-200 bg-amber-50 text-amber-700",
  BILLING:      "border-slate-200 bg-slate-100 text-slate-700",
};

// ─── Blank form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  fullName:        "",
  email:           "",
  phoneNumber:     "",
  employment:      "",
  designation:     "",
  department:      "",
  employmentType:  "FULL_TIME",
  dateOfJoining:   "",
  status:          "ACTIVE",
  permissions:     [],
  emergencyContact: { name: "", relation: "", phone: "" },
};

// ─── Production-ready Permission Selector with One-Click Templates ──────────
export const PermissionSelector = ({ selected = [], onChange, currentRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const allPermIds = useMemo(() => getAllPermissions(), []);
  const totalCount = allPermIds.length;
  const selectedCount = selected.length;
  const pct = Math.round((selectedCount / (totalCount || 1)) * 100);

  const toggle = (permId) => {
    if (selected.includes(permId)) {
      onChange(selected.filter((p) => p !== permId));
    } else {
      onChange([...selected, permId]);
    }
  };

  const toggleGroup = (groupPerms) => {
    const permIds = groupPerms.map((p) => p.id);
    const allChecked = permIds.every((id) => selected.includes(id));
    if (allChecked) {
      onChange(selected.filter((p) => !permIds.includes(p)));
    } else {
      const merged = [...new Set([...selected, ...permIds])];
      onChange(merged);
    }
  };

  const applyPreset = (preset) => {
    onChange([...preset.permissions]);
    toast.info(`Applied "${preset.name}" template`);
  };

  const selectAll = () => {
    onChange([...allPermIds]);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Check if current permissions match any standard preset
  const matchedPreset = useMemo(() => {
    return STAFF_ROLE_PRESETS.find((preset) => {
      if (preset.permissions.length !== selected.length) return false;
      return preset.permissions.every((p) => selected.includes(p));
    });
  }, [selected]);

  // Filter groups by search term if typed
  const displayedGroups = useMemo(() => {
    if (!searchTerm.trim()) return PERMISSION_GROUPS;
    const q = searchTerm.trim().toLowerCase();
    return PERMISSION_GROUPS.map((g) => {
      const filteredPerms = g.perms.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          g.label.toLowerCase().includes(q)
      );
      if (filteredPerms.length === 0) return null;
      return { ...g, perms: filteredPerms };
    }).filter(Boolean);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      {/* ── Role Templates / Presets Bar ── */}
      <div className="bg-gradient-to-br from-slate-50 to-cyan-50/30 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Quick Role Templates
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Apply standard hospital access profiles in 1 click
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 bg-white hover:bg-cyan-50 border border-cyan-200/80 px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              Grant All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Template Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAFF_ROLE_PRESETS.map((preset) => {
            const isCurrent = matchedPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20 scale-[1.02]"
                    : "bg-white border-slate-200/90 hover:border-cyan-300 hover:bg-cyan-50/50 text-slate-700 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-black tracking-tight truncate ${isCurrent ? "text-white" : "text-slate-800"}`}>
                    {preset.name.split("/")[0].trim()}
                  </span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </div>
                <span className={`text-[10px] font-medium mt-0.5 truncate w-full ${isCurrent ? "text-cyan-100" : "text-slate-400"}`}>
                  {preset.permissions.length} privileges
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-200/70">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-600">
              Active Capabilities: <strong className="text-slate-900">{selectedCount}</strong> of {totalCount} granted
            </span>
            <span className="font-bold text-cyan-700">{pct}% Coverage</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Search Filter Inside Permissions ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter privileges by name (e.g. queue, invoice, delete, treatment)..."
          className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Grouped Permissions Cards ── */}
      <div className="space-y-3">
        {displayedGroups.map((group) => {
          const groupPermIds = group.perms.map((p) => p.id);
          const allChecked = groupPermIds.every((id) => selected.includes(id));
          const someChecked = groupPermIds.some((id) => selected.includes(id));
          const grantedInGroup = groupPermIds.filter((id) => selected.includes(id)).length;
          const GroupIcon = GROUP_ICONS[group.id] || Shield;

          return (
            <div key={group.id} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs hover:border-slate-300 transition-colors">
              {/* Group Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 select-none">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleGroup(group.perms)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center shrink-0">
                      <GroupIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {group.label}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </label>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    grantedInGroup === group.perms.length
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : grantedInGroup > 0
                      ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {grantedInGroup} / {group.perms.length} active
                  </span>
                </div>
              </div>

              {/* Group Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {group.perms.map((perm) => {
                  const isChecked = selected.includes(perm.id);
                  const isDestructive = perm.isDestructive;

                  let badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
                  if (perm.action === "create") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (perm.action === "edit") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  if (perm.action === "delete") badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                  if (perm.action === "manage") badgeColor = "bg-violet-50 text-violet-700 border-violet-200";

                  return (
                    <label
                      key={perm.id}
                      className={`flex flex-col justify-between p-3.5 cursor-pointer select-none transition-all ${
                        isChecked
                          ? isDestructive
                            ? "bg-rose-50/50 hover:bg-rose-50/80"
                            : "bg-cyan-50/50 hover:bg-cyan-50/80"
                          : "bg-white hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(perm.id)}
                          className="w-4 h-4 rounded border-slate-300 text-cyan-600 accent-cyan-600 cursor-pointer mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 leading-snug">
                              {perm.label}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${badgeColor}`}>
                              {perm.action}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1 line-clamp-2">
                            {perm.desc}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Staff Form Modal ─────────────────────────────────────────────────────────
const StaffModal = ({ isOpen, onClose, onSave, initial }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        ...EMPTY_FORM,
        ...initial,
        permissions: Array.isArray(initial.permissions) ? initial.permissions : [],
        emergencyContact: initial.emergencyContact || { name: "", relation: "", phone: "" },
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setEC = (field, value) =>
    setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-all animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[88vh] sm:max-h-[92vh] flex flex-col overflow-hidden border-t sm:border border-slate-200/90 animate-slide-up sm:animate-[fadeIn_0.2s_ease-out]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {initial ? "Edit Staff Member" : "Add Staff Member"}
            </h2>
            <p className="text-[11px] font-medium text-slate-500">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-6">

            {/* ── Personal Info ── */}
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Maya Kapoor" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="staff@clinic.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input required value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+91 98765 00000" className={inputCls} />
                </div>
              </div>
            </div>

            {/* ── Emergency Contact ── */}
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input value={form.emergencyContact.name} onChange={(e) => setEC("name", e.target.value)} placeholder="Jane Doe" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Relation</label>
                  <input value={form.emergencyContact.relation} onChange={(e) => setEC("relation", e.target.value)} placeholder="Spouse" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input value={form.emergencyContact.phone} onChange={(e) => setEC("phone", e.target.value)} placeholder="+91 98765 00001" className={inputCls} />
                </div>
              </div>
            </div>

            {/* ── Employment ── */}
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Role *</label>
                  <select
                    required
                    value={form.employment}
                    onChange={(e) => {
                      const role = e.target.value;
                      set("employment", role);
                      const preset = getPresetByRole(role);
                      if (preset && (!form.permissions || form.permissions.length === 0 || !initial)) {
                        set("permissions", preset.permissions);
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Select role...</option>
                    {EMPLOYMENT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
                  <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={inputCls}>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                  <input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Senior Skin Care Assistant" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                  <input required value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Operations" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Joining</label>
                  <input type="date" value={form.dateOfJoining ? form.dateOfJoining.slice(0, 10) : ""} onChange={(e) => set("dateOfJoining", e.target.value)} className={inputCls + " text-slate-600"} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Permissions ── */}
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">
                Permissions
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Select the modules this staff member can access.
                {form.permissions.length > 0 && (
                  <span className="ml-1 font-semibold text-cyan-600">{form.permissions.length} selected</span>
                )}
              </p>
              <PermissionSelector
                selected={form.permissions}
                onChange={(perms) => set("permissions", perms)}
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0 bg-white">
          <p className="hidden sm:block text-[11px] font-medium text-slate-500">Fields marked * are required</p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staff-form"
              disabled={saving}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-cyan-700 disabled:opacity-70 transition-colors shadow-xs shadow-cyan-600/20 cursor-pointer text-center"
            >
              {saving ? "Saving..." : initial ? "Save Changes" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Quick Permissions Focused Modal ─────────────────────────────────────────
export const QuickPermissionsModal = ({ isOpen, onClose, staff, onSave }) => {
  const [perms, setPerms] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setPerms(Array.isArray(staff.permissions) ? staff.permissions : []);
    }
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(staff._id, perms);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update privileges.");
    } finally {
      setSaving(false);
    }
  };

  const initials = staff.fullName
    ? staff.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-all animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border-t sm:border border-slate-200/90 animate-slide-up sm:animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-black text-violet-800 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {staff.fullName}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {staff.employment || "Staff"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Quick privileges editor & role template assignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4">
          <PermissionSelector
            selected={perms}
            onChange={setPerms}
            currentRole={staff.employment}
          />
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0 bg-white">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            {perms.length} privileges currently active
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-1/2 sm:w-auto px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-cyan-700 disabled:opacity-70 transition-colors shadow-xs shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Privileges"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Staff Page ──────────────────────────────────────────────────────────
export const Staff = () => {
  const navigate = useNavigate();
  const { syncStaffPermissions, hasPermission } = useContext(ContextProvider);
  const canManageStaff = hasPermission ? Boolean(hasPermission('MANAGE_STAFF')) : false;
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter]     = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permTarget, setPermTarget]       = useState(null);

  const token = getToken();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff(token);
      const list = Array.isArray(data) ? data : data?.data || data?.staff || [];
      setStaffList(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSave = async (payload) => {
    if (editTarget) {
      await updateStaff(token, editTarget._id, payload);
      toast.success("Staff member updated!");
    } else {
      await createStaff(token, payload);
      toast.success("Staff member added!");
    }
    await fetchStaff();
    if (syncStaffPermissions) {
      syncStaffPermissions();
    }
  };

  const handleSavePermissions = async (staffId, newPerms) => {
    const target = staffList.find(s => String(s._id) === String(staffId));
    if (!target) return;
    await updateStaff(token, staffId, { ...target, permissions: newPerms });
    toast.success(`Access privileges updated for ${target.fullName}`);
    await fetchStaff();
    if (syncStaffPermissions) {
      syncStaffPermissions();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await deleteStaff(token, id);
      toast.success("Staff member deleted.");
      await fetchStaff();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete staff.");
    }
  };

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (person) => { setEditTarget(person); setModalOpen(true); };
  const openPermissions = (person) => { setPermTarget(person); setPermModalOpen(true); };

  const exportStaffCSV = () => {
    if (staffList.length === 0) {
      toast.info("No staff records to export");
      return;
    }
    const headers = ["Full Name", "Email", "Phone", "Role", "Designation", "Department", "Status", "Date Joined", "Permissions Count", "Permissions List"];
    const rows = filtered.map(s => [
      `"${s.fullName || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phoneNumber || ''}"`,
      `"${s.employment || ''}"`,
      `"${s.designation || ''}"`,
      `"${s.department || ''}"`,
      `"${s.status || ''}"`,
      `"${s.dateOfJoining ? s.dateOfJoining.slice(0, 10) : ''}"`,
      s.permissions ? s.permissions.length : 0,
      `"${(s.permissions || []).join('; ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Staff roster exported to CSV");
  };

  const statuses = ["ALL", ...new Set(staffList.map((s) => s.status).filter(Boolean))];
  const roleFilters = ["ALL", "RECEPTIONIST", "NURSE", "BILLING", "ADMIN", "TECHNICIAN"];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return staffList.filter((s) => {
      const fields = [
        s.fullName, s.email, s.phoneNumber,
        s.employment, s.designation, s.department, s.employmentType,
        ...(s.permissions || []),
      ];
      const matchSearch  = !term || fields.some((f) => f?.toLowerCase().includes(term));
      const matchStatus  = statusFilter === "ALL" || s.status === statusFilter;
      const matchRole    = roleFilter === "ALL" || s.employment === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [staffList, query, statusFilter, roleFilter]);

  const activeCount   = staffList.filter((s) => s.status === "ACTIVE").length;
  const frontDeskCount = staffList.filter((s) => s.employment === "RECEPTIONIST" || s.employment === "BILLING").length;
  const clinicalCount  = staffList.filter((s) => s.employment === "NURSE" || s.employment === "TECHNICIAN" || s.employment === "ADMIN").length;
  const totalPermCount = useMemo(() => getAllPermissions().length, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 pb-28 sm:pb-32 md:pb-6">

      {/* Header */}
      <section className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Staff & Access</h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/80">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Manage clinic workforce, role templates, and granular module privileges.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportStaffCSV}
            title="Export staff roster to CSV"
            className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          {canManageStaff && (
            <button onClick={openAdd} className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs shadow-cyan-600/20 cursor-pointer active:scale-95">
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          )}
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Metric title="Team Members"  value={loading ? "—" : staffList.length} caption="Total registered staff"  icon={UsersRound}  color="text-cyan-600" bg="bg-cyan-50" />
        <Metric title="Active on Duty" value={loading ? "—" : activeCount}      caption="Active status records"    icon={UserCheck}   color="text-emerald-600" bg="bg-emerald-50" />
        <Metric title="Front & Billing" value={loading ? "—" : frontDeskCount} caption="Reception & Invoicing"  icon={Sparkles}    color="text-sky-600" bg="bg-sky-50" />
        <Metric title="Clinical & Lab" value={loading ? "—" : clinicalCount}   caption="Nurses, Techs & Admin"   icon={ShieldCheck} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Table Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs ring-1 ring-slate-100/70">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 bg-slate-50/80 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, role, department, permission..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none shadow-xs focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-1 border-t border-slate-200/50">
            {roleFilters.map((r) => {
              const count = r === "ALL" 
                ? staffList.length 
                : staffList.filter(s => s.employment === r).length;
              const isSelected = roleFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{r === "ALL" ? "All Roles" : r.charAt(0) + r.slice(1).toLowerCase()}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
            <span className="text-sm font-medium">Loading staff...</span>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards (< 768px) - Modern, informative card view */}
            <div className="md:hidden divide-y divide-slate-100 bg-slate-50/40 p-2.5 sm:p-3 space-y-2.5">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200">
                  {staffList.length === 0
                    ? "No staff members found. Add your first staff member."
                    : "No staff members match your search."}
                </div>
              ) : (
                filtered.map((person) => {
                  const initials = person.fullName
                    ? person.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
                    : "?";
                  const perms = Array.isArray(person.permissions) ? person.permissions : [];
                  const matched = STAFF_ROLE_PRESETS.find((preset) => {
                    if (preset.permissions.length !== perms.length) return false;
                    return preset.permissions.every((p) => perms.includes(p));
                  });

                  return (
                    <div
                      key={person._id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                    >
                      {/* Top Row: Avatar + Name + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/staff/${person._id}`, { state: { staff: person } })}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-xs font-black text-cyan-800 shrink-0 shadow-xs shadow-cyan-500/10">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm truncate hover:text-cyan-600 transition-colors">
                              {person.fullName}
                            </h4>
                            <p className="text-xs font-medium text-slate-500 truncate">
                              {person.designation || person.department || "Staff Member"}
                            </p>
                          </div>
                        </div>

                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${statusStyle[person.status] || "border-slate-200 bg-slate-100 text-slate-500"}`}>
                          {person.status?.replace(/_/g, " ") || "—"}
                        </span>
                      </div>

                      {/* Middle Row: Role pill + Privileges Badge */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${employmentStyle[person.employment] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
                          <KeyRound className="w-3 h-3" />
                          {person.employment || "—"}
                        </span>

                        {matched ? (
                          <button
                            type="button"
                            onClick={() => openPermissions(person)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-violet-600" />
                            <span>{matched.badge}</span>
                            <span className="text-[10px] bg-violet-200/60 text-violet-800 px-1 rounded-full font-bold">
                              {perms.length}
                            </span>
                          </button>
                        ) : perms.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openPermissions(person)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3 text-cyan-600" />
                            <span>Custom ({perms.length}/{totalPermCount})</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            No Access
                          </span>
                        )}
                      </div>

                      {/* Contact Preview if available */}
                      {(person.phoneNumber || person.email) && (
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          {person.phoneNumber && (
                            <a
                              href={`tel:${person.phoneNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-cyan-700 font-medium truncate"
                            >
                              📞 {person.phoneNumber}
                            </a>
                          )}
                          {person.email && (
                            <span className="text-slate-400 truncate text-[11px]">
                              ✉️ {person.email}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Row Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => navigate(`/staff/${person._id}`, { state: { staff: person } })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-600" /> Profile
                        </button>

                        <div className="flex items-center gap-1">
                          {canManageStaff && (
                            <button
                              type="button"
                              onClick={() => openPermissions(person)}
                              title="Quick Manage Privileges"
                              className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canManageStaff && (
                            <button
                              type="button"
                              onClick={() => openEdit(person)}
                              title="Edit Staff"
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-cyan-600" />
                            </button>
                          )}
                          {canManageStaff && (
                            <button
                              type="button"
                              onClick={() => handleDelete(person._id)}
                              title="Delete Staff"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Staff Member</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Role / Type</th>
                    <th className="px-5 py-3.5">Permissions</th>
                    <th className="px-5 py-3.5">Date Joined</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-16 text-center text-sm font-medium text-slate-500">
                        {staffList.length === 0
                          ? "No staff members found. Add your first staff member."
                          : "No staff members match your search."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((person) => {
                      const initials = person.fullName
                        ? person.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
                        : "?";
                      const joinedDate = person.dateOfJoining
                        ? new Date(person.dateOfJoining).toLocaleDateString()
                        : "—";
                      return (
                        <tr key={person._id} className="hover:bg-cyan-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => navigate(`/staff/${person._id}`, { state: { staff: person } })}
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-xs font-black text-cyan-800 shrink-0">{initials}</div>
                              <div>
                                <p className="font-bold text-slate-900 hover:text-cyan-600 transition-colors">{person.fullName}</p>
                                <p className="text-xs font-medium text-slate-500">{person.designation || "—"}</p>
                                <p className="text-[11px] text-slate-400">{person.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{person.department || "—"}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${employmentStyle[person.employment] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
                              <KeyRound className="w-3 h-3" />{person.employment || "—"}
                            </span>
                            {person.employmentType && (
                              <p className="text-[10px] text-slate-400 mt-1">{person.employmentType.replace(/_/g, " ")}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {(() => {
                              const perms = Array.isArray(person.permissions) ? person.permissions : [];
                              const matched = STAFF_ROLE_PRESETS.find((preset) => {
                                if (preset.permissions.length !== perms.length) return false;
                                return preset.permissions.every((p) => perms.includes(p));
                              });

                              return (
                                <div className="flex items-center gap-1.5">
                                  {matched ? (
                                    <button
                                      type="button"
                                      onClick={() => openPermissions(person)}
                                      title="Click to view or edit privileges"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200/80 hover:bg-violet-100 transition-all cursor-pointer shadow-2xs group"
                                    >
                                      <Sparkles className="w-3 h-3 text-violet-600 group-hover:scale-110 transition-transform" />
                                      <span>{matched.badge}</span>
                                      <span className="text-[10px] bg-violet-200/60 text-violet-800 px-1.5 py-0.2 rounded-full font-bold">
                                        {perms.length}
                                      </span>
                                    </button>
                                  ) : perms.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => openPermissions(person)}
                                      title="Click to view or edit privileges"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/80 hover:bg-cyan-100 transition-all cursor-pointer shadow-2xs group"
                                    >
                                      <KeyRound className="w-3 h-3 text-cyan-600 group-hover:scale-110 transition-transform" />
                                      <span>Custom</span>
                                      <span className="text-[10px] bg-cyan-200/60 text-cyan-900 px-1.5 py-0.2 rounded-full font-bold">
                                        {perms.length}/{totalPermCount}
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openPermissions(person)}
                                      title="No privileges assigned - click to grant"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/70 transition-colors cursor-pointer"
                                    >
                                      <span>No Access</span>
                                      <span className="text-[10px]">(0/{totalPermCount})</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-600">{joinedDate}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[person.status] || "border-slate-200 bg-slate-100 text-slate-500"}`}>
                              {person.status?.replace(/_/g, " ") || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`/staff/${person._id}`, { state: { staff: person } })}
                                title="View Staff Details"
                                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-cyan-600" />
                              </button>
                              {canManageStaff && (
                                <button
                                  onClick={() => openPermissions(person)}
                                  title="Quick Manage Privileges"
                                  className="p-1.5 border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-200 text-violet-600 transition-colors rounded-lg cursor-pointer"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                              {canManageStaff && (
                                <button onClick={() => openEdit(person)} title="Edit Staff Profile" className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 transition-colors rounded-lg cursor-pointer">
                                  <Edit className="w-4 h-4 text-cyan-600" />
                                </button>
                              )}
                              {canManageStaff && (
                                <button onClick={() => handleDelete(person._id)} title="Delete Staff" className="p-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors rounded-lg cursor-pointer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer count */}
        {!loading && (
          <div className="p-3 sm:p-4 border-t border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
            Showing {filtered.length} of {staffList.length} staff members
          </div>
        )}
      </section>

      {/* Staff Profile Modal */}
      <StaffModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* Quick Permissions Modal */}
      <QuickPermissionsModal
        isOpen={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        staff={permTarget}
        onSave={handleSavePermissions}
      />

      {/* Mobile Floating Action Button (FAB) */}
      {canManageStaff && (
        <button
          onClick={openAdd}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Add Staff"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

// ─── Metric card ──────────────────────────────────────────────────────────────
const Metric = ({ title, value, caption, icon: Icon, color, bg = "bg-cyan-50" }) => (
  <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="mt-1 text-xs font-medium text-slate-400">{caption}</p>
  </section>
);
