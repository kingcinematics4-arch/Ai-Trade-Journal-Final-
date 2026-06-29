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

export const notificationService = {
  async fetchSettings(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as NotificationSettings | null;
  },

  async updateSettings(userId: string, settings: Partial<NotificationSettings>) {
    const supabase = createClient();
    const { error } = await supabase.from('notification_settings').upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  isTypeEnabled(type: NotificationType, settings: NotificationSettings | null): boolean {
    if (!settings) return true;
    if (!settings.notifications_enabled || settings.do_not_disturb) return false;

    switch (type) {
      case 'trade':
        return settings.trade_alerts;
      case 'analytics':
        return settings.pnl_alerts;
      case 'warning':
        return settings.security_alerts;
      case 'system':
        return settings.system_updates;
      case 'achievement':
        return settings.activity_alerts;
      case 'admin':
        return settings.message_alerts;
      case 'ai':
        return settings.system_updates;
      default:
        return true;
    }
  },

  async triggerTestNotification(userId: string) {
    const supabase = createClient();
    return await supabase.from('notifications').insert({
      user_id: userId,
      title: '🔔 Test Notification',
      message: 'This is a test notification to verify sounds, popups, and vibration.',
      type: 'system',
      link: '/dashboard',
      metadata: { is_test: true },
    });
  },
};
