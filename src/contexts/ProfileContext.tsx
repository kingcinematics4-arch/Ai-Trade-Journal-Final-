'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, initializeProfileFromAuth, upsertProfile } from '@/services/profileService';
import type { AuthMeta } from '@/services/profileService';
import type { Profile, ProfileFormData } from '@/types/profile';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface ProfileContextValue {
  /** The DB profile for the logged-in user */
  dbProfile: Profile | null;
  /** True while the first fetch is in-flight */
  isLoading: boolean;
  /** Error from the last operation */
  error: string | null;
  /** Manually re-fetch the profile from DB */
  refetch: () => Promise<void>;
  /** Update profile fields (optimistic) */
  updateProfile: (data: Partial<ProfileFormData> & { avatar_url?: string | null }) => Promise<void>;
  /** Whether an update is in-flight */
  isSaving: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const [dbProfile, setDbProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedForRef = useRef<string | null>(null);
  // Stable ref so fetchProfile always reads the latest user without depending on the object
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const existing = await getProfile(currentUser.id);

      // Build auth metadata from Supabase user object to seed missing fields
      const rawMeta = (currentUser.user_metadata ?? {}) as Record<string, unknown>;
      const meta: AuthMeta = {
        full_name:          typeof rawMeta.full_name  === 'string' ? rawMeta.full_name  : null,
        name:               typeof rawMeta.name       === 'string' ? rawMeta.name       : null,
        email:              currentUser.email ?? (typeof rawMeta.email === 'string' ? rawMeta.email : null),
        avatar_url:         typeof rawMeta.avatar_url === 'string' ? rawMeta.avatar_url : null,
        picture:            typeof rawMeta.picture    === 'string' ? rawMeta.picture    : null,
        preferred_username: typeof rawMeta.preferred_username === 'string' ? rawMeta.preferred_username : null,
        user_name:          typeof rawMeta.user_name  === 'string' ? rawMeta.user_name  : null,
      };

      // initializeProfileFromAuth creates the row if missing and seeds NULL fields
      // from OAuth / email metadata.  It never overwrites user-entered values.
      const profile = await initializeProfileFromAuth(currentUser.id, meta, existing);
      setDbProfile(profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('[ProfileContext] fetch error:', msg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  // ── Auto-fetch on user change ────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    if (!user?.id) {
      setDbProfile(null);
      fetchedForRef.current = null;
      return;
    }
    // Avoid duplicate fetches in React Strict Mode
    if (fetchedForRef.current === user.id) return;
    fetchedForRef.current = user.id;
    fetchProfile();
  }, [user?.id, isInitialized, fetchProfile]);

  // ── Update ───────────────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (data: Partial<ProfileFormData> & { avatar_url?: string | null }) => {
      if (!user?.id) throw new Error('Not authenticated');
      setIsSaving(true);
      setError(null);

      // Optimistic update
      setDbProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.username !== undefined && { username: data.username || null }),
          ...(data.bio !== undefined && { bio: data.bio || null }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.country !== undefined && { country: data.country || null }),
          ...(data.website !== undefined && { website: data.website || null }),
          ...(data.twitter !== undefined && { twitter: data.twitter || null }),
          ...(data.instagram !== undefined && { instagram: data.instagram || null }),
          ...(data.linkedin !== undefined && { linkedin: data.linkedin || null }),
          ...(data.tradingStyle !== undefined && { tradingStyle: data.tradingStyle || null }),
          ...(data.markets !== undefined && {
            markets: typeof data.markets === 'string'
              ? (data.markets.trim() ? data.markets.split(',').map((m) => m.trim()).filter(Boolean) : null)
              : (data.markets as string[]) || null,
          }),
          ...(data.experience !== undefined && { experience: data.experience || null }),
          ...(data.avatar_url !== undefined && { avatarUrl: data.avatar_url }),
        };
      });

      try {
        const updated = await upsertProfile(user.id, data);
        console.log("===== UPDATED PROFILE =====");
        console.log(updated);
        setDbProfile(updated);
      } catch (err) {
        // Rollback on error
        await fetchProfile();
        console.error(err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, fetchProfile]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      dbProfile,
      isLoading,
      error,
      refetch: fetchProfile,
      updateProfile,
      isSaving,
    }),
    [dbProfile, isLoading, error, fetchProfile, updateProfile, isSaving]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used within ProfileProvider');
  return ctx;
}