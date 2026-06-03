'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar, removeAvatar } from '@/services/profileService';
import { useProfileContext } from '@/contexts/ProfileContext';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB raw input

interface UseAvatarUploadReturn {
  isUploading: boolean;
  isRemoving: boolean;
  uploadAvatar: (file: File) => Promise<string | null>;
  removeAvatar: () => Promise<void>;
  validateFile: (file: File) => string | null;
}

/**
 * Hook that handles avatar upload and removal with validation and toast feedback.
 *
 * @example
 * const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
  const { user } = useAuth();
  const { dbProfile, refetch } = useProfileContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  /** Client-side validation before upload */
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, WebP, or GIF image.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'Image must be smaller than 10 MB.';
    }
    return null;
  }, []);

  const handleUpload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user?.id) {
        toast.error('You must be logged in to upload an avatar.');
        return null;
      }

      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return null;
      }

      setIsUploading(true);
      const toastId = toast.loading('Uploading avatar…');

      try {
        const result = await uploadAvatar(user.id, file);
        await refetch();
        toast.success('Avatar updated!', { id: toastId });
        return result.publicUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(msg, { id: toastId });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, validateFile, refetch]
  );

  const handleRemove = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    const currentUrl = dbProfile?.avatarUrl;
    if (!currentUrl) return;

    setIsRemoving(true);
    const toastId = toast.loading('Removing avatar…');

    try {
      await removeAvatar(user.id, currentUrl);
      await refetch();
      toast.success('Avatar removed.', { id: toastId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove avatar';
      toast.error(msg, { id: toastId });
    } finally {
      setIsRemoving(false);
    }
  }, [user?.id, dbProfile?.avatarUrl, refetch]);

  return {
    isUploading,
    isRemoving,
    uploadAvatar: handleUpload,
    removeAvatar: handleRemove,
    validateFile,
  };
}
