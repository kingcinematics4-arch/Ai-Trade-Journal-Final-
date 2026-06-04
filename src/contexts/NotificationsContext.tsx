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

export interface NotificationsContextType {
  notifications: DbNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  popupEnabled: boolean;
  soundEnabled: boolean;
  togglePopup: (enabled: boolean) => void;
  toggleSound: (enabled: boolean) => void;
  clearAllNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic Update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

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
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

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
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [user?.id, supabase]);

  const togglePopup = (enabled: boolean) => setPopupEnabled(enabled);
  const toggleSound = (enabled: boolean) => setSoundEnabled(enabled);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Generate a completely unique channel name to prevent collisions / cache issues
    const uniqueChannelName = `user-notifications:${user.id}:${Math.random().toString(36).substring(2, 9)}`;

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
          setNotifications((prev) => {
            // Guard against duplicate notifications
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            if (!newNotif.is_read) {
              setUnreadCount((count) => count + 1);
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
          setNotifications((prev) => {
            const oldNotif = prev.find((n) => n.id === updatedNotif.id);
            if (oldNotif && oldNotif.is_read !== updatedNotif.is_read) {
              setUnreadCount((count) =>
                updatedNotif.is_read ? Math.max(0, count - 1) : count + 1
              );
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
          setNotifications((prev) => {
            const target = prev.find((n) => n.id === deletedId);
            if (target && !target.is_read) {
              setUnreadCount((count) => Math.max(0, count - 1));
            }
            return prev.filter((n) => n.id !== deletedId);
          });
        }
      );

    // Call subscribe after all listeners are registered
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.debug('Realtime notification channel subscribed:', uniqueChannelName);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications, supabase]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      refresh: fetchNotifications,
      popupEnabled,
      soundEnabled,
      togglePopup,
      toggleSound,
      clearAllNotifications,
    }),
    [notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications, popupEnabled, soundEnabled, clearAllNotifications]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
