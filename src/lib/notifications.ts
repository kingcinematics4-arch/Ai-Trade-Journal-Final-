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
  metadata?: Record<string, any>;
  created_at: string;
}

interface DbNotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string | null;
  metadata?: Record<string, any>;
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
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
    metadata: params.metadata ?? {},
  };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([insertData])
      .select()
      .single();

    return { data: data as DbNotification, error };
  } catch (error) {
    return { data: null, error };
  }
}