'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicTraderProfile } from '@/types/community';

interface TraderCardProps {
  trader: PublicTraderProfile;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1 && parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return 'NT';
}

const TraderCardComponent = ({ trader }: TraderCardProps) => {
  const router = useRouter();

  const displayName = useMemo(() => {
    if (trader.fullName?.trim()) return trader.fullName.trim();
    if (trader.username?.trim()) return trader.username.trim();
    return 'Trader';
  }, [trader.fullName, trader.username]);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const handleViewProfile = () => {
    const slug = trader.username?.toLowerCase() ?? trader.id;
    router.push(`/community/profile/${slug}`);
  };

  const hasTrades = trader.tradesLogged > 0 && trader.winRate !== null;

  return (
    <div className="h-[150px] w-full bg-[#0a0a0a] border border-white/[0.04] rounded-[18px] p-5 flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_6px_20px_rgba(59,130,246,0.12)]">
      <div className="w-[20%] flex items-center gap-3">
        <div className="h-[56px] w-[56px] rounded-full overflow-hidden flex-shrink-0">
          {trader.avatarUrl ? (
            <img src={trader.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">{initials}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-[55%] flex flex-col justify-center">
        <h2 className="text-[16px] font-semibold text-white leading-tight">{displayName}</h2>
        {trader.username && (
          <p className="text-[13px] text-white/40 leading-tight mt-0.5">@{trader.username}</p>
        )}
        {trader.bio && (
          <p className="text-[13px] text-white/50 leading-tight mt-1 line-clamp-2">{trader.bio}</p>
        )}
        {!hasTrades && (
          <p className="text-[12px] text-white/40 leading-tight mt-1">No verified trades yet.</p>
        )}
        <p className="text-[11px] text-white/40 leading-tight mt-1">
          {trader.country && trader.tradingStyle
            ? `${trader.country} • ${trader.tradingStyle}`
            : trader.country || trader.tradingStyle || ''}
        </p>
      </div>

      <div className="w-[25%] flex flex-col items-end justify-center gap-2">
        <div className="text-right">
          <span className="block text-[18px] font-semibold text-white leading-tight">
            {trader.winRate !== null ? `${Math.round(trader.winRate)}%` : '--'}
          </span>
          <span className="block text-[11px] text-white/40 uppercase tracking-wider leading-tight">
            Win Rate
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[18px] font-semibold text-white leading-tight">
            {trader.tradesLogged > 0 ? String(trader.tradesLogged) : '--'}
          </span>
          <span className="block text-[11px] text-white/40 uppercase tracking-wider leading-tight">
            Trades
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[18px] font-semibold text-white leading-tight">
            {trader.experience || 'Professional'}
          </span>
          <span className="block text-[11px] text-white/40 uppercase tracking-wider leading-tight">
            Level
          </span>
        </div>
      </div>

      <button
        onClick={handleViewProfile}
        className="h-[34px] w-[120px] text-[13px] text-white/70 font-medium border border-white/[0.12] rounded-full hover:text-white hover:border-blue-500/50 transition-all duration-200 flex-shrink-0"
      >
        View Profile →
      </button>
    </div>
  );
};

export default React.memo(TraderCardComponent);
