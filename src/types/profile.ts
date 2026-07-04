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
  trading_style: string | null;
  markets: string | null;
  experience: string | null;
  show_stats: boolean;
  public_profile: boolean;
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
  tradingStyle: string | null;
  markets: string | null;
  experience: string | null;
  showStats: boolean;
  publicProfile: boolean;
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
  tradingStyle: string;
  /** The form stores markets as a plain comma-separated string from the text input */
  markets: string;
  experience: string;
  showStats: boolean;
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
    tradingStyle: row.trading_style, // string | null
    // DB stores as comma-separated string, UI uses array
    markets: row.markets ? row.markets.split(',').filter(Boolean) : [],
    experience: row.experience,
    showStats: row.show_stats,
    publicProfile: row.public_profile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a Profile → DB upsert payload */
export function mapProfileToDb(
  userId: string,
  data: Partial<ProfileFormData> & {
    avatar_url?: string | null;
    public_profile?: boolean;
    show_stats?: boolean;
  }
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
  if (data.tradingStyle !== undefined) out.trading_style = data.tradingStyle || null;
  // Form sends a plain string (e.g. "Crypto, Forex"); store as-is.
  // An array (e.g. from other callers) is joined with commas.
  // An empty value writes null so the column is not stored as an empty string.
  if (data.markets !== undefined) {
    if (Array.isArray(data.markets)) {
      out.markets = data.markets.length > 0 ? data.markets.join(',') : null;
    } else if (typeof data.markets === 'string') {
      out.markets = data.markets.trim() || null;
    } else {
      out.markets = null;
    }
  }
  if (data.experience !== undefined) out.experience = data.experience || null;
  if (data.showStats !== undefined) out.show_stats = data.showStats;
  if (data.avatar_url !== undefined) out.avatar_url = data.avatar_url;
  if (data.public_profile !== undefined) out.public_profile = data.public_profile;
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
  if (parts.length > 1) {
    return (`${parts[0][0]}${parts[parts.length - 1][0]}`).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    return local.slice(0, 2).toUpperCase();
  }
  return 'T';
}
