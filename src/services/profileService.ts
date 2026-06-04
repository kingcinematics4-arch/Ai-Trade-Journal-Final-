import { createClient } from '@/lib/supabase';
import type { DbProfile, Profile, ProfileFormData, AvatarUploadResult } from '@/types/profile';
import { mapDbProfile, mapProfileToDb } from '@/types/profile';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const AVATAR_BUCKET = 'avatars';

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

/**
 * Fetch a single profile row by user ID.
 * Returns null if no profile exists yet.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  // STEP 5: Verify service code with a simplified query
  // This helps determine if the table name is even recognized by the API
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('[profileService] Supabase Error Details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    // PGRST116 or 406 = no rows returned
    if (error.code === 'PGRST116' || error.code === '406') return null;
    throw new Error(error.message);
  }

  const userProfile = Array.isArray(data) ? data.find(p => p.id === userId) : null;
  return userProfile ? mapDbProfile(userProfile as DbProfile) : null;
}

/**
 * Upsert (insert or update) a profile row.
 * Always merges — only updates the provided fields.
 */
export async function upsertProfile(
  userId: string,
  data: Partial<ProfileFormData> & { avatar_url?: string | null }
): Promise<Profile> {
  const supabase = createClient();
  const payload = mapProfileToDb(userId, data);

  const { data: row, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('[profileService] upsertProfile error:', error.message);
    throw new Error(error.message);
  }

  return mapDbProfile(row as DbProfile);
}

// ─── Avatar Upload ─────────────────────────────────────────────────────────────

/**
 * Compress an image file client-side using a canvas element.
 * Reduces file size while keeping quality acceptable.
 */
async function compressImage(file: File, maxSide = 512, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

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
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Image compression failed'));
          resolve(blob);
        },
        'image/webp',
        quality
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
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
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
    console.error('[profileService] uploadAvatar error:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(storagePath);

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

// ─── Account Operations ────────────────────────────────────────────────────────

/**
 * Update the user's email via Supabase Auth.
 * Sends a confirmation email to the new address.
 */
export async function updateEmail(newEmail: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw new Error(error.message);
}

/**
 * Send a password reset email to the current user's email address.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });
  if (error) throw new Error(error.message);
}

/**
 * Sign out from all sessions (global sign-out).
 */
export async function signOutEverywhere(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw new Error(error.message);
}

/**
 * Delete the user's account.
 * NOTE: Requires a Supabase Edge Function or admin API to delete from auth.users.
 * Here we sign the user out — the actual deletion needs to be done via Edge Function.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = createClient();
  // Sign out first
  await supabase.auth.signOut();
  // Additional server-side deletion should be handled via a Supabase Edge Function
  // that calls supabase.auth.admin.deleteUser(userId)
}
