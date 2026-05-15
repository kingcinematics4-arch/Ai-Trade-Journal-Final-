import type { User } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string | undefined;
  avatarUrl: string | null;
  fullName: string | null;
  name: string | null;
  username: string | null;
  experienceLevel: string | null;
  tradingStyle: string | null;
  country: string | null;
};

function readMetaString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getAvatarUrlFromMetadata(meta: Record<string, unknown>): string | null {
  return readMetaString(meta, 'avatar_url') ?? readMetaString(meta, 'picture');
}

export function buildProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: user.id,
    email: user.email,
    avatarUrl: getAvatarUrlFromMetadata(meta),
    fullName: readMetaString(meta, 'full_name'),
    name: readMetaString(meta, 'name'),
    username: readMetaString(meta, 'username'),
    experienceLevel: readMetaString(meta, 'experience_level'),
    tradingStyle: readMetaString(meta, 'trading_style'),
    country: readMetaString(meta, 'country'),
  };
}

export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.fullName) return profile.fullName;
  if (profile.name) return profile.name;
  if (profile.username) return profile.username;
  if (profile.email) return profile.email.split('@')[0];
  return 'Trader';
}

export function getInitials(displayName: string, email?: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }

  if (parts.length === 1 && parts[0].length >= 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    const local = email.split('@')[0] ?? '';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
  }

  return '';
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDisplaySubtitle(profile: UserProfile | null): string {
  if (!profile) return '';
  if (profile.tradingStyle) return formatLabel(profile.tradingStyle);
  if (profile.experienceLevel) return formatLabel(profile.experienceLevel);
  return profile.email ?? '';
}

/** Stable hue from user id for initials avatar background */
export function getAvatarColorSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}
