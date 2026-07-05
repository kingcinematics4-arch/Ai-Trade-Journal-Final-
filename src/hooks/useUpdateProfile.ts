'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { ProfileFormData } from '@/types/profile';

/**
 * Hook for updating profile fields with toast feedback.
 *
 * @example
 * const { updateProfile, isSaving } = useUpdateProfile();
 * await updateProfile({ fullName: 'Jay Vare' });
 */
export function useUpdateProfile() {
  const { updateProfile: ctxUpdate, isSaving } = useProfileContext();

  const updateProfile = useCallback(
    async (
      data: Partial<ProfileFormData> & { avatar_url?: string | null },
      options?: { successMessage?: string; errorMessage?: string; silent?: boolean }
    ) => {
      const {
        successMessage = 'Profile updated!',
        silent = false,
      } = options ?? {};

      try {
        await ctxUpdate(data);
        if (!silent) toast.success(successMessage);
      } catch (err: any) {
        console.error(err);
        if (!silent) toast.error(err?.message ?? JSON.stringify(err));
        throw err;
      }
    },
    [ctxUpdate]
  );

  return { updateProfile, isSaving };
}