import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, Bell, ShieldCheck, Clock, Save, CheckCircle2, 
  Mail, Phone, MapPin, Globe, Sparkles, CreditCard, AlertCircle, Loader2
} from 'lucide-react';
import { getMyClinic, updateMyClinic } from '../../services/clinic';
import { ContextProvider } from '../../context/store';
import { toast } from 'react-toastify';

export const Settings = () => {
  const { currentUser, setUser } = useContext(ContextProvider);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicData, setClinicData] = useState(null);

  const [formData, setFormData] = useState({
    clinicName: '',
    tagline: 'Personalized Skin Care & Aesthetic Treatments',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    website: '',
    smsReminders: true,
    whatsappAlerts: true,
    emailReceipts: true,
    autoQueueCalling: true,
    twoFactorAuth: false,
    sessionTimeout: '30'
  });

  // Load clinic profile from backend
  useEffect(() => {
    let isMounted = true;
    const fetchClinic = async () => {
      try {
        setIsLoading(true);
        const res = await getMyClinic();
        const data = res?.data || res;
        if (isMounted && data) {
          setClinicData(data);
          setFormData((prev) => ({
            ...prev,
            clinicName: data.name || data.clinicName || currentUser?.clinicName || '',
            email: data.email || currentUser?.email || '',
            phone: data.phone || currentUser?.phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            website: data.website || '',
          }));
        }
      } catch (err) {
        console.warn('Could not load clinic from API, using currentUser info:', err);
        if (isMounted) {
          setFormData((prev) => ({
            ...prev,
            clinicName: currentUser?.clinicName || '',
            email: currentUser?.email || '',
            phone: currentUser?.phone || '',
          }));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClinic();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: formData.clinicName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        website: formData.website,
      };

      const res = await updateMyClinic(payload);
      const updatedClinic = res?.data || res;
      setClinicData(updatedClinic);

      // Also update localStorage so Header and Sidebar reflect the updated clinic name
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.data?.user) parsed.data.user.clinicName = formData.clinicName;
          if (parsed.user) parsed.user.clinicName = formData.clinicName;
          if (parsed.data?.clinic) parsed.data.clinic.name = formData.clinicName;
          localStorage.setItem('user', JSON.stringify(parsed));
          if (setUser) setUser(parsed);
        }
      } catch (e) {
        console.warn('Error updating clinic in localStorage', e);
      }

      setIsSaved(true);
      toast.success('Clinic settings updated successfully!');
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update clinic settings';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Clinic Profile', icon: Building2, desc: 'Name, contact & clinic details' },
    { id: 'subscription', label: 'SaaS Subscription', icon: CreditCard, desc: 'Plan status, trial & billing' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, desc: 'SMS, WhatsApp & reminders' },
    { id: 'hours', label: 'Working Hours', icon: Clock, desc: 'Doctor shift timings & schedule' },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck, desc: 'Password & session policies' },
  ];

  const plan = clinicData?.subscription?.plan || 'trial';
  const status = clinicData?.status || 'active';
  const trialEnds = clinicData?.subscription?.trialEndsAt 
    ? new Date(clinicData.subscription.trialEndsAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '14 Days Remaining';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto pb-28 sm:pb-32 md:pb-8 transition-all">
      {/* Header Banner */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-cyan-950/20 border border-cyan-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
            </span>
            <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-cyan-300">Clinic Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
            {formData.clinicName || 'Clinic Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-cyan-200/80 mt-1 max-w-xl">
            Configure clinic identity, contact credentials, prescription letterhead, and view SaaS subscription status.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Changes saved successfully!
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1">
          {/* Mobile horizontal pill scroll */}
          <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20 ring-1 ring-cyan-500'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop vertical pill list */}
          <div className="hidden lg:flex flex-col gap-2 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-50 via-teal-50 to-white text-cyan-950 font-bold border-l-4 border-cyan-600 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-600 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isActive ? 'text-cyan-950 font-black' : 'text-slate-700'}`}>{tab.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Form Body */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7">
            {/* 1. CLINIC PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Clinic Profile & Identity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This information appears on prescription printouts, tax invoices, and SMS updates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Official Clinic Name</label>
                    <input
                      type="text"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Radiant Skin & Aesthetics Clinic"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tagline / Specialization</label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleInputChange}
                      placeholder="e.g. Dermatology & Personalized Skin Care"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-600" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@skinclinic.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      Primary Clinic Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Shop 102, Sunrise Plaza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      City & State
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai, Maharashtra"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">SaaS Subscription & Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your clinic's multi-tenant SaaS license and feature access status.</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 text-white relative overflow-hidden shadow-lg shadow-cyan-950/20">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-300/30 text-cyan-200 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        Current Plan: {plan.toUpperCase()}
                      </span>
                      <h4 className="text-xl font-black">{formData.clinicName || 'Your Skin Care Clinic'}</h4>
                      <p className="text-xs text-cyan-200/80 mt-1">Status: <span className="capitalize font-bold text-emerald-300">{status}</span></p>
                    </div>

                    <div className="text-left sm:text-right bg-white/10 p-3.5 rounded-xl border border-white/10">
                      <p className="text-[11px] text-cyan-200 uppercase tracking-wider font-bold">Trial Ends At</p>
                      <p className="text-base font-extrabold text-white mt-0.5">{trialEnds}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage & Patients</p>
                    <p className="text-lg font-black text-slate-900 mt-1">Unlimited</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Zero quota limits</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-User Access</p>
                    <p className="text-lg font-black text-slate-900 mt-1">Enabled</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Doctors, nurses & staff</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Privacy</p>
                    <p className="text-lg font-black text-slate-900 mt-1">100% Isolated</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dedicated tenant partition</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Automated Patient Communications</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select triggers for sending automated reminders via SMS & WhatsApp.</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { key: 'smsReminders', title: 'Automated SMS Reminders', desc: 'Send appointment reminder SMS 24 hours and 2 hours before scheduled visit.' },
                    { key: 'whatsappAlerts', title: 'WhatsApp Token & Prescription PDF Alerts', desc: 'Instantly message prescription links and live OPD queue tokens to patient mobile.' },
                    { key: 'emailReceipts', title: 'Email Invoices & Billing Summaries', desc: 'Dispatch formal GST compliant payment receipts upon invoice settlement.' },
                    { key: 'autoQueueCalling', title: 'Next Token Chime & Screen Announcements', desc: 'Trigger auditory chime when OPD queue token is called to consulting room.' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/90 hover:bg-cyan-50/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.key}
                        checked={formData[item.key]}
                        onChange={handleInputChange}
                        className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500/20 border-slate-300 accent-cyan-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 4. WORKING HOURS TAB */}
            {activeTab === 'hours' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Clinic Operation Schedule</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Default appointment booking slots and OPD reception hours.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800">Morning Shift</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">09:00 AM - 01:30 PM (Mon - Sat)</p>
                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800">Evening Shift</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">04:30 PM - 09:00 PM (Mon - Sat)</p>
                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Security & Session Policies</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage administrative timeout and multi-factor verification.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Inactivity Session Timeout</label>
                    <select
                      name="sessionTimeout"
                      value={formData.sessionTimeout}
                      onChange={handleInputChange}
                      className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-slate-50/50"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes (Recommended)</option>
                      <option value="60">1 Hour</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/90 hover:bg-cyan-50/30 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={formData.twoFactorAuth}
                      onChange={handleInputChange}
                      className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500/20 border-slate-300 accent-cyan-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Require Two-Factor Authentication (OTP via SMS)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Mandate secure SMS OTP code whenever staff or doctors sign in from an unrecognized device.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Clinic Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
