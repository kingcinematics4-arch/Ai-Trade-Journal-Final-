export type NotificationType =
  | 'trade'
  | 'system'
  | 'achievement'
  | 'warning'
  | 'analytics'
  | 'ai'
  | 'admin'
  | 'success'
  | 'error'
  | 'info'
  | 'community'
  | 'profile_like';

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export { createNotification } from '@/lib/createNotification';
