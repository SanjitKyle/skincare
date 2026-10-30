import React, { useContext, useEffect, useState } from "react";
import { UserRoundPlus, X } from "lucide-react";
import { ContextProvider } from "../context/store";
import { toast } from "react-toastify";

const PatientFormModal = ({ isOpen, onClose }) => {
  const { PatientCreate, PatientEdit, Doctors, selectedPatientData } = useContext(ContextProvider);
  const [isLoading, setIsLoading] = useState(false);
  const [FormData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    height: "",
    weight: "",
    emergency_contact_name: "",
    emergencty_contact_phone: "",
    relation: "",
    age: "",
    assigned_doctor_id: "",
    assigned_doctor_name: "",
  });

  useEffect(() => {
    if (isOpen && selectedPatientData) {
      setFormData(selectedPatientData);
    } else if (isOpen && !selectedPatientData) {
      setFormData({
        full_name: "",
        date_of_birth: "",
        gender: "",
        blood_group: "",
        phone: "",
        email: "",
        address: "",
        note: "",
        height: "",
        weight: "",
        emergency_contact_name: "",
        emergencty_contact_phone: "",
        relation: "",
        assigned_doctor_id: "",
        assigned_doctor_name: "",
        age: "",
      });
    }
  }, [isOpen, selectedPatientData]);

  if (!isOpen) return null;

  function handleChange(e) {
    setFormData({ ...FormData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (selectedPatientData) {
        await PatientEdit(selectedPatientData._id, FormData);
        toast.success("Patient updated successfully!");
      } else {
        await PatientCreate(FormData);
        toast.success("Patient added successfully!");
      }
      if (onClose) onClose();
    } catch (error) {
      // Extract the API error message
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-all animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] border-t sm:border border-slate-200/90 animate-slide-up sm:animate-[fadeIn_0.2s_ease-out]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center">
              <UserRoundPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {selectedPatientData ? "Edit Patient" : "Add New Patient"}
              </h2>
              <p className="text-[11px] font-medium text-slate-500">Patient record and care details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close patient form"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-5 sm:px-7 py-6 overflow-y-auto bg-slate-50/40">
          <form
            id="patient-form"
            onSubmit={handleSubmit}
            className="space-y-7 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:text-sm [&_input]:shadow-xs [&_input]:focus:ring-2 [&_input]:focus:ring-cyan-500/20 [&_input]:focus:border-cyan-500 [&_select]:rounded-xl [&_select]:border-slate-200 [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:text-sm [&_select]:shadow-xs [&_select]:focus:ring-2 [&_select]:focus:ring-cyan-500/20 [&_select]:focus:border-cyan-500 [&_textarea]:rounded-xl [&_textarea]:border-slate-200 [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:shadow-xs [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-cyan-500/20 [&_textarea]:focus:border-cyan-500"
          >
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" name="full_name" value={FormData.full_name} onChange={handleChange} required className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={FormData.date_of_birth} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select name="gender" value={FormData.gender} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                  <select name="blood_group" value={FormData.blood_group} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600">
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Height (cm)</label>
                    <input type="number" name="height" value={FormData.height} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="175" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label>
                    <input type="number" name="weight" value={FormData.weight} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="70" />
                  </div>
                </div>
              </div>
            </div>

            {/* Care Team */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Care Team</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Doctor</label>
                  <select
                    name="assigned_doctor_id"
                    value={FormData.assigned_doctor_id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedDoc = Doctors?.data?.find((d) => d._id === selectedId);
                      setFormData({
                        ...FormData,
                        assigned_doctor_id: selectedId,
                        assigned_doctor_name: selectedDoc ? selectedDoc.full_name : "",
                      });
                    }}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
                  >
                    <option value="">Select...</option>
                    {Doctors?.data?.map((d, idx) => (
                      <option key={d._id || idx} value={d._id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input type="tel" name="phone" value={FormData.phone} onChange={handleChange} required className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" name="email" value={FormData.email} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="john@example.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" name="address" value={FormData.address} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="123 Wellness Way, Suite 100" />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" name="emergency_contact_name" value={FormData.emergency_contact_name} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" name="emergencty_contact_phone" value={FormData.emergencty_contact_phone} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="(555) 111-2222" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Relation</label>
                  <input type="text" name="relation" value={FormData.relation} onChange={handleChange} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Spouse" />
                </div>
              </div>
            </div>

            {/* Medical Notes */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2.5">Medical Notes</h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Allergies or Existing Conditions</label>
                <textarea name="note" value={FormData.note} onChange={handleChange} rows="3" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" placeholder="e.g. Allergic to Penicillin..."></textarea>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          <p className="hidden sm:block text-[11px] font-medium text-slate-500">Fields marked with * are required</p>
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
              form="patient-form"
              disabled={isLoading}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-70 transition-all shadow-xs shadow-cyan-600/20 cursor-pointer text-center"
            >
              {isLoading ? "Saving..." : selectedPatientData ? "Save Changes" : "Save Patient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientFormModal;
