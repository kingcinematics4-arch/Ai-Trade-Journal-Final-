import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import {
  calculateReportAnalytics,
  formatCurrency,
  formatPercentage,
  formatExportDate
} from './export/exportFormatting';

/**
 * Generates the professional TXT report string.
 */
export function buildProfessionalTxt(data: any[], fileName: string = 'TradingJournal'): string {
  if (!data || data.length === 0) return '';

  const generatedDate = new Date();
  const generatedDateStr = format(generatedDate, 'yyyy-MM-dd HH:mm:ss');
  const dateStr = format(generatedDate, 'yyyy_MM_dd');
  
  const analytics = calculateReportAnalytics(data);

  // Build Strategy Stats
  const strategyStats: Record<string, any> = {};
  data.forEach(trade => {
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

  const separator = '='.repeat(80);
  const lightSeparator = '-'.repeat(80);

  const lines: string[] = [];

  // --- TITLE SECTION ---
  lines.push(separator);
  lines.push('                      INSTITUTIONAL TRADING REPORT');
  lines.push(separator);
  lines.push(`Generated On: ${generatedDateStr}`);
  lines.push(`Account Name: AI Trade Journal Account`);
  lines.push(`Export ID:    ${fileName}_${dateStr}`);
  lines.push('');

  // --- PERFORMANCE METRICS ---
  lines.push(separator);
  lines.push('PERFORMANCE METRICS');
  lines.push(separator);
  lines.push(String('Total Executed Trades:').padEnd(30) + analytics.totalTrades);
  lines.push(String('Win Rate:').padEnd(30) + formatPercentage(analytics.winRate));
  lines.push(String('Net P&L:').padEnd(30) + formatCurrency(analytics.netPnl));
  lines.push(String('Gross Profit:').padEnd(30) + formatCurrency(analytics.grossProfit));
  lines.push(String('Gross Loss:').padEnd(30) + formatCurrency(analytics.grossLoss));
  lines.push(String('Profit Factor:').padEnd(30) + (analytics.profitFactor === Infinity ? 'Infinity' : analytics.profitFactor.toFixed(2)));
  lines.push(String('Largest Win:').padEnd(30) + formatCurrency(analytics.maxWin));
  lines.push(String('Largest Loss:').padEnd(30) + formatCurrency(analytics.maxLoss));
  lines.push('');

  // --- STRATEGY STATISTICS ---
  lines.push(separator);
  lines.push('STRATEGY PERFORMANCE OVERVIEW');
  lines.push(separator);
  lines.push(
    String('STRATEGY').padEnd(30) +
    String('TRADES').padStart(10) +
    String('WIN %').padStart(15) +
    String('NET P&L').padStart(20)
  );
  lines.push(lightSeparator);

  Object.keys(strategyStats).forEach(strat => {
    const stats = strategyStats[strat];
    const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
    
    lines.push(
      String(strat).substring(0, 28).padEnd(30) +
      String(stats.trades).padStart(10) +
      String(formatPercentage(winRate)).padStart(15) +
      String(formatCurrency(stats.pnl)).padStart(20)
    );
  });
  lines.push('');

  // --- TRADE LOG ---
  lines.push(separator);
  lines.push('TRADE EXECUTION LOG');
  lines.push(separator);

  const sortedData = [...data].sort((a, b) => new Date(a.trade_date || a.date || 0).getTime() - new Date(b.trade_date || b.date || 0).getTime());

  sortedData.forEach((trade, index) => {
    const date = formatExportDate(trade.trade_date || trade.date);
    const asset = trade.asset_name || trade.symbol || 'Unknown';
    const side = (trade.trade_direction || trade.side || 'N/A').toUpperCase();
    const pnl = parseFloat(trade.pnl_amount || '0');
    const strategy = trade.strategy_used || 'Uncategorized';
    
    lines.push(`Trade #${index + 1} | ${date}`);
    lines.push(`Asset: ${asset.padEnd(15)} | Side: ${side.padEnd(10)} | Strategy: ${strategy}`);
    lines.push(`P&L:   ${formatCurrency(pnl).padEnd(15)} | Result: ${pnl >= 0 ? 'WIN' : 'LOSS'}`);
    
    if (trade.notes) {
      lines.push(`Notes: ${trade.notes}`);
    }
    lines.push(lightSeparator);
  });

  lines.push('');
  lines.push('END OF REPORT');
  lines.push(separator);

  return lines.join('\n');
}

/**
 * Generates and downloads a professional, institutional-grade TXT report.
 */
export async function exportProfessionalTxt(
  data: any[],
  fileName: string = 'TradingJournal',
  context: Record<string, any> = {}
): Promise<boolean> {
  if (!data || data.length === 0) return false;

  try {
    const dateStr = format(new Date(), 'yyyy_MM_dd');
    const txtContent = buildProfessionalTxt(data, fileName);

    // Download
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    saveAs(blob, `${fileName}_Export_${dateStr}.txt`);

    return true;
  } catch (error) {
    console.error('[exportProfessionalTxt] Error generating TXT:', error);
    return false;
  }
}
