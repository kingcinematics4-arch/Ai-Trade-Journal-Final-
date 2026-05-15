'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

export interface TradeRow {
  id: string;
  asset: string;
  market: string;
  direction: 'buy' | 'sell';
  entry: number;
  exit: number;
  pnl: number;
  rr: number;
  strategy: string;
  status: 'win' | 'loss' | 'breakeven';
  date: string;
  duration: string;
  rating: number;
}

type SortKey = 'date' | 'pnl' | 'rr';
type SortDir = 'asc' | 'desc';

function mapDbTrade(row: Record<string, unknown>): TradeRow {
  const tradeDate = row.trade_date ?? row.created_at;
  const formattedDate =
    typeof tradeDate === 'string' || tradeDate instanceof Date
      ? new Date(tradeDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

  return {
    id: String(row.id),
    asset: String(row.asset_name ?? row.asset ?? '—'),
    market: String(row.market_type ?? row.market ?? '—'),
    direction: (row.trade_direction as 'buy' | 'sell') ?? 'buy',
    entry: Number(row.entry_price ?? 0),
    exit: Number(row.exit_price ?? 0),
    pnl: Number(row.pnl_amount ?? row.pnl ?? 0),
    rr: Number(row.rr_ratio ?? row.rr ?? 0),
    strategy: String(row.strategy_used ?? row.strategy ?? '—'),
    status: (row.trade_status as TradeRow['status']) ?? 'breakeven',
    date: formattedDate,
    duration: String(row.trade_duration ?? '—'),
    rating: Number(row.trade_rating ?? 0),
  };
}

export default function RecentTradesTable() {
  const { user, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTrades([]);
      setIsLoadingTrades(false);
      return;
    }

    const supabase = createClient();

    const loadTrades = async () => {
      setIsLoadingTrades(true);

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (process.env.NODE_ENV === 'development') {
        console.debug('[auth] trades fetch', {
          userId: user.id,
          count: data?.length ?? 0,
          error: error?.message ?? null,
        });
      }

      if (!error && data?.length) {
        setTrades(data.map((row) => mapDbTrade(row as Record<string, unknown>)));
      } else {
        setTrades([]);
      }

      setIsLoadingTrades(false);
    };

    void loadTrades();
  }, [user, authLoading]);

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

    setTrades((prev) => prev.filter((t) => t.id !== deleteTarget));
    setDeleteTarget(null);
    setIsDeleting(false);
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
          <p className="text-xs text-muted-foreground mt-0.5">{trades.length} trades this month</p>
        </div>
        <Link
          href="/dashboard"
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
            {(authLoading || isLoadingTrades) &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRowSkeleton key={`trade-skel-${i}`} cols={9} />
              ))}
            {!authLoading && !isLoadingTrades && trades.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No trades yet.{' '}
                  <Link href="/add-trade" className="text-primary hover:underline">
                    Log your first trade
                  </Link>
                </td>
              </tr>
            )}
            {!authLoading &&
              !isLoadingTrades &&
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
                      {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}
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
    </div>
  );
}
