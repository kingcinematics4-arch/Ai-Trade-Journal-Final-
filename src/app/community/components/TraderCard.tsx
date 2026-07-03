'use client';

import React, { useMemo } from 'react';
import { Eye, UserPlus, ShieldCheck, BarChart3, Target, Ratio, TrendingUp, Briefcase, BrainCircuit, Globe, Calendar, LineChart, Users } from 'lucide-react';
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

const StatCard = ({ icon, title, value, isPositive, isNegative }: { icon: React.ReactNode; title: string; value: string; isPositive?: boolean; isNegative?: boolean }) => {
  const valueColor = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-white';
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-white/[0.03] border border-white/10 rounded-xl h-full">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        {icon}
        <span>{title}</span>
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${valueColor}`}>
        {value}
      </div>
    </div>
  );
};

const InfoBadge = ({ icon, text }: { icon: React.ReactNode; text: string | null }) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300">
      {icon}
      <span>{text}</span>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      {icon}
      <span className="font-medium text-slate-300">{value}</span>
    </div>
  );
};

const TraderCardComponent = ({ trader, isPremium = false }: TraderCardProps) => {
  const router = useRouter();
  const displayName = useMemo(() => trader.fullName?.trim() || trader.username || 'New Trader', [trader.fullName, trader.username]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const gradient = useMemo(() => PREMIUM_GRADIENTS[getGradientIndex(trader.id)], [trader.id]);
  const memberSince = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(trader.createdAt), { addSuffix: true });
    } catch {
      return null;
    }
  }, [trader.createdAt]);

  const hasTrades = trader.tradesLogged > 0;

  const handleViewProfile = () => {
    if (trader.username) {
      router.push(`/community/profile/${trader.username}`);
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col bg-white/[0.03] border border-white/10 rounded-[28px] backdrop-blur-xl transition-all duration-300 group shadow-lg shadow-black/20 hover:shadow-primary/20 hover:border-primary/20 hover:-translate-y-1.5"
    >
      <div className="p-6 flex flex-col flex-grow">
        {/* TOP SECTION */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/60 to-primary/30 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className={`relative h-full w-full rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/10 bg-gradient-to-br ${gradient}`}>
              {trader.avatarUrl ? (
                <img src={trader.avatarUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-white text-3xl font-bold">{initials}</span>
              )}
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate" title={displayName}>{displayName}</h2>
              {isPremium && <ShieldCheck size={18} className="text-primary flex-shrink-0" />}
            </div>
            {trader.username && <p className="text-sm text-muted-foreground truncate">@{trader.username}</p>}
            {trader.country && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <CountryFlag countryCode={trader.country} />
                <span>{trader.country}</span>
              </div>
            )}
          </div>
        </div>

        {/* BADGES */}
        <div className="flex flex-wrap gap-2 mt-4">
          <InfoBadge icon={<Briefcase size={12} />} text={trader.tradingStyle} />
          <InfoBadge icon={<BrainCircuit size={12} />} text={trader.experience} />
          {trader.markets?.map(market => <InfoBadge key={market} icon={<Globe size={12} />} text={market} />)}
        </div>

        {/* BIO */}
        {trader.bio && <p className="text-sm text-slate-400 mt-4 line-clamp-2 leading-relaxed">{trader.bio}</p>}

        {/* STATISTICS */}
        <div className="mt-6">
          {hasTrades ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<BarChart3 size={14} />} title="Trades" value={trader.tradesLogged.toString()} />
              <StatCard
                icon={<Target size={14} />}
                title="Win Rate"
                value={trader.winRate !== null ? `${trader.winRate.toFixed(0)}%` : 'N/A'}
                isPositive={trader.winRate !== null && trader.winRate >= 50}
                isNegative={trader.winRate !== null && trader.winRate < 40}
              />
              <StatCard
                icon={<Ratio size={14} />}
                title="Avg. R:R"
                value={trader.avgRr !== null ? `${trader.avgRr.toFixed(2)}R` : 'N/A'}
              />
              <StatCard
                icon={<TrendingUp size={14} />}
                title="Net P&L"
                value={trader.totalPnl !== null ? `${trader.totalPnl >= 0 ? '+' : ''}$${Math.abs(trader.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}
                isPositive={trader.totalPnl !== null && trader.totalPnl > 0}
                isNegative={trader.totalPnl !== null && trader.totalPnl < 0}
              />
            </div>
          ) : (
            <div className="h-[100px] flex flex-col items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/10 p-4 text-center">
              <LineChart size={24} className="text-muted-foreground/50 mb-2" />
              <p className="font-bold text-white text-sm">No Trading History</p>
              <p className="text-xs text-muted-foreground mt-1">No completed trades published yet.</p>
            </div>
          )}
        </div>

        <div className="flex-grow" />

        {/* FOOTER INFO */}
        <div className="flex justify-between items-center gap-4 mt-6 pt-4 border-t border-white/10">
          <InfoItem icon={<Calendar size={14} />} value={memberSince} label="Member Since" />
          <InfoItem icon={<Users size={14} />} value="0" label="Connections" />
          <InfoItem icon={<Eye size={14} />} value="Public" label="Profile" />
        </div>
      </div>

      {/* BOTTOM BUTTONS */}
      <div className="flex items-center gap-4 p-6 pt-4 border-t border-white/10">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
            className="h-11 flex-1 flex items-center justify-center gap-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
          >
            <Eye size={16} />
            View Profile
          </button>
          <button
            disabled
            className="h-11 flex-1 flex items-center justify-center gap-2 px-4 bg-white/10 border border-white/20 rounded-lg text-sm font-semibold text-white/60 cursor-not-allowed"
          >
            <UserPlus size={16} />
            Connect
          </button>
      </div>
    </div>
  );
};

export default React.memo(TraderCardComponent);
