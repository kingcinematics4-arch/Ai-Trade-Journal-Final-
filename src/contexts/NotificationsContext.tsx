'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
  RealtimeChannel,
} from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DbNotification } from '@/lib/notifications';
import {
  notificationService,
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/services/notificationService';
import { soundService } from '@/services/soundService';
import { toast } from 'sonner';

export interface NotificationsContextType {
  notifications: DbNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  settings: NotificationSettings | null;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  triggerTest: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Use refs to avoid stale closures in the Realtime callback
  const settingsRef = useRef<NotificationSettings | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Memoize the supabase client to prevent unnecessary re-creations
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Fetched Data:', data);
      console.log('Fetch Error:', error);

      if (!error && data) {
        console.log('[NotificationsContext] Fetched notifications:', data);
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationService.fetchSettings(user.id);
      if (data) {
        setSettings(data);
      } else {
        console.debug('[NotificationsContext] No settings found in DB, using defaults.');
        // Fallback to defaults if row is missing
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      }
    } catch (err) {
      console.warn(
        '[NotificationsContext] Settings not found, using defaults:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    }
  }, [user?.id]);

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      if (!user?.id) return;

      // 1. Optimistic UI update (Functional to avoid stale closure issues)
      setSettings((prev) => {
        const current = prev ?? DEFAULT_NOTIFICATION_SETTINGS;
        const updated = { ...current, ...newSettings };

        // 2. Sound preview when volume is being adjusted
        if (
          newSettings.volume !== undefined &&
          newSettings.volume !== current.volume &&
          updated.sound_enabled &&
          !updated.do_not_disturb
        ) {
          soundService.play('notification', newSettings.volume);
        }

        return updated;
      });

      // If desktop notifications are being enabled, request browser permission
      if (newSettings.desktop_enabled === true) {
        await requestBrowserPermission();
      }

      try {
        // 3. Persist to DB
        await notificationService.updateSettings(user.id, newSettings);
      } catch (err: any) {
        console.error('[NotificationsContext] Settings sync failed:', JSON.stringify(err, null, 2));
        console.error('Supabase Error Details:', {
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          payload: newSettings,
        });
        await fetchSettings(); // 4. Rollback to server state on failure
      }
    },
    [user?.id, fetchSettings]
  );

  const playNotificationSound = useCallback((currentSettings: NotificationSettings | null) => {
    if (!currentSettings?.sound_enabled || currentSettings?.do_not_disturb) return;
    soundService.play('notification', currentSettings?.volume);
  }, []);

  const triggerVibration = useCallback((currentSettings: NotificationSettings | null) => {
    if (currentSettings?.vibration_enabled && !currentSettings?.do_not_disturb) {
      soundService.triggerVibration();
    }
  }, []);

  const showNativeNotification = useCallback(
    (notif: DbNotification, currentSettings: NotificationSettings | null) => {
      if (
        currentSettings?.desktop_enabled &&
        Notification.permission === 'granted' &&
        !currentSettings.do_not_disturb
      ) {
        new Notification(notif.title, {
          body: currentSettings.popup_preview_enabled ? notif.message : 'New notification received',
          icon: '/logo.png',
        });
      }
    },
    []
  );

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const triggerTest = async () => {
    if (!user?.id) return;
    console.debug('[NotificationsContext] Manual test trigger initiated');
    const { error } = await notificationService.triggerTestNotification(user.id);
    if (error) toast.error('Failed to trigger test notification');
  };

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev: DbNotification[]) => {
        const notif = prev.find((n) => n.id === id);
        if (!notif || notif.is_read) return prev;

        // Decrement unread count only if we are actually changing a status
        setUnreadCount((c: number): number => Math.max(0, c - 1));
        return prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      });

      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert on error
        fetchNotifications();
      }
    },
    [supabase, fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistic Update
    setNotifications((prev: DbNotification[]) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount((_: number) => 0);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [user?.id, supabase, fetchNotifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      setNotifications((_: DbNotification[]) => []);
      setUnreadCount((_: number) => 0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setSettings(null);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Initial Load
    fetchNotifications();
    fetchSettings();

    // Generate a completely unique channel name to prevent collisions / cache issues
    const uniqueChannelName = `notifs:${user.id.slice(0, 8)}:${Math.random().toString(36).substring(2, 7)}`;

    // Create the channel and register all event listeners BEFORE calling subscribe()
    const channel = supabase
      .channel(uniqueChannelName)
      .on<DbNotification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresInsertPayload<DbNotification>) => {
          const newNotif = payload.new;
          console.debug('[Notifications] Realtime INSERT received:', newNotif.id);

          const currentSettings = settingsRef.current ?? DEFAULT_NOTIFICATION_SETTINGS;
          const isEnabled = notificationService.isTypeEnabled(newNotif.type, currentSettings);

          // Handle side effects outside state updaters
          if (isEnabled && currentSettings.notifications_enabled) {
            console.debug(
              '[Notifications] Side effects enabled for this type. Triggering feedback...'
            );
            playNotificationSound(currentSettings);
            triggerVibration(currentSettings);
            showNativeNotification(newNotif, currentSettings);

            if (currentSettings.floating_enabled) {
              toast.info(newNotif.title, {
                description: currentSettings.popup_preview_enabled ? newNotif.message : undefined,
                action: newNotif.link
                  ? {
                      label: 'View',
                      onClick: () => (window.location.href = newNotif.link!),
                    }
                  : undefined,
              });
            }
          }

          setNotifications((prev: DbNotification[]): DbNotification[] => {
            if (!isMounted) return prev;
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            if (!newNotif.is_read) {
              setUnreadCount((c) => c + 1);
            }
            return [newNotif, ...prev].slice(0, 20);
          });
        }
      )
      .on<DbNotification>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresUpdatePayload<DbNotification>) => {
          const updatedNotif = payload.new;
          console.debug('[Notifications] Realtime UPDATE received:', updatedNotif.id);

          setNotifications((prev: DbNotification[]) => {
            if (!isMounted) return prev;
            const oldNotif = prev.find((n) => n.id === updatedNotif.id);

            if (oldNotif && oldNotif.is_read !== updatedNotif.is_read) {
              setUnreadCount((c: number) => (updatedNotif.is_read ? Math.max(0, c - 1) : c + 1));
            }

            return prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n));
          });
        }
      )
      .on<DbNotification>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresDeletePayload<DbNotification>) => {
          const deletedId = payload.old.id;
          let wasUnread = false;

          setNotifications((prev: DbNotification[]) => {
            if (!isMounted) return prev;
            const target = prev.find((n) => n.id === deletedId);
            if (target && !target.is_read) wasUnread = true;
            return prev.filter((n) => n.id !== deletedId);
          });

          if (wasUnread) {
            setUnreadCount((count: number) => Math.max(0, count - 1));
          }
        }
      );

    // Call subscribe after all listeners are registered
    channel.subscribe((status) => {
      if (!isMounted) return;

      if (status === 'SUBSCRIBED') {
        console.debug('Realtime notification channel subscribed:', uniqueChannelName);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error - retrying:', uniqueChannelName);
      } else if (status === 'TIMED_OUT') {
        console.warn('Realtime channel timeout - retrying:', uniqueChannelName);
      }
    });

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch((err) => {
          console.warn('[Notifications] Cleanup failed:', err);
        });
        if (channelRef.current === channel) channelRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications, fetchSettings, supabase]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      refresh: fetchNotifications,
      settings,
      updateSettings,
      clearAllNotifications,
      requestBrowserPermission,
      triggerTest,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      settings,
      updateSettings,
      clearAllNotifications,
      triggerTest,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
