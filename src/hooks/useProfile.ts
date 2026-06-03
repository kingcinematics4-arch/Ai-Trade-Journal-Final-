'use client';

import { useProfileContext } from '@/contexts/ProfileContext';

/**
 * Convenience hook — exposes the logged-in user's DB profile.
 *
 * @example
 * const { dbProfile, isLoading, refetch } = useProfile();
 */
export function useProfile() {
  const { dbProfile, isLoading, error, refetch } = useProfileContext();
  return { profile: dbProfile, isLoading, error, refetch };
}
