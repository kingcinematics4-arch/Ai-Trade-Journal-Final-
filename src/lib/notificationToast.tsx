'use client';

import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  TrendingUp,
  Brain,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Cpu,
  X,
} from 'lucide-react';
import type { DbNotification, NotificationType } from '@/lib/notifications';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Icon map – each type gets a distinct icon + bg colour             */
/* ------------------------------------------------------------------ */

interface IconDef {
  icon: React.ReactNode;
  bg: string; // tailwind bg class for the circular icon container
}

function getTypeIcon(type: NotificationType | string): IconDef {
  const iconClass = 'w-4 h-4 shrink-0';
  switch (type) {
    case 'trade':
      return {
        icon: <TrendingUp className={`${iconClass} text-blue-400`} />,
        bg: 'bg-blue-500/12',
      };
    case 'ai':
      return {
        icon: <Brain className={`${iconClass} text-indigo-400`} />,
        bg: 'bg-indigo-500/12',
      };
    case 'community':
      return {
        icon: <Users className={`${iconClass} text-pink-400`} />,
        bg: 'bg-pink-500/12',
      };
    case 'warning':
      return {
        icon: <AlertTriangle className={`${iconClass} text-amber-400`} />,
        bg: 'bg-amber-500/12',
      };
    case 'error':
      return {
        icon: <XCircle className={`${iconClass} text-red-400`} />,
        bg: 'bg-red-500/12',
      };
    case 'success':
      return {
        icon: <CheckCircle2 className={`${iconClass} text-emerald-400`} />,
        bg: 'bg-emerald-500/12',
      };
    case 'info':
      return {
        icon: <Info className={`${iconClass} text-sky-400`} />,
        bg: 'bg-sky-500/12',
      };
    case 'system':
      return {
        icon: <Cpu className={`${iconClass} text-zinc-400`} />,
        bg: 'bg-zinc-500/12',
      };
    default:
      return {
        icon: <Bell className={`${iconClass} text-primary`} />,
        bg: 'bg-primary/12',
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Relative timestamp helper                                         */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Actual toast component (rendered inside sonner's portal)          */
/* ------------------------------------------------------------------ */

interface ToastContentProps {
  notif: DbNotification;
  showPreview: boolean;
  onClose: () => void;
  onClick: () => void;
  toastId: string | number;
}

function ToastContent({
  notif,
  showPreview,
  onClose,
  onClick,
  toastId,
}: ToastContentProps) {
  const { icon, bg } = getTypeIcon(notif.type);

  // Progress bar state
  const DURATION_MS = 5000;
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());
  const pausedAtRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
    setProgress(remaining);
    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const handleMouseEnter = () => {
    if (pausedAtRef.current === null) {
      pausedAtRef.current = Date.now();
    }
    setPaused(true);
    cancelAnimationFrame(rafRef.current);
  };

  const handleMouseLeave = () => {
    if (pausedAtRef.current !== null) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      startRef.current += pauseDuration;
      pausedAtRef.current = null;
    }
    setPaused(false);
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      layout
      role="status"
      className={`
        pointer-events-auto relative overflow-hidden
        w-[min(100vw-2rem,380px)]
        rounded-[16px] border
        bg-[#0F1117] border-[rgba(59,130,246,0.18)]
        shadow-[0_10px_40px_rgba(0,0,0,0.45)]
        p-4 pl-[18px] pr-4 pt-[18px] pb-[22px]
        flex gap-3.5
        cursor-pointer
        transition-all duration-200
        hover:brightness-125 hover:shadow-[0_14px_48px_rgba(0,0,0,0.55)]
      `}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon circle */}
      <div
        className={`
          mt-0.5 w-10 h-10 rounded-full ${bg}
          flex items-center justify-center shrink-0
          border border-white/[0.06]
        `}
      >
        {icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white leading-snug truncate">
            {notif.title}
          </p>
          <button
            type="button"
            aria-label="Close notification"
            className="shrink-0 p-0.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors -mr-1 -mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showPreview && notif.message ? (
          <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
            {notif.message}
          </p>
        ) : null}

        <p className="text-[11px] font-medium text-zinc-600 mt-1.5">
          {formatTimestamp(notif.created_at)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
        <div
          className="h-full bg-[#3B82F6] transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Premium AITrade toast notification.
 * Framer Motion animations, glassmorphism, progress bar, hover pause.
 */
export function showRealtimeNotificationToast(
  notif: DbNotification,
  options?: {
    showPreview?: boolean;
    onNavigate?: (link: string) => void;
    onSelect?: (id: string) => void;
  }
): void {
  if (!notif?.id || !notif.title) return;

  const showPreview = options?.showPreview !== false;
  const toastId = `realtime-notif-${notif.id}`;
  const handleSelect = options?.onSelect;

  toast.custom(
    (t) => (
      <ToastContent
        notif={notif}
        showPreview={showPreview}
        onClose={() => toast.dismiss(t)}
        onClick={() => {
          if (handleSelect) handleSelect(notif.id);
          toast.dismiss(t);
        }}
        toastId={t}
      />
    ),
    {
      id: toastId,
      duration: Infinity, // we manage dismissal via progress bar ourselves
      position: 'top-right',
      unstyled: true,
    }
  );

  // Auto-dismiss after 5s (sonner will remove the element)
  setTimeout(() => {
    toast.dismiss(toastId);
  }, 5000);
}