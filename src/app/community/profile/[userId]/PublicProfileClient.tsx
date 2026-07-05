'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Award,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  UserPlus,
  ArrowLeft,
  Calendar,
  MapPin,
  Briefcase,
  Percent,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { PublicTraderProfile } from '@/types/community';
import { CountryFlag } from '../../components/CountryFlag';

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
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PREMIUM_GRADIENTS.length;
}

function getDisplayName(profile: PublicTraderProfile): string {
  if (profile.fullName && profile.fullName.trim().length > 0) return profile.fullName.trim();
  if (profile.username && profile.username.trim().length > 0) return profile.username.trim();
  // Never show UUIDs, placeholders, or fake names
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

export default function PublicProfileClient({ profile }: Props) {
  console.log("===== PUBLIC PROFILE CLIENT DATA =====");
  console.log(profile);
  const router = useRouter();
  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const gradient = useMemo(() => PREMIUM_GRADIENTS[getGradientIndex(profile.id)], [profile.id]);
  const connection = null;
  const connecting = false;

  const hasTrades = profile.tradesLogged > 0;

  const renderConnectButton = () => {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-semibold text-foreground/50 cursor-not-allowed opacity-70"
      >
        <UserPlus size={16} />
        Coming Soon
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <button
          onClick={() => router.push('/community/discover')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Discover
        </button>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/[0.08]">
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
                      fallback.className = `h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-3xl font-bold`;
                      fallback.textContent = initials;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-3xl font-bold`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {displayName}
              </h1>
              {profile.username && (
                <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
              )}
              {profile.bio && (
                <p className="text-sm text-slate-400 mt-3 max-w-2xl">{profile.bio}</p>
              )}
            </div>

            {/* Connect Button */}
            <div className="flex-shrink-0 w-full md:w-auto">
              {renderConnectButton()}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/[0.05]">
            {/* Country - hide if empty */}
            {profile.country && profile.country.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <MapPin size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm font-medium text-foreground">{profile.country}</p>
                </div>
              </div>
            )}

            {/* Trading Style - hide if empty */}
            {profile.tradingStyle && profile.tradingStyle.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <TrendingUp size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trading Style</p>
                  <p className="text-sm font-medium text-foreground capitalize">{profile.tradingStyle}</p>
                </div>
              </div>
            )}

            {/* Markets - hide if empty; markets is string[] | null */}
            {profile.markets && profile.markets.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <BarChart3 size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Markets</p>
                  <p className="text-sm font-medium text-foreground">{profile.markets.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Experience - hide if empty */}
            {profile.experience && profile.experience.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Briefcase size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium text-foreground capitalize">{profile.experience}</p>
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Calendar size={18} className="text-muted-foreground flex-shrink-0" />
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

            {/* Trades Logged - only show if has trades */}
            {hasTrades && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Target size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trades Logged</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.tradesLogged} trade{profile.tradesLogged !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* No trading history message */}
          {!hasTrades && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
              <Activity size={20} className="text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/50 font-medium">No trading history yet</p>
              </div>
            </div>
          )}

          {/* Win Rate (if allowed and has trades) */}
          {hasTrades && profile.showStats && profile.winRate !== null && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <Percent size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-bold text-emerald-400">{profile.winRate.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}