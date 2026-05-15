'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import {
  buildProfile,
  getDisplayName,
  getDisplaySubtitle,
  type UserProfile,
} from '@/lib/auth/profile';

export type { UserProfile };
export { getDisplayName, getDisplaySubtitle, buildProfile } from '@/lib/auth/profile';
export { getInitials, getAvatarUrlFromMetadata } from '@/lib/auth/profile';

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

    const meta = (nextSession?.user?.user_metadata ?? {}) as Record<string, unknown>;

    logAuth('state updated', {
      userId: nextSession?.user?.id ?? null,
      email: nextSession?.user?.email ?? null,
      hasSession: Boolean(nextSession),
      hasAvatar: Boolean(meta.avatar_url ?? meta.picture),
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
    [user, session, profile, isLoading, signOut, displayName, displaySubtitle]
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
