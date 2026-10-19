import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Sparkles,
  KeyRound,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth';
import { DoctorArrivalScene } from './DoctorArrivalScene';
import { brandConfig } from '../../config/brand';

interface Auth3DContainerProps {
  initialMode?: 'login' | 'signup';
}

export const Auth3DContainer: React.FC<Auth3DContainerProps> = ({ initialMode = 'login' }) => {
  // Stage 1: Carrying bag -> Stage 2: Bag opened, form revealed (Default: true for immediate access)
  const [isBagOpen, setIsBagOpen] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [cursorPos, setCursorPos] = useState(50);
  const [characterStatus, setCharacterStatus] = useState<'idle' | 'typing' | 'covering_eyes' | 'peeking' | 'success' | 'error'>('idle');

  // Signup fields
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: Role.PATIENT,
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  // Mouse 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -5);
    setRotateY(((x - centerX) / centerX) * 5);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setCharacterStatus('idle');
  };

  // Demo credential quick-fill
  const fillDemoCredentials = (roleEmail: string, rolePassword = 'Password123!') => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setError('');
    setCursorPos(roleEmail.length * 3);
    setCharacterStatus('typing');
    setTimeout(() => setCharacterStatus('idle'), 1000);
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCharacterStatus('typing');

    try {
      await login(email, password);
      setCharacterStatus('success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setCharacterStatus('error');
      setError(err.response?.data?.detail || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    setCharacterStatus('typing');

    try {
      const res = await registerUser(signupData);
      setCharacterStatus('success');
      setSuccessMsg(`Account created! Token: ${res.data?.verificationToken || 'Sent to registered email.'}`);
      setTimeout(() => {
        setMode('login');
        setEmail(signupData.email);
        setPassword(signupData.password);
      }, 2000);
    } catch (err: any) {
      setCharacterStatus('error');
      setError(err.response?.data?.detail || err.response?.data?.errors?.[0]?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none"
      style={{ perspective: 1200 }}
    >
      {/* 3D Animated Background Grid and Auras */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls Bar */}
      <div className="mb-4 z-20 flex items-center justify-between w-full max-w-lg px-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-sm"
        >
          <span>← Back to {brandConfig.name}</span>
        </Link>

        {isBagOpen && (
          <button
            onClick={() => setIsBagOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-sm"
            title="Replay 5-second arrival scene"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay Bag Entrance</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isBagOpen ? (
          /* ====================================================================
             SCENE 1: Doctor Carrying Carry-On Bag (5-Second Animated Entrance)
             ==================================================================== */
          <DoctorArrivalScene
            key="arrival-scene"
            onComplete={() => setIsBagOpen(true)}
          />
        ) : (
          /* ====================================================================
             SCENE 2: Carry-On Bag Opened -> 3D Form Revealed & Looking Character
             ==================================================================== */
          <motion.div
            key="auth-card"
            initial={{ opacity: 0, scale: 0.85, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: 'preserve-3d', rotateX, rotateY }}
            className="w-full max-w-lg bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/60 relative z-10"
          >
            {/* Subtle glossy 3D overlay reflection */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Top Brand Header */}
            <div className="text-center mb-6" style={{ transform: 'translateZ(30px)' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30 mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {mode === 'login' ? 'Sign In to Healthcare Portal' : 'Create Medical Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Access your clinical records, triage queue, and hospital workspace'
                  : 'Join the MediCore multi-tenant intelligent hospital network'}
              </p>
            </div>

            {/* Mode Switcher Tabs (Sign In / Sign Up) */}
            <div
              style={{ transform: 'translateZ(25px)' }}
              className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6 relative"
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all relative ${
                  mode === 'login' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-blue-600 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all relative ${
                  mode === 'signup' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-blue-600 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </span>
              </button>
            </div>

            {/* Feedback Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-tight">{error}</p>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-tight">{successMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form View */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4" style={{ transform: 'translateZ(20px)' }}>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Clinical Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setCursorPos(Math.min(e.target.value.length * 3.5, 100));
                        setCharacterStatus('typing');
                      }}
                      onFocus={() => {
                        setIsPasswordFocused(false);
                        setCharacterStatus('typing');
                      }}
                      onBlur={() => setCharacterStatus('idle')}
                      placeholder="doctor.a1@citygeneral.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => {
                        setIsPasswordFocused(true);
                        setCharacterStatus(showPassword ? 'peeking' : 'covering_eyes');
                      }}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                        setCharacterStatus('idle');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Demo Credentials for All 14 System Roles */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Demo Fill (All 14 Roles):
                    </span>
                    <span className="text-[10px] text-sky-400 font-mono">Password: Password123!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('superadmin@hospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition text-left truncate flex items-center justify-between"
                      title="superadmin@hospital.com"
                    >
                      <span>👑 Super Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('admin@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-left truncate flex items-center justify-between"
                      title="admin@citycarehospital.com"
                    >
                      <span>🏥 Hospital Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('branchadmin@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition text-left truncate flex items-center justify-between"
                      title="branchadmin@citycarehospital.com"
                    >
                      <span>🏢 Branch Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('dr.jenkins@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition text-left truncate flex items-center justify-between"
                      title="dr.jenkins@citycarehospital.com"
                    >
                      <span>🩺 Doctor / Spec.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('nurse.watson@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition text-left truncate flex items-center justify-between"
                      title="nurse.watson@citycarehospital.com"
                    >
                      <span>💉 Nurse Station</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('receptionist.dave@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition text-left truncate flex items-center justify-between"
                      title="receptionist.dave@citycarehospital.com"
                    >
                      <span>📋 Receptionist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('pharmacist@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 transition text-left truncate flex items-center justify-between"
                      title="pharmacist@citycarehospital.com"
                    >
                      <span>💊 Pharmacist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('labtech@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition text-left truncate flex items-center justify-between"
                      title="labtech@citycarehospital.com"
                    >
                      <span>🧪 Lab Technician</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('radiologist@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition text-left truncate flex items-center justify-between"
                      title="radiologist@citycarehospital.com"
                    >
                      <span>🩻 Radiologist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('accountant@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/20 transition text-left truncate flex items-center justify-between"
                      title="accountant@citycarehospital.com"
                    >
                      <span>💰 Accountant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('insurance@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 transition text-left truncate flex items-center justify-between"
                      title="insurance@citycarehospital.com"
                    >
                      <span>🛡️ Insurance Staff</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('ambulance@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition text-left truncate flex items-center justify-between"
                      title="ambulance@citycarehospital.com"
                    >
                      <span>🚑 Ambulance Fleet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('bloodbank@citycarehospital.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition text-left truncate flex items-center justify-between"
                      title="bloodbank@citycarehospital.com"
                    >
                      <span>🩸 Blood Bank</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('john.doe@example.com')}
                      className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 transition text-left truncate flex items-center justify-between"
                      title="john.doe@example.com"
                    >
                      <span>🧑 Patient Portal</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Healthcare Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Signup Form View */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5" style={{ transform: 'translateZ(20px)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Eleanor"
                      value={signupData.firstName}
                      onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Vance"
                      value={signupData.lastName}
                      onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.org"
                    value={signupData.email}
                    onChange={(e) => {
                      setSignupData({ ...signupData, email: e.target.value });
                      setCursorPos(Math.min(e.target.value.length * 3.5, 100));
                      setCharacterStatus('typing');
                    }}
                    onFocus={() => {
                      setIsPasswordFocused(false);
                      setCharacterStatus('typing');
                    }}
                    onBlur={() => setCharacterStatus('idle')}
                    className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">System Role</label>
                    <select
                      value={signupData.role}
                      onChange={(e) => setSignupData({ ...signupData, role: e.target.value as Role })}
                      className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={Role.PATIENT}>Patient</option>
                      <option value={Role.DOCTOR}>Doctor / Specialist</option>
                      <option value={Role.NURSE}>Nurse</option>
                      <option value={Role.RECEPTIONIST}>Receptionist</option>
                      <option value={Role.PHARMACIST}>Pharmacist</option>
                      <option value={Role.LAB_TECHNICIAN}>Lab Technician</option>
                      <option value={Role.RADIOLOGIST}>Radiologist</option>
                      <option value={Role.ACCOUNTANT}>Accountant</option>
                      <option value={Role.INSURANCE_STAFF}>Insurance Staff</option>
                      <option value={Role.AMBULANCE_OPERATOR}>Ambulance Operator</option>
                      <option value={Role.BLOOD_BANK_STAFF}>Blood Bank Staff</option>
                      <option value={Role.BRANCH_ADMIN}>Branch Admin</option>
                      <option value={Role.HOSPITAL_ADMIN}>Hospital Admin</option>
                      <option value={Role.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      onFocus={() => {
                        setIsPasswordFocused(true);
                        setCharacterStatus(showPassword ? 'peeking' : 'covering_eyes');
                      }}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                        setCharacterStatus('idle');
                      }}
                      className="w-full px-3 pr-10 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Healthcare Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

            {/* Security Assurance Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-bit HIPAA Encryption</span>
              </div>
              <span>Multi-Tenant Clinical Node</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth3DContainer;
