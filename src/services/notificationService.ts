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
  community_alerts: boolean;
  ai_alerts: boolean;
  email_notifications: boolean;
  show_stats: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notifications_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  floating_enabled: true,
  desktop_enabled: true,
  popup_preview_enabled: true,
  do_not_disturb: false,
  volume: 1,
  trade_alerts: true,
  pnl_alerts: true,
  security_alerts: true,
  system_updates: true,
  message_alerts: true,
  activity_alerts: true,
  community_alerts: true,
  ai_alerts: true,
  email_notifications: false,
  show_stats: true,
};

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
  /** When true, skip preference filters and always attempt insert (used by Trigger Test). */
  force?: boolean;
}

export interface FetchNotificationsOptions {
  limit?: number;
  offset?: number;
}

export interface NotificationMutationResult {
  success: boolean;
  data: DbNotification | null;
  error: string | null;
}

function formatSupabaseError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  const parts: string[] = [];
  if (error.message) parts.push(error.message);
  if (error.code) parts.push(`code: ${error.code}`);
  if (error.details) parts.push(`details: ${error.details}`);
  if (error.hint) parts.push(`hint: ${error.hint}`);

  const joined = parts.join(' | ');
  const lower = joined.toLowerCase();

  if (lower.includes('permission denied') || error.code === '42501') {
    return `Insert failed — permission denied (RLS). ${joined}`;
  }
  if (lower.includes('row-level security') || error.code === '42501' || lower.includes('rls')) {
    return `Insert failed — RLS blocked insert. ${joined}`;
  }
  if (lower.includes('does not exist') || error.code === '42P01') {
    return `Insert failed — table notifications not found. Run notifications_schema.sql. ${joined}`;
  }
  if (lower.includes('column') && lower.includes('user_id')) {
    return `Insert failed — column user_id missing/invalid. ${joined}`;
  }
  if (error.code === 'PGRST204' || lower.includes('could not find the table')) {
    return `Insert failed — notifications table not exposed via PostgREST/schema cache. ${joined}`;
  }

  return joined || 'Insert failed — unknown Supabase error';
}

function mapSettings(row: Record<string, unknown> | null): NotificationSettings | null {
  if (!row) return null;
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    notifications_enabled: Boolean(row.notifications_enabled ?? true),
    sound_enabled: Boolean(row.sound_enabled ?? true),
    vibration_enabled: Boolean(row.vibration_enabled ?? true),
    floating_enabled: Boolean(row.floating_enabled ?? true),
    desktop_enabled: Boolean(row.desktop_enabled ?? true),
    popup_preview_enabled: Boolean(row.popup_preview_enabled ?? true),
    do_not_disturb: Boolean(row.do_not_disturb ?? false),
    volume: Number(row.volume ?? 1),
    trade_alerts: Boolean(row.trade_alerts ?? true),
    pnl_alerts: Boolean(row.pnl_alerts ?? true),
    security_alerts: Boolean(row.security_alerts ?? true),
    system_updates: Boolean(row.system_updates ?? true),
    message_alerts: Boolean(row.message_alerts ?? true),
    activity_alerts: Boolean(row.activity_alerts ?? true),
    community_alerts: Boolean(row.community_alerts ?? row.activity_alerts ?? true),
    ai_alerts: Boolean(row.ai_alerts ?? row.system_updates ?? true),
    email_notifications: Boolean(row.email_notifications ?? false),
    show_stats: Boolean(row.show_stats ?? true),
  };
}

