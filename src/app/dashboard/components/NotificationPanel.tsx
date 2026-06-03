'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Trash2,
  Inbox,
  Settings,
  ArrowLeft,
  Volume2,
  VolumeX,
  BellRing,
  BellOff,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { DbNotification } from '@/lib/notifications';

export default function NotificationPanel() {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    popupEnabled,
    soundEnabled,
    togglePopup,
    toggleSound,
  } = useNotifications();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimestamp = (dateString: string | undefined | null) => {
    if (!mounted || !dateString) return 'recently';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'recently';

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'just now';

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString();
    } catch {
      return 'recently';
    }
  };

  const handleNotificationClick = async (notification: DbNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] bg-slate-900/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl z-50 shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showSettings && (
            <button
              onClick={() => setShowSettings(false)}
              className="text-muted-foreground hover:text-white transition-colors"
              aria-label="Back to notifications"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {showSettings ? 'Settings' : 'Notifications'}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {!showSettings && notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`transition-colors ${showSettings ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
            aria-label="Notification Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="overflow-y-auto flex-1 scrollbar-none">
        {showSettings ? (
          /* Settings View */
          <div className="flex flex-col text-xs">
            {/* Popup Toggle Row */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                  {popupEnabled ? (
                    <BellRing size={16} className="text-primary" />
                  ) : (
                    <BellOff size={16} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">Popup Notifications</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Show desktop alert toasts for new notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePopup(!popupEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none ${
                  popupEnabled ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    popupEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Toggle Row */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                  {soundEnabled ? (
                    <Volume2 size={16} className="text-primary" />
                  ) : (
                    <VolumeX size={16} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">Sound Alerts</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Play a chime when new notification arrives
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleSound(!soundEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none ${
                  soundEnabled ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions Row */}
            <div className="p-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Clear all notification history? This cannot be undone.')) {
                    await clearAllNotifications();
                    setShowSettings(false);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl font-bold transition-all"
              >
                <Trash2 size={14} />
                Clear All Notifications
              </button>
            </div>
          </div>
        ) : (
          /* Notifications View */
          <>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-xs">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <Inbox className="text-muted-foreground/20" size={32} />
                <p className="text-xs text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] relative group cursor-pointer animate-in fade-in duration-300 ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.is_read ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-2 font-medium">
                        {formatTimestamp(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-primary"
                        aria-label="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className="p-3 bg-white/[0.02] text-center border-t border-white/[0.05]">
        <button
          type="button"
          onClick={() => {
            setShowSettings(false);
            router.push('/dashboard');
          }}
          className="text-[10px] font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
}
