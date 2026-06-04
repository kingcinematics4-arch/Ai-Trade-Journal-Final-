import { createClient } from '@/lib/supabase';
import type { DbNotification, NotificationType } from '@/lib/notifications';

export interface NotificationSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  floating_enabled: boolean;
  desktop_enabled: boolean;
  popup_preview_enabled: boolean;
  do_not_disturb: boolean;
  volume: number;
  trade_alerts: boolean;
  pnl_alerts: boolean;
  security_alerts: boolean;
  system_updates: boolean;
  message_alerts: boolean;
  activity_alerts: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notifications_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  floating_enabled: true,
  desktop_enabled: true,
  popup_preview_enabled: true,
  do_not_disturb: false,
  volume: 1.0,
  trade_alerts: true,
  pnl_alerts: true,
  security_alerts: true,
  system_updates: true,
  message_alerts: true,
  activity_alerts: true,
};

export const notificationService = {
  async getNotifications(userId: string, limit = 20): Promise<{ data: DbNotification[] | null; error: any }> {
    const supabase = createClient();
    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    metadata?: Record<string, any>;
  }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      metadata: params.metadata || {},
      is_read: false,
      created_at: new Date().toISOString()
    }).select().single();
    
    return { data, error };
  },

  async markAsRead(id: string) {
    const supabase = createClient();
    return await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllAsRead(userId: string) {
    const supabase = createClient();
    return await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  },

  async deleteNotification(id: string) {
    const supabase = createClient();
    return await supabase.from('notifications').delete().eq('id', id);
  },

  async getSettings(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116' && error.code !== '406') throw error;
    return data as NotificationSettings | null;
  },

  async fetchSettings(userId: string) {
    return this.getSettings(userId);
  },

  async updateSettings(userId: string, settings: Partial<NotificationSettings>) {
    const supabase = createClient();
    
    // Filter settings to only include valid database columns to avoid "invalid payload" errors
    const validColumns = [
      'notifications_enabled', 'sound_enabled', 'vibration_enabled', 
      'floating_enabled', 'desktop_enabled', 'popup_preview_enabled', 
      'do_not_disturb', 'volume'
    ];

    const filteredSettings = Object.entries(settings).reduce((acc, [key, value]) => {
      if (validColumns.includes(key)) {
        acc[key] = key === 'volume' ? Number(value) : value;
      }
      return acc;
    }, {} as Record<string, any>);

    const { error } = await supabase
      .from('notification_settings')
      .upsert({ 
        user_id: userId,
        ...filteredSettings, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });
    
    if (error) throw error;
  },

  isTypeEnabled(type: NotificationType, settings: NotificationSettings | null): boolean {
    const currentSettings = settings ?? DEFAULT_NOTIFICATION_SETTINGS;
    if (!currentSettings.notifications_enabled || (currentSettings.do_not_disturb && type !== 'warning')) return false;

    switch (type) {
      case 'trade': return currentSettings.trade_alerts;
      case 'analytics': return currentSettings.pnl_alerts;
      case 'warning': return currentSettings.security_alerts;
      case 'system': return currentSettings.system_updates;
      case 'achievement': return currentSettings.activity_alerts;
      case 'admin': return currentSettings.message_alerts;
      case 'ai': return currentSettings.system_updates;
      default: return true;
    }
  },

  async triggerTestNotification(userId: string) {
    const supabase = createClient();
    console.debug('[notificationService] Triggering test notification for user:', userId);
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Test Notification 🔔',
      message: 'If you see this, the realtime flow is working perfectly!',
      type: 'system',
      link: '/dashboard',
      metadata: { is_test: true }
    });
    return { error };
  }
};