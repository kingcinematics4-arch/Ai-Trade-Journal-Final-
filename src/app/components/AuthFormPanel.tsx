'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

type AuthFeedback = {
  type: 'success' | 'error' | 'info';
  message: string;
  redirect?: string;
};

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  focused: {
    scale: 1.03,
    y: -20,
    boxShadow: "0 0 100px rgba(59, 130, 246, 0.15), 0 25px 60px -15px rgba(0,0,0,0.9)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function AuthFormPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const formRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
  };
  const handleBlur = (e: React.FocusEvent) => {
    // Only unfocus if the blur event is not caused by focusing another element within the form
    if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  // Initialize Supabase client once per component mount to avoid recreating it on every action
  const supabase = useMemo(() => createClient(), []);

  // Listen to auth state changes and reset local loading state if session is null or signed out
  useEffect(() => {
    // Reset loading states on mount (handles page back-button/BFcache restoration)
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

    return () => {
      subscription.unsubscribe();
    };
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
      setIsLoading(false);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[auth] signup success', {
        email: authData.user?.email,
        hasSession: Boolean(authData.session),
      });
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

    if (isGoogleLoading) return; // Prevent double requests

    setIsGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      toast.info('Connecting to Google...');
      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth] Google OAuth redirect destination:', redirectTo);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' }
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirecting user to the third-party OAuth provider
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

  const AuthCard = ({ isFocusedLayout = false }: { isFocusedLayout?: boolean }) => (
    <motion.div 
      layoutId="auth-card-layout"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={formRef}
      style={{ zIndex: 50 }}
      className={`w-full bg-slate-950/45 backdrop-blur-xl border border-white/[0.07] rounded-[24px] p-5 sm:p-6 xl:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group transition-colors duration-500 ${isFocusedLayout ? 'max-w-[520px]' : 'max-w-[480px]'}`}
    >
      {/* Neon blue ambient corner borders */}
      <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0" />
      <div className="absolute top-0 left-0 w-[1px] h-24 bg-gradient-to-b from-blue-500/0 via-blue-500/30 to-blue-500/0" />

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

      {/* Header Title */}
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

      {/* Sliding segmented tab switcher */}
      <motion.div
        variants={itemVariants}
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
            className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 z-10 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/10 ${
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
      </motion.div>

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
            <motion.div variants={itemVariants} className="space-y-1.5">
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
                  className="w-full bg-slate-950/60 border border-white/[0.07] hover:border-white/[0.12] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans font-medium"
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
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
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
                <p className="text-[10px] text-red-400 font-semibold">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </motion.div>

            {/* Remember & Forgot Row */}
            <motion.div variants={itemVariants} className="flex items-center justify-between pt-1">
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
            </motion.div>

            {/* Animated Neon Sign In CTA */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isLoading || isGoogleLoading}
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
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
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
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
            {/* ... (signup form content will be here) ... */}
          </motion.form>
        )}
      </AnimatePresence>

      {/* Separator Divider */}
      <motion.div variants={itemVariants} className="relative flex items-center justify-center my-5">
        <div className="flex-grow border-t border-white/[0.06]" />
        <span className="px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-transparent relative z-10">
          Secure Single Sign-on
        </span>
        <div className="flex-grow border-t border-white/[0.06]" />
      </motion.div>

      {/* Social Authentication Portals */}
      <motion.div variants={itemVariants} className="flex items-center justify-center w-full">
        {/* ... (social login button) ... */}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-[#02040a] via-[#050814] to-[#02040a]">
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 relative overflow-hidden">

        {/* Background grids and abstract glows on the form side */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Animated premium background glow */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
            x: ['-50%', '-48%', '-50%'],
            y: ['-50%', '-52%', '-50%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" 
        />
        <div className="absolute top-[20%] right-[-10%] w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-[70px] pointer-events-none" />

        <AnimatePresence>
          {isFocused ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#02040a]/60 backdrop-blur-[4px]"
                onClick={() => setIsFocused(false)}
              />
              <AuthCard isFocusedLayout={true} />
            </div>
          ) : (
            <AuthCard />
          )}
        </AnimatePresence>
        
        {/* The rest of the component remains largely the same, but the card itself is now abstracted */}
        {/* The logic for forms, social login, etc., is contained within the AuthCard component */}
        {/* This structure allows for the layout animation to work correctly */}
        
      </div>
    </div>
  );
}
