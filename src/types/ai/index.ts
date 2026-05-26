import type { DbTrade } from '@/lib/trades/types';

export interface AiScores {
  disciplineScore: number;
  riskManagementScore: number;
  emotionalControlScore: number;
  executionQualityScore: number;
  consistencyScore: number;
  overallScore: number;
}

export interface AiCoachFeedback {
  message: string;
  type: 'positive' | 'warning' | 'negative' | 'info';
  category: string;
}

export interface SessionPerformance {
  session: string;
  trades: number;
  winRate: number;
  pnl: number;
}

export interface DayPerformance {
  day: string;
  trades: number;
  winRate: number;
  pnl: number;
}

export interface MistakePattern {
  mistake: string;
  frequency: number;
  avgLoss: number;
}

export interface StreakAnalysis {
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  maxWinStreak: number;
  maxLossStreak: number;
  behaviorAfterWins: { winRate: number; avgPnl: number; count: number };
  behaviorAfterLosses: { winRate: number; avgPnl: number; count: number };
}

export interface EmotionAnalysis {
  emotionDistribution: { emotion: string; count: number; winRate: number; avgPnl: number }[];
  emotionalTrend: { date: string; score: number }[];
  revengeTradeCount: number;
  calmTradeWinRate: number;
}

export interface TradeReplayAnalysis {
  trade: DbTrade;
  entryQuality: 'good' | 'average' | 'poor';
  exitQuality: 'good' | 'average' | 'poor';
  riskAssessment: string;
  whatWasGood: string[];
  whatWasBad: string[];
  emotionalMistakes: string[];
  suggestedImprovement: string[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SmartAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  message: string;
  timestamp: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalTrades: number;
  pnl: number;
  winRate: number;
  bestTrade: { asset: string; pnl: number } | null;
  worstTrade: { asset: string; pnl: number } | null;
  mainMistake: string;
  mainImprovement: string;
  emotionalTrend: string;
  recommendations: string[];
}

export interface AiInsightsResult {
  scores: AiScores;
  feedback: AiCoachFeedback[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  sessionPerformance: SessionPerformance[];
  dayPerformance: DayPerformance[];
  mistakePatterns: MistakePattern[];
  streakAnalysis: StreakAnalysis;
  emotionAnalysis: EmotionAnalysis;
  smartAlerts: SmartAlert[];
  tradingPersonality: string;
  weeklyReport: WeeklyReport | null;
  overtradingDetected: boolean;
  revengeTradeDetected: boolean;
}
