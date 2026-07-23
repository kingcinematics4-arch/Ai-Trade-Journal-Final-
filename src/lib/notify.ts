import { createClient } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';

/** Fire-and-forget helpers so feature code never blocks on notification failures */

async function safeNotify(
  params: Parameters<typeof notificationService.createNotification>[0]
): Promise<void> {
  try {
    await notificationService.createNotification(params);
  } catch (err) {
    console.warn('[notify]', err instanceof Error ? err.message : 'notification failed');
  }
}

export const notify = {
  tradeCreated(userId: string, asset: string, direction?: string) {
    return safeNotify({
      userId,
      title: 'Trade Created',
      message: direction
        ? `Your ${direction} trade on ${asset} was logged successfully.`
        : `Trade on ${asset} was logged successfully.`,
      type: 'trade',
      link: '/trade-history',
      metadata: { kind: 'trade_created', asset },
    });
  },

  tradeUpdated(userId: string, asset?: string) {
    return safeNotify({
      userId,
      title: 'Trade Updated',
      message: asset ? `Your trade on ${asset} was updated.` : 'A trade was updated.',
      type: 'trade',
      link: '/trade-history',
      metadata: { kind: 'trade_updated', asset },
    });
  },

  tradeDeleted(userId: string, asset?: string) {
    return safeNotify({
      userId,
      title: 'Trade Deleted',
      message: asset ? `Trade on ${asset} was removed from your journal.` : 'A trade was deleted.',
      type: 'trade',
      link: '/trade-history',
      metadata: { kind: 'trade_deleted', asset },
    });
  },

  profileLike(
    recipientId: string,
    likerId: string,
    profileId: string,
    likerName: string,
    avatarUrl?: string | null
  ) {
    (async () => {
      try {
        const supabase = createClient();

        const { data: existing, error: dupError } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', recipientId)
          .eq('type', 'profile_like')
          .eq('is_read', false)
          .contains('metadata', { kind: 'profile_like', liker_id: likerId })
          .maybeSingle();

        if (dupError) {
          console.warn('[notify] duplicate check failed:', dupError);
        }

        if (existing) {
          return;
        }

        const link = `/community/profile/${likerId}`;

        const result = await notificationService.createNotification({
          userId: recipientId,
          title: 'New Profile Like',
          message: `${likerName} liked your profile.`,
          type: 'profile_like',
          link,
          metadata: {
            kind: 'profile_like',
            liker_id: likerId,
            profile_id: profileId,
            avatar_url: avatarUrl,
          },
        });

        if (result.success && result.data) {
          const settings = await notificationService.fetchSettings(recipientId);
          if (settings?.desktop_enabled && settings?.notifications_enabled) {
            try {
              await fetch('/api/onesignal/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId, likerName }),
              });
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('[notify]', err instanceof Error ? err.message : 'notification failed');
      }
    })();
  },

  follow(recipientId: string, followerName: string) {
    return safeNotify({
      userId: recipientId,
      title: 'New Follower',
      message: `${followerName} started following you.`,
      type: 'community',
      link: '/profile',
      metadata: { kind: 'follow' },
    });
  },

  like(recipientId: string, actorName: string, asset?: string) {
    return safeNotify({
      userId: recipientId,
      title: 'Trade Liked',
      message: asset ? `${actorName} liked your ${asset} trade.` : `${actorName} liked your trade.`,
      type: 'community',
      link: '/profile',
      metadata: { kind: 'like', asset },
    });
  },

  comment(recipientId: string, actorName: string, asset?: string) {
    return safeNotify({
      userId: recipientId,
      title: 'New Comment',
      message: asset
        ? `${actorName} commented on your ${asset} trade.`
        : `${actorName} commented on your trade.`,
      type: 'community',
      link: '/profile',
      metadata: { kind: 'comment', asset },
    });
  },

  profileUpdated(userId: string) {
    return safeNotify({
      userId,
      title: 'Profile Updated',
      message: 'Your profile details were saved successfully.',
      type: 'info',
      link: '/profile',
      metadata: { kind: 'profile_updated' },
    });
  },

  avatarChanged(userId: string) {
    return safeNotify({
      userId,
      title: 'Avatar Changed',
      message: 'Your profile photo was updated.',
      type: 'info',
      link: '/profile',
      metadata: { kind: 'avatar_changed' },
    });
  },

  aiAnalysisCompleted(userId: string) {
    return safeNotify({
      userId,
      title: 'AI Analysis Completed',
      message: 'Fresh insights from your recent trades are ready to review.',
      type: 'ai',
      link: '/ai-coach',
      metadata: { kind: 'ai_analysis_completed' },
    });
  },

  aiCoachReady(userId: string) {
    return safeNotify({
      userId,
      title: 'AI Coach Ready',
      message: 'Your AI trading coach has new guidance based on your journal.',
      type: 'ai',
      link: '/ai-coach',
      metadata: { kind: 'ai_coach_ready' },
    });
  },

  systemUpdate(userId: string, message: string) {
    return safeNotify({
      userId,
      title: 'Update Available',
      message,
      type: 'system',
      link: '/settings',
      metadata: { kind: 'update_available' },
    });
  },

  maintenance(userId: string, message: string) {
    return safeNotify({
      userId,
      title: 'Maintenance Notice',
      message,
      type: 'warning',
      link: '/dashboard',
      metadata: { kind: 'maintenance' },
    });
  },

  exportCompleted(userId: string, format: string) {
    return safeNotify({
      userId,
      title: 'Export Complete',
      message: `Your ${format} trade report was generated successfully.`,
      type: 'success',
      link: '/exports',
      metadata: { kind: 'export_completed', format },
    });
  },

  exportFailed(userId: string, format: string) {
    return safeNotify({
      userId,
      title: 'Export Failed',
      message: `Your ${format} export could not be generated. Please try again.`,
      type: 'error',
      link: '/exports',
      metadata: { kind: 'export_failed', format },
    });
  },

  goalCreated(userId: string, title: string) {
    return safeNotify({
      userId,
      title: 'Goal Created',
      message: `"${title}" target has been set.`,
      type: 'info',
      link: '/goals',
      metadata: { kind: 'goal_created', title },
    });
  },

  goalCompleted(userId: string, title: string) {
    return safeNotify({
      userId,
      title: 'Goal Achieved',
      message: `"${title}" — you hit your target!`,
      type: 'success',
      link: '/goals',
      metadata: { kind: 'goal_completed', title },
    });
  },

  goalFailed(userId: string, title: string) {
    return safeNotify({
      userId,
      title: 'Goal Missed',
      message: `"${title}" target was not met by the deadline.`,
      type: 'warning',
      link: '/goals',
      metadata: { kind: 'goal_failed', title },
    });
  },

  eventCreated(userId: string, title: string, date: string) {
    return safeNotify({
      userId,
      title: 'Event Scheduled',
      message: `"${title}" added to ${date}.`,
      type: 'info',
      link: '/dashboard/calendar',
      metadata: { kind: 'event_created', title, date },
    });
  },

  eventCompleted(userId: string, title: string) {
    return safeNotify({
      userId,
      title: 'Task Completed',
      message: `"${title}" marked as done.`,
      type: 'success',
      link: '/dashboard/calendar',
      metadata: { kind: 'event_completed', title },
    });
  },
};
