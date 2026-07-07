'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicTraderProfile } from '@/types/community';
import { getCountryCode } from './CountryFlag';
import { formatLevel } from '@/lib/format';

interface TraderCardProps {
  trader: PublicTraderProfile;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1 && parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return 'NT';
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const truncateBio = (bio?: string) => {
  if (!bio) return '';

  const MAX_BIO_LENGTH = 120;

  return bio.length > MAX_BIO_LENGTH
    ? bio.slice(0, MAX_BIO_LENGTH).trimEnd() + '...'
    : bio;
};

const TraderCardComponent = ({ trader }: TraderCardProps) => {
  const router = useRouter();

  const displayName = useMemo(() => {
    if (trader.fullName?.trim()) return trader.fullName.trim();
    if (trader.username?.trim()) return trader.username.trim();
    return 'Trader';
  }, [trader.fullName, trader.username]);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const flagEmoji = useMemo(
    () => getFlagEmoji(getCountryCode(trader.country || '')),
    [trader.country],
  );

  const countryText = useMemo(
    () => (trader.country ? (flagEmoji ? `${flagEmoji} ${trader.country}` : trader.country) : ''),
    [trader.country, flagEmoji],
  );
  const marketText = useMemo(
    () => (trader.markets && trader.markets.length ? trader.markets.join(' • ') : ''),
    [trader.markets],
  );
  const bioText = useMemo(() => truncateBio(trader.bio), [trader.bio]);

  const styleText = useMemo(() => trader.tradingStyle || '', [trader.tradingStyle]);

  const levelText = useMemo(() => formatLevel(trader.experience), [trader.experience]);
  const handleViewProfile = () => {
    const slug = trader.username?.toLowerCase() ?? trader.id;
    router.push(`/community/profile/${slug}`);
  };

  const hasTrades = trader.tradesLogged > 0 && trader.winRate !== null;

  return (
    <div className="h-[184px] w-full bg-[#0a0a0a] border border-white/[0.04] rounded-[18px] p-5 pb-7 flex flex-col justify-between cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_6px_20px_rgba(59,130,246,0.12)]">
      {/* Top row: avatar + name/bio | stats | button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-[56px] w-[56px] rounded-full overflow-hidden flex-shrink-0">
            {trader.avatarUrl ? (
              <img src={trader.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">{initials}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-[14px] font-semibold text-white leading-tight truncate">
              {displayName}
            </h2>
            {bioText && (
              <p className="text-[11px] text-white/50 leading-tight mt-2 line-clamp-3 break-words [overflow-wrap:anywhere] whitespace-normal">
                {bioText}
              </p>
            )}
          </div>
        </div>

        <div className="w-[25%] flex flex-col items-end justify-center gap-2 flex-shrink-0">
          <div className="text-right">
            <span className="block text-[18px] font-semibold text-white leading-tight">
              {trader.winRate !== null ? `${Math.round(trader.winRate)}%` : '--'}
            </span>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider leading-tight">
              Win Rate
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[18px] font-semibold text-white leading-tight">
              {trader.tradesLogged > 0 ? String(trader.tradesLogged) : '--'}
            </span>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider leading-tight">
              Trades
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[15px] font-semibold text-white leading-tight">
              {levelText}
            </span>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider leading-tight">
              Level
            </span>
          </div>
        </div>

        <button
          onClick={handleViewProfile}
          className="h-[34px] w-[120px] text-[13px] text-white font-semibold bg-blue-500 hover:bg-blue-400 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-400/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex-shrink-0"
        >
          View Profile <span className="ml-2">→</span>
        </button>
      </div>

      {/* Bottom row: Country (left) | Market • Trading Style (centered) */}
      {(countryText || marketText || styleText) && (
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-white/40 leading-tight text-left truncate">
            {countryText}
          </span>
          <span className="flex-1 text-[10px] text-white/40 leading-tight text-center truncate">
            {marketText ? (styleText ? `${marketText} • ${styleText}` : marketText) : styleText}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(TraderCardComponent);
