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
} from 'lucide-react';
import type { PublicTraderProfile } from '@/types/community';
import SocialLinkCard from '@/components/profile/SocialLinkCard';
import { CountryFlag } from '@/app/community/components/CountryFlag';
import { formatLevel } from '@/lib/format';

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

export default function PublicProfileClient({ profile }: Props) {
  console.log('===== PUBLIC PROFILE CLIENT DATA =====');
  console.log(profile);
  const router = useRouter();
  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const gradient = useMemo(() => PREMIUM_GRADIENTS[getGradientIndex(profile.id)], [profile.id]);

  const hasTrades = profile.tradesLogged > 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <button
          onClick={() => router.push('/community/discover')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Discover
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
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
                <div
                  className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white text-3xl font-bold`}
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {displayName}
              </h1>
              {profile.username && (
                <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
              )}
              {profile.email && (
                <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
              )}
              {profile.bio && (
                <p className="text-sm text-slate-400 mt-3 max-w-2xl">{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#262626]">
            {profile.country && profile.country.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
                <MapPin size={18} className="text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <CountryFlag country={profile.country} />
                  <p className="text-sm font-medium text-foreground">{profile.country}</p>
                </div>
              </div>
            )}

            {profile.tradingStyle && profile.tradingStyle.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
                <TrendingUp size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trading Style</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {profile.tradingStyle}
                  </p>
                </div>
              </div>
            )}

            {profile.markets && profile.markets.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
                <BarChart3 size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Markets</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile.markets.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {profile.experience && profile.experience.trim().length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
                <Briefcase size={18} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatLevel(profile.experience)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
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

            {hasTrades && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626]">
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

          {(profile.website ||
            profile.twitter ||
            profile.instagram ||
            profile.linkedin ||
            profile.youtube ||
            profile.github ||
            profile.discord ||
            profile.telegram) && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Links
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.website && (
                  <SocialLinkCard
                    platform="Website"
                    username={profile.website.replace(/^https?:\/\//, '')}
                    url={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                  />
                )}
                {profile.twitter && (
                  <SocialLinkCard
                    platform="Twitter/X"
                    username={
                      profile.twitter.startsWith('@') ? profile.twitter : `@${profile.twitter}`
                    }
                    url={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                  />
                )}
                {profile.instagram && (
                  <SocialLinkCard
                    platform="Instagram"
                    username={
                      profile.instagram.startsWith('@')
                        ? profile.instagram
                        : `@${profile.instagram}`
                    }
                    url={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                    avatar={profile.instagramAvatar}
                  />
                )}
                {profile.linkedin && (
                  <SocialLinkCard
                    platform="LinkedIn"
                    username={profile.linkedin.replace(
                      /^https?:\/\/(www\.)?linkedin\.com\/in\//,
                      ''
                    )}
                    url={
                      profile.linkedin.startsWith('http')
                        ? profile.linkedin
                        : `https://linkedin.com/in/${profile.linkedin}`
                    }
                  />
                )}
                {profile.youtube && (
                  <SocialLinkCard
                    platform="YouTube"
                    username={profile.youtube}
                    url={
                      profile.youtube.startsWith('http')
                        ? profile.youtube
                        : `https://youtube.com/@${profile.youtube.replace('@', '')}`
                    }
                  />
                )}
                {profile.github && (
                  <SocialLinkCard
                    platform="GitHub"
                    username={
                      profile.github.startsWith('@') ? profile.github : `@${profile.github}`
                    }
                    url={`https://github.com/${profile.github.replace('@', '')}`}
                  />
                )}
                {profile.discord && (
                  <SocialLinkCard
                    platform="Discord"
                    username={profile.discord}
                    url={
                      profile.discord.startsWith('http')
                        ? profile.discord
                        : `https://discord.com/users/${profile.discord}`
                    }
                  />
                )}
                {profile.telegram && (
                  <SocialLinkCard
                    platform="Telegram"
                    username={
                      profile.telegram.startsWith('@') ? profile.telegram : `@${profile.telegram}`
                    }
                    url={`https://t.me/${profile.telegram.replace('@', '')}`}
                  />
                )}
              </div>
            </div>
          )}

          {!hasTrades && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-[#262626] flex items-center gap-3">
              <Activity size={20} className="text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/50 font-medium">
                  No trading history yet
                </p>
              </div>
            </div>
          )}

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
