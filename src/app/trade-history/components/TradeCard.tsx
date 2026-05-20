'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import AppImage from '@/components/ui/AppImage';
import type { DbTrade } from '@/lib/trades/types';
import { formatCurrency, parseSafeNumber, getTradePnL } from '@/lib/trades/analytics';

interface TradeCardProps {
  trade: DbTrade;
  index: number;
  onClick: () => void;
}

export default function TradeCard({ trade, index, onClick }: TradeCardProps) {
  const pnl = getTradePnL(trade);
  const rr = parseSafeNumber(trade.rr_ratio);
  const assetName = trade.asset_name || 'Unknown';
  const initials = assetName.slice(0, 2).toUpperCase();
  const allImages = [
    ...(trade.entry_images || []),
    ...(trade.exit_images || []),
    ...(trade.chart_images || []),
  ];
  const hasImages = allImages.length > 0;
  const tradeDate = trade.trade_date || trade.created_at;
  const formattedDate = tradeDate
    ? new Date(tradeDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      onClick={onClick}
      className="card-elevated card-hover cursor-pointer p-5 group flex flex-col justify-between min-h-[220px]"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                pnl >= 0
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{assetName}</p>
              <p className="text-xs text-muted-foreground">{trade.market_type || '—'}</p>
            </div>
          </div>
          <StatusBadge
            variant={(trade.trade_direction as 'buy' | 'sell') || 'buy'}
            label={trade.trade_direction === 'sell' ? '▼ Short' : '▲ Long'}
          />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Entry</p>
            <p className="text-sm font-semibold text-foreground font-tabular">
              ${parseSafeNumber(trade.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Exit</p>
            <p className="text-sm font-semibold text-foreground font-tabular">
              ${parseSafeNumber(trade.exit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">P&L</p>
            <p
              className={`text-sm font-bold font-tabular ${
                pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(pnl, { showSign: true })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">RR Ratio</p>
            <p
              className={`text-sm font-semibold font-tabular ${
                rr >= 2 ? 'text-green-400' : rr >= 1 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {rr.toFixed(1)}R
            </p>
          </div>
        </div>

        {/* Notes Preview */}
        {trade.notes && (
          <div className="flex items-start gap-2 mb-3 p-2.5 bg-muted/30 rounded-lg border border-border">
            <MessageSquare size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {trade.notes}
            </p>
          </div>
        )}

        {/* Thumbnail */}
        {hasImages && (
          <div className="mb-3 flex items-center gap-2">
            <div className="w-16 h-10 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0">
              <AppImage
                src={allImages[0]}
                alt="Trade screenshot"
                className="w-full h-full object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ImageIcon size={10} />
                +{allImages.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={12} />
          {formattedDate}
        </div>
        <StatusBadge variant={(trade.trade_status as any) || 'breakeven'} />
      </div>
    </motion.div>
  );
}
