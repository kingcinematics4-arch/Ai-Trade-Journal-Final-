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
import { getProfile, upsertProfile } from '@/services/profileService';
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

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getProfile(user.id);
      // If profile doesn't exist yet, upsert a blank one so the row is guaranteed
      if (!profile) {
        const created = await upsertProfile(user.id, {});
        setDbProfile(created);
      } else {
        setDbProfile(profile);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      console.warn('[ProfileContext] Profile not found yet, will be created on update.');
      console.error('[ProfileContext] fetch error:', msg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

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
          ...(data.avatar_url !== undefined && { avatarUrl: data.avatar_url }),
        };
      });

      try {
        const updated = await upsertProfile(user.id, data);
        setDbProfile(updated);
      } catch (err) {
        // Rollback on error
        await fetchProfile();
        const msg = err instanceof Error ? err.message : 'Failed to save profile';
        setError(msg);
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
