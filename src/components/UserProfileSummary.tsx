'use client';

import UserAvatar, { type UserAvatarSize } from '@/components/ui/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

interface UserProfileSummaryProps {
  size?: UserAvatarSize;
  layout?: 'horizontal' | 'stacked';
  showEmail?: boolean;
  className?: string;
}

function ProfileSummarySkeleton({
  size,
  layout,
}: {
  size: UserAvatarSize;
  layout: 'horizontal' | 'stacked';
}) {
  const box =
    size === 'xl' ? 'h-16 w-16' : size === 'lg' ? 'h-12 w-12' : size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const isStacked = layout === 'stacked';

  return (
    <div className={isStacked ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5'}>
      <Skeleton className={`${box} rounded-full flex-shrink-0`} />
      <div className={`space-y-1.5 ${isStacked ? 'w-full' : 'flex-1'}`}>
        <Skeleton className={`h-3.5 ${isStacked ? 'mx-auto w-24' : 'w-28'}`} />
        <Skeleton className={`h-3 ${isStacked ? 'mx-auto w-32' : 'w-36'}`} />
      </div>
    </div>
  );
}

export default function UserProfileSummary({
  size = 'sm',
  layout = 'horizontal',
  showEmail = true,
  className = '',
}: UserProfileSummaryProps) {
  const { profile, displayName, isLoading } = useAuth();

  if (isLoading) {
    return <ProfileSummarySkeleton size={size} layout={layout} />;
  }

  if (!profile) return null;

  const isStacked = layout === 'stacked';

  return (
    <div
      className={[
        'min-w-0',
        isStacked ? 'flex flex-col items-center gap-2 text-center' : 'flex items-center gap-2.5 sm:gap-3',
        className,
      ].join(' ')}
    >
      <UserAvatar size={size} showLoading={false} />
      <div className={`min-w-0 ${isStacked ? 'w-full' : 'flex-1'}`}>
        <p
          className="text-sm font-semibold text-foreground truncate leading-tight"
          title={displayName}
        >
          {displayName}
        </p>
        {showEmail && profile.email && (
          <p
            className="text-xs text-muted-foreground truncate leading-tight mt-0.5"
            title={profile.email}
          >
            {profile.email}
          </p>
        )}
      </div>
    </div>
  );
}
