'use client';

import React, { useMemo } from 'react';
import { Eye, UserPlus, BarChart3, Target, Ratio, TrendingUp, Briefcase, BrainCircuit, Globe, Calendar, LineChart, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PublicTraderProfile } from '@/types/community';
import { CountryFlag } from './CountryFlag';
import { formatDistanceToNow } from 'date-fns';

interface TraderCardProps {
  trader: PublicTraderProfile;
  isPremium?: boolean;
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0]?.length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'NT';
}

const StatPill = ({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string; }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/[.03] border border-white/5 rounded-lg flex-1 min-w-0">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-grow">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate">{label}</p>
        <p className={`text-base font-bold truncate ${valueColor || 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, text }: { icon: React.ReactNode; text: string | null }) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
      {icon}
      <span>{text}</span>
    </div>
  );
};

const InfoBadge = ({ text, icon }: { text: string | null; icon?: React.ReactNode }) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300 flex-shrink-0">
      {icon}
      <span>{text}</span>
    </div>
  );
};

const TraderCardComponent = ({ trader, isPremium = false }: TraderCardProps) => {
  console.log("===== TRADER CARD DATA =====");
  console.log(trader);
  const router = useRouter();
  const displayName = useMemo(() => {
    if (trader.fullName?.trim()) return trader.fullName.trim();
    if (trader.username?.trim()) return trader.username.trim();
    // Both are empty — the profile seeding should have populated at least one.
    // Show 'Trader' as a neutral fallback; never show UUIDs or IDs.
    return 'Trader';
  }, [trader.fullName, trader.username]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const memberSince = useMemo(() => trader.createdAt ? `Joined ${new Date(trader.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : null, [trader.createdAt]);

  const hasTrades = trader.tradesLogged > 0;

  const handleViewProfile = () => {
    // Route by username if set, fall back to user ID so the button always works
    const slug = trader.username?.toLowerCase() ?? trader.id;
    router.push(`/community/profile/${slug}`);
  };

  return (
    <div
      className="relative w-full md:h-[320px] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-xl shadow-black/30 overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30"
    >
      <div className="flex flex-col md:flex-row flex-grow p-6 gap-6"> {/* Main content area */}
        {/* LEFT SECTION: Avatar & Meta */}
        <div className="flex-shrink-0 md:w-[18%] flex flex-col items-center justify-center text-center gap-4">
          <div className="relative h-24 w-24 rounded-full group-hover:scale-105 transition-transform duration-300">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/50 to-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className={`relative h-full w-full rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/10 bg-gradient-to-br ${PREMIUM_GRADIENTS[getGradientIndex(trader.id)]}`}>
              {trader.avatarUrl ? (
                <img src={trader.avatarUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-white text-4xl font-bold">{initials}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {memberSince && <InfoItem icon={<Calendar size={14} />} text={memberSince} />}
            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">Public</div>
          </div>
        </div>

        {/* RIGHT SECTION: Main Content */}
        <div className="flex-grow md:w-[82%] flex flex-col gap-4 min-w-0">
          {/* Name, Username, Verified, Country */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-white truncate" title={displayName}>{displayName}</h2>
              {trader.username && <p className="text-sm text-slate-400 truncate">@{trader.username}</p>}
            </div>
            {trader.country && <div className="flex-shrink-0"><CountryFlag countryCode={trader.country} className="w-6 h-auto rounded-sm" /></div>}
          </div>

          {/* Bio — only render when content exists, matching PublicProfileClient */}
          {trader.bio && (
            <p className="text-base text-slate-400 line-clamp-2 leading-relaxed">{trader.bio}</p>
          )}

          {/* Stats Row */}
          <div className="flex-grow flex items-center">
            {hasTrades ? (
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <StatPill icon={<BarChart3 size={16} />} label="Trades" value={trader.tradesLogged.toString()} />
                <StatPill icon={<Target size={16} />} label="Win Rate" value={trader.winRate !== null ? `${trader.winRate.toFixed(0)}%` : 'N/A'} valueColor={trader.winRate && trader.winRate >= 50 ? 'text-emerald-400' : 'text-slate-200'} />
                <StatPill icon={<TrendingUp size={16} />} label="Net P&L" value={trader.totalPnl !== null ? `${trader.totalPnl >= 0 ? '+' : ''}$${Math.abs(trader.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'} valueColor={trader.totalPnl && trader.totalPnl > 0 ? 'text-emerald-400' : (trader.totalPnl && trader.totalPnl < 0 ? 'text-red-400' : 'text-slate-200')} />
                <StatPill icon={<Ratio size={16} />} label="Avg. RR" value={trader.avgRr !== null ? `${trader.avgRr.toFixed(2)}R` : 'N/A'} />
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center rounded-xl bg-white/5 p-4 text-center">
                <LineChart size={24} className="text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-white text-sm">No Trading History</p>
                <p className="text-xs text-muted-foreground mt-1">This trader hasn't published any completed trades yet.</p>
              </div>
            )}
          </div>

          {/* Info Chips & Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <InfoBadge text={trader.tradingStyle} icon={<Briefcase size={12} />} />
              <InfoBadge text={trader.experience} icon={<BrainCircuit size={12} />} />
              {trader.markets?.map(market => <InfoBadge key={market} text={market} icon={<Globe size={12} />} />)}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
              <button onClick={handleViewProfile} className="h-11 flex-1 flex items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-xl text-base font-semibold transition-all duration-300 hover:bg-primary/90">
                View Profile
              </button>
              <button disabled className="h-11 flex-1 flex items-center justify-center gap-2 px-6 bg-white/10 border border-white/20 rounded-xl text-base font-semibold text-white/60 cursor-not-allowed">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TraderCardComponent);
