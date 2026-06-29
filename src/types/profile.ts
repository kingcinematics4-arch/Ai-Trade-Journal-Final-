// ─── Profile Types ────────────────────────────────────────────────────────────

/** Raw row from the `profiles` Supabase table */
export interface DbProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
}

/** Camel-cased profile used in components */
export interface Profile {
  id: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Editable fields in the profile form */
export interface ProfileFormData {
  username: string;
  fullName: string;
  bio: string;
  phone: string;
  country: string;
  website: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

/** Result from an avatar upload operation */
export interface AvatarUploadResult {
  publicUrl: string;
  path: string;
}

/** Notification preference keys stored in profile / localStorage */
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradeAlerts: boolean;
  goalAlerts: boolean;
  aiInsights: boolean;
  weeklyReport: boolean;
}

/** Privacy settings */
export interface PrivacySettings {
  profilePublic: boolean;
  showEmail: boolean;
  showStats: boolean;
}

/** Theme preference */
export type ThemePreference = 'dark' | 'light' | 'system';

/** Map a DbProfile row → camelCase Profile */
export function mapDbProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    country: row.country,
    website: row.website,
    twitter: row.twitter,
    instagram: row.instagram,
    linkedin: row.linkedin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a Profile → DB upsert payload */
export function mapProfileToDb(
  userId: string,
  data: Partial<ProfileFormData> & { avatar_url?: string | null }
): Partial<DbProfile> & { id: string } {
  const out: Partial<DbProfile> & { id: string } = { id: userId };
  if (data.username !== undefined) out.username = data.username || null;
  if (data.fullName !== undefined) out.full_name = data.fullName || null;
  if (data.bio !== undefined) out.bio = data.bio || null;
  if (data.phone !== undefined) out.phone = data.phone || null;
  if (data.country !== undefined) out.country = data.country || null;
  if (data.website !== undefined) out.website = data.website || null;
  if (data.twitter !== undefined) out.twitter = data.twitter || null;
  if (data.instagram !== undefined) out.instagram = data.instagram || null;
  if (data.linkedin !== undefined) out.linkedin = data.linkedin || null;
  if (data.avatar_url !== undefined) out.avatar_url = data.avatar_url;
  return out;
}

/** Get display name from profile (falls back gracefully) */
export function getProfileDisplayName(profile: Profile | null, email?: string | null): string {
  if (!profile) return email?.split('@')[0] ?? 'Trader';
  if (profile.fullName) return profile.fullName;
  if (profile.username) return profile.username;
  if (email) return email.split('@')[0];
  return 'Trader';
}

/** Get initials for avatar fallback */
export function getProfileInitials(displayName: string, email?: string | null): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase();
  }
  return 'T';
}
