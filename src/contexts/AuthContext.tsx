'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import {
  buildProfile,
  getDisplayName,
  getDisplaySubtitle,
  type UserProfile,
} from '@/lib/auth/profile';
import { setOneSignalExternalId, requestOneSignalPermission } from '@/lib/oneSignal';

export type { UserProfile };
export { getDisplayName, getDisplaySubtitle, buildProfile } from '@/lib/auth/profile';
export { getInitials, getAvatarUrlFromMetadata } from '@/lib/auth/profile';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

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
      try {
        logAuth('checking initial session');
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          applySession(data.session);
          // We don't set isInitialized to true yet if no session is found,
          // to give onAuthStateChange a chance to fire for OAuth flows.
          if (data.session) {
            setIsInitialized(true);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('[auth] initialization error', err);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      logAuth(`onAuthStateChange: ${event}`, { userId: nextSession?.user?.id });
      applySession(nextSession);
      setIsLoading(false);
      setIsInitialized(true);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.refresh();
        if (event === 'SIGNED_IN' && nextSession?.user?.id) {
          void setOneSignalExternalId(nextSession.user.id);
          void requestOneSignalPermission();
        }
      }
    });

    // Safety timeout: if no session is found within 1.5s, consider initialization complete
    const timer = setTimeout(() => {
      if (mounted && !isInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [supabase, applySession, isInitialized, router]);

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
      isInitialized,
      signOut,
      displayName,
      displaySubtitle,
    }),
    [user, session, profile, isLoading, isInitialized, signOut, displayName, displaySubtitle]
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
