'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  email: string | undefined;
  fullName: string | null;
  username: string | null;
  experienceLevel: string | null;
  tradingStyle: string | null;
  country: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  displayName: string;
  displaySubtitle: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function logAuth(event: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[auth] ${event}`, payload ?? '');
  }
}

function buildProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email,
    fullName: (meta.full_name as string) ?? null,
    username: (meta.username as string) ?? null,
    experienceLevel: (meta.experience_level as string) ?? null,
    tradingStyle: (meta.trading_style as string) ?? null,
    country: (meta.country as string) ?? null,
  };
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.fullName?.trim()) return profile.fullName.trim();
  if (profile.username?.trim()) return profile.username.trim();
  if (profile.email) return profile.email.split('@')[0];
  return 'Trader';
}

export function getDisplaySubtitle(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.tradingStyle) return formatLabel(profile.tradingStyle);
  if (profile.experienceLevel) return formatLabel(profile.experienceLevel);
  return profile.email ?? '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const profile = useMemo(() => buildProfile(user), [user]);
  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const displaySubtitle = useMemo(() => getDisplaySubtitle(profile), [profile]);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    logAuth('state updated', {
      userId: nextSession?.user?.id ?? null,
      email: nextSession?.user?.email ?? null,
      hasSession: Boolean(nextSession),
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      logAuth('checking session');
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        logAuth('getSession error', { message: error.message });
      }

      if (mounted) {
        applySession(data.session);
        setIsLoading(false);
        logAuth('initial session resolved', {
          userId: data.session?.user?.id ?? null,
        });
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logAuth(`onAuthStateChange: ${event}`, {
        userId: nextSession?.user?.id ?? null,
        email: nextSession?.user?.email ?? null,
      });

      if (mounted) {
        applySession(nextSession);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, applySession]);

  const signOut = useCallback(async () => {
    logAuth('signing out');
    await supabase.auth.signOut();
    applySession(null);
  }, [supabase, applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isLoading,
      signOut,
      displayName,
      displaySubtitle,
    }),
    [user, session, profile, isLoading, signOut, displayName, displaySubtitle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
