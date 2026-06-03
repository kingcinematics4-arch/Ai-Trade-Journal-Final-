'use client';

import { useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarColorSeed, getInitials } from '@/lib/auth/profile';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { useProfileContext } from '@/contexts/ProfileContext';

const SIZE_CLASSES = {
  xs: { box: 'h-7 w-7', text: 'text-[10px]', icon: 14 },
  sm: { box: 'h-8 w-8', text: 'text-xs', icon: 16 },
  md: { box: 'h-10 w-10', text: 'text-sm', icon: 18 },
  lg: { box: 'h-12 w-12', text: 'text-base', icon: 22 },
  xl: { box: 'h-16 w-16', text: 'text-lg', icon: 28 },
} as const;

export type UserAvatarSize = keyof typeof SIZE_CLASSES;

interface UserAvatarProps {
  size?: UserAvatarSize;
  className?: string;
  showLoading?: boolean;
}

export default function UserAvatar({
  size = 'md',
  className = '',
  showLoading = true,
}: UserAvatarProps) {
  const { profile, displayName, isLoading } = useAuth();
  const { dbProfile } = useProfileContext();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeConfig = SIZE_CLASSES[size];
  const initials = useMemo(
    () => getInitials(displayName, profile?.email),
    [displayName, profile?.email]
  );

  // DB avatar takes precedence over auth metadata avatar
  const avatarUrl = dbProfile?.avatarUrl ?? profile?.avatarUrl ?? null;
  const hasInitials = initials.length > 0;
  const showImage = Boolean(avatarUrl) && !imageError;

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [avatarUrl, profile?.id]);

  if (isLoading && showLoading) {
    return (
      <Skeleton
        className={`${sizeConfig.box} rounded-full flex-shrink-0 ${className}`}
        aria-hidden
      />
    );
  }

  const baseClass = [
    'relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full',
    'ring-2 ring-border/60 bg-muted',
    sizeConfig.box,
    className,
  ].join(' ');

  if (showImage && avatarUrl) {
    return (
      <span className={baseClass} title={displayName}>
        {!imageLoaded && <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={displayName ? `${displayName} profile photo` : 'Profile photo'}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      </span>
    );
  }

  if (hasInitials && profile?.id) {
    const hue = getAvatarColorSeed(profile.id) % 360;

    return (
      <span
        className={`${baseClass} font-semibold ${sizeConfig.text} text-white`}
        style={{ backgroundColor: `hsl(${hue} 55% 42%)` }}
        title={displayName}
        aria-label={displayName}
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} bg-primary/15 text-primary`}
      title={displayName}
      aria-label={displayName || 'User'}
    >
      <User size={sizeConfig.icon} strokeWidth={2} aria-hidden />
    </span>
  );
}
