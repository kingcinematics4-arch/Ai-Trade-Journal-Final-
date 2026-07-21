import { createClient } from '@/lib/supabase';
import type { ProfileLike, DbProfileLike } from '@/types/community';
import { mapDbProfileLike } from '@/types/community';
import { isTableNotFoundError, getTableNotFoundFriendlyError } from '@/lib/supabase/tableExists';

const TABLE_NAME = 'profile_likes';

/**
 * Log the full Supabase error object for debugging.
 * This is a helper to ensure we never lose error details.
 */
function logFullError(context: string, error: unknown): void {
  if (!error) return;
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    console.error(`[profileLikeService] ${context}`, {
      message: err.message ?? '(no message)',
      code: err.code ?? '(no code)',
      details: err.details ?? '(no details)',
      hint: err.hint ?? '(no hint)',
      fullError: err,
    });
  } else {
    console.error(`[profileLikeService] ${context}`, error);
  }
}

/**
 * Safely handle a Supabase error. If it's a "table not found" error,
 * log a friendly message and return true (handled). Otherwise return false.
 */
function handleTableNotFoundError(error: { code?: string; message?: string } | null): boolean {
  if (isTableNotFoundError(error)) {
    console.warn(`[profileLikeService] ${getTableNotFoundFriendlyError(TABLE_NAME)}`);
    return true;
  }
  return false;
}

/**
 * Get the total number of likes for a profile.
 */
export async function getProfileLikeCount(profileId: string): Promise<number> {
  const supabase = createClient();

  const response = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (response.error) {
    console.log('[LIKE STATE UPDATE]', 'Function: getProfileLikeCount', 'Returned error:', response.error, 'Returned count:', 0, 'Returned rows:', response.data);
    if (handleTableNotFoundError(response.error)) return 0;
    logFullError('getProfileLikeCount error', response.error);
    return 0;
  }

  console.log('[LIKE STATE UPDATE]', 'Function: getProfileLikeCount', 'Returned count:', response.count, 'Returned rows:', response.data?.length ?? 0, 'Returned error:', response.error);
  return response.count ?? 0;
}

/**
 * Check if the current user has liked a profile.
 */
export async function hasUserLikedProfile(profileId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const response = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('profile_id', profileId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (response.error) {
    if (handleTableNotFoundError(response.error)) return false;
    logFullError('hasUserLikedProfile error', response.error);
    return false;
  }

  return !!response.data;
}

/**
 * Toggle a like on a profile.
 * Returns the new like state (true = liked, false = unliked) and the new count.
 * Returns null on error (including table not found) — never throws.
 */
export async function toggleProfileLike(
  profileId: string
): Promise<{ liked: boolean; count: number } | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[profileLikeService] toggleProfileLike: user not authenticated');
    return null;
  }

  // Prevent liking your own profile
  if (user.id === profileId) {
    console.warn('[profileLikeService] toggleProfileLike: cannot like your own profile');
    return null;
  }

  // Check if already liked
  const checkResponse = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('profile_id', profileId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkResponse.error) {
    if (handleTableNotFoundError(checkResponse.error)) return null;
    logFullError('toggleProfileLike check error', checkResponse.error);
    return null;
  }

  if (checkResponse.data) {
    // Unlike: remove the like
    console.log('[LIKE STATE UPDATE]', 'Function: toggleProfileLike DELETE', 'Deleting row id:', checkResponse.data.id, 'for profileId:', profileId, 'userId:', user.id);
    const deleteResponse = await supabase.from(TABLE_NAME).delete().eq('id', checkResponse.data.id);

    if (deleteResponse.error) {
      console.log('[LIKE STATE UPDATE]', 'Function: toggleProfileLike DELETE', 'Returned error:', deleteResponse.error);
      if (handleTableNotFoundError(deleteResponse.error)) return null;
      logFullError('toggleProfileLike delete error', deleteResponse.error);
      return null;
    }
    console.log('[LIKE STATE UPDATE]', 'Function: toggleProfileLike DELETE', 'Deleted successfully');
  } else {
    // Like: insert a new like
    const insertResponse = await supabase.from(TABLE_NAME).insert({
      profile_id: profileId,
      user_id: user.id,
    });

    if (insertResponse.error) {
      if (handleTableNotFoundError(insertResponse.error)) return null;
      console.error('[profileLikeService] toggleProfileLike INSERT FAILED', {
        code: insertResponse.error.code,
        message: insertResponse.error.message,
        details: insertResponse.error.details,
        hint: insertResponse.error.hint,
        fullError: insertResponse.error,
      });
      return null;
    }

    // Verify INSERT actually succeeds
    const verifyResponse = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (verifyResponse.error || !verifyResponse.data) {
      console.error(
        '[profileLikeService] INSERT verification failed - row not found after insert',
        {
          error: verifyResponse.error,
          data: verifyResponse.data,
        }
      );
      return null;
    }
    console.log('Rows after insert', verifyResponse.data);
  }

  // Get the updated count
  const newCount = await getProfileLikeCount(profileId);
  console.log('[LIKE STATE UPDATE]', 'Function: toggleProfileLike return', 'Returned liked:', !checkResponse.data, 'Returned count:', newCount);

  return {
    liked: !checkResponse.data,
    count: newCount,
  };
}

/**
 * Get all users who liked a profile (for display purposes).
 */
export async function getProfileLikes(profileId: string): Promise<ProfileLike[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    if (handleTableNotFoundError(error)) return [];
    console.error('[profileLikeService] getProfileLikes error:', error.message);
    return [];
  }

  return (data ?? []).map((row: DbProfileLike) => mapDbProfileLike(row));
}

/**
 * Subscribe to realtime changes on profile_likes for a given profile.
 * Returns the unsubscribe function.
 * If the table doesn't exist, it logs a warning and returns a no-op function.
 */
export function subscribeToProfileLikes(
  profileId: string,
  onCountChange: (count: number) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`profile_likes:${profileId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_NAME,
        filter: `profile_id=eq.${profileId}`,
      },
      async (payload) => {
        // Handle potential errors in the payload (errors is string[])
        if (payload.errors && payload.errors.length > 0) {
          const hasTableError = payload.errors.some((err) => {
            const msg = (err ?? '').toLowerCase();
            return msg.includes('could not find the table') || msg.includes('does not exist');
          });
          if (hasTableError) {
            console.warn(`[profileLikeService] ${getTableNotFoundFriendlyError(TABLE_NAME)}`);
            return;
          }
        }
        const count = await getProfileLikeCount(profileId);
        console.log('[LIKE STATE UPDATE]', 'Function: subscribeToProfileLikes', 'Trigger: Realtime refresh', 'Returned count:', count, 'Payload event:', payload.eventType, 'Payload data:', payload.new ?? payload.old);
        onCountChange(count);
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' && err) {
        const msg = typeof err === 'string' ? err : ((err as { message?: string }).message ?? '');
        if (
          msg.toLowerCase().includes('could not find the table') ||
          msg.toLowerCase().includes('does not exist')
        ) {
          console.warn(`[profileLikeService] ${getTableNotFoundFriendlyError(TABLE_NAME)}`);
        }
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
