import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { calculateReportAnalytics } from './export/exportFormatting';

/**
 * Generates the structured, professional JSON object.
 */
export function buildProfessionalJson(data: any[], context: Record<string, any> = {}): string {
  if (!data || data.length === 0) return '';

  const generatedDate = new Date();
  const isoDateStr = generatedDate.toISOString();

  const analytics = calculateReportAnalytics(data);

  // Group trades by strategy for the strategies section if not provided in context
  const strategyStats: Record<string, any> = {};
  data.forEach((trade) => {
    const strat = trade.strategy_used || 'Uncategorized';
    if (!strategyStats[strat]) {
      strategyStats[strat] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
    }
    strategyStats[strat].trades++;
    const pnl = parseFloat(trade.pnl_amount || '0');
    if (pnl > 0) strategyStats[strat].wins++;
    else if (pnl < 0) strategyStats[strat].losses++;
    strategyStats[strat].pnl += pnl;
  });

  const strategiesList = Object.keys(strategyStats).map((name) => ({
    name,
    totalTrades: strategyStats[name].trades,
    winRate:
      strategyStats[name].trades > 0
        ? (strategyStats[name].wins / strategyStats[name].trades) * 100
        : 0,
    netPnl: strategyStats[name].pnl,
  }));

  // Build the structured API-style JSON payload
  const jsonPayload = {
    metadata: {
      appName: 'AI Trade Journal',
      exportType: 'Professional JSON Export',
      exportVersion: '1.0.0',
      generatedAt: isoDateStr,
      recordCount: data.length,
    },
    account: {
      currency: 'USD',
    },
    statistics: {
      totalTrades: analytics.totalTrades,
      wins: analytics.wins,
      losses: analytics.losses,
      winRatePercent: analytics.winRate,
      grossProfit: analytics.grossProfit,
      grossLoss: analytics.grossLoss,
      netPnl: analytics.netPnl,
      profitFactor: analytics.profitFactor,
      averageWin: analytics.avgWin,
      averageLoss: analytics.avgLoss,
      maxWin: analytics.maxWin,
      maxLoss: analytics.maxLoss,
    },
    strategies: context.strategyData || strategiesList,
    goals: context.goals || [],
    tasks: context.tasks || [],
    trades: data.map((trade) => trade),
  };

  return JSON.stringify(jsonPayload, null, 2);
}

/**
 * Generates and downloads a structured, professional JSON export.
 */
export async function exportProfessionalJson(
  data: any[],
  fileName: string = 'TradingJournal',
  context: Record<string, any> = {}
): Promise<boolean> {
  if (!data || data.length === 0) return false;

  try {
    const dateStr = format(generatedDate, 'yyyy_MM_dd');
    const dateStr = format(new Date(), 'yyyy_MM_dd');
    const jsonString = buildProfessionalJson(data, context);

    // Download
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${fileName}_Export_${dateStr}.json`);

    return true;
  } catch (error) {
    console.error('[exportProfessionalJson] Error generating JSON:', error);
    return false;
  }
}
