import { createClient } from '@/lib/supabase';
import type { NotificationType, DbNotification } from './notifications';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Reusable database utility to create a new notification.
 * Works client-side or server-side (sharing the browser/session client context).
 *
 * @param params CreateNotificationParams details
 * @returns Object with inserted DbNotification data or error
 */
export async function createNotification(params: CreateNotificationParams): Promise<{
  data: DbNotification | null;
  error: Error | null;
}> {
  console.info('[createNotification] Attempting to insert notification:', {
    userId: params.userId,
    title: params.title,
    type: params.type,
  });

  try {
    const supabase = createClient();

    const insertData = {
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      is_read: false,
      link: params.link ?? null,
    };

    // Perform insert, request inserted row back, and enforce single row resolution
    const { data, error } = await supabase
      .from('notifications')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[createNotification] Database insert failed:', error.message, error.details);
      return { data: null, error: new Error(error.message) };
    }

    console.info('[createNotification] Database insert succeeded. ID:', data.id);
    return { data: data as DbNotification, error: null };
  } catch (error) {
    console.error('[createNotification] Critical exception in helper pipeline:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in createNotification'),
    };
  }
}
