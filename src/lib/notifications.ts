import { createClient } from '@/lib/supabase';

export type NotificationType = 
  | 'trade' 
  | 'system' 
  | 'achievement' 
  | 'warning' 
  | 'analytics' 
  | 'ai' 
  | 'admin';

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

interface DbNotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient();
  
  const insertData: DbNotificationInsert = {
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    is_read: false,
    link: params.link ?? null,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert([insertData]);

  return { data, error };
}