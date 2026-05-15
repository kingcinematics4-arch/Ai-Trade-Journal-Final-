'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ToastProvider from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase';

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
  { value: 'intermediate', label: 'Intermediate (1–3 years)' },
  { value: 'advanced', label: 'Advanced (3–5 years)' },
  { value: 'professional', label: 'Professional (5+ years)' },
];

const tradingStyles = [
  { value: 'scalping', label: 'Scalping' },
  { value: 'day-trading', label: 'Day Trading' },
  { value: 'swing-trading', label: 'Swing Trading' },
  { value: 'position-trading', label: 'Position Trading' },
  { value: 'algo-trading', label: 'Algorithmic Trading' },
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'Singapore', 'India', 'UAE', 'Japan', 'South Korea', 'Other',
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
      fullName: '', username: '', email: '', password: '',
      confirmPassword: '', experienceLevel: '', tradingStyle: '', country: '',
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

  return (
    <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
      <ToastProvider />
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeTab === 'login' ?'Track your trades and improve your performance' :'Start journaling your trades today — free forever'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted rounded-lg p-1">
          {(['login', 'signup'] as AuthTab[]).map((tab) => (
            <button
              key={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === tab ? 'bg-card text-foreground shadow-sm' : ''
              } tab-button`}
            >
              {tab === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="you@example.com"
                {...loginForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                })}
              />
              {loginForm.formState.errors.email && (
                <p className="form-error">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  {...loginForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-action-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="form-error">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-input accent-primary"
                  {...loginForm.register('rememberMe')}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:text-blue-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="signup-fullname">Full Name</label>
                <input
                  id="signup-fullname"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  {...signupForm.register('fullName', { required: 'Full name is required' })}
                />
                {signupForm.formState.errors.fullName && (
                  <p className="form-error">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="signup-username">Username</label>
                <input
                  id="signup-username"
                  type="text"
                  className="form-input"
                  placeholder="your_username"
                  {...signupForm.register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Min 3 characters' },
                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
                  })}
                />
                {signupForm.formState.errors.username && (
                  <p className="form-error">{signupForm.formState.errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                {...signupForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                })}
              />
              {signupForm.formState.errors.email && (
                <p className="form-error">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="signup-password">Password</label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Min 8 characters"
                    {...signupForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-action-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="form-error">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
                <div className="relative">
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Repeat password"
                    {...signupForm.register('confirmPassword', { required: 'Please confirm your password' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="input-action-btn"
                    aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="form-error">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="signup-exp">Experience Level</label>
                <select
                  id="signup-exp"
                  className="form-input"
                  {...signupForm.register('experienceLevel', { required: 'Select your experience' })}
                >
                  <option value="">Select level</option>
                  {experienceLevels.map((l) => (
                    <option key={`exp-${l.value}`} value={l.value}>{l.label}</option>
                  ))}
                </select>
                {signupForm.formState.errors.experienceLevel && (
                  <p className="form-error">{signupForm.formState.errors.experienceLevel.message}</p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="signup-style">Trading Style</label>
                <select
                  id="signup-style"
                  className="form-input"
                  {...signupForm.register('tradingStyle', { required: 'Select trading style' })}
                >
                  <option value="">Select style</option>
                  {tradingStyles.map((s) => (
                    <option key={`style-${s.value}`} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {signupForm.formState.errors.tradingStyle && (
                  <p className="form-error">{signupForm.formState.errors.tradingStyle.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="signup-country">Country</label>
              <select
                id="signup-country"
                className="form-input"
                {...signupForm.register('country', { required: 'Select your country' })}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={`country-${c}`} value={c}>{c}</option>
                ))}
              </select>
              {signupForm.formState.errors.country && (
                <p className="form-error">{signupForm.formState.errors.country.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <button type="button" className="text-primary hover:underline">Terms of Service</button>
              {' '}and{' '}
              <button type="button" className="text-primary hover:underline">Privacy Policy</button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}