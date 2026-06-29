'use client';
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradesContext';
import { createClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/trades/analytics';
import type { TradeRow } from '@/lib/trades/types';
import TradeDetailsModal from './TradeDetailsModal';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export type { TradeRow };

type SortKey = 'date' | 'pnl' | 'rr';
type SortDir = 'asc' | 'desc';

export default function RecentTradesTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tradeRows, trades: rawTrades, isLoading: isLoadingTrades, refetch } = useTrades();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trades = useMemo(() => {
    const sorted = [...tradeRows].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'date') return (a.sortDate - b.sortDate) * dir;
      if (sortKey === 'pnl') return (a.pnl - b.pnl) * dir;
      return (a.rr - b.rr) * dir;
    });
    return sorted.slice(0, 8);
  }, [tradeRows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', deleteTarget)
      .eq('user_id', user.id);

    if (error) {
      toast.error(t('dashboard.trades.deleteFailed'));
      setIsDeleting(false);
      return;
    }

    setDeleteTarget(null);
    setIsDeleting(false);
    await refetch();
    toast.success(t('dashboard.trades.deleteSuccess'));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-primary" />
    ) : (
      <ChevronDown size={12} className="text-primary" />
    );
  };

  // Mobile specific skeleton to prevent hydration errors (div-based vs tr-based)
  const MobileTradeSkeleton = () => (
    <div className="p-3 border-b border-border/40 animate-pulse">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-2.5 w-24 bg-muted rounded" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="h-4 w-14 bg-muted rounded" />
          <div className="h-2.5 w-12 bg-muted rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-6 w-14 bg-muted rounded" />
          <div className="h-6 w-14 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-muted/50 rounded" />
          <div className="h-7 w-7 bg-muted/50 rounded" />
        </div>
      </div>
    </div>
  );

  // Mobile specific card component
  const MobileTradeCard = (
    { trade }: { trade: TradeRow } // This component is now replaced by a table
  ) => (
    <div
      className="mx-4 mb-4 p-7 card-premium active:scale-[0.98] cursor-pointer"
      onClick={() => setSelectedTradeId(trade.id)}
    >
      <div className="flex justify-between items-start mb-7">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-[11px] shadow-inner border border-white/[0.03] ${trade.direction === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
          >
            <span className="opacity-40 uppercase tracking-tight">
              {trade.direction === 'buy' ? 'Long' : 'Short'}
            </span>
            <span className="text-sm mt-1">{trade.direction === 'buy' ? '▲' : '▼'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-xl tracking-tight leading-none">
              {trade.asset}
            </span>
            <span className="text-[12px] font-bold text-muted-foreground/40 mt-2 uppercase tracking-[0.2em]">
              {trade.market} • {trade.date}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`block text-2xl font-bold tabular-nums leading-none tracking-[-0.03em] ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {trade.pnl >= 0 ? '+' : ''}
            {formatCurrency(trade.pnl, { showSign: false })}
          </span>
          <span className="inline-block text-[11px] font-black text-muted-foreground/30 mt-2 uppercase tracking-[0.25em]">
            {trade.rr.toFixed(2)}R Ratio
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-7 border-t border-white/[0.03]">
        <div className="flex items-center gap-4">
          <StatusBadge variant={trade.status} size="sm" className="rounded-full px-4 py-1" />
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            {trade.strategy}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/add-trade?id=${trade.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-muted-foreground active:text-white transition-all hover:bg-white/[0.06]"
          >
            <Pencil size={18} />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(trade.id);
            }}
            className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-muted-foreground active:text-red-400 transition-all hover:bg-red-500/10"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted)
    return (
      <div className="card-premium p-10 h-64 flex items-center justify-center text-muted-foreground">
        {t('dashboard.trades.loading')}
      </div>
    );

  return (
    <div className="card-premium">
      <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5 border-b border-white/[0.05]">
        <div>
          <h3 className="text-base font-semibold text-foreground">{t('dashboard.trades.title')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trades.length === 0
              ? t('dashboard.trades.noTradesLogged')
              : t('dashboard.trades.recentCount', { count: trades.length })}
          </p>
        </div>
        <Link
          href="/trade-history"
          className="text-xs text-primary hover:text-blue-400 font-medium transition-colors"
        >
          {t('dashboard.trades.viewAll')}
        </Link>
      </div>

      {!isLoadingTrades && trades.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-sm font-medium mb-4">
            {t('dashboard.trades.noRecords')}
          </p>
          <Link href="/add-trade" className="text-primary hover:underline text-xs font-bold">
            {t('dashboard.trades.logFirst')}
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {[
                    { key: null, label: t('dashboard.trades.name') },
                    { key: 'date' as SortKey, label: t('dashboard.trades.date') },
                    { key: 'pnl' as SortKey, label: t('dashboard.trades.profit') },
                  ].map((col, i) => (
                    <th
                      key={`th-${i}`}
                      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                        col.key ? 'cursor-pointer hover:text-foreground select-none' : ''
                      }`}
                      onClick={col.key ? () => handleSort(col.key as SortKey) : undefined}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={col.label === t('dashboard.trades.profit') ? 'ml-auto' : ''}
                        >
                          {col.label}
                        </span>
                        {col.key && <SortIcon col={col.key as SortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingTrades &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={`trade-skel-${i}`} cols={9} />
                  ))}
                {!isLoadingTrades && trades.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {t('dashboard.trades.noTradesYet')}{' '}
                      <Link href="/add-trade" className="text-primary hover:underline">
                        {t('dashboard.trades.logFirst')}
                      </Link>
                    </td>
                  </tr>
                )}
                {!isLoadingTrades &&
                  trades.map((trade) => (
                    <tr
                      key={trade.id}
                      className={`border-b border-white/[0.03] transition-colors duration-200 ${
                        hoveredRow === trade.id ? 'bg-muted/30' : ''
                      }`}
                      onMouseEnter={() => setHoveredRow(trade.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground font-tabular">
                            {trade.asset}
                          </p>
                          <p className="text-xs text-muted-foreground">{trade.market}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(trade.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-tabular font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {formatCurrency(trade.pnl, { showSign: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden overflow-x-auto scrollbar-thin">
            {isLoadingTrades &&
              Array.from({ length: 3 }).map((_, i) => (
                <MobileTradeSkeleton key={`mob-skel-${i}`} />
              ))}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {[
                    { key: null, label: t('dashboard.trades.name') },
                    { key: 'date' as SortKey, label: t('dashboard.trades.date') },
                    { key: 'pnl' as SortKey, label: t('dashboard.trades.profit') },
                  ].map((col, i) => (
                    <th
                      key={`th-mob-${i}`}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap',
                        col.label === t('dashboard.trades.profit') ? 'text-right' : ''
                      )}
                      onClick={col.key ? () => handleSort(col.key as SortKey) : undefined}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.key && <SortIcon col={col.key as SortKey} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingTrades &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={`trade-skel-mob-${i}`} cols={4} />
                  ))}
                {!isLoadingTrades && trades.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {t('dashboard.trades.noTradesYet')}{' '}
                      <Link href="/add-trade" className="text-primary hover:underline">
                        {t('dashboard.trades.logFirst')}
                      </Link>
                    </td>
                  </tr>
                )}
                {!isLoadingTrades &&
                  trades.map((trade) => (
                    <tr
                      key={trade.id}
                      className={`border-b border-white/[0.03] transition-colors duration-200 ${
                        hoveredRow === trade.id ? 'bg-muted/30' : ''
                      }`}
                      onMouseEnter={() => setHoveredRow(trade.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setSelectedTradeId(trade.id)} // Make row clickable for details
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground font-tabular">
                            {trade.asset}
                          </p>
                          <p className="text-xs text-muted-foreground">{trade.market}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(trade.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-tabular font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {formatCurrency(trade.pnl, { showSign: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('dashboard.trades.deleteTitle')}
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-5">{t('dashboard.trades.deleteConfirm')}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm">
            {t('dashboard.trades.cancel')}
          </button>
          <button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="btn-danger text-sm flex items-center gap-2"
          >
            {isDeleting ? t('dashboard.trades.deleting') : t('dashboard.trades.delete')}
          </button>
        </div>
      </Modal>

      <TradeDetailsModal
        isOpen={!!selectedTradeId}
        onClose={() => setSelectedTradeId(null)}
        trade={rawTrades.find((t) => String(t.id) === selectedTradeId) || null}
      />
    </div>
  );
}
