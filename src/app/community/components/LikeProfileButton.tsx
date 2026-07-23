'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  toggleProfileLike,
  hasUserLikedProfile,
  getProfileLikeCount,
  subscribeToProfileLikes,
} from '@/services/profileLikeService';
import { createClient } from '@/lib/supabase';
import { notify } from '@/lib/notify';

interface LikeProfileButtonProps {
  profileId: string;
  profileOwnerId: string;
  /** Optional initial count to avoid an extra fetch */
  initialCount?: number;
  /** Optional initial liked state */
  initialLiked?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show compact mode (icon + count only) */
  compact?: boolean;
  /** Callback when like state changes */
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function LikeProfileButton({
  profileId,
  profileOwnerId,
  initialCount = 0,
  initialLiked = false,
  size = 'md',
  compact = false,
  onLikeChange,
}: LikeProfileButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isOwnProfile = currentUserId === profileOwnerId;
  const isProcessing = useRef(false);
  // Refs to track current state for use inside async callbacks (avoid stale closures)
  const likedRef = useRef(liked);
  const countRef = useRef(count);

  // Keep refs in sync with state
  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  // Size mappings
  const sizeMap = {
    sm: { icon: 14, text: 'text-xs', gap: 'gap-2', height: 'h-7', padding: 'px-2.5' },
    md: { icon: 18, text: 'text-sm', gap: 'gap-2', height: 'h-8', padding: 'px-3' },
    lg: { icon: 22, text: 'text-base', gap: 'gap-2', height: 'h-9', padding: 'px-3.5' },
  };

  const s = sizeMap[size];

  // Fetch initial state and current user
  useEffect(() => {
    let mounted = true;

    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      const userId = user?.id ?? null;
      setCurrentUserId(userId);
      const [likeCount, likedStatus] = await Promise.all([
        getProfileLikeCount(profileId),
        userId ? hasUserLikedProfile(profileId) : Promise.resolve(false),
      ]);

      if (!mounted) return;
      console.log(
        '[LIKE STATE UPDATE]',
        'Function: init',
        'Old liked:',
        liked,
        'New liked:',
        likedStatus,
        'Old count:',
        count,
        'New count:',
        likeCount,
        new Error().stack
      );
      setCount(likeCount);
      setLiked(likedStatus);
      setIsAuthReady(true);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [profileId, initialCount, initialLiked]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToProfileLikes(profileId, (newCount) => {
      console.log(
        '[LIKE STATE UPDATE]',
        'Function: subscribeToProfileLikes callback',
        'Old count:',
        count,
        'New count:',
        newCount,
        'Trigger: Realtime event',
        new Error().stack
      );
      setCount(newCount);
    });

    return unsubscribe;
  }, [profileId]);

  const handleLike = useCallback(async () => {
    if (!isAuthReady) {
      console.warn('[LikeProfileButton] Auth not ready yet');
      return;
    }

    if (isOwnProfile) {
      console.warn('[LikeProfileButton] Cannot like own profile');
      return;
    }

    if (isProcessing.current) {
      console.warn('[LikeProfileButton] Already processing a like');
      return;
    }

    isProcessing.current = true;
    setIsLoading(true);

    const currentLiked = likedRef.current;
    const currentCount = countRef.current;

    const previousLiked = currentLiked;
    const previousCount = currentCount;

    // Optimistic update
    console.log(
      '[LIKE STATE UPDATE]',
      'Function: handleLike optimistic',
      'Old liked:',
      currentLiked,
      'New liked:',
      !currentLiked,
      'Old count:',
      currentCount,
      'New count:',
      currentLiked ? currentCount - 1 : currentCount + 1,
      new Error().stack
    );
    setLiked(!currentLiked);
    setCount((prev) => (currentLiked ? prev - 1 : prev + 1));
    setIsAnimating(true);

    try {
      const result = await toggleProfileLike(profileId);

      if (!result) {
        console.warn('[LikeProfileButton] toggle returned null, reverting');
        console.log(
          '[LIKE STATE UPDATE]',
          'Function: handleLike revert-null',
          'Old liked:',
          !currentLiked,
          'New liked:',
          previousLiked,
          'Old count:',
          currentLiked ? currentCount - 1 : currentCount + 1,
          'New count:',
          previousCount,
          new Error().stack
        );
        setLiked(previousLiked);
        setCount(previousCount);
      } else {
        // Success: apply server-confirmed state
        console.log(
          '[LIKE STATE UPDATE]',
          'Function: handleLike success',
          'Old liked:',
          !currentLiked,
          'New liked:',
          result.liked,
          'Old count:',
          currentLiked ? currentCount - 1 : currentCount + 1,
          'New count:',
          result.count,
          new Error().stack
        );
        setLiked(result.liked);
        setCount(result.count);
        onLikeChange?.(result.liked, result.count);

        if (result.liked && profileOwnerId !== currentUserId) {
          try {
            const client = createClient();
            const { data: profile, error: profileErr } = await client
              .from('profiles')
              .select('full_name, username, avatar_url')
              .eq('id', currentUserId)
              .single();

            if (profileErr) {
              console.warn(
                '[LikeProfileButton] Failed to fetch actor profile for notification:',
                profileErr
              );
            } else {
              const actorName = profile?.full_name || profile?.username || 'Someone';
              notify.profileLike(
                profileOwnerId,
                currentUserId,
                profileId,
                actorName,
                profile?.avatar_url ?? null
              );
            }
          } catch (notifyErr) {
            console.warn('[LikeProfileButton] Notification error:', notifyErr);
          }
        }
      }
    } catch (err) {
      // Catch any unexpected errors
      console.error('[LikeProfileButton] Unexpected error in handleLike:', err);
      console.log(
        '[LIKE STATE UPDATE]',
        'Function: handleLike catch',
        'Old liked:',
        !currentLiked,
        'New liked:',
        previousLiked,
        'Old count:',
        currentLiked ? currentCount - 1 : currentCount + 1,
        'New count:',
        previousCount,
        new Error().stack
      );
      setLiked(previousLiked);
      setCount(previousCount);
    } finally {
      setIsLoading(false);
      isProcessing.current = false;
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [profileId, isOwnProfile, onLikeChange, currentUserId, profileOwnerId, isAuthReady]);

  if (isOwnProfile) return null;

  return (
    <motion.button
      onClick={handleLike}
      disabled={isLoading}
      className={`
        relative inline-flex items-center justify-center ${s.height} ${s.padding} ${s.gap}
        rounded-full border transition-all duration-200 cursor-pointer
        ${
          liked
            ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.12)] hover:shadow-[0_0_14px_rgba(59,130,246,0.2)]'
            : 'bg-transparent border-border text-gray-500 hover:text-blue-400 hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
        group
      `}
      whileTap={{ scale: 0.95 }}
      aria-label={liked ? 'Unlike profile' : 'Like profile'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={liked ? 'liked' : 'unliked'}
          initial={{ scale: 1 }}
          animate={{
            scale: isAnimating ? [1, 1.08, 1] : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative"
        >
          <Heart
            size={s.icon}
            className={`
              transition-all duration-200
              ${liked ? 'fill-blue-400 text-blue-400' : 'fill-none text-gray-500 group-hover:text-blue-400'}
              group-hover:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]
            `}
          />
        </motion.div>
      </AnimatePresence>

      <span className={`${s.text} font-medium tabular-nums select-none`}>{count}</span>
    </motion.button>
  );
}
