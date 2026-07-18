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
      message: asset
        ? `${actorName} liked your ${asset} trade.`
        : `${actorName} liked your trade.`,
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
};
