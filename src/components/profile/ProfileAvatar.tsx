'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Trash2, Upload, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { getProfileInitials } from '@/types/profile';
import { getAvatarColorSeed } from '@/lib/auth/profile';

interface ProfileAvatarProps {
  editable?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

const SIZE = {
  md: { box: 'h-20 w-20', text: 'text-xl', icon: 20, camSize: 16 },
  lg: { box: 'h-24 w-24', text: 'text-2xl', icon: 24, camSize: 18 },
  xl: { box: 'h-28 w-28', text: 'text-3xl', icon: 28, camSize: 20 },
} as const;

export default function ProfileAvatar({ editable = false, size = 'xl' }: ProfileAvatarProps) {
  const { user, displayName } = useAuth();
  const { dbProfile } = useProfileContext();
  const { uploadAvatar, removeAvatar, isUploading, isRemoving, validateFile } = useAvatarUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const sizeConfig = SIZE[size];
  const avatarUrl = preview ?? dbProfile?.avatarUrl ?? null;
  const initials = getProfileInitials(displayName, user?.email);
  const hue = user?.id ? getAvatarColorSeed(user.id) % 360 : 200;
  const showImage = Boolean(avatarUrl) && !imageError;
  const isBusy = isUploading || isRemoving;

  const processFile = useCallback(
    async (file: File) => {
      const err = validateFile(file);
      if (err) return;
      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setImageError(false);
      await uploadAvatar(file);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    },
    [uploadAvatar, validateFile]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';
      await processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await processFile(file);
    },
    [processFile]
  );

  const handleRemove = useCallback(async () => {
    setPreview(null);
    setImageError(false);
    await removeAvatar();
  }, [removeAvatar]);

  const avatarBody = (
    <div
      className={[
        'relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden',
        'ring-2 ring-border/60',
        sizeConfig.box,
        dragOver && editable ? 'ring-primary ring-offset-2 ring-offset-background' : '',
      ].join(' ')}
    >
      {/* Image */}
      {showImage && avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName ? `${displayName} avatar` : 'Profile photo'}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* Initials fallback */}
      {!showImage && initials && (
        <span
          className={`font-bold ${sizeConfig.text} text-white select-none`}
          style={{ backgroundColor: `hsl(${hue} 55% 42%)` }}
        >
          {initials}
        </span>
      )}

      {/* Icon fallback */}
      {!showImage && !initials && (
        <span className="bg-primary/15 text-primary h-full w-full flex items-center justify-center">
          <User size={sizeConfig.icon} />
        </span>
      )}

      {/* Loading overlay */}
      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
          <Loader2 size={sizeConfig.camSize} className="animate-spin text-white" />
        </div>
      )}

      {/* Camera overlay (hover) — edit mode only */}
      {editable && !isBusy && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 rounded-full transition-all duration-200 cursor-pointer group"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          title="Change avatar"
        >
          <Camera
            size={sizeConfig.camSize}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {avatarBody}

      {editable && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <Upload size={12} />
            {isUploading ? 'Uploading…' : 'Upload photo'}
          </button>

          {(avatarUrl || preview) && (
            <>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                {isRemoving ? 'Removing…' : 'Remove'}
              </button>
            </>
          )}
        </div>
      )}

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload avatar"
        />
      )}
    </div>
  );
}
