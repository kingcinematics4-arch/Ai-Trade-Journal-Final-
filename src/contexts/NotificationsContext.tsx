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
import { soundService, unlockNotificationAudio, preloadNotificationSound } from '@/services/soundService';
import { showRealtimeNotificationToast } from '@/lib/notificationToast';

const PAGE_SIZE = 20;
const PERMISSION_ASKED_KEY = 'aitj_notif_permission_asked';
const seenNotificationIds = new Set<string>();
const soundedNotificationIds = new Set<string>();

export interface NotificationsContextType {
  notifications: DbNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  settings: NotificationSettings | null;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  triggerTest: () => Promise<{ success: boolean; error: string | null }>;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const settingsRef = useRef<NotificationSettings | null>(null);
  const offsetRef = useRef(0);
  const welcomeSentRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Unlock audio after first user gesture (autoplay policy)
  useEffect(() => {
    unlockNotificationAudio();
    preloadNotificationSound();
  }, []);

  const supabase = useMemo(() => createClient(), []);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    const count = await notificationService.fetchUnreadCount(user.id);
    setUnreadCount(count);
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      offsetRef.current = 0;
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error, hasMore: more } = await notificationService.fetchNotifications(user.id, {
        limit: PAGE_SIZE,
        offset: 0,
      });

      if (!error) {
        setNotifications(data);
        offsetRef.current = data.length;
        setHasMore(more);
        data.forEach((n) => seenNotificationIds.add(n.id));
      }

      await refreshUnreadCount();
    } catch (err) {
      console.warn('[NotificationsContext] fetch failed:', err instanceof Error ? err.message : err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!user?.id || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const { data, error, hasMore: more } = await notificationService.fetchNotifications(user.id, {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });

      if (!error && data.length > 0) {
        setNotifications((prev) => {
          const existing = new Set(prev.map((n) => n.id));
          const merged = [...prev, ...data.filter((n) => !existing.has(n.id))];
          offsetRef.current = merged.length;
          return merged;
        });
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [user?.id, isLoadingMore, hasMore]);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationService.ensureSettings(user.id);
      setSettings(data);

      if (!welcomeSentRef.current) {
        welcomeSentRef.current = true;
        await notificationService.ensureWelcomeNotification(user.id);
      }
    } catch (err) {
      console.warn(
        '[NotificationsContext] Settings fallback:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    }
  }, [user?.id]);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }, []);

  /** Ask browser permission once (never spam). */
  const askBrowserPermissionOnce = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(PERMISSION_ASKED_KEY)) return;
    localStorage.setItem(PERMISSION_ASKED_KEY, '1');
    await requestBrowserPermission();
  }, [requestBrowserPermission]);

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      if (!user?.id) return;

      setSettings((prev) => {
        const current = prev ?? DEFAULT_NOTIFICATION_SETTINGS;
        const updated = { ...current, ...newSettings };

        if (
          newSettings.volume !== undefined &&
          newSettings.volume !== current.volume &&
          updated.sound_enabled &&
          !updated.do_not_disturb
        ) {
          soundService.play('notification', newSettings.volume, `volume-${Date.now()}`);
        }

        return updated;
      });

      if (newSettings.desktop_enabled === true) {
        await requestBrowserPermission();
      }

      try {
        await notificationService.updateSettings(user.id, newSettings);
      } catch (err) {
        console.warn(
          '[NotificationsContext] Settings sync failed:',
          err instanceof Error ? err.message : err
        );
        await fetchSettings();
      }
    },
    [user?.id, fetchSettings, requestBrowserPermission]
  );

  const handleRealtimeInsert = useCallback(
    (newNotif: DbNotification, options?: { forceFeedback?: boolean }) => {
      if (!newNotif?.id) return;
      console.log(`[NotificationsContext] Notification triggered (${newNotif.type})`);

      // Hard user targeting
      if (userIdRef.current && newNotif.user_id && newNotif.user_id !== userIdRef.current) {
        return;
      }

      // Duplicate protection (list + toast + sound)
      if (seenNotificationIds.has(newNotif.id)) return;
      seenNotificationIds.add(newNotif.id);
      window.setTimeout(() => seenNotificationIds.delete(newNotif.id), 60_000);

      const currentSettings = settingsRef.current ?? DEFAULT_NOTIFICATION_SETTINGS;
      const masterOn = currentSettings.notifications_enabled && !currentSettings.do_not_disturb;
      const typeOn = notificationService.isTypeEnabled(newNotif.type, currentSettings);
      const allowFeedback = options?.forceFeedback || (masterOn && typeOn);

      // Always update list + badge instantly (even if muted)
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        offsetRef.current += 1;
        return [newNotif, ...prev];
      });

      if (!newNotif.is_read) {
        setUnreadCount((c) => c + 1);
      }

      if (!allowFeedback) return;

      // Popup toast (respect floating setting unless forced by Trigger Test)
      if (options?.forceFeedback || currentSettings.floating_enabled !== false) {
        console.log('[NotificationsContext] Notification popup shown');
        showRealtimeNotificationToast(newNotif, {
          showPreview: currentSettings.popup_preview_enabled !== false,
          onNavigate: (link) => {
            window.location.href = link;
          },
        });
      }

      // Sound once per notification id (still respects sound_enabled)
      if (currentSettings.sound_enabled && !currentSettings.do_not_disturb) {
        if (!soundedNotificationIds.has(newNotif.id)) {
          soundedNotificationIds.add(newNotif.id);
          window.setTimeout(() => soundedNotificationIds.delete(newNotif.id), 10_000);
          soundService.play('notification', currentSettings.volume ?? 1, newNotif.id);
        }
      }

      // Haptics
      if (currentSettings.vibration_enabled && !currentSettings.do_not_disturb) {
        soundService.triggerVibration();
      }

      // Native browser notification only when tab is hidden / minimized
      const tabHidden =
        typeof document !== 'undefined' &&
        (document.hidden || document.visibilityState === 'hidden');

      if (
        tabHidden &&
        currentSettings.desktop_enabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const native = new Notification(newNotif.title, {
            body:
              currentSettings.popup_preview_enabled !== false
                ? newNotif.message
                : 'New notification received',
            icon: '/logo.png',
            tag: newNotif.id,
            renotify: false,
          });

          native.onclick = () => {
            try {
              window.focus();
              if (newNotif.link) {
                window.location.href = newNotif.link;
              }
              native.close();
            } catch {
              // ignore
            }
          };
        } catch {
          // Permission race / unsupported — in-app toast already shown
        }
      }
    },
    []
  );

  const triggerTest = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated — sign in again.' };
    }

    console.log('[NotificationsContext] Notification triggered (test)');
    unlockNotificationAudio();
    preloadNotificationSound();
    await askBrowserPermissionOnce();

    const result = await notificationService.triggerTestNotification(user.id);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error ?? 'Insert failed — unknown error',
      };
    }

    // Present immediately so test works even if realtime is delayed/misconfigured.
    // Realtime INSERT for the same id is ignored by duplicate protection.
    handleRealtimeInsert(result.data, { forceFeedback: true });

    return { success: true, error: null };
  }, [user?.id, askBrowserPermissionOnce, handleRealtimeInsert]);

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.is_read) return;

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.warn('[NotificationsContext] markAsRead failed:', error);
        await fetchNotifications();
      }
    },
    [supabase, fetchNotifications, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.warn('[NotificationsContext] markAllAsRead failed:', error);
      await fetchNotifications();
    }
  }, [user?.id, supabase, fetchNotifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      let wasUnread = false;

      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.is_read) wasUnread = true;
        return prev.filter((n) => n.id !== id);
      });

      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      offsetRef.current = Math.max(0, offsetRef.current - 1);

      const { error } = await notificationService.deleteNotification(id);
      if (error) {
        console.warn('[NotificationsContext] delete failed:', error.message);
        await fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { error } = await notificationService.clearAll(user.id);
      if (error) throw error;
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      offsetRef.current = 0;
    } catch (error) {
      console.warn('[NotificationsContext] clearAll failed:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setSettings(null);
      setHasMore(false);
      offsetRef.current = 0;
      welcomeSentRef.current = false;

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    void fetchNotifications();
    void fetchSettings();
    void askBrowserPermissionOnce();
    unlockNotificationAudio();

    // One stable channel per user — avoids duplicate subscriptions
    const channelName = `notifications:user:${user.id}`;

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(channelName)
      .on<DbNotification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresInsertPayload<DbNotification>) => {
          if (!isMounted) return;
          console.log('[NotificationsContext] Notification saved (realtime insert)');
          handleRealtimeInsert(payload.new);
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
          if (!isMounted) return;
          const updatedNotif = payload.new;

          setNotifications((prev) => {
            const oldNotif = prev.find((n) => n.id === updatedNotif.id);

            if (oldNotif && oldNotif.is_read !== updatedNotif.is_read) {
              setUnreadCount((c) => (updatedNotif.is_read ? Math.max(0, c - 1) : c + 1));
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
          if (!isMounted) return;
          const deletedId = payload.old.id;
          let wasUnread = false;

          setNotifications((prev) => {
            const target = prev.find((n) => n.id === deletedId);
            if (target && !target.is_read) wasUnread = true;
            offsetRef.current = Math.max(0, offsetRef.current - 1);
            return prev.filter((n) => n.id !== deletedId);
          });

          if (wasUnread) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }

          if (deletedId) {
            seenNotificationIds.delete(deletedId);
            soundedNotificationIds.delete(deletedId);
          }
        }
      );

    channel.subscribe((status) => {
      if (!isMounted) return;

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (!isMounted) return;
          try {
            void channel.subscribe();
          } catch {
            // reconnect quietly
          }
        }, 2500);
      }
    });

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) {
        void supabase.removeChannel(channel).catch(() => undefined);
        if (channelRef.current === channel) channelRef.current = null;
      }
    };
  }, [
    user?.id,
    fetchNotifications,
    fetchSettings,
    supabase,
    handleRealtimeInsert,
    askBrowserPermissionOnce,
  ]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      hasMore,
      isLoadingMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      loadMore,
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
      hasMore,
      isLoadingMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      loadMore,
      fetchNotifications,
      settings,
      updateSettings,
      clearAllNotifications,
      requestBrowserPermission,
      triggerTest,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
