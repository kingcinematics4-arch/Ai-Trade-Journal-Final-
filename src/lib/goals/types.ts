export type GoalType =
  | 'profit'
  | 'win_rate'
  | 'consistency'
  | 'max_loss'
  | 'rr_ratio'
  | 'trade_count'
  | 'discipline'
  | 'custom';
export type GoalStatus = 'active' | 'completed' | 'failed';

/**
 * Extended Trade type that includes goal assignment.
 * In your main trades/types.ts, you should add goalId?: string; to DbTrade.
 */
export interface TradeWithGoal {
  goalId?: string;
  pnl?: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  progress: number; // 0 to 100
  status: GoalStatus;
  createdAt: string;
  deadline?: string;
  completedAt?: string;
  startingPnL?: number; // For profit goals, the PnL at the time of goal creation
  category: 'performance' | 'risk' | 'psychology' | 'custom' | 'consistency';
}
