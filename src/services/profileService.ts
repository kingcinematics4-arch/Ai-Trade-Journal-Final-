'use client';

import { createClient } from '@/lib/supabase';
import type { DbProfile, Profile, ProfileFormData, AvatarUploadResult } from '@/types/profile';
import { mapDbProfile, mapProfileToDb } from '@/types/profile';

const MAX_AVATAR_SIZE = 500 * 1024; // 500 KB target
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const AVATAR_BUCKET = 'avatars';

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

/**
 * Fetch a single profile row by user ID.
 * Returns null if no profile exists yet.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    console.error('[profileService] Supabase Error Details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    // PGRST116 or 406 = no rows returned
    if (error.code === 'PGRST116' || error.code === '406') return null;
    throw new Error(error.message);
  }

  return data ? mapDbProfile(data as DbProfile) : null;
}

/**
 * Upsert (insert or update) a profile row.
 * Always merges — only updates the provided fields.
 */
export async function upsertProfile(
  userId: string,
  data: Partial<ProfileFormData> & { avatar_url?: string | null; public_profile?: boolean }
): Promise<Profile> {
  // [DEBUG] Log the raw data received by the service function
  console.log('[DEBUG] 1. upsertProfile received data:', JSON.stringify(data, null, 2));

  const supabase = createClient();
  const payload = mapProfileToDb(userId, data);

  // [DEBUG] Log the snake_cased payload before it's sent to Supabase
  console.log('[DEBUG] 2. Mapped payload for Supabase:', JSON.stringify(payload, null, 2));

  const { data: row, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  // [DEBUG] Log any potential errors from the upsert operation
  if (error) {
    console.error('[DEBUG] 3. Supabase upsert error:', {
      message: error.message,
      details: error.details,
      code: error.code,
    });
    throw new Error(error.message);
  }

  // [DEBUG] Task 7: Post-upsert verification — re-read the row to confirm values were written
  const { data: verifyRow, error: verifyError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (verifyError) {
    console.warn('[DEBUG] 5. Post-upsert verify read failed:', verifyError.message);
  } else {
    console.log('[DEBUG] 5. Post-upsert verified DB row:', JSON.stringify(verifyRow, null, 2));
    // Warn if key fields that were sent are still NULL in the DB (possible RLS issue)
    const sentKeys = Object.keys(payload) as Array<keyof typeof payload>;
    const nullKeys = sentKeys.filter((k) => payload[k] !== undefined && payload[k] !== null && verifyRow[k] === null);
    if (nullKeys.length > 0) {
      console.error('[DEBUG] 6. WARNING: These fields were sent but are NULL in DB (check RLS UPDATE policy):', nullKeys);
    }
  }

  const finalProfile = mapDbProfile(row as DbProfile);
  // [DEBUG] Log the final, mapped profile object that will be returned
  console.log('[DEBUG] 4. Supabase returned and mapped profile:', JSON.stringify(finalProfile, null, 2));
  return finalProfile;
}

/**
 * Update the user's public profile status.
 */
export async function updatePublicProfile(userId: string, isPublic: boolean): Promise<Profile> {
  return upsertProfile(userId, { public_profile: isPublic });
}

// ─── Auth-seeded Profile Initialization ───────────────────────────────────────

/**
 * Metadata shape from Supabase auth.users.user_metadata (OAuth + email sign-ups).
 */
export interface AuthMeta {
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  preferred_username?: string | null;
  user_name?: string | null;
}

/**
 * Generate a safe username slug from an email prefix or display name.
 * Strips non-alphanumeric characters, lowercases, truncates to 20 chars.
 */
function generateUsernameSlug(source: string): string {
  return source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')   // non-alphanumeric → underscore
    .replace(/_+/g, '_')            // collapse consecutive underscores
    .replace(/^_|_$/g, '')          // trim leading/trailing underscores
    .slice(0, 20)
    || 'trader';
}

/**
 * Initialize a profile row from auth metadata.
 *
 * Rules:
 * - Only writes a field if the DB column is currently NULL (never overwrites user edits).
 * - Derives full_name from `user_metadata.full_name` → `user_metadata.name`.
 * - Derives username from `user_metadata.preferred_username` → `user_metadata.user_name`
 *   → email prefix slug.
 * - Derives avatar_url from `user_metadata.avatar_url` → `user_metadata.picture`.
 * - Called once after sign-in when a profile row is first created or fields are still empty.
 */
export async function initializeProfileFromAuth(
  userId: string,
  meta: AuthMeta,
  existingProfile: Profile | null
): Promise<Profile> {
  const patch: Record<string, string | null> = {};

  // ── full_name ──────────────────────────────────────────────────────────────
  if (!existingProfile?.fullName) {
    const name =
      (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta.name === 'string' && meta.name.trim()) ||
      null;
    if (name) patch.full_name = name;
  }

  // ── username ───────────────────────────────────────────────────────────────
  if (!existingProfile?.username) {
    const rawUsername =
      (typeof meta.preferred_username === 'string' && meta.preferred_username.trim()) ||
      (typeof meta.user_name === 'string' && meta.user_name.trim()) ||
      null;

    const emailPrefix =
      (typeof meta.email === 'string' && meta.email.split('@')[0]) || null;

    const slugSource = rawUsername || emailPrefix;
    if (slugSource) patch.username = generateUsernameSlug(slugSource);
  }

  // ── avatar_url ─────────────────────────────────────────────────────────────
  if (!existingProfile?.avatarUrl) {
    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
      (typeof meta.picture === 'string' && meta.picture.trim()) ||
      null;
    if (avatarUrl) patch.avatar_url = avatarUrl;
  }

  // Nothing to seed — return existing profile or create a bare row
  if (Object.keys(patch).length === 0) {
    if (existingProfile) return existingProfile;
    return upsertProfile(userId, {});
  }

  console.log('[profileService] Seeding profile from auth metadata:', patch);

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('[profileService] initializeProfileFromAuth upsert error:', error.message);
    // Non-fatal: return existing profile if seeding fails
    if (existingProfile) return existingProfile;
    throw new Error(error.message);
  }

  return mapDbProfile(row as DbProfile);
}

// ─── Avatar Upload ─────────────────────────────────────────────────────────────

/**
 * Compress an image file client-side using a canvas element.
 * Reduces file size while keeping quality acceptable.
 * Targets < 500KB by adjusting quality if needed.
 */
async function compressImage(file: File, maxSide = 512, initialQuality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Resize to max dimension
      if (width > height) {
        if (width > maxSide) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        }
      } else {
        if (height > maxSide) {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, width, height);

      // Try initial quality
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Image compression failed'));

          // If under target size, return
          if (blob.size <= MAX_AVATAR_SIZE) {
            return resolve(blob);
          }

          // If over target, try progressively lower quality
          let quality = initialQuality;
          const tryLowerQuality = (attempt: number) => {
            if (attempt >= 5) {
              // Give up after 5 attempts, return what we have
              return resolve(blob);
            }

            quality -= 0.1;
            if (quality < 0.5) quality = 0.5;

            canvas.toBlob(
              (newBlob) => {
                if (newBlob && newBlob.size <= MAX_AVATAR_SIZE) {
                  resolve(newBlob);
                } else if (newBlob) {
                  tryLowerQuality(attempt + 1);
                } else {
                  resolve(blob);
                }
              },
              'image/webp',
              quality
            );
          };

          tryLowerQuality(0);
        },
        'image/webp',
        initialQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Validate + compress + upload an avatar file to Supabase storage.
 * Returns the public URL and storage path.
 */
export async function uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  // Validate raw size (before compression) - allow up to 10 MB input
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File is too large. Maximum input size is 10 MB.');
  }

  // Compress
  const compressed = await compressImage(file);

  // Double-check compressed size
  if (compressed.size > MAX_AVATAR_SIZE) {
    throw new Error('Compressed image is still too large. Please use a smaller image.');
  }

  const ext = 'webp';
  const fileName = `avatar_${Date.now()}.${ext}`;
  const storagePath = `${userId}/${fileName}`;

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, compressed, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[profileService] uploadAvatar error (dev):', uploadError);
    }
    
    let friendlyMessage = 'Failed to upload avatar. Please try again.';
    const msg = uploadError.message?.toLowerCase() || '';
    
    if (msg.includes('bucket not found')) {
      friendlyMessage = 'Storage bucket is missing. Please ensure the "avatars" bucket is created.';
    } else if (msg.includes('policy') || msg.includes('permission denied')) {
      friendlyMessage = 'Upload permission denied. Check storage policies.';
    } else {
      friendlyMessage = 'Storage configuration is incorrect. ' + uploadError.message;
    }
    
    throw new Error(friendlyMessage);
  }

  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

  // Update DB
  await upsertProfile(userId, { avatar_url: urlData.publicUrl });

  return { publicUrl: urlData.publicUrl, path: storagePath };
}

/**
 * Remove the current avatar from storage and clear the DB field.
 */
export async function removeAvatar(userId: string, currentAvatarUrl: string): Promise<void> {
  const supabase = createClient();

  // Extract the storage path from the public URL
  try {
    const url = new URL(currentAvatarUrl);
    // Path is typically /storage/v1/object/public/avatars/{userId}/{filename}
    const parts = url.pathname.split(`/${AVATAR_BUCKET}/`);
    if (parts.length > 1) {
      const storagePath = parts[1];
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
    }
  } catch {
    // Non-fatal — the file might not exist in our bucket (e.g. OAuth avatar URL)
  }

  // Always clear the DB field
  await upsertProfile(userId, { avatar_url: null });
}
