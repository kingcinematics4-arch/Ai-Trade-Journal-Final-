'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  TrendingUp,
  Brain,
  BarChart3,
  Users,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  Trophy,
  Shield,
  Cpu,
  Bell,
} from 'lucide-react';
import type { DbNotification, NotificationType } from '@/lib/notifications';

interface IconDef {
  icon: React.ReactNode;
  bg: string;
  text: string;
}

function getTypeIcon(type: NotificationType | string): IconDef {
  const iconClass = 'w-5 h-5';
  switch (type) {
    case 'trade':
      return { icon: <TrendingUp className={iconClass} />, bg: 'bg-blue-500/10', text: 'text-blue-400' };
    case 'ai':
      return { icon: <Brain className={iconClass} />, bg: 'bg-indigo-500/10', text: 'text-indigo-400' };
    case 'analytics':
      return { icon: <BarChart3 className={iconClass} />, bg: 'bg-purple-500/10', text: 'text-purple-400' };
    case 'community':
      return { icon: <Users className={iconClass} />, bg: 'bg-pink-500/10', text: 'text-pink-400' };
    case 'warning':
      return { icon: <AlertTriangle className={iconClass} />, bg: 'bg-amber-500/10', text: 'text-amber-400' };
    case 'error':
      return { icon: <XCircle className={iconClass} />, bg: 'bg-red-500/10', text: 'text-red-400' };
    case 'success':
      return { icon: <CheckCircle2 className={iconClass} />, bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    case 'info':
      return { icon: <Info className={iconClass} />, bg: 'bg-sky-500/10', text: 'text-sky-400' };
    case 'achievement':
      return { icon: <Trophy className={iconClass} />, bg: 'bg-yellow-500/10', text: 'text-yellow-400' };
    case 'admin':
      return { icon: <Shield className={iconClass} />, bg: 'bg-red-500/10', text: 'text-red-400' };
    case 'system':
      return { icon: <Cpu className={iconClass} />, bg: 'bg-zinc-500/10', text: 'text-zinc-300' };
    default:
      return { icon: <Bell className={iconClass} />, bg: 'bg-primary/10', text: 'text-primary' };
  }
}

const BADGE_TYPES: NotificationType[] = ['success', 'warning', 'error', 'info'];

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

interface NotificationDetailsPanelProps {
  notification: DbNotification | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
}

export default function NotificationDetailsPanel({
  notification,
  onClose,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onNavigate,
}: NotificationDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isOpen = Boolean(notification);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeydown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 60);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [isOpen, handleKeydown]);

  const icon = notification ? getTypeIcon(notification.type) : null;
  const showBadge = notification ? BADGE_TYPES.includes(notification.type) : false;
  const hasLink = Boolean(notification?.link);

  return (
    <AnimatePresence>
      {isOpen && notification && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClose}
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-details-title"
            className="relative w-full max-w-[560px] max-h-[80vh] bg-card border border-white/[0.06] rounded-[20px] shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-5">
              <div className="flex items-start gap-4 min-w-0">
                {icon && (
                  <div
                    className={`w-10 h-10 rounded-xl ${icon.bg} ${icon.text} flex items-center justify-center border border-white/[0.06] shrink-0`}
                  >
                    {icon.icon}
                  </div>
                )}
                <div className="min-w-0 pt-0.5">
                  <h2
                    id="notif-details-title"
                    className="text-lg font-semibold text-foreground leading-snug tracking-tight truncate"
                  >
                    {notification.title}
                  </h2>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto">
              {showBadge && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-4 ${icon.bg} ${icon.text}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  <span className="capitalize">{notification.type}</span>
                </div>
              )}

              <div className="rounded-2xl bg-white/[0.02] px-5 py-4">
                <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                  {notification.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-8 py-6">
              {hasLink && (
                <button
                  type="button"
                  onClick={() => onNavigate(notification.link!)}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <ExternalLink size={15} />
                  Open
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  notification.is_read ? onMarkUnread(notification.id) : onMarkRead(notification.id)
                }
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                {notification.is_read ? (
                  <>
                    <CheckCheck size={15} />
                    Mark unread
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Mark read
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onDelete(notification.id);
                  handleClose();
                }}
                aria-label="Delete notification"
                className="h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl border border-border bg-white/[0.02] text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-xl hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
