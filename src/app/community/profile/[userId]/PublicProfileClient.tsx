'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  ArrowLeft,
  Calendar,
  MapPin,
  Briefcase,
  Percent,
  Trophy,
  Flame,
  BarChart2,
  TrendingDown,
} from 'lucide-react';
import type { PublicTraderProfile } from '@/types/community';
import SocialLinks from '@/components/profile/SocialLinks';
import { CountryFlag } from '@/app/community/components/CountryFlag';
import { formatLevel, truncateBio } from '@/lib/format';
import { formatCurrency } from '@/lib/trades/analytics';
import LikeProfileButton from '@/app/community/components/LikeProfileButton';

interface Props {
  profile: PublicTraderProfile;
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
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PREMIUM_GRADIENTS.length;
}

function getDisplayName(profile: PublicTraderProfile): string {
  if (profile.fullName && profile.fullName.trim().length > 0) return profile.fullName.trim();
  if (profile.username && profile.username.trim().length > 0) return profile.username.trim();
  return 'Trader';
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

function formatPnL(value: number | null): string {
  if (value == null) return '$0.00';
  return formatCurrency(value, { showSign: true });
}

function getStreakLabel(streak: { type: 'win' | 'loss' | 'none'; count: number }): string {
  if (streak.type === 'none') return '0';
  return `${streak.type === 'win' ? 'W' : 'L'}${streak.count}`;
}

function getStreakSubtext(streak: { type: 'win' | 'loss' | 'none'; count: number }): string {
  if (streak.type === 'none') return 'No active streak';
  const tradeType = streak.type === 'win' ? 'wins' : 'losses';
  return `${streak.count} consecutive ${tradeType}`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'text-foreground',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
      <span className={`${color} opacity-70 flex-shrink-0`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-bold text-foreground tracking-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function PublicProfileClient({ profile }: Props) {
  const router = useRouter();
  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const gradient = useMemo(() => PREMIUM_GRADIENTS[getGradientIndex(profile.id)], [profile.id]);

  const hasTrades = profile.tradesLogged > 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1750px] mx-auto px-6 lg:px-14 pt-6">
        <button
          onClick={() => router.push('/community/discover')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-8"
        >
          <ArrowLeft size={16} />
          Back to Discover
        </button>
      </div>

      <div className="max-w-[1750px] mx-auto px-6 lg:px-14">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 lg:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
            <div className="relative h-32 w-32 md:h-36 md:w-36 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/[0.08]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = `h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-4xl font-bold`;
                      fallback.textContent = initials;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div
                  className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-4xl font-bold`}
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {displayName}
                </h1>
                <LikeProfileButton profileId={profile.id} profileOwnerId={profile.id} size="md" />
              </div>
              {profile.username && (
                <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
              )}
              {profile.email && (
                <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
              )}
              {profile.bio && (
                <p className="text-sm text-slate-400 mt-4 max-w-2xl line-clamp-3 break-words [overflow-wrap:anywhere] whitespace-normal">
                  {truncateBio(profile.bio)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 pt-10 border-t border-[#262626]">
            {profile.country && profile.country.trim().length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
                <MapPin size={20} className="text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <CountryFlag country={profile.country} />
                  <p className="text-sm font-medium text-foreground">{profile.country}</p>
                </div>
              </div>
            )}

            {profile.tradingStyle && profile.tradingStyle.trim().length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
                <TrendingUp size={20} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trading Style</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {profile.tradingStyle}
                  </p>
                </div>
              </div>
            )}

            {profile.markets && profile.markets.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
                <BarChart3 size={20} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Markets</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.markets.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {profile.experience && profile.experience.trim().length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
                <Briefcase size={20} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatLevel(profile.experience)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
              <Calendar size={20} className="text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {hasTrades && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#262626]">
                <Target size={20} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trades Logged</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.tradesLogged} trade{profile.tradesLogged !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!hasTrades && (
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-[#262626] flex items-center gap-3">
              <Activity size={20} className="text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/50 font-medium">
                  No trading history yet
                </p>
              </div>
            </div>
          )}

          {hasTrades && profile.showStats && (
            <div className="mt-8 pt-8 border-t border-[#262626]">
              <h3 className="text-sm font-bold text-foreground mb-4">Trading Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Target size={18} />}
                  label="Total Trades"
                  value={profile.tradesLogged.toString()}
                />
                <StatCard
                  icon={<Percent size={18} />}
                  label="Win Rate"
                  value={`${(profile.winRate ?? 0).toFixed(1)}%`}
                  color={(profile.winRate ?? 0) >= 50 ? 'text-emerald-400' : 'text-rose-400'}
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Total P&L"
                  value={formatPnL(profile.totalPnl)}
                  color={(profile.totalPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                />
                <StatCard
                  icon={<BarChart2 size={18} />}
                  label="Risk/Reward"
                  value={`1 : ${(profile.avgRr ?? 0).toFixed(1)}`}
                />
                <StatCard
                  icon={<Trophy size={18} />}
                  label="Best Trade"
                  value={profile.bestTrade ? formatPnL(profile.bestTrade.pnl) : '$0.00'}
                  sub={profile.bestTrade?.asset}
                  color="text-amber-400"
                />
                <StatCard
                  icon={<TrendingDown size={18} />}
                  label="Worst Trade"
                  value={profile.worstTrade ? formatPnL(profile.worstTrade.pnl) : '$0.00'}
                  sub={profile.worstTrade?.asset}
                  color="text-rose-400"
                />
                <StatCard
                  icon={<Flame size={18} />}
                  label="Streak"
                  value={getStreakLabel(profile.currentStreak)}
                  sub={getStreakSubtext(profile.currentStreak)}
                  color={
                    profile.currentStreak.type === 'win'
                      ? 'text-emerald-400'
                      : profile.currentStreak.type === 'loss'
                        ? 'text-rose-400'
                        : 'text-muted-foreground'
                  }
                />
                <StatCard
                  icon={<Target size={18} />}
                  label="Wins / Losses"
                  value={`${profile.winCount}W / ${profile.lossCount}L`}
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <SocialLinks profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
