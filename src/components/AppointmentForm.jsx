import React, { useContext, useEffect, useState } from "react";
import { ContextProvider } from "../context/store";
import { X, Calendar, Clock, User, Stethoscope } from 'lucide-react';

function AppointmentForm({ setClick, isFollowUp = false }) {
    const { Patients, Doctors, setIsEditClick, AppointmentCreate, selectedPatientData, AppointmentUpdate } = useContext(ContextProvider);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        patient: "",
        doctor: "",
        date: "",
        start_time: "",
        end_time: "",
        service: "",
        visit_type: "",
        reasonForVisit: "",
        status: "Scheduled"
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = selectedPatientData ? await AppointmentUpdate(formData, selectedPatientData?._id) : await AppointmentCreate(formData);
            setIsEditClick(false);
            if (setClick) setClick(false);
        } catch (error) {
            console.error('Failed to create appointment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onClose = () => {
        setIsEditClick(false);
        if (setClick) setClick(false);
    };

    useEffect(() => {
        if (selectedPatientData) {
            const formatTime = (timeStr) => {
                if (!timeStr) return "";
                if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
                if (/^\d{2}:\d{2}:\d{2}/.test(timeStr)) return timeStr.substring(0, 5);
                return timeStr;
            };

            setFormData({
                patient: selectedPatientData.patient?._id || selectedPatientData.patient || "",
                doctor: selectedPatientData.doctor?._id || selectedPatientData.doctor || "",
                date: selectedPatientData.date ? selectedPatientData.date.split('T')[0] : "",
                start_time: formatTime(selectedPatientData.start_time || selectedPatientData.starttime),
                end_time: formatTime(selectedPatientData.end_time || selectedPatientData.endtime),
                service: selectedPatientData.service || "",
                visit_type: selectedPatientData.visit_type || "",
                reasonForVisit: selectedPatientData.reasonForVisit || "",
                status: selectedPatientData.status || "Scheduled"
            });
        }
    }, [selectedPatientData]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-all animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] border-t sm:border border-slate-200/90 animate-slide-up sm:animate-[fadeIn_0.2s_ease-out]">
                
                {/* Mobile Bottom Sheet Grab Indicator */}
                <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        {selectedPatientData ? 'Edit Appointment' : isFollowUp ? 'Add New Follow-Up' : 'Book Appointment'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    <form id="appointment-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Participants */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-cyan-600" />
                                Participants
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Patient *</label>
                                    <select
                                        name="patient"
                                        value={formData.patient}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm text-slate-700 bg-white"
                                    >
                                        <option value="">Select Patient</option>
                                        {(Array.isArray(Patients?.data) ? Patients.data : Array.isArray(Patients) ? Patients : []).map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor *</label>
                                    <select
                                        name="doctor"
                                        value={formData.doctor}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm text-slate-700 bg-white"
                                    >
                                        <option value="">Select Doctor</option>
                                        {(Array.isArray(Doctors?.data) ? Doctors.data : Array.isArray(Doctors) ? Doctors : []).map((d) => (
                                            <option key={d._id} value={d._id}>
                                                {d.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-cyan-600" />
                                Scheduling
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleChange}
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visit Details */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-cyan-600" />
                                Visit Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Visit Type *</label>
                                    <select
                                        name="visit_type"
                                        value={formData.visit_type}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm text-slate-700 bg-white"
                                    >
                                        <option value="">Select Option</option>
                                        <option value="Consultation">Consultation</option>
                                        <option value="Follow-up">Follow-up</option>
                                        <option value="Routine Checkup">Routine Checkup</option>
                                        <option value="Emergency">Emergency</option>
                                        <option value="Telehealth/Online">Telehealth/Online</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Service</label>
                                    <input
                                        type="text"
                                        name="service"
                                        value={formData.service}
                                        onChange={handleChange}
                                        placeholder="e.g. Skin consultation or chemical peel"
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm bg-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reason For Visit</label>
                                    <textarea
                                        name="reasonForVisit"
                                        value={formData.reasonForVisit}
                                        onChange={handleChange}
                                        placeholder="Briefly describe the reason for the visit..."
                                        rows="2"
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm resize-none bg-white"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm text-slate-700 bg-white"
                                    >
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Follow-up">Follow-up</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3 bg-slate-50/80 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-1/2 sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer text-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="appointment-form"
                        disabled={isLoading}
                        className="w-1/2 sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 border border-cyan-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shadow-cyan-600/20 disabled:opacity-70 cursor-pointer text-center transition-all"
                    >
                        {isLoading ? 'Saving...' : (selectedPatientData ? 'Edit Appointment' : isFollowUp ? 'Add Follow-Up' : 'Add Appointment')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AppointmentForm;
