import React, { useState } from 'react';
import { User, Mail, Lock, ChevronRight, Briefcase, Eye, EyeClosed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth';

function Register() {
    const navigate = useNavigate();
    const [IsOpenEye, SetIsOpenEye] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'patient',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async(e) => {
         e.preventDefault();
        try {
           
            const response=await register(formData);
            console.log('response to submit',response)
            navigate('/dashboard');

        } catch (error) {
            console.log('error', error)
        }
    };
    function handlePasswordShow() {
        console.log('is ', IsOpenEye)
        SetIsOpenEye(!IsOpenEye)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 selection:bg-cyan-500/30">

            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-200/50 via-slate-50 to-white/50 -z-10" />
            <div className="absolute top-0 w-full h-full bg-gradient-to-b from-cyan-50/50 to-transparent -z-10" />

            {/* Decorative Blobs */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-700" />

            {/* Main Card */}
            <div className="w-full max-w-md p-8 md:p-10 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 relative z-10 m-4">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl shadow-lg shadow-cyan-200 flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                            <span className="text-white font-extrabold text-2xl leading-none">K</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Create Account</h1>
                    <p className="text-slate-500 text-sm font-medium">Join Kydoc and manage your health.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                <User size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                <Mail size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Role Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Account Role</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                <Briefcase size={18} strokeWidth={2.5} />
                            </div>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                            >
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                            {/* Custom dropdown arrow to match the design */}
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <ChevronRight size={16} strokeWidth={2.5} className="transform rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                <Lock size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type={IsOpenEye ? "password" : "text"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-600 transition-all font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="••••••••"
                                required
                            />
                            <div className="absolute inset-y-0 right-[20px] pl-4 flex items-center cursor-pointer text-slate-400 hover:text-cyan-600 transition-colors" onClick={handlePasswordShow}>
                                {IsOpenEye ? <Eye size={20} strokeWidth={2.5} /> : <EyeClosed size={20} strokeWidth={2.5} />}
                            </div>

                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full mt-6 bg-gradient-to-r from-cyan-600 via-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-cyan-600/30 hover:shadow-xl hover:shadow-cyan-600/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        Create Account
                        <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                {/* Footer Link */}
                <div className="mt-8 text-center text-sm font-medium text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline transition-all">
                        Log in here
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default Register;
