import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Activity,
  Clock,
  Eye,
  Phone,
  Calendar,
  Stethoscope,
  Plus,
  X,
} from "lucide-react";
import { PatientKpi } from "./SharedKpis";
import { ContextProvider } from "../../context/store";
import PatientFormModal from "../PatientFormModal";
import { DataPageSkeleton } from "../DataPageSkeleton";

export const Patients = ({ onAddPatient }) => {
  const navigate = useNavigate();
  const {
    Patients,
    setIsEditClick,
    setSelectedPatientData,
    PatientDelete,
    loading,
    hasPermission,
  } = useContext(ContextProvider);

  const canCreatePatient = hasPermission ? Boolean(hasPermission('CREATE_PATIENT')) : false;
  const canEditPatient = hasPermission ? Boolean(hasPermission('EDIT_PATIENT')) : false;
  const canDeletePatient = hasPermission ? Boolean(hasPermission('DELETE_PATIENT')) : false;

  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  if (loading?.patients) return <DataPageSkeleton />;

  const patientsList = Array.isArray(Patients?.data)
    ? Patients.data
    : Array.isArray(Patients)
    ? Patients
    : [];

  const patientAges = patientsList
    .map((patient) => {
      if (!patient?.date_of_birth) return null;
      const birthDate = new Date(patient.date_of_birth);
      if (Number.isNaN(birthDate.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const birthdayHasPassed =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() >= birthDate.getDate());
      if (!birthdayHasPassed) age -= 1;
      return age >= 0 ? age : null;
    })
    .filter((age) => age !== null);

  const averageAge = patientAges.length
    ? Math.round(
        patientAges.reduce((total, age) => total + age, 0) / patientAges.length
      )
    : "—";

  const now = new Date();
  const newThisMonth = patientsList.filter((p) => {
    if (!p?.createdAt) return false;
    const d = new Date(p.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const activePatients = patientsList.filter((p) => p?.assigned_doctor_name).length;

  const filteredPatients = patientsList.filter((p) => {
    const searchLower = searchValue.toLowerCase();
    const nameMatch = p?.full_name?.toLowerCase()?.includes(searchLower);
    const phoneMatch = String(p?.phone || "").includes(searchValue);
    const matchesSearch = !searchValue || nameMatch || phoneMatch;

    const matchesType =
      typeFilter === "all" || p?.gender?.toLowerCase() === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "assigned" && p?.assigned_doctor_name) ||
      (statusFilter === "unassigned" && !p?.assigned_doctor_name);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 pb-28 sm:pb-32 md:pb-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Patients
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {patientsList.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage patient records, clinical history, and doctor assignments.
          </p>
        </div>
        {canCreatePatient && (
          <button
            onClick={() => {
              setSelectedPatientData(null);
              onAddPatient();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 border border-cyan-600 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-cyan-600/20 text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <PatientKpi
          title="Total Patients"
          value={patientsList.length || 0}
          subtext="vs last month"
          icon={Users}
          percentage="100"
          trendUp={true}
        />
        <PatientKpi
          title="New This Month"
          value={newThisMonth}
          subtext="this month"
          icon={UserPlus}
          percentage={patientsList.length ? Math.round((newThisMonth / patientsList.length) * 100) : 0}
          trendUp={newThisMonth > 0}
        />
        <PatientKpi
          title="Active Patients"
          value={activePatients}
          subtext="With assigned doctor"
          icon={Activity}
        />
        <PatientKpi
          title="Avg Age"
          value={averageAge}
          subtext={patientAges.length ? "Years old" : "Birth dates unavailable"}
          icon={Clock}
        />
      </div>

      {/* Main Table / Mobile Card Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xs overflow-hidden ring-1 ring-slate-100/70">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 flex flex-col gap-3 bg-slate-50/80">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between w-full">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-xs placeholder:text-slate-400"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filters (md+) */}
            <div className="hidden md:flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {/* ALL TYPES — filters by gender */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* ALL STATUS — filters by assigned doctor */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Quick Filter Chips (md:hidden) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 hide-scrollbar">
            <button
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "all" && typeFilter === "all"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({patientsList.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "assigned" ? "all" : "assigned")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "assigned"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Assigned ({activePatients})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "unassigned" ? "all" : "unassigned")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "unassigned"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Unassigned ({Math.max(0, patientsList.length - activePatients)})
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === "male" ? "all" : "male")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                typeFilter === "male"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === "female" ? "all" : "female")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                typeFilter === "female"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Mobile List (< 768px) - Rich Tactile App Cards */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/30">
          {filteredPatients && filteredPatients.length > 0 ? (
            filteredPatients.map((item) => {
              const initials = item?.full_name
                ? item.full_name.substring(0, 2).toUpperCase()
                : "PT";

              let ageStr = null;
              if (item?.date_of_birth) {
                const birthDate = new Date(item.date_of_birth);
                if (!Number.isNaN(birthDate.getTime())) {
                  const diff = Date.now() - birthDate.getTime();
                  const yrs = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
                  if (yrs >= 0) ageStr = `${yrs} yrs`;
                }
              }

              return (
                <div
                  key={item._id || Math.random()}
                  onClick={() => navigate(`/patients/${item._id || item.id}`, { state: { patient: item } })}
                  className="p-4 bg-white hover:bg-slate-50/80 active:bg-cyan-50/20 transition-all cursor-pointer group"
                >
                  {/* Top: Avatar, Name, Age/Gender, Blood group & Details Chevron */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm capitalize truncate group-hover:text-cyan-700 transition-colors">
                          {item?.full_name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium flex-wrap">
                          {ageStr && <span>{ageStr}</span>}
                          {item?.gender && (
                            <>
                              {ageStr && <span className="text-slate-300">•</span>}
                              <span className="capitalize">{item.gender}</span>
                            </>
                          )}
                          {item?.blood_group && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 font-bold text-[10px]">
                              {item.blood_group}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Middle Row: 1-Tap Phone & Doctor Assignment */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Phone button */}
                    {item?.phone ? (
                      <a
                        href={`tel:${item.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 active:scale-95 text-xs font-semibold transition-all"
                        title="Call patient"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No phone recorded</span>
                    )}

                    {/* Assigned Doctor */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-medium">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate max-w-[130px]">
                        {item?.assigned_doctor_name || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* Action Strip: View, Edit, Delete */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${item._id || item.id}`, { state: { patient: item } });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-600" />
                      <span>View</span>
                    </button>

                    {canEditPatient && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditClick(true);
                          onAddPatient();
                          setSelectedPatientData(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Edit</span>
                      </button>
                    )}

                    {canDeletePatient && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this patient?")) {
                            PatientDelete(item._id);
                          }
                        }}
                        className="p-1 rounded-lg bg-white hover:bg-rose-50 text-rose-500 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50/50 p-4">
              <Search className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider">
                No patients found{" "}
                {searchValue ? `for "${searchValue}"` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse saas-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    className="border-slate-300 text-cyan-600 accent-cyan-600 rounded-sm"
                  />
                </th>
                <th>Patient</th>
                <th>Contact</th>
                <th>Age</th>
                <th>BLOOD</th>
                <th>LAST VISIT</th>
                <th>DOCTOR</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients && filteredPatients.length > 0 ? (
                filteredPatients.map((item) => {
                  let age = "N/A";
                  if (item?.date_of_birth) {
                    const birthDate = new Date(item.date_of_birth);
                    const difference = Date.now() - birthDate.getTime();
                    age =
                      Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25)) +
                      " yrs";
                  }
                  const joinedDate = item?.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "N/A";
                  const initials = item?.full_name
                    ? item.full_name.substring(0, 2).toUpperCase()
                    : "PT";

                  return (
                    <tr key={item._id || Math.random()} className="group">
                      <td>
                        <input
                          type="checkbox"
                          className="border-slate-300 text-cyan-600 accent-cyan-600 rounded-sm"
                        />
                      </td>
                      <td>
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/patients/${item._id || item.id}`, { state: { patient: item } })}
                        >
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <span className="font-bold text-slate-900 capitalize hover:text-cyan-700 transition-colors">
                            {item?.full_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">
                            {item?.phone || "No phone"}
                          </span>
                          <span className="text-slate-500 text-xs font-medium">
                            {item?.email || "No email"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">
                            {age}
                          </span>
                          <span className="text-slate-500 text-xs font-medium mt-0.5">
                            Joined {joinedDate}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item?.blood_group ? (
                          <span className="status-badge active">
                            {item.blood_group}
                          </span>
                        ) : (
                          <span className="status-badge inactive">-</span>
                        )}
                      </td>
                      <td className="font-semibold text-slate-500">
                        {item?.last_visit
                          ? item?.last_visit
                          : new Date().toLocaleDateString()}
                      </td>
                      <td className="font-bold text-slate-500">
                        {item?.assigned_doctor_name || "—"}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100">
                          <button
                            className="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                            title="View Patient Details"
                            onClick={() => navigate(`/patients/${item._id || item.id}`, { state: { patient: item } })}
                          >
                            <Eye className="w-4 h-4 text-cyan-600" />
                          </button>
                          {canEditPatient && (
                            <button
                              className="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                              title="Edit Patient"
                              onClick={() => {
                                setIsEditClick(true);
                                onAddPatient();
                                setSelectedPatientData(item);
                              }}
                            >
                              <Edit className="w-4 h-4 text-cyan-600" />
                            </button>
                          )}
                          {canDeletePatient && (
                            <button
                              className="p-1.5 border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors rounded-lg cursor-pointer"
                              title="Delete Patient"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this patient?"
                                  )
                                ) {
                                  PatientDelete(item._id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-12 text-slate-500 bg-slate-50"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-slate-400" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        No patients found{" "}
                        {searchValue ? `for "${searchValue}"` : ""}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
          <div>
            Showing 1-{filteredPatients.length} of {filteredPatients.length}
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              Rows
              <button className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs">
                10 <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              Page 1 of 1
              <div className="flex items-center gap-1 ml-1">
                <button
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs"
                  disabled
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs"
                  disabled
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {canCreatePatient && (
        <button
          onClick={() => {
            setSelectedPatientData(null);
            onAddPatient();
          }}
          className="md:hidden fixed bottom-20 right-4 z-40 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full shadow-lg shadow-cyan-600/30 flex items-center gap-2 font-bold text-xs uppercase tracking-wider active:scale-95 hover:shadow-cyan-600/40 transition-all cursor-pointer"
          aria-label="Add Patient"
        >
          <Plus className="w-4 h-4" />
          <span>Patient</span>
        </button>
      )}
    </div>
  );
};
