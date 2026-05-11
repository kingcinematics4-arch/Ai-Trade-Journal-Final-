'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';

// BACKEND: GET /api/trades?limit=8&sort=date_desc — replace with real data
const mockTrades = [
  {
    id: 'trade-001',
    asset: 'BTC/USDT',
    market: 'Crypto',
    direction: 'buy' as const,
    entry: 61240.50,
    exit: 63480.00,
    pnl: 1240.00,
    rr: 2.8,
    strategy: 'Breakout',
    status: 'win' as const,
    date: 'May 8, 2026',
    duration: '4h 22m',
    rating: 5,
  },
  {
    id: 'trade-002',
    asset: 'EUR/USD',
    market: 'Forex',
    direction: 'sell' as const,
    entry: 1.0842,
    exit: 1.0798,
    pnl: 440.00,
    rr: 2.1,
    strategy: 'Trend Follow',
    status: 'win' as const,
    date: 'May 9, 2026',
    duration: '2h 05m',
    rating: 4,
  },
  {
    id: 'trade-003',
    asset: 'AAPL',
    market: 'Stocks',
    direction: 'buy' as const,
    entry: 187.40,
    exit: 184.20,
    pnl: -320.00,
    rr: 0.6,
    strategy: 'Reversal',
    status: 'loss' as const,
    date: 'May 7, 2026',
    duration: '1h 48m',
    rating: 2,
  },
  {
    id: 'trade-004',
    asset: 'ETH/USDT',
    market: 'Crypto',
    direction: 'buy' as const,
    entry: 2940.00,
    exit: 3120.50,
    pnl: 680.00,
    rr: 2.4,
    strategy: 'Breakout',
    status: 'win' as const,
    date: 'May 10, 2026',
    duration: '6h 10m',
    rating: 5,
  },
  {
    id: 'trade-005',
    asset: 'GBP/JPY',
    market: 'Forex',
    direction: 'sell' as const,
    entry: 196.420,
    exit: 195.880,
    pnl: 380.00,
    rr: 1.9,
    strategy: 'Range',
    status: 'win' as const,
    date: 'May 6, 2026',
    duration: '45m',
    rating: 3,
  },
  {
    id: 'trade-006',
    asset: 'TSLA',
    market: 'Stocks',
    direction: 'buy' as const,
    entry: 178.60,
    exit: 175.20,
    pnl: -210.00,
    rr: 0.8,
    strategy: 'Momentum',
    status: 'loss' as const,
    date: 'May 5, 2026',
    duration: '3h 20m',
    rating: 2,
  },
  {
    id: 'trade-007',
    asset: 'SOL/USDT',
    market: 'Crypto',
    direction: 'buy' as const,
    entry: 148.20,
    exit: 156.80,
    pnl: 520.00,
    rr: 2.6,
    strategy: 'Breakout',
    status: 'win' as const,
    date: 'May 4, 2026',
    duration: '8h 15m',
    rating: 4,
  },
  {
    id: 'trade-008',
    asset: 'NQ Futures',
    market: 'Futures',
    direction: 'sell' as const,
    entry: 18420.00,
    exit: 18295.00,
    pnl: 247.00,
    rr: 1.5,
    strategy: 'Trend Follow',
    status: 'win' as const,
    date: 'May 3, 2026',
    duration: '1h 30m',
    rating: 3,
  },
];

type SortKey = 'date' | 'pnl' | 'rr';
type SortDir = 'asc' | 'desc';

export default function RecentTradesTable() {
  const [trades, setTrades] = useState(mockTrades);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    // BACKEND: DELETE /api/trades/:id — remove trade record
    await new Promise((r) => setTimeout(r, 800));
    setTrades((prev) => prev.filter((t) => t.id !== deleteTarget));
    setDeleteTarget(null);
    setIsDeleting(false);
    toast.success('Trade deleted successfully');
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Trades</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{trades.length} trades this month</p>
        </div>
        <Link href="/dashboard" className="text-xs text-primary hover:text-blue-400 font-medium transition-colors">
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
            {trades.map((trade) => (
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
                  <StatusBadge variant={trade.direction} label={trade.direction === 'buy' ? '▲ Long' : '▼ Short'} />
                </td>
                <td className="px-4 py-3">
                  <span className={`font-tabular font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-tabular text-sm ${trade.rr >= 2 ? 'text-green-400' : trade.rr >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
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
          Are you sure you want to delete this trade? This action cannot be undone and will affect your analytics.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteTarget(null)}
            className="btn-secondary text-sm"
          >
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