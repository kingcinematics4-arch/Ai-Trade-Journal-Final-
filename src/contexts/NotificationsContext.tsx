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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  popupEnabled: boolean;
  soundEnabled: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  togglePopup: (val: boolean) => void;
  toggleSound: (val: boolean) => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
    console.info('[notifications] Audio chime played successfully.');
  } catch (error) {
    console.warn('[notifications] Audio chime blocked or failed to play:', error);
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const popupEnabledRef = useRef(popupEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  const routerRef = useRef(router);

  // Sync state values to refs for the subscription closure
  useEffect(() => {
    popupEnabledRef.current = popupEnabled;
  }, [popupEnabled]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Load preferences from localStorage client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPopup = localStorage.getItem('notifications:popupEnabled');
      const storedSound = localStorage.getItem('notifications:soundEnabled');
      if (storedPopup !== null) {
        setPopupEnabled(storedPopup === 'true');
        console.info('[notifications] Loaded popupEnabled setting:', storedPopup);
      }
      if (storedSound !== null) {
        setSoundEnabled(storedSound === 'true');
        console.info('[notifications] Loaded soundEnabled setting:', storedSound);
      }
    }
  }, []);

  const togglePopup = useCallback((val: boolean) => {
    console.info('[notifications] Toggle popup setting:', val);
    setPopupEnabled(val);
    localStorage.setItem('notifications:popupEnabled', String(val));
  }, []);

  const toggleSound = useCallback((val: boolean) => {
    console.info('[notifications] Toggle sound setting:', val);
    setSoundEnabled(val);
    localStorage.setItem('notifications:soundEnabled', String(val));
  }, []);

  // Memoize the supabase client
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.info('[notifications] No user session found. Resetting notifications.');
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    console.info('[notifications] Fetching notifications for user:', user.id);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[notifications] Database fetch error:', error.message, error.details);
      } else if (data) {
        console.info('[notifications] Database fetch success:', data.length, 'records loaded.');
        setNotifications(data);
        const unreads = data.filter((n) => !n.is_read).length;
        setUnreadCount(unreads);
        console.info('[notifications] Initial unread count set to:', unreads);
      }
    } catch (err) {
      console.error('[notifications] Critical exception while fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  const markAsRead = useCallback(
    async (id: string) => {
      console.info('[notifications] Marking notification as read:', id);
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
        console.info('[notifications] DB marked as read successfully:', id);
      } catch (error) {
        console.error('[notifications] Error updating notification read state, reverting:', error);
        fetchNotifications();
      }
    },
    [supabase, fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    console.info('[notifications] Marking all notifications as read for:', user.id);

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
      console.info('[notifications] DB marked all read successfully.');
    } catch (error) {
      console.error('[notifications] Error marking all read, reverting:', error);
      fetchNotifications();
    }
  }, [user?.id, supabase, fetchNotifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    console.info('[notifications] Clearing all notification history for user:', user.id);

    // Optimistic Update
    setNotifications([]);
    setUnreadCount(0);

    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);

      if (error) {
        throw error;
      }
      console.info('[notifications] DB cleared all notifications successfully.');
    } catch (error) {
      console.error('[notifications] Error clearing notification history, reverting:', error);
      fetchNotifications();
    }
  }, [user?.id, supabase, fetchNotifications]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);

      if (channelRef.current) {
        console.info('[notifications] Cleaning up active channel because user logged out.');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    fetchNotifications();

    if (channelRef.current) {
      console.info('[notifications] Discarding previous realtime channel.');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const uniqueChannelName = `user-notifications:${user.id}:${Math.random().toString(36).substring(2, 9)}`;
    console.info('[notifications] Generating new realtime channel:', uniqueChannelName);

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
          console.info('[notifications] Intercepted realtime INSERT event:', newNotif);

          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) {
              console.warn('[notifications] Prevented duplicate notification render:', newNotif.id);
              return prev;
            }
            if (!newNotif.is_read) {
              setUnreadCount((count) => {
                const nextCount = count + 1;
                console.info('[notifications] Realtime unread count incremented:', nextCount);
                return nextCount;
              });
            }

            // Play sound if enabled
            if (soundEnabledRef.current) {
              playNotificationSound();
            }

            // Show sonner toast notification if enabled
            if (popupEnabledRef.current) {
              console.info('[notifications] Displaying alert toast popup for:', newNotif.title);
              toast(newNotif.title, {
                description: newNotif.message,
                duration: 5000,
                action: newNotif.link
                  ? {
                      label: 'View',
                      onClick: () => {
                        routerRef.current.push(newNotif.link!);
                      },
                    }
                  : undefined,
              });
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
          console.info('[notifications] Intercepted realtime UPDATE event:', updatedNotif);

          setNotifications((prev) => {
            const oldNotif = prev.find((n) => n.id === updatedNotif.id);
            if (oldNotif && oldNotif.is_read !== updatedNotif.is_read) {
              setUnreadCount((count) => {
                const nextCount = updatedNotif.is_read ? Math.max(0, count - 1) : count + 1;
                console.info('[notifications] Realtime unread count sync update:', nextCount);
                return nextCount;
              });
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
          console.info('[notifications] Intercepted realtime DELETE event for ID:', deletedId);

          setNotifications((prev) => {
            const target = prev.find((n) => n.id === deletedId);
            if (target && !target.is_read) {
              setUnreadCount((count) => {
                const nextCount = Math.max(0, count - 1);
                console.info(
                  '[notifications] Realtime unread count decremented (DELETE):',
                  nextCount
                );
                return nextCount;
              });
            }
            return prev.filter((n) => n.id !== deletedId);
          });
        }
      );

    channel.subscribe((status, err) => {
      console.info(`[notifications] Realtime subscription status callback: ${status}`, err || '');
      if (status === 'CHANNEL_ERROR') {
        console.error(
          '[notifications] WebSocket channel subscription failed. Verify if table realtime replication is active on Supabase!'
        );
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.info(
          '[notifications] Executing useEffect cleanup - removing channel:',
          uniqueChannelName
        );
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
      popupEnabled,
      soundEnabled,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      togglePopup,
      toggleSound,
      refresh: fetchNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      popupEnabled,
      soundEnabled,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      togglePopup,
      toggleSound,
      fetchNotifications,
    ]
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
