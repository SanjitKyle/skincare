import React, { useContext, useState } from 'react';
import { 
  Building2, User, Mail, Lock, Phone, MapPin, 
  Sparkles, ArrowRight, Eye, EyeOff, ShieldCheck, 
  CheckCircle2, Calendar, Stethoscope, Activity 
} from 'lucide-react';
import { registerClinic } from '../services/auth';
import { ContextProvider } from '../context/store';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export const RegisterClinic = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useContext(ContextProvider);

  const [formData, setFormData] = useState({
    clinicName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    specialization: 'Dermatology & Skin Care',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await registerClinic(formData);

      if (res.data?.success) {
        // Save auth data to localStorage
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        if (setIsAuthenticated) setIsAuthenticated(true);
        if (onRegisterSuccess) onRegisterSuccess();

        toast.success(`🎉 Welcome to ${formData.clinicName}! Your 14-day free trial is now active.`);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Registration failed. Please verify the information entered.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to register clinic. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left side - Registration Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto">
        <div className="w-full max-w-xl my-auto">
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between gap-3 mb-8">
            <Link to="/login" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-cyan-600 via-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/25 group-hover:scale-105 transition-transform">
                <Activity className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Ky<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">doc</span>
              </span>
            </Link>

            {/* Free Trial Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>14-Day Free Trial</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Start your Clinic's Free Trial
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Create your clinic workspace in under a minute. No credit card required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Section 1: Clinic Information */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Building2 className="w-4 h-4 text-cyan-600" />
                Clinic Details
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Skin Care Clinic Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Radiant Skin & Aesthetics Clinic"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    City <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    State / Province <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Clinic Street Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 102 Crystal Heights, Station Road"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Section 2: Owner / Lead Doctor Account */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <User className="w-4 h-4 text-cyan-600" />
                Clinic Administrator / Doctor Account
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Practitioner / Owner Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Dr. Asha Patel"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Specialization
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Dermatology / Aesthetic Skin Care"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="practitioner@skinclinic.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a secure password (min. 6 chars)"
                    className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600 transition-all font-medium placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-600 via-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/25 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Clinic & Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already have a clinic account?{' '}
              <Link to="/login" className="text-cyan-600 font-bold hover:text-cyan-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Informative SaaS Hero */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-600/20 rounded-full blur-[100px] mix-blend-screen translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-teal-600/20 rounded-full blur-[100px] mix-blend-screen -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col h-full justify-center text-white max-w-md mx-auto">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-200 mb-6 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              Skin Care Clinic Management
            </div>

            <h2 className="text-3xl font-extrabold leading-tight mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-300">
              Your Entire Practice In One Seamless Platform.
            </h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Manage appointments, client records, product orders, and billing in one workspace.
            </p>
          </div>

          {/* Value Props */}
          <div className="space-y-4 border-t border-white/10 pt-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Full Data Isolation</h4>
                <p className="text-xs text-slate-400">Your patients and records are completely private to your clinic workspace.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Appointments & Follow-ups</h4>
                <p className="text-xs text-slate-400">Keep clinic scheduling and client follow-ups organized.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">14-Day Full Access Trial</h4>
                <p className="text-xs text-slate-400">Zero upfront fees. Invite your doctors, receptionists, and staff right away.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;
