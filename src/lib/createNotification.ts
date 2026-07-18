import { notificationService } from '@/services/notificationService';
import type { NotificationType } from '@/lib/notifications';
import type { DbNotification } from '@/lib/notifications';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
  force?: boolean;
}

/**
 * Reusable helper to create a notification.
 * Delegates to notificationService (settings-aware + RLS-safe).
 */
export async function createNotification(params: CreateNotificationParams): Promise<{
  data: DbNotification | null;
  error: Error | null;
}> {
  const result = await notificationService.createNotification(params);
  return {
    data: result.data,
    error: result.error ? new Error(result.error) : null,
  };
}
