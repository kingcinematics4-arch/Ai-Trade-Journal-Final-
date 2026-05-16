export type TradeStatus = 'win' | 'loss' | 'breakeven';

export interface DbTrade {
  id: string;
  user_id: string;
  trade_title?: string | null;
  trade_date?: string | null;
  created_at?: string | null;
  market_type?: string | null;
  asset_name?: string | null;
  trade_direction?: 'buy' | 'sell' | string | null;
  entry_price?: number | null;
  exit_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  lot_size?: number | null;
  risk_amount?: number | null;
  pnl_amount?: number | null;
  rr_ratio?: number | null;
  trade_status?: TradeStatus | string | null;
  strategy_used?: string | null;
  trade_duration?: string | null;
  trade_rating?: number | null;
  emotion_before?: string | null;
  emotion_after?: string | null;
  mistake_category?: string | null;
  lessons_learned?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  confidence_level?: number | null;
  entry_images?: string[] | null;
  exit_images?: string[] | null;
  chart_images?: string[] | null;
}

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
  status: TradeStatus;
  date: string;
  duration: string;
  rating: number;
  sortDate: number;
}

export interface PnlTrendPoint {
  date: string;
  pnl: number;
  cumulative: number;
}

export interface MarketDistributionPoint {
  id: string;
  name: string;
  value: number;
  trades: number;
  pnl: number;
}

export interface TradeAnalytics {
  isEmpty: boolean;
  totalTrades: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  avgRr: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  bestTrade: { pnl: number; asset: string; strategy: string; date: string } | null;
  pnlTrend: PnlTrendPoint[];
  marketDistribution: MarketDistributionPoint[];
}

export interface TradeInsight {
  id: string;
  type: 'positive' | 'warning' | 'negative';
  text: string;
}
