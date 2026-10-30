import React, { useContext, useState } from 'react';
import { Stethoscope, X } from 'lucide-react';
import { ContextProvider } from '../context/store';

const DoctorFormModal = ({ isOpen, onClose }) => {
  const { Doctors, CreateDoctor, selectedPatientData, DoctorEdit } = useContext(ContextProvider);
  const [isLoading, setisLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    specialization: "",
    phone: "",
    email: "",
    experience_years: "",
    shift_start_time: "",
    shift_end_time: "",
    working_days: "",
    consultation_fee: "",
    status: "Active"
  });

  React.useEffect(() => {
    if (isOpen && selectedPatientData) {
      setFormData({
        ...selectedPatientData,
        working_days: Array.isArray(selectedPatientData.working_days) ? selectedPatientData.working_days.join(', ') : selectedPatientData.working_days
      });
    } else if (isOpen && !selectedPatientData) {
      setFormData({
        full_name: "",
        specialization: "",
        phone: "",
        email: "",
        experience_years: "",
        shift_start_time: "",
        shift_end_time: "",
        working_days: "",
        consultation_fee: "",
        status: "Active"
      });
    }
  }, [isOpen, selectedPatientData]);

  if (!isOpen) return null;

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setisLoading(true);
      const payload = {
        ...formData,
        qualifications: formData.qualifications || ["BDS"]
      };
      if (selectedPatientData) {
        await DoctorEdit(selectedPatientData._id, payload);
      } else {
        await CreateDoctor(payload);
      }
      if (onClose) onClose();
      setisLoading(false);
      setFormData({
        full_name: "",
        specialization: "",
        phone: "",
        email: "",
        experience_years: "",
        shift_start_time: "",
        shift_end_time: "",
        working_days: "",
        consultation_fee: "",
        status: "Active"
      });
    } catch (error) {
      console.log('error', error);
      setisLoading(false);
      if (onClose) onClose();
      setFormData({
        full_name: "",
        specialization: "",
        phone: "",
        email: "",
        experience_years: "",
        shift_start_time: "",
        shift_end_time: "",
        working_days: "",
        consultation_fee: "",
        status: "Active"
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-all animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white border-t sm:border border-slate-200/90 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] animate-slide-up sm:animate-[fadeIn_0.2s_ease-out]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {selectedPatientData ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <p className="text-[11px] font-medium text-slate-500">
                {selectedPatientData ? 'Update professional and schedule details' : 'Professional and schedule details'}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close doctor form" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-5 sm:px-7 py-6 overflow-y-auto bg-slate-50/40 flex-1 overscroll-contain">
          <form id="doctor-form" onSubmit={handleSubmit} className="space-y-7 [&_input]:border-slate-200 [&_input]:shadow-xs [&_select]:border-slate-200 [&_select]:shadow-xs">
            {/* Professional Info */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="Dr. Sarah Jenkins" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization *</label>
                  <select name="specialization" value={formData.specialization} onChange={handleChange} required className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white">
                    <option value="">Select Specialization</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Prosthodontics">Prosthodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Aesthetic Dermatology">Aesthetic Dermatology</option>
                    <option value="Skin Care">Skin Care</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (Years) *</label>
                  <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} required min="0" className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="e.g. 8" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Fee (₹)</label>
                  <input type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} min="0" className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule & Contact */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Schedule & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="doctor@hospital.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Working Days</label>
                  <input type="text" name="working_days" value={formData.working_days} onChange={handleChange} className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" placeholder="e.g. Mon, Wed, Fri" />
                </div>
                <div className="block">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Shift Start Time </label>
                  <input type="time" name="shift_start_time" value={formData.shift_start_time} onChange={handleChange} className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" />
                </div>
                <div className="block">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Shift End Time </label>
                  <input type="time" name="shift_end_time" value={formData.shift_end_time} onChange={handleChange} className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white" />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 flex justify-between items-center gap-3 bg-white shrink-0">
          <p className="hidden sm:block text-[11px] font-medium text-slate-500">Fields marked with * are required</p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="doctor-form"
              disabled={isLoading}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shadow-cyan-600/20 disabled:opacity-70 cursor-pointer text-center transition-all"
            >
              {isLoading ? 'Saving...' : selectedPatientData ? 'Save Changes' : 'Add Doctor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorFormModal;
