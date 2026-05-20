'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradesContext';
import { createClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/trades/analytics';
import type { TradeRow } from '@/lib/trades/types';
import TradeDetailsModal from './TradeDetailsModal';

export type { TradeRow };

type SortKey = 'date' | 'pnl' | 'rr';
type SortDir = 'asc' | 'desc';

export default function RecentTradesTable() {
  const { user } = useAuth();
  const { tradeRows, trades: rawTrades, isLoading: isLoadingTrades, refetch } = useTrades();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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
      toast.error('Failed to delete trade');
      setIsDeleting(false);
      return;
    }

    setDeleteTarget(null);
    setIsDeleting(false);
    await refetch();
    toast.success('Trade deleted successfully');
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-primary" />
    ) : (
      <ChevronDown size={12} className="text-primary" />
    );
  };

  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Trades</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trades.length === 0
              ? 'No trades logged'
              : `${trades.length} recent trade${trades.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          href="/trade-history"
          className="text-xs text-primary hover:text-blue-400 font-medium transition-colors"
        >
          View All Trades →
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                { key: null, label: 'Asset' },
                { key: null, label: 'Direction' },
                { key: 'pnl' as SortKey, label: 'P&L' },
                { key: 'rr' as SortKey, label: 'RR Ratio' },
                { key: null, label: 'Strategy' },
                { key: null, label: 'Status' },
                { key: 'date' as SortKey, label: 'Date' },
                { key: null, label: 'Rating' },
                { key: null, label: '' },
              ].map((col, i) => (
                <th
                  key={`th-${i}`}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                    col.key ? 'cursor-pointer hover:text-foreground select-none' : ''
                  }`}
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
                <TableRowSkeleton key={`trade-skel-${i}`} cols={9} />
              ))}
            {!isLoadingTrades && trades.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No trades yet.{' '}
                  <Link href="/add-trade" className="text-primary hover:underline">
                    Log your first trade
                  </Link>
                </td>
              </tr>
            )}
            {!isLoadingTrades &&
              trades.map((trade) => (
                <tr
                  key={trade.id}
                  className={`border-b border-border/50 transition-colors duration-100 ${
                    hoveredRow === trade.id ? 'bg-muted/30' : ''
                  }`}
                  onMouseEnter={() => setHoveredRow(trade.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground font-tabular">{trade.asset}</p>
                      <p className="text-xs text-muted-foreground">{trade.market}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      variant={trade.direction}
                      label={trade.direction === 'buy' ? '▲ Long' : '▼ Short'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-tabular font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {formatCurrency(trade.pnl, { showSign: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-tabular text-sm ${trade.rr >= 2 ? 'text-green-400' : trade.rr >= 1 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {trade.rr.toFixed(1)}R
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {trade.strategy}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={trade.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {trade.date}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={`star-${trade.id}-${star}`}
                          className={`text-xs ${star <= trade.rating ? 'text-amber-400' : 'text-muted'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={`flex items-center gap-1 transition-opacity duration-150 ${
                        hoveredRow === trade.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTradeId(trade.id)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View trade details"
                      >
                        <Eye size={14} />
                      </button>
                      <Link
                        href="/add-trade"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors"
                        title="Edit trade"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(trade.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete trade — this cannot be undone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Trade"
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-5">
          Are you sure you want to delete this trade? This action cannot be undone and will affect
          your analytics.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="btn-danger text-sm flex items-center gap-2"
          >
            {isDeleting ? 'Deleting...' : 'Delete Trade'}
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
