'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import ToastProvider from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase';
import AppLogo from '@/components/ui/AppLogo';

type AuthTab = 'login' | 'signup';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  experienceLevel: string;
  tradingStyle: string;
  country: string;
}

const experienceLevels = [
  { value: 'beginner', label: 'Beginner (< 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1–3 yrs)' },
  { value: 'advanced', label: 'Advanced (3–5 yrs)' },
  { value: 'professional', label: 'Professional (5+ yrs)' },
];

const tradingStyles = [
  { value: 'scalping', label: 'Scalping' },
  { value: 'day-trading', label: 'Day Trading' },
  { value: 'swing-trading', label: 'Swing Trading' },
  { value: 'position-trading', label: 'Position' },
  { value: 'algo-trading', label: 'Algo Trading' },
];

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'India',
  'UAE',
  'Japan',
  'Other',
];

export default function AuthFormPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const signupForm = useForm<SignupFormData>({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      experienceLevel: '',
      tradingStyle: '',
      country: '',
    },
  });

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      loginForm.setError('email', { message: error.message });
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[auth] login success', {
        userId: authData.user?.id,
        email: authData.user?.email,
      });
    }

    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
    setIsLoading(false);
  };

  const handleSignupSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: data.fullName,
          username: data.username,
          experience_level: data.experienceLevel,
          trading_style: data.tradingStyle,
          country: data.country,
        },
      },
    });

    if (error) {
      signupForm.setError('email', { message: error.message });
      toast.error(error.message || 'Failed to create account');
      setIsLoading(false);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[auth] signup success', {
        userId: authData.user?.id,
        email: authData.user?.email,
        hasSession: Boolean(authData.session),
      });
    }

    if (authData.session) {
      toast.success('Account created! Welcome aboard.');
      router.push('/dashboard');
      router.refresh();
    } else {
      toast.success('Account created! Check your email to confirm.');
    }

    setIsLoading(false);
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`Connecting to ${provider}...`);
    // Connect to Supabase social login in future
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-[#02040a] via-[#050814] to-[#02040a]">
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 relative overflow-hidden">
        <ToastProvider />

        {/* Background grids and abstract glows on the form side */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Extreme Glassmorphic refraction glow directly behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-[70px] pointer-events-none" />

        {/* Main glassmorphism login container */}
        <div className="w-full max-w-[480px] bg-slate-950/45 backdrop-blur-xl border border-white/[0.07] rounded-[24px] p-5 sm:p-6 xl:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Neon blue ambient corner borders */}
          <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0" />
          <div className="absolute top-0 left-0 w-[1px] h-24 bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0" />

          {/* Mobile Header Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-5 text-center">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 border border-blue-500/20 shadow-lg mb-2">
              <AppLogo size={28} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">AITradeJournal</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Smart journaling for institutional performance
            </p>
          </div>

          {/* Header Title */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'login' ? 'Welcome back' : 'Create an Account'}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
              {activeTab === 'login'
                ? 'Institutional-grade journaling, driven by AI insights.'
                : 'Begin building a data-backed, disciplined edge today.'}
            </p>
          </div>

          {/* Sliding segmented tab switcher */}
          <div
            className="relative flex bg-slate-950/80 border border-white/[0.05] p-1 rounded-xl mb-5"
            role="tablist"
          >
            {(['login', 'signup'] as AuthTab[]).map((tab) => (
              <button
                key={`tab-${tab}`}
                onClick={() => {
                  setActiveTab(tab);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-label={tab === 'login' ? 'Sign In' : 'Create Account'}
                className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 z-10 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white/[0.04] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.5)] rounded-lg z-[-1]"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Tab Forms Container */}
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login-form-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                className="space-y-4"
              >
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    htmlFor="login-email"
                  >
                    Email Address
                  </label>
                  <div className="relative flex items-center group/input">
                    <Mail
                      size={15}
                      className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@domain.com"
                      className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                      {...loginForm.register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                      })}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-[10px] text-red-400 font-semibold">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                      htmlFor="login-password"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center group/input">
                    <Lock
                      size={15}
                      className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your security credentials"
                      className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                      {...loginForm.register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Must be at least 8 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[10px] text-red-400 font-semibold">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember & Forgot Row */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded bg-slate-950 border border-white/[0.08] checked:bg-blue-600 checked:border-blue-500 focus:ring-0 text-blue-600 transition-colors cursor-pointer"
                      {...loginForm.register('rememberMe')}
                    />
                    <span className="text-[11px] text-slate-400 font-semibold">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info('Password recovery link dispatched to administrator.')
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Animated Neon Sign In CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold tracking-wide rounded-xl py-3.5 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Authorizing Portal...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup-form-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
                className="space-y-3.5"
              >
                {/* Full Name & Username */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-fullname"
                    >
                      Full Name
                    </label>
                    <div className="relative flex items-center group/input">
                      <User
                        size={13}
                        className="absolute left-3 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                      />
                      <input
                        id="signup-fullname"
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                        {...signupForm.register('fullName', { required: 'Name is required' })}
                      />
                    </div>
                    {signupForm.formState.errors.fullName && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-username"
                    >
                      Username
                    </label>
                    <div className="relative flex items-center group/input">
                      <span className="absolute left-3 text-[11px] font-bold text-slate-500 transition-colors group-focus-within/input:text-blue-400">
                        @
                      </span>
                      <input
                        id="signup-username"
                        type="text"
                        placeholder="trader101"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                        {...signupForm.register('username', {
                          required: 'Required',
                          minLength: { value: 3, message: 'Min 3 chars' },
                          pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message: 'Alphanumeric and _ only',
                          },
                        })}
                      />
                    </div>
                    {signupForm.formState.errors.username && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label
                    className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                    htmlFor="signup-email"
                  >
                    Email Address
                  </label>
                  <div className="relative flex items-center group/input">
                    <Mail
                      size={13}
                      className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                    />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="name@domain.com"
                      className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                      {...signupForm.register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid format' },
                      })}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-[9px] text-red-400 font-semibold">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-password"
                    >
                      Password
                    </label>
                    <div className="relative flex items-center group/input">
                      <Lock
                        size={13}
                        className="absolute left-3 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                      />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                        {...signupForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Min 8 chars' },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        aria-label="Toggle password"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-confirm"
                    >
                      Confirm
                    </label>
                    <div className="relative flex items-center group/input">
                      <Lock
                        size={13}
                        className="absolute left-3 text-slate-500 transition-colors group-focus-within/input:text-blue-400"
                      />
                      <input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat pass"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                        {...signupForm.register('confirmPassword', {
                          required: 'Please confirm',
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        aria-label="Toggle password"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Experience & Style */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-exp"
                    >
                      Experience Level
                    </label>
                    <div className="relative flex items-center group/select">
                      <Sparkles
                        size={13}
                        className="absolute left-3 text-slate-500 transition-colors group-focus-within/select:text-blue-400 pointer-events-none"
                      />
                      <select
                        id="signup-exp"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium appearance-none cursor-pointer"
                        {...signupForm.register('experienceLevel', {
                          required: 'Select level',
                        })}
                      >
                        <option value="" className="bg-[#0b0f19]">
                          Select level
                        </option>
                        {experienceLevels.map((l) => (
                          <option key={`exp-${l.value}`} value={l.value} className="bg-[#0b0f19]">
                            {l.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-3 text-slate-500 pointer-events-none"
                      />
                    </div>
                    {signupForm.formState.errors.experienceLevel && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.experienceLevel.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                      htmlFor="signup-style"
                    >
                      Trading Style
                    </label>
                    <div className="relative flex items-center group/select">
                      <ChevronDown
                        size={12}
                        className="absolute right-3 text-slate-500 pointer-events-none"
                      />
                      <select
                        id="signup-style"
                        className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium appearance-none cursor-pointer"
                        {...signupForm.register('tradingStyle', { required: 'Select style' })}
                      >
                        <option value="" className="bg-[#0b0f19]">
                          Select style
                        </option>
                        {tradingStyles.map((s) => (
                          <option key={`style-${s.value}`} value={s.value} className="bg-[#0b0f19]">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {signupForm.formState.errors.tradingStyle && (
                      <p className="text-[9px] text-red-400 font-semibold">
                        {signupForm.formState.errors.tradingStyle.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country Selection */}
                <div className="space-y-1">
                  <label
                    className="block text-[9px] font-bold uppercase tracking-wider text-slate-400"
                    htmlFor="signup-country"
                  >
                    Country of Residence
                  </label>
                  <div className="relative flex items-center group/select">
                    <Globe
                      size={13}
                      className="absolute left-3 text-slate-500 transition-colors group-focus-within/select:text-blue-400 pointer-events-none"
                    />
                    <select
                      id="signup-country"
                      className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 rounded-xl pl-8 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium appearance-none cursor-pointer"
                      {...signupForm.register('country', { required: 'Select country' })}
                    >
                      <option value="" className="bg-[#0b0f19]">
                        Select residence
                      </option>
                      {countries.map((c) => (
                        <option key={`country-${c}`} value={c} className="bg-[#0b0f19]">
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-3 text-slate-500 pointer-events-none"
                    />
                  </div>
                  {signupForm.formState.errors.country && (
                    <p className="text-[9px] text-red-400 font-semibold">
                      {signupForm.formState.errors.country.message}
                    </p>
                  )}
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold tracking-wide rounded-xl py-3 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Allocating Secure Vault...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="text-[9px] text-slate-500 text-center font-medium leading-relaxed mt-2.5">
                  By registering, you execute agreement with our{' '}
                  <button type="button" className="text-blue-400 hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-blue-400 hover:underline">
                    Privacy Policy
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Separator Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="flex-grow border-t border-white/[0.06]" />
            <span className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-transparent relative z-10">
              Secure Single Sign-on
            </span>
            <div className="flex-grow border-t border-white/[0.06]" />
          </div>

          {/* Social Authentication Portals */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all active:scale-[0.97] group cursor-pointer"
              title="Authenticate with Google"
            >
              <svg
                className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.92 1.16 12s4.96 11 11.08 11c6.38 0 10.62-4.474 10.62-10.785 0-.726-.078-1.285-.172-1.93H12.24z" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Apple')}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all active:scale-[0.97] group cursor-pointer"
              title="Authenticate with Apple"
            >
              <svg
                className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.73-1.2 1.88-1.05 2.99 1.12.09 2.27-.57 2.99-1.44z" />
              </svg>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Microsoft')}
              className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all active:scale-[0.97] group cursor-pointer"
              title="Authenticate with Microsoft"
            >
              <svg
                className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110"
                viewBox="0 0 23 23"
                fill="currentColor"
              >
                <path d="M0 0h11v11H0z" fill="#f25022" />
                <path d="M12 0h11v11H12z" fill="#7fba00" />
                <path d="M0 12h11v11H0z" fill="#00a4ef" />
                <path d="M12 12h11v11H12z" fill="#ffb900" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
