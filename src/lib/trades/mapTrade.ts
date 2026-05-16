import { parseSafeNumber, calculatePnL } from './analytics';
import type { DbTrade, TradeRow } from './types';

export function mapDbTrade(row: Record<string, unknown>): TradeRow {
  const tradeDate = row.trade_date ?? row.created_at;
  const parsedDate =
    typeof tradeDate === 'string' || tradeDate instanceof Date
      ? new Date(tradeDate)
      : null;

  const formattedDate = parsedDate
    ? parsedDate.toLocaleDateString('en-US', {
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
    entry: parseSafeNumber(row.entry_price),
    exit: parseSafeNumber(row.exit_price),
    pnl: calculatePnL(row),
    rr: parseSafeNumber(row.rr_ratio ?? row.rr),
    strategy: String(row.strategy_used ?? row.strategy ?? '—'),
    status: (row.trade_status as TradeRow['status']) ?? 'breakeven',
    date: formattedDate,
    duration: String(row.trade_duration ?? '—'),
    rating: Number(row.trade_rating ?? 0),
    sortDate: parsedDate?.getTime() ?? 0,
  };
}

export function mapDbTrades(rows: Record<string, unknown>[]): TradeRow[] {
  return rows.map(mapDbTrade);
}

export function dbTradeFromRow(row: Record<string, unknown>): DbTrade {
  return row as unknown as DbTrade;
}
