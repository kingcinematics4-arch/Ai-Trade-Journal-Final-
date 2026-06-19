'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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

// Shared spring used for the hero layout transition
const LAYOUT_SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

// Card sizing tokens
const CARD_SIZING =
  'w-full max-w-[520px] lg:max-w-[580px] xl:max-w-[600px] ' +
  'min-h-[600px] md:min-h-[700px] lg:min-h-[720px] xl:min-h-[760px] ' +
  'max-h-[90vh] md:max-h-[85vh]';

// Shared card class tokens (applied to both normal + focused instances)
const CARD_BASE =
  'w-full bg-slate-950/45 backdrop-blur-xl border border-white/[0.07] rounded-[24px] p-6 sm:p-7 xl:p-8 relative overflow-hidden flex flex-col';
const CARD_SHADOW = 'shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]';
const CARD_FOCUSED_SHADOW =
  'shadow-[0_0_120px_rgba(59,130,246,0.18),0_30px_70px_-20px_rgba(0,0,0,0.7)]';

// Per-item stagger — only fires on first mount of the normal card
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};
// Hide scrollbars via injected style (cross-browser)
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
    overflow-x: hidden;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function AuthFormPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  // Initialize Supabase client once per component mount
  const supabase = useMemo(() => createClient(), []);

  // ESC key exits focus mode
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFocused(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Reset loading states on auth change / page restore
  useEffect(() => {
    setIsGoogleLoading(false);
    setIsLoading(false);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsGoogleLoading(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        loginForm.setError('email', { message: error.message });
        toast.error(error.message || 'Failed to sign in');
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth] login success', { userId: authData.user?.id, email: authData.user?.email });
      }
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
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
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth] signup success', { email: authData.user?.email, hasSession: Boolean(authData.session) });
      }
      if (authData.session) {
        toast.success('Account created! Welcome aboard.');
        router.push('/dashboard');
      } else {
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider.toLowerCase() !== 'google') {
      toast.error(`Unsupported provider: ${provider}`);
      return;
    }
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      toast.info('Connecting to Google...');
      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth] Google OAuth redirect destination:', redirectTo);
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to initialize Google authentication flow');
      }
    } catch (err: any) {
      console.error('[auth] Google login error:', err);
      toast.error(err.message || 'Failed to authenticate using Google');
      setIsGoogleLoading(false);
    }
  };

  // ─── Tab switcher — always visible, never re-mounted ─────────────────────
  const TabSwitcher = (
    <div
      className="relative flex bg-slate-950/80 border border-white/[0.05] p-1 rounded-xl mb-5"
      role="tablist"
      aria-label="Authentication mode"
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
          aria-controls={tab === 'login' ? 'login-form-pane' : 'signup-form-pane'}
          aria-label={tab === 'login' ? 'Sign In' : 'Create Account'}
          className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 z-10 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
            activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute inset-0 bg-white/[0.05] border border-white/[0.10] shadow-[0_2px_10px_rgba(0,0,0,0.6)] rounded-lg z-[-1]"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          {tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      ))}
    </div>
  );

  // ─── The card body (inlined — no inner component) ─────────────────────────
  const cardBody = (
    <>
      {/* Neon blue ambient corner accents */}
      <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 pointer-events-none" />
      <div className="absolute top-0 left-0 w-[1px] h-24 bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0 pointer-events-none" />

      {/* Mobile Header Logo */}
      <motion.div variants={itemVariants} className="lg:hidden flex flex-col items-center justify-center mb-5 text-center">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 border border-blue-500/20 shadow-lg mb-2">
          <AppLogo size={28} />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">AITradeJournal</span>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
          Smart journaling for institutional performance
        </p>
      </motion.div>

      {/* Header Title — animates text only, not the tab row */}
      <motion.div variants={itemVariants} className="text-center mb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {activeTab === 'login' ? 'Welcome back' : 'Create an Account'}
        </h2>
        <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
          {activeTab === 'login'
            ? 'Institutional-grade journaling, driven by AI insights.'
            : 'Begin building a data-backed, disciplined edge today.'}
        </p>
      </motion.div>

      {/* ── Permanent Tab Switcher — always visible ── */}
      <div className="sticky top-0 z-20 bg-slate-950/70 backdrop-blur-xl">
        {TabSwitcher}
      </div>

      {/* ── Form area — only this section transitions on tab change ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'login' ? (
          <motion.form
            key="login-form-pane"
            id="login-form-pane"
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative flex items-center group/input">
                <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                  })}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-password">
                Password
              </label>
              <div className="relative flex items-center group/input">
                <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your security credentials"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...loginForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded bg-slate-950 border border-white/[0.08] checked:bg-blue-600 checked:border-blue-500 focus:ring-0 text-blue-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  {...loginForm.register('rememberMe')}
                />
                <span className="text-[11px] text-slate-400 font-semibold">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info('Password recovery link dispatched.')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-sm"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In CTA */}
            <motion.button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold tracking-wide rounded-xl py-3.5 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Authorizing Portal...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.form
            key="signup-form-pane"
            id="signup-form-pane"
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
            className="space-y-3.5"
          >
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-fullname">
                Full Name
              </label>
              <div className="relative flex items-center group/input">
                <User size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="signup-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...signupForm.register('fullName', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
              </div>
              {signupForm.formState.errors.fullName && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.fullName.message}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-username">
                Username
              </label>
              <div className="relative flex items-center group/input">
                <Sparkles size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  placeholder="traderpro99"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...signupForm.register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscores' },
                  })}
                />
              </div>
              {signupForm.formState.errors.username && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-email">
                Email Address
              </label>
              <div className="relative flex items-center group/input">
                <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...signupForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                  })}
                />
              </div>
              {signupForm.formState.errors.email && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-password">
                Password
              </label>
              <div className="relative flex items-center group/input">
                <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...signupForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="relative flex items-center group/input">
                <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                  {...signupForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Experience Level + Trading Style */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-experience">
                  Experience
                </label>
                <div className="relative flex items-center group/input">
                  <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                  <select
                    id="signup-experience"
                    className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 text-xs text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                    {...signupForm.register('experienceLevel', { required: 'Required' })}
                  >
                    <option value="" className="bg-slate-900">Select level</option>
                    {experienceLevels.map((lvl) => (
                      <option key={lvl.value} value={lvl.value} className="bg-slate-900">{lvl.label}</option>
                    ))}
                  </select>
                </div>
                {signupForm.formState.errors.experienceLevel && (
                  <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.experienceLevel.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-style">
                  Style
                </label>
                <div className="relative flex items-center group/input">
                  <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                  <select
                    id="signup-style"
                    className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 text-xs text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                    {...signupForm.register('tradingStyle', { required: 'Required' })}
                  >
                    <option value="" className="bg-slate-900">Select style</option>
                    {tradingStyles.map((style) => (
                      <option key={style.value} value={style.value} className="bg-slate-900">{style.label}</option>
                    ))}
                  </select>
                </div>
                {signupForm.formState.errors.tradingStyle && (
                  <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.tradingStyle.message}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-country">
                Country
              </label>
              <div className="relative flex items-center group/input">
                <Globe size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                <select
                  id="signup-country"
                  className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-10 pr-8 py-3 text-xs text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                  {...signupForm.register('country', { required: 'Country is required' })}
                >
                  <option value="" className="bg-slate-900">Select your country</option>
                  {countries.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>
              {signupForm.formState.errors.country && (
                <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.country.message}</p>
              )}
            </div>

            {/* Terms & Privacy */}
            <div className="pt-1">
              <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                By creating an account, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => toast.info('Terms of Service — opening soon.')}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => toast.info('Privacy Policy — opening soon.')}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded"
                >
                  Privacy Policy
                </button>
                .
              </p>
            </div>

            {/* Create Account CTA */}
            <motion.button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold tracking-wide rounded-xl py-3.5 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
      </div>

      {/* Separator Divider */}
      <div className="relative flex items-center justify-center my-5">
        <div className="flex-grow border-t border-white/[0.06]" />
        <span className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 relative z-10">
          Secure Single Sign-on
        </span>
        <div className="flex-grow border-t border-white/[0.06]" />
      </div>

      {/* Google SSO */}
      <div className="flex items-center justify-center w-full">
        <motion.button
          type="button"
          disabled={isLoading || isGoogleLoading}
          onClick={() => handleSocialLogin('Google')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/40"
          title="Continue with Google"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 size={15} className="animate-spin text-blue-400" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.92 1.16 12s4.96 11 11.08 11c6.38 0 10.62-4.474 10.62-10.785 0-.726-.078-1.285-.172-1.93H12.24z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </motion.button>
      </div>
    </>
  );

  // ─── Root render ──────────────────────────────────────────────────────────
  //
  // Architecture: true shared-element (hero) transition.
  //
  // Two conditional <motion.div> instances share layoutId="auth-card".
  // Framer Motion captures the bounding box of the EXITING instance and
  // animates the ENTERING instance FROM that snapshot position → natural
  // target position. Only ONE instance is ever in the DOM at a time.
  //
  //  • Normal   → card sits in document flex flow (right-half panel)
  //  • Focused  → card sits in fixed inset-0 flex center (true viewport center)
  //
  // The backdrop fades in/out independently via its own AnimatePresence.
  // The LayoutGroup coordinates the layout animations across the two
  // AnimatePresence groups so they fire in sync.
  //
  return (
    <LayoutGroup id="auth-focus-group">
      {/* Global scrollbar-hide inject */}
      <style>{scrollbarHideStyle}</style>

      {/* ── Page shell ──────────────────────────────────────── */}
      <div className="flex-1 h-full overflow-y-auto scrollbar-hide bg-gradient-to-b from-[#02040a] via-[#050814] to-[#02040a]">
        <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 relative">

          {/* Dot-grid background */}

          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Animated ambient glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
              x: ['-50%', '-48%', '-50%'],
              y: ['-50%', '-52%', '-50%'],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"
          />
          <div className="absolute top-[20%] right-[-10%] w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-[70px] pointer-events-none" />

          {/* ── NORMAL CARD — in document flow ─────────────────
               Rendered only when NOT focused.
               On focus trigger: Framer snapshots its bounding box,
               removes it, and the focused card animates FROM that snapshot.
          ─────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {!isFocused && (
              <motion.div
                key="auth-card-normal"
                layoutId="auth-card"
                layout
                transition={LAYOUT_SPRING}
                ref={cardRef}
                // First-mount entrance — only fires once on page load
                initial={{ opacity: 0, scale: 0.92, y: 28 }}
                animate={{ opacity: 1, scale: 1, y: 0,
                  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } }}
                // Exit is instant; the layout animation drives the visual
                exit={{ opacity: 0, transition: { duration: 0 } }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ zIndex: 10 }}
                className={`${CARD_BASE} ${CARD_SHADOW} ${CARD_SIZING}`}
              >
                {/* ── Fixed Header Section ── */}
                <div className="shrink-0">
                  <motion.div variants={itemVariants} className="lg:hidden flex flex-col items-center justify-center mb-4 sm:mb-5 text-center">
                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 border border-blue-500/20 shadow-lg mb-2">
                      <AppLogo size={28} />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">AITradeJournal</span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Smart journaling for institutional performance
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="text-center mb-4 sm:mb-5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {activeTab === 'login' ? 'Welcome back' : 'Create an Account'}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
                      {activeTab === 'login'
                        ? 'Institutional-grade journaling, driven by AI insights.'
                        : 'Begin building a data-backed, disciplined edge today.'}
                    </p>
                  </motion.div>

                  {/* ── Permanent Tab Switcher — always visible, never scrolls ── */}
                  {TabSwitcher}
                </div>

                {/* ── Scrollable Form Body ── */}
                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeTab === 'login' ? (
                      <motion.form
                        key="login-form-pane"
                        id="login-form-pane"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                        className="space-y-4 sm:space-y-5"
                      >
                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-email">
                            Email Address
                          </label>
                          <div className="relative flex items-center group/input">
                            <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="login-email"
                              type="email"
                              autoComplete="email"
                              placeholder="name@domain.com"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...loginForm.register('email', {
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                              })}
                            />
                          </div>
                          {loginForm.formState.errors.email && (
                            <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-password">
                            Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              placeholder="Enter your security credentials"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...loginForm.register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Must be at least 8 characters' },
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {loginForm.formState.errors.password && (
                            <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded bg-slate-950 border border-white/[0.08] checked:bg-blue-600 checked:border-blue-500 focus:ring-0 text-blue-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
                              {...loginForm.register('rememberMe')}
                            />
                            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => toast.info('Password recovery link dispatched.')}
                            className="text-[11px] sm:text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-sm"
                          >
                            Forgot password?
                          </button>
                        </div>

                        {/* Sign In CTA */}
                        <motion.button
                          type="submit"
                          disabled={isLoading || isGoogleLoading}
                          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide rounded-xl py-3.5 sm:py-4 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-3 focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Authorizing Portal...</span>
                            </>
                          ) : (
                            <>
                              <span>Sign In to Dashboard</span>
                              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="signup-form-pane"
                        id="signup-form-pane"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
                        className="space-y-3.5 sm:space-y-4"
                      >
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-fullname">
                            Full Name
                          </label>
                          <div className="relative flex items-center group/input">
                            <User size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-fullname"
                              type="text"
                              autoComplete="name"
                              placeholder="John Doe"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('fullName', {
                                required: 'Full name is required',
                                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                              })}
                            />
                          </div>
                          {signupForm.formState.errors.fullName && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.fullName.message}</p>
                          )}
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-username">
                            Username
                          </label>
                          <div className="relative flex items-center group/input">
                            <Sparkles size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-username"
                              type="text"
                              autoComplete="username"
                              placeholder="traderpro99"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('username', {
                                required: 'Username is required',
                                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                                pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscores' },
                              })}
                            />
                          </div>
                          {signupForm.formState.errors.username && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.username.message}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-email">
                            Email Address
                          </label>
                          <div className="relative flex items-center group/input">
                            <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-email"
                              type="email"
                              autoComplete="email"
                              placeholder="name@domain.com"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('email', {
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                              })}
                            />
                          </div>
                          {signupForm.formState.errors.email && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-password">
                            Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Min. 8 characters"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Must be at least 8 characters' },
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {signupForm.formState.errors.password && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-confirm-password">
                            Confirm Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Re-enter your password"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('confirmPassword', {
                                required: 'Please confirm your password',
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {signupForm.formState.errors.confirmPassword && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>

                        {/* Experience Level + Trading Style */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-experience">
                              Experience
                            </label>
                            <div className="relative flex items-center group/input">
                              <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                              <select
                                id="signup-experience"
                                className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                                {...signupForm.register('experienceLevel', { required: 'Required' })}
                              >
                                <option value="" className="bg-slate-900">Select level</option>
                                {experienceLevels.map((lvl) => (
                                  <option key={lvl.value} value={lvl.value} className="bg-slate-900">{lvl.label}</option>
                                ))}
                              </select>
                            </div>
                            {signupForm.formState.errors.experienceLevel && (
                              <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.experienceLevel.message}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-style">
                              Style
                            </label>
                            <div className="relative flex items-center group/input">
                              <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                              <select
                                id="signup-style"
                                className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                                {...signupForm.register('tradingStyle', { required: 'Required' })}
                              >
                                <option value="" className="bg-slate-900">Select style</option>
                                {tradingStyles.map((style) => (
                                  <option key={style.value} value={style.value} className="bg-slate-900">{style.label}</option>
                                ))}
                              </select>
                            </div>
                            {signupForm.formState.errors.tradingStyle && (
                              <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.tradingStyle.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Country */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-country">
                            Country
                          </label>
                          <div className="relative flex items-center group/input">
                            <Globe size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                            <select
                              id="signup-country"
                              className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-10 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                              {...signupForm.register('country', { required: 'Country is required' })}
                            >
                              <option value="" className="bg-slate-900">Select your country</option>
                              {countries.map((c) => (
                                <option key={c} value={c} className="bg-slate-900">{c}</option>
                              ))}
                            </select>
                          </div>
                          {signupForm.formState.errors.country && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.country.message}</p>
                          )}
                        </div>

                        {/* Terms & Privacy */}
                        <div className="pt-1">
                          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed text-center">
                            By creating an account, you agree to our{' '}
                            <button
                              type="button"
                              onClick={() => toast.info('Terms of Service — opening soon.')}
                              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded"
                            >
                              Terms of Service
                            </button>{' '}
                            and{' '}
                            <button
                              type="button"
                              onClick={() => toast.info('Privacy Policy — opening soon.')}
                              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded"
                            >
                              Privacy Policy
                            </button>
                            .
                          </p>
                        </div>

                        {/* Create Account CTA */}
                        <motion.button
                          type="submit"
                          disabled={isLoading || isGoogleLoading}
                          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide rounded-xl py-3.5 sm:py-4 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-3 focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Account</span>
                              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Separator + Social section — always visible ── */}
                <div className="shrink-0">
                  <div className="relative flex items-center justify-center my-5">
                    <div className="flex-grow border-t border-white/[0.06]" />
                    <span className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 relative z-10">
                      Secure Single Sign-on
                    </span>
                    <div className="flex-grow border-t border-white/[0.06]" />
                  </div>

                  <div className="flex items-center justify-center w-full">
                    <motion.button
                      type="button"
                      disabled={isLoading || isGoogleLoading}
                      onClick={() => handleSocialLogin('Google')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      title="Continue with Google"
                    >
                      {isGoogleLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-blue-400" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.92 1.16 12s4.96 11 11.08 11c6.38 0 10.62-4.474 10.62-10.785 0-.726-.078-1.285-.172-1.93H12.24z" />
                          </svg>
                          <span>Continue with Google</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── FOCUSED OVERLAY + CENTERED CARD ────────────────────
           Rendered only when focused.
           The card enters FROM the normal card's captured position
           and travels to the fixed viewport center.
           On exit: reverse path, back to normal position.
      ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFocused && (
          <>
            {/* Backdrop — fades independently */}
            <motion.div
              key="focus-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="fixed inset-0 bg-[#02040a]/85 backdrop-blur-[3px]"
              style={{ zIndex: 40 }}
              onClick={() => setIsFocused(false)}
            />

            {/* Viewport-center container — pointer-events-none so clicks
                on the transparent areas fall through to the backdrop */}
            <div
              className="fixed inset-0 flex items-center justify-center pointer-events-none p-4 sm:p-6"
              style={{ zIndex: 50 }}
            >
              {/* FOCUSED CARD — enters from normal card's position */}
              <motion.div
                key="auth-card-focused"
                layoutId="auth-card"
                layout
                transition={LAYOUT_SPRING}
                ref={cardRef}
                // Scale up slightly as it arrives at viewport center
                animate={{ scale: 1.02,
                  transition: { ...LAYOUT_SPRING, delay: 0.05 } }}
                exit={{ scale: 1, opacity: 0,
                  transition: { duration: 0 } }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                // pointer-events-auto re-enables interaction on the card itself
                className={`${CARD_BASE} ${CARD_FOCUSED_SHADOW} border-white/[0.13] ${CARD_SIZING} pointer-events-auto`}
              >
                {/* ── Fixed Header Section ── */}
                <div className="shrink-0">
                  <motion.div variants={itemVariants} className="lg:hidden flex flex-col items-center justify-center mb-4 sm:mb-5 text-center">
                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/10 border border-blue-500/20 shadow-lg mb-2">
                      <AppLogo size={28} />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">AITradeJournal</span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Smart journaling for institutional performance
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="text-center mb-4 sm:mb-5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {activeTab === 'login' ? 'Welcome back' : 'Create an Account'}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
                      {activeTab === 'login'
                        ? 'Institutional-grade journaling, driven by AI insights.'
                        : 'Begin building a data-backed, disciplined edge today.'}
                    </p>
                  </motion.div>

                  {/* ── Permanent Tab Switcher — always visible, never scrolls ── */}
                  {TabSwitcher}
                </div>

                {/* ── Scrollable Form Body ── */}
                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeTab === 'login' ? (
                      <motion.form
                        key="login-form-pane"
                        id="login-form-pane"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                        className="space-y-4 sm:space-y-5"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-email-focused">
                            Email Address
                          </label>
                          <div className="relative flex items-center group/input">
                            <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="login-email-focused"
                              type="email"
                              autoComplete="email"
                              placeholder="name@domain.com"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...loginForm.register('email', {
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                              })}
                            />
                          </div>
                          {loginForm.formState.errors.email && (
                            <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="login-password-focused">
                            Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="login-password-focused"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              placeholder="Enter your security credentials"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...loginForm.register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Must be at least 8 characters' },
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {loginForm.formState.errors.password && (
                            <p className="text-[10px] text-red-400 font-semibold">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded bg-slate-950 border border-white/[0.08] checked:bg-blue-600 checked:border-blue-500 focus:ring-0 text-blue-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
                              {...loginForm.register('rememberMe')}
                            />
                            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => toast.info('Password recovery link dispatched.')}
                            className="text-[11px] sm:text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-sm"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <motion.button
                          type="submit"
                          disabled={isLoading || isGoogleLoading}
                          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide rounded-xl py-3.5 sm:py-4 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-3 focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Authorizing Portal...</span>
                            </>
                          ) : (
                            <>
                              <span>Sign In to Dashboard</span>
                              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="signup-form-pane-focused"
                        id="signup-form-pane-focused"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
                        className="space-y-3.5 sm:space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-fullname-focused">
                            Full Name
                          </label>
                          <div className="relative flex items-center group/input">
                            <User size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-fullname-focused"
                              type="text"
                              autoComplete="name"
                              placeholder="John Doe"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                            />
                          </div>
                          {signupForm.formState.errors.fullName && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.fullName.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-username-focused">
                            Username
                          </label>
                          <div className="relative flex items-center group/input">
                            <Sparkles size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-username-focused"
                              type="text"
                              autoComplete="username"
                              placeholder="traderpro99"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('username', { required: 'Username is required', minLength: { value: 3, message: 'Username must be at least 3 characters' }, pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscores' } })}
                            />
                          </div>
                          {signupForm.formState.errors.username && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.username.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-email-focused">
                            Email Address
                          </label>
                          <div className="relative flex items-center group/input">
                            <Mail size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-email-focused"
                              type="email"
                              autoComplete="email"
                              placeholder="name@domain.com"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' } })}
                            />
                          </div>
                          {signupForm.formState.errors.email && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-password-focused">
                            Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-password-focused"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Min. 8 characters"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('password', { required: 'Password is required', minLength: { value: 8, message: 'Must be at least 8 characters' } })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {signupForm.formState.errors.password && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-confirm-password-focused">
                            Confirm Password
                          </label>
                          <div className="relative flex items-center group/input">
                            <Lock size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <input
                              id="signup-confirm-password-focused"
                              type={showConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Re-enter your password"
                              className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
                              {...signupForm.register('confirmPassword', { required: 'Please confirm your password' })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-md"
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {signupForm.formState.errors.confirmPassword && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-experience-focused">
                              Experience
                            </label>
                            <div className="relative flex items-center group/input">
                              <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                              <select
                                id="signup-experience-focused"
                                className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                                {...signupForm.register('experienceLevel', { required: 'Required' })}
                              >
                                <option value="" className="bg-slate-900">Select level</option>
                                {experienceLevels.map((lvl) => (
                                  <option key={lvl.value} value={lvl.value} className="bg-slate-900">{lvl.label}</option>
                                ))}
                              </select>
                            </div>
                            {signupForm.formState.errors.experienceLevel && (
                              <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.experienceLevel.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-style-focused">
                              Style
                            </label>
                            <div className="relative flex items-center group/input">
                              <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                              <select
                                id="signup-style-focused"
                                className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-3.5 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                                {...signupForm.register('tradingStyle', { required: 'Required' })}
                              >
                                <option value="" className="bg-slate-900">Select style</option>
                                {tradingStyles.map((style) => (
                                  <option key={style.value} value={style.value} className="bg-slate-900">{style.label}</option>
                                ))}
                              </select>
                            </div>
                            {signupForm.formState.errors.tradingStyle && (
                              <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.tradingStyle.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="signup-country-focused">
                            Country
                          </label>
                          <div className="relative flex items-center group/input">
                            <Globe size={15} className="absolute left-3.5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                            <ChevronDown size={14} className="absolute right-3 text-slate-500 pointer-events-none transition-colors group-focus-within/input:text-blue-400" />
                            <select
                              id="signup-country-focused"
                              className="w-full appearance-none bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-10 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white focus:outline-none transition-all font-sans font-medium cursor-pointer"
                              {...signupForm.register('country', { required: 'Country is required' })}
                            >
                              <option value="" className="bg-slate-900">Select your country</option>
                              {countries.map((c) => (
                                <option key={c} value={c} className="bg-slate-900">{c}</option>
                              ))}
                            </select>
                          </div>
                          {signupForm.formState.errors.country && (
                            <p className="text-[10px] text-red-400 font-semibold">{signupForm.formState.errors.country.message}</p>
                          )}
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed text-center">
                            By creating an account, you agree to our{' '}
                            <button type="button" onClick={() => toast.info('Terms of Service — opening soon.')} className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded">Terms of Service</button> and{' '}
                            <button type="button" onClick={() => toast.info('Privacy Policy — opening soon.')} className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 rounded">Privacy Policy</button>.
                          </p>
                        </div>
                        <motion.button
                          type="submit"
                          disabled={isLoading || isGoogleLoading}
                          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide rounded-xl py-3.5 sm:py-4 shadow-[0_4px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-3 focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Account</span>
                              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Separator + Social section — always visible ── */}
                <div className="shrink-0">
                  <div className="relative flex items-center justify-center my-5">
                    <div className="flex-grow border-t border-white/[0.06]" />
                    <span className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 relative z-10">
                      Secure Single Sign-on
                    </span>
                    <div className="flex-grow border-t border-white/[0.06]" />
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <motion.button
                      type="button"
                      disabled={isLoading || isGoogleLoading}
                      onClick={() => handleSocialLogin('Google')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      title="Continue with Google"
                    >
                      {isGoogleLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-blue-400" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-slate-300 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.92 1.16 12s4.96 11 11.08 11c6.38 0 10.62-4.474 10.62-10.785 0-.726-.078-1.285-.172-1.93H12.24z" />
                          </svg>
                          <span>Continue with Google</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
 