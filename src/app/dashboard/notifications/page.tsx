'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { useNotifications } from '@/contexts/NotificationsContext';
import { type NotificationSettings } from '@/services/notificationService';
import {
  Bell,
  Trash2,
  Settings2,
  Volume2,
  Vibrate,
  Monitor,
  Eye,
  Moon,
  Info,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Cpu,
  Trophy,
  Shield,
  Brain,
  Clock,
  Inbox,
  Zap,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DbNotification } from '@/lib/notifications';
import { requestOneSignalPermission, optOutOneSignal } from '@/lib/oneSignal';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'trade':
      return <TrendingUp size={18} className="text-blue-400" />;
    case 'analytics':
      return <BarChart3 size={18} className="text-purple-400" />;
    case 'warning':
      return <AlertTriangle size={18} className="text-amber-400" />;
    case 'error':
      return <XCircle size={18} className="text-red-400" />;
    case 'success':
      return <CheckCircle2 size={18} className="text-emerald-400" />;
    case 'info':
      return <Info size={18} className="text-sky-400" />;
    case 'system':
      return <Cpu size={18} className="text-zinc-400" />;
    case 'achievement':
      return <Trophy size={18} className="text-yellow-400" />;
    case 'admin':
      return <Shield size={18} className="text-red-400" />;
    case 'ai':
      return <Brain size={18} className="text-indigo-400" />;
    case 'community':
      return <Users size={18} className="text-pink-400" />;
    default:
      return <Bell size={18} className="text-zinc-400" />;
  }
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    deleteNotification,
    clearAllNotifications,
    selectNotification,
    settings,
    updateSettings,
    triggerTest,
    triggerLongNotification,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useNotifications();

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean | number) => {
    void updateSettings({ [key]: value });
    if (key === 'desktop_enabled') {
      if (value) {
        const granted = await requestOneSignalPermission();
        if (!granted) {
          toast.error('Browser push permission was not granted.');
        }
      } else {
        await optOutOneSignal();
      }
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (dateString: string) => {
    if (!mounted) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = (notification: DbNotification) => {
    selectNotification(notification.id);
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6 text-white">
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Bell size={20} />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight uppercase">
                    Notification Center
                  </h1>
                </div>
                <p className="text-zinc-500 text-sm font-medium">
                  Manage your alerts, system updates, and trading insights.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-black">
                  {unreadCount} UNREAD
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div
              className="lg:col-span-8 space-y-4 max-h-[70vh] overflow-y-auto pr-1"
              onScroll={(e) => {
                if (!hasMore || isLoadingMore) return;
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
                  void loadMore();
                }
              }}
            >
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse"
                    />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white/[0.01] border border-dashed border-white/[0.08] text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
                    <Inbox size={40} className="text-zinc-700 relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-300">No notifications found</h3>
                  <p className="text-zinc-500 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
                    When you receive trade alerts or system updates, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => void handleNotificationClick(notification)}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                        notification.is_read
                          ? 'bg-white/[0.01] border-white/[0.05] opacity-60'
                          : 'bg-white/[0.03] border-white/[0.1] hover:border-blue-500/40 hover:bg-white/[0.05] hover:-translate-y-0.5 shadow-2xl shadow-black'
                      }`}
                    >
                      {!notification.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      )}

                      <div className="p-5 flex gap-5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.05] ${notification.is_read ? 'bg-zinc-900' : 'bg-white/[0.03]'}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3
                              className={`font-bold text-sm md:text-base tracking-tight truncate ${notification.is_read ? 'text-zinc-400' : 'text-white'}`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 whitespace-nowrap">
                                <Clock size={12} />
                                {formatTime(notification.created_at)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void deleteNotification(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-red-400"
                                aria-label="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p
                            className={`text-sm leading-relaxed line-clamp-2 ${notification.is_read ? 'text-zinc-500' : 'text-zinc-400'}`}
                          >
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoadingMore && (
                    <div className="py-4 text-center text-xs text-zinc-500">Loading more...</div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl overflow-hidden sticky top-8">
                <div className="p-6 border-b border-white/[0.05] flex items-center gap-3">
                  <Settings2 size={18} className="text-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                    Settings
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <ToggleItem
                    label="Enable Notifications"
                    desc="Toggle all app alerts"
                    checked={settings?.notifications_enabled ?? true}
                    onChange={(v) => handleSettingChange('notifications_enabled', v)}
                    icon={<Bell size={16} />}
                  />
                  <ToggleItem
                    label="Sound Effects"
                    desc="Chime on new messages"
                    checked={settings?.sound_enabled ?? true}
                    onChange={(v) => handleSettingChange('sound_enabled', v)}
                    icon={<Volume2 size={16} />}
                  />
                  <ToggleItem
                    label="Vibration"
                    desc="Haptic feedback on mobile"
                    checked={settings?.vibration_enabled ?? true}
                    onChange={(v) => handleSettingChange('vibration_enabled', v)}
                    icon={<Vibrate size={16} />}
                  />
                  <ToggleItem
                    label="Floating Popups"
                    desc="Toast messages in-app"
                    checked={settings?.floating_enabled ?? true}
                    onChange={(v) => handleSettingChange('floating_enabled', v)}
                    icon={<Zap size={16} />}
                  />
                  <ToggleItem
                    label="Browser Push"
                    desc="OS-level notifications"
                    checked={settings?.desktop_enabled ?? true}
                    onChange={(v) => handleSettingChange('desktop_enabled', v)}
                    icon={<Monitor size={16} />}
                  />
                  <ToggleItem
                    label="Popup Preview"
                    desc="Show message content"
                    checked={settings?.popup_preview_enabled ?? true}
                    onChange={(v) => handleSettingChange('popup_preview_enabled', v)}
                    icon={<Eye size={16} />}
                  />
                  <ToggleItem
                    label="Do Not Disturb"
                    desc="Silence all alerts"
                    checked={settings?.do_not_disturb ?? false}
                    onChange={(v) => handleSettingChange('do_not_disturb', v)}
                    icon={<Moon size={16} />}
                  />

                  <div className="pt-4 space-y-3 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">Alert Volume</span>
                      <span className="text-xs font-black text-blue-500">
                        {Math.round((settings?.volume ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round((settings?.volume ?? 1) * 100)}
                      onChange={(e) =>
                        handleSettingChange('volume', parseInt(e.target.value, 10) / 100)
                      }
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                  </div>

                  <div className="pt-6 flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        const result = await triggerTest();
                        if (result.success) {
                          toast.success('Test notification dispatched');
                        } else {
                          toast.error(result.error ?? 'Insert failed');
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={14} /> Trigger Realtime Test
                    </button>
                    <button
                      onClick={async () => {
                        const result = await triggerLongNotification();
                        if (result.success) {
                          toast.success('Long notification dispatched');
                        } else {
                          toast.error(result.error ?? 'Insert failed');
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={14} /> Trigger Long Notification
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Permanently delete all notification history?')) {
                          void clearAllNotifications();
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Clear History
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/[0.05] flex items-center gap-3">
                  <Info size={14} className="text-zinc-500" />
                  <p className="text-[10px] font-medium text-zinc-500 leading-tight italic">
                    Realtime synchronization is active via Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

interface ToggleItemProps {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
}

function ToggleItem({ label, desc, checked, onChange, icon }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 transition-colors ${checked ? 'text-blue-500' : 'text-zinc-600'}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-200">{label}</span>
          <span className="text-[10px] font-medium text-zinc-600 group-hover:text-zinc-500 transition-colors">
            {desc}
          </span>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all duration-300 ${checked ? 'bg-blue-500' : 'bg-zinc-800'}`}
      >
        <div
          className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${checked ? 'left-5' : 'left-1'}`}
        />
      </button>
    </div>
  );
}
