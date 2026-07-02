'use client';

import React, { useMemo } from 'react';
import { Eye, UserPlus, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PublicTraderProfile } from '@/types/community';
import { CountryFlag } from './CountryFlag';

interface TraderCardProps {
  trader: PublicTraderProfile;
}

const PREMIUM_GRADIENTS = [
  'from-violet-500/40 to-purple-600/20',
  'from-emerald-500/40 to-teal-600/20',
  'from-amber-500/40 to-orange-600/20',
  'from-rose-500/40 to-pink-600/20',
  'from-sky-500/40 to-blue-600/20',
  'from-cyan-500/40 to-indigo-600/20',
];

function getGradientIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PREMIUM_GRADIENTS.length;
}

function getDisplayName(trader: PublicTraderProfile): string {
  if (trader.fullName && trader.fullName.trim().length > 0) return trader.fullName;
  if (trader.username && trader.username.trim().length > 0) return trader.username;
  return 'New Trader';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }
  return 'NT';
}

function hasMinimumProfile(trader: PublicTraderProfile): boolean {
  const hasFullName = trader.fullName && trader.fullName.trim().length > 0;
  const hasUsername = trader.username && trader.username.trim().length > 0;
  return hasFullName || hasUsername;
}

const StatItem = ({ label, value, positive, negative }: {
  label: string;
  value: string | number | null;
  positive?: boolean;
  negative?: boolean;
}) => {
  if (value === null) return null;
  const colorClass = positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-white';
  return (
    <div className="text-center">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">{label}</dt>
      <dd className={`text-sm font-bold ${colorClass} mt-0.5`}>{value}</dd>
    </div>
  );
};

const TraderCard = ({ trader }: TraderCardProps) => {
  const router = useRouter();
  const displayName = useMemo(() => getDisplayName(trader), [trader]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const gradient = useMemo(() => PREMIUM_GRADIENTS[getGradientIndex(trader.id)], [trader.id]);
  const profileIncomplete = useMemo(() => !hasMinimumProfile(trader), [trader]);

  const hasTrades = trader.tradesLogged > 0;
  const winRateDisplay = useMemo(() => {
    if (!hasTrades) return null;
    if (trader.winRate === null || trader.winRate === undefined) return null;
    return `${trader.winRate.toFixed(1)}%`;
  }, [hasTrades, trader.winRate]);

  const avgRrDisplay = useMemo(() => {
    if (!hasTrades) return null;
    if (trader.avgRr === null || trader.avgRr === undefined) return null;
    return `${trader.avgRr.toFixed(2)}R`;
  }, [hasTrades, trader.avgRr]);

  const totalPnlDisplay = useMemo(() => {
    if (!hasTrades) return null;
    if (trader.totalPnl === null || trader.totalPnl === undefined) return null;
    const isPositive = trader.totalPnl >= 0;
    const formatted = `${isPositive ? '+' : ''}$${Math.abs(trader.totalPnl).toFixed(0)}`;
    return { value: formatted, isPositive };
  }, [hasTrades, trader.totalPnl]);

  const handleViewProfile = () => {
    if (trader.username) {
      router.push(`/community/profile/${trader.username}`);
    }
  };

  return (
    <div
      onClick={handleViewProfile}
      className="relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 transition-all duration-300 group flex flex-col h-full cursor-pointer overflow-hidden"
    >
      {/* Glass hover effect */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* ─── Avatar ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative h-20 w-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 mb-3 ring-2 ring-white/[0.06] group-hover:ring-primary/30 transition-all">
            {trader.avatarUrl ? (
              <img
                src={trader.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = `h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-2xl font-bold`;
                    fallback.textContent = initials;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-2xl font-bold`}>
                {initials}
              </div>
            )}
          </div>

          {/* ─── Name ─────────────────────────────────────────── */}
          <h3 className="text-lg font-bold text-white truncate w-full leading-tight">{displayName}</h3>

          {/* ─── @username ────────────────────────────────────── */}
          {trader.username && trader.username.trim().length > 0 && (
            <p className="text-sm text-muted-foreground truncate w-full mt-0.5">@{trader.username}</p>
          )}

          {/* ─── Country flag + verified badge row ────────────── */}
          <div className="flex items-center justify-center gap-3 mt-3 min-h-[20px]">
            {trader.country && trader.country.trim().length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CountryFlag countryCode={trader.country} />
                <span className="text-xs text-muted-foreground/70">{trader.country}</span>
              </div>
            )}
            {/* Verified badge (future ready) */}
            <div className="flex items-center gap-1 text-xs text-primary/60">
              <ShieldCheck size={12} />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* ─── Profile Incomplete Badge ──────────────────────── */}
        {profileIncomplete && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Profile Incomplete
            </span>
          </div>
        )}

        {/* ─── Bio ───────────────────────────────────────────── */}
        {trader.bio && trader.bio.trim().length > 0 && (
          <p className="text-sm text-slate-400 mb-5 line-clamp-2 text-center leading-relaxed">{trader.bio}</p>
        )}

        {/* ─── Trading Style Badge ────────────────────────────── */}
        {trader.tradingStyle && trader.tradingStyle.trim().length > 0 && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-primary/8 text-primary border border-primary/15">
              {trader.tradingStyle}
            </span>
          </div>
        )}

        {/* ─── Statistics ────────────────────────────────────── */}
        <div className="my-auto">
          {hasTrades ? (
            <>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                <StatItem label="Trades" value={trader.tradesLogged.toString()} />
                <StatItem label="Win Rate" value={winRateDisplay} positive />
                <StatItem label="Avg R:R" value={avgRrDisplay} />
                {totalPnlDisplay ? (
                  <StatItem
                    label="Net P&L"
                    value={totalPnlDisplay.value}
                    positive={totalPnlDisplay.isPositive}
                    negative={!totalPnlDisplay.isPositive}
                  />
                ) : (
                  <StatItem label="Net P&L" value="$0" />
                )}
              </div>
            </>
          ) : (
            <div className="py-4 text-center border-y border-white/[0.05]">
              <p className="text-xs text-muted-foreground/50 font-medium tracking-wide">No trading history yet</p>
            </div>
          )}
        </div>

        {/* ─── Footer Actions ────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-semibold text-foreground/50 cursor-not-allowed opacity-70"
          >
            <UserPlus size={14} />
            Coming Soon
          </button>
          <button
            onClick={handleViewProfile}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-semibold transition-all"
          >
            <Eye size={14} />
            Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TraderCard);
