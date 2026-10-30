import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Stethoscope, 
  UserCheck, 
  Activity, 
  Clock, 
  Eye, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Calendar 
} from 'lucide-react';
import { PatientKpi } from './SharedKpis';
import { ContextProvider } from '../../context/store';
import { DataPageSkeleton } from '../DataPageSkeleton';
import { ROLES } from '../../utils/rbac';

export const Doctors = ({ onAddDoctor }) => {
  const navigate = useNavigate();
  const { Doctors, setIsEditClick, setSelectedPatientData, DoctorDelete, loading, userRole } = useContext(ContextProvider);
  const [searchValue, setSearchValue] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (loading?.doctors) return <DataPageSkeleton />;
  
  const doctorsList = Array.isArray(Doctors?.data) ? Doctors.data : Array.isArray(Doctors) ? Doctors : [];
  const specializations = [...new Set(doctorsList.map((doctor) => doctor?.specialization).filter(Boolean))].sort();
  const activeDoctors = doctorsList.filter((doctor) => String(doctor?.status || '').toLowerCase() === 'active');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time) => {
    if (!time || !/^\d{1,2}:\d{2}/.test(time)) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const onShiftDoctors = activeDoctors.filter((doctor) => {
    const start = toMinutes(doctor.shift_start_time);
    const end = toMinutes(doctor.shift_end_time);
    if (start === null || end === null) return false;
    return start <= end ? currentMinutes >= start && currentMinutes <= end : currentMinutes >= start || currentMinutes <= end;
  });
  const doctorsWithExperience = doctorsList.filter((doctor) => Number.isFinite(Number(doctor?.experience_years)));
  const averageExperience = doctorsWithExperience.length
    ? Math.round(doctorsWithExperience.reduce((total, doctor) => total + Number(doctor.experience_years), 0) / doctorsWithExperience.length)
    : '—';
  
  const filteredDoctors = doctorsList.filter((d) => {
    const searchLower = searchValue.toLowerCase();
    const nameMatch = d?.full_name?.toLowerCase()?.includes(searchLower);
    const specMatch = d?.specialization?.toLowerCase()?.includes(searchLower);
    const phoneMatch = String(d?.phone || '').includes(searchValue);
    const emailMatch = d?.email?.toLowerCase()?.includes(searchLower);
    const matchesSearch = !searchValue || nameMatch || specMatch || phoneMatch || emailMatch;
    const matchesSpecialization = specializationFilter === 'ALL' || d?.specialization === specializationFilter;
    const matchesStatus = statusFilter === 'ALL' || String(d?.status || 'Unknown') === statusFilter;
    
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 pb-28 sm:pb-32 md:pb-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Doctors Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {doctorsList.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Manage medical specialists, clinic qualifications, and duty shifts.</p>
        </div>
        {userRole === ROLES.ADMIN && (
          <button 
            onClick={onAddDoctor} 
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 border border-cyan-600 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-cyan-600/20 text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <PatientKpi title="Total Doctors" value={doctorsList.length} subtext="Registered staff" icon={Stethoscope} />
        <PatientKpi title="Active Doctors" value={activeDoctors.length} subtext="Current active status" icon={UserCheck} />
        <PatientKpi title="On Shift" value={onShiftDoctors.length} subtext="Working right now" icon={Activity} />
        <PatientKpi title="Avg Exp." value={averageExperience} subtext={doctorsWithExperience.length ? "Years of experience" : "Experience not available"} icon={Clock} />
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xs overflow-hidden ring-1 ring-slate-100/70">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 flex flex-col gap-3 bg-slate-50/80">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between w-full">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, specialization, phone..."
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
              <div className="relative">
                <select 
                  value={specializationFilter} 
                  onChange={(event) => setSpecializationFilter(event.target.value)} 
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  <option value="ALL">All Specializations</option>
                  {specializations.map((specialization) => (
                    <option key={specialization} value={specialization}>{specialization}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={statusFilter} 
                  onChange={(event) => setStatusFilter(event.target.value)} 
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Quick Filter Chips (md:hidden) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 hide-scrollbar">
            <button
              onClick={() => { setStatusFilter("ALL"); setSpecializationFilter("ALL"); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "ALL" && specializationFilter === "ALL"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({doctorsList.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "Active" ? "ALL" : "Active")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "Active"
                  ? "bg-cyan-600 text-white shadow-cyan-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Active ({activeDoctors.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "On Leave" ? "ALL" : "On Leave")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                statusFilter === "On Leave"
                  ? "bg-amber-600 text-white shadow-amber-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              On Leave
            </button>
            {specializations.slice(0, 3).map((spec) => (
              <button
                key={spec}
                onClick={() => setSpecializationFilter(specializationFilter === spec ? "ALL" : spec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all shadow-xs ${
                  specializationFilter === spec
                    ? "bg-cyan-600 text-white shadow-cyan-600/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Mobile List (< 768px) - Rich Tactile Mobile App Cards */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/30">
          {filteredDoctors && filteredDoctors.length > 0 ? (
            filteredDoctors.map((item) => {
              const initials = item?.full_name ? item.full_name.substring(0, 2).toUpperCase() : "DR";
              const isActive = String(item?.status || '').toLowerCase() === 'active';

              return (
                <div
                  key={item._id || Math.random()}
                  onClick={() => navigate(`/doctors/${item._id || item.id}`, { state: { doctor: item } })}
                  className="p-4 bg-white hover:bg-slate-50/80 active:bg-cyan-50/20 transition-all cursor-pointer group"
                >
                  {/* Top: Avatar, Name, Specialization, Status Badge & Chevron */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm capitalize truncate group-hover:text-cyan-700 transition-colors">
                          Dr. {item?.full_name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-100 font-bold text-[10px]">
                            {item?.specialization || 'Skin Care Practitioner'}
                          </span>
                          {item?.experience_years && (
                            <span className="text-slate-500 text-[11px]">
                              • {item.experience_years} yrs exp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {item?.status || 'Unknown'}
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Phone & Working Shift */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Phone button */}
                    {item?.phone ? (
                      <a
                        href={`tel:${item.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 active:scale-95 text-xs font-semibold transition-all"
                        title="Call doctor"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.phone}</span>
                      </a>
                    ) : item?.email ? (
                      <a
                        href={`mailto:${item.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[140px]">{item.email}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No contact info</span>
                    )}

                    {/* Shift Pill */}
                    {(item?.shift_start_time || item?.shift_end_time) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{item.shift_start_time || '9:00'} - {item.shift_end_time || '17:00'}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Strip */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctors/${item._id || item.id}`, { state: { doctor: item } });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-600" />
                      <span>View</span>
                    </button>

                    {userRole === ROLES.ADMIN && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditClick(true);
                            setSelectedPatientData(item);
                            if (onAddDoctor) onAddDoctor();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this doctor?")) {
                              DoctorDelete(item._id);
                            }
                          }}
                          className="p-1 rounded-lg bg-white hover:bg-rose-50 text-rose-500 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50/50 p-4">
              <Stethoscope className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider">No doctors found {searchValue ? `for "${searchValue}"` : ""}</span>
            </div>
          )}
        </div>

        {/* 2. Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse saas-table">
            <thead>
              <tr>
                <th className="w-12"><input type="checkbox" className="rounded border-slate-300 text-cyan-600 accent-cyan-600 focus:ring-cyan-500/20" /></th>
                <th>Doctor</th>
                <th>Contact</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Status</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors && filteredDoctors.length > 0 ? filteredDoctors.map((item) => {
                const initials = item?.full_name ? item.full_name.substring(0, 2).toUpperCase() : "DR";

                return (
                  <tr key={item._id || Math.random()} className="group">
                    <td><input type="checkbox" className="rounded border-slate-300 text-cyan-600 accent-cyan-600 focus:ring-cyan-500/20" /></td>
                    <td>
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(`/doctors/${item._id || item.id}`, { state: { doctor: item } })}
                      >
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shadow-xs">
                          {initials}
                        </div>
                        <span className="font-extrabold text-slate-900 capitalize group-hover:text-cyan-700 transition-colors">Dr. {item?.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{item?.phone || "No phone"}</span>
                        <span className="text-slate-400 text-xs font-medium">{item?.email || "No email"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-1 rounded-lg text-xs">{item?.specialization}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-700">{item?.experience_years ? `${item.experience_years} yrs` : '—'}</span>
                    </td>
                    <td>
                      {item?.status === 'Active' ? (
                        <span className="status-badge active">{item.status}</span>
                      ) : (
                        <span className="status-badge pending">{item?.status || "Unknown"}</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <button 
                          className="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                          title="View Doctor Details"
                          onClick={() => navigate(`/doctors/${item._id || item.id}`, { state: { doctor: item } })}
                        >
                          <Eye className="w-4 h-4 text-cyan-600" />
                        </button>
                        {userRole === ROLES.ADMIN && (
                          <>
                            <button 
                              className="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                              title="Edit Doctor"
                              onClick={() => { setIsEditClick(true); setSelectedPatientData(item); if (onAddDoctor) onAddDoctor(); }}>
                              <Edit className="w-4 h-4 text-cyan-600" />
                            </button>
                            <button 
                              className="p-1.5 border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors rounded-lg cursor-pointer"
                              title="Delete Doctor"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this doctor?")) {
                                  DoctorDelete(item._id);
                                }
                              }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-cyan-600" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {searchValue ? `No doctors found for "${searchValue}"` : "No doctors found. Create one to get started!"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination */}
        <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
          <div>Showing 1-{filteredDoctors.length} of {filteredDoctors.length}</div>
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
                <button className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs" disabled><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs" disabled><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {userRole === ROLES.ADMIN && (
        <button
          onClick={onAddDoctor}
          className="md:hidden fixed bottom-20 right-4 z-40 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full shadow-lg shadow-cyan-600/30 flex items-center gap-2 font-bold text-xs uppercase tracking-wider active:scale-95 hover:shadow-cyan-600/40 transition-all cursor-pointer"
          aria-label="Add Doctor"
        >
          <Plus className="w-4 h-4" />
          <span>Doctor</span>
        </button>
      )}
    </div>
  );
};
export default Doctors;