export const notificationService = {
  async fetchSettings(userId: string): Promise<NotificationSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return mapSettings(data as Record<string, unknown> | null);
  },

  async ensureSettings(userId: string): Promise<NotificationSettings> {
    const existing = await this.fetchSettings(userId);
    if (existing) return existing;

    const supabase = createClient();
    const { error } = await supabase.from('notification_settings').upsert({
      user_id: userId,
      ...DEFAULT_NOTIFICATION_SETTINGS,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[notificationService] ensureSettings failed:', error.message);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    return (await this.fetchSettings(userId)) ?? DEFAULT_NOTIFICATION_SETTINGS;
  },

  async updateSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
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
      case 'success':
        return settings.pnl_alerts;
      case 'warning':
      case 'error':
        return settings.security_alerts;
      case 'system':
      case 'info':
        return settings.system_updates;
      case 'achievement':
        return settings.activity_alerts;
      case 'admin':
        return settings.message_alerts;
      case 'community':
        return settings.community_alerts ?? settings.activity_alerts;
      case 'ai':
        return settings.ai_alerts ?? settings.system_updates;
      default:
        return true;
    }
  },

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'trade':
        return '📈';
      case 'achievement':
        return '🏆';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'ai':
        return '🧠';
      case 'analytics':
        return '📊';
      case 'community':
        return '👥';
      case 'system':
        return '⚙️';
      case 'admin':
        return '🛡️';
      default:
        return '🔔';
    }
  },

  async createNotification(
    params: CreateNotificationInput
  ): Promise<NotificationMutationResult> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        return {
          success: false,
          data: null,
          error: `Auth session error: ${authError.message}`,
        };
      }

      if (!user) {
        return {
          success: false,
          data: null,
          error: 'Not authenticated — no auth session. Sign in again.',
        };
      }

      if (user.id !== params.userId && !params.force) {
        // Cross-user path uses RPC below; self path continues
      }

      if (!params.force) {
        const settings = await this.fetchSettings(params.userId);
        if (settings && !this.isTypeEnabled(params.type, settings)) {
          return {
            success: false,
            data: null,
            error: `Notification blocked by settings (type "${params.type}" disabled, master off, or Do Not Disturb).`,
          };
        }
      }

      const payload = {
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        is_read: false,
        link: params.link ?? null,
        metadata: params.metadata ?? {},
      };

      // Self-notification: direct insert. Other users: SECURITY DEFINER RPC.
      if (user.id === params.userId) {
        const { data, error } = await supabase
          .from('notifications')
          .insert(payload)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            data: null,
            error: formatSupabaseError(error),
          };
        }

        return {
          success: true,
          data: data as DbNotification,
          error: null,
        };
      }

      const { data, error } = await supabase.rpc('create_user_notification', {
        p_user_id: params.userId,
        p_title: params.title,
        p_message: params.message,
        p_type: params.type,
        p_link: params.link ?? null,
        p_metadata: params.metadata ?? {},
      });

      if (error) {
        return {
          success: false,
          data: null,
          error: formatSupabaseError(error),
        };
      }

      return {
        success: true,
        data: {
          id: String(data),
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          is_read: false,
          link: params.link,
          metadata: params.metadata ?? {},
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create notification',
      };
    }
  },

  async fetchNotifications(
    userId: string,
    options: FetchNotificationsOptions = {}
  ): Promise<{ data: DbNotification[]; error: Error | null; hasMore: boolean }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return { data: [], error: new Error(error.message), hasMore: false };

      const rows = (data ?? []) as DbNotification[];
      return { data: rows, error: null, hasMore: rows.length === limit };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to fetch notifications'),
        hasMore: false,
      };
    }
  },

  async fetchUnreadCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] unread count failed:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  async deleteNotification(id: string): Promise<{ error: Error | null }> {
    const supabase = createClient();
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    return { error: error ? new Error(error.message) : null };
  },

  async clearAll(userId: string): Promise<{ error: Error | null }> {
    const supabase = createClient();
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  },

  async triggerTestNotification(userId: string): Promise<NotificationMutationResult> {
    return this.createNotification({
      userId,
      title: '🔔 Test Notification',
      message: 'This is a test notification to verify sounds, popups, and vibration.',
      type: 'system',
      link: '/dashboard/notifications',
      metadata: { is_test: true },
      force: true,
    });
  },

  async ensureWelcomeNotification(userId: string): Promise<void> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .contains('metadata', { kind: 'welcome' });

    if (error || (count ?? 0) > 0) return;

    await this.createNotification({
      userId,
      title: 'Welcome to AI Trade Journal',
      message:
        'Your notification center is ready. Stay on top of trades, AI insights, and system updates.',
      type: 'system',
      link: '/dashboard/notifications',
      metadata: { kind: 'welcome' },
      force: true,
    });
  },
};
