import { notificationService as coreNotificationService } from '@/services/notificationService';

type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type: 'trade' | 'goal' | 'system' | 'ai' | 'community' | 'info';
  link?: string;
  metadata?: Record<string, unknown>;
};

export const notificationService = {
  async createNotification(payload: NotificationPayload) {
    const mappedType =
      payload.type === 'goal' ? 'achievement' : (payload.type as Parameters<typeof coreNotificationService.createNotification>[0]['type']);

    return coreNotificationService.createNotification({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: mappedType,
      link: payload.link,
      metadata: payload.metadata,
    });
  },
};
