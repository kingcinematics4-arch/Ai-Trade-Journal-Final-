'use client';

import { createClient } from '@/lib/supabase';
import type { AvatarUploadResult } from '@/types/profile';
import { upsertProfile } from '../profileService';

const MAX_AVATAR_SIZE = 500 * 1024; // 500 KB target
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const AVATAR_BUCKET = 'avatars';

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
      console.error('[avatarService] uploadAvatar error (dev):', uploadError);
    }
    
    let friendlyMessage = 'Failed to upload avatar. Please try again.';
    const msg = uploadError.message?.toLowerCase() || '';
    
    if (msg.includes('bucket not found') || msg.includes('not found')) {
      friendlyMessage = 'Storage bucket is missing. Please ensure the "avatars" bucket is created.';
    } else if (
      msg.includes('row-level security') || 
      msg.includes('violates') || 
      msg.includes('policy') || 
      msg.includes('security') || 
      msg.includes('permission denied') || 
      msg.includes('unauthorized')
    ) {
      friendlyMessage = 'Upload permission denied.';
    } else if (msg.includes('fetch') || msg.includes('network')) {
      friendlyMessage = 'Network error.';
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