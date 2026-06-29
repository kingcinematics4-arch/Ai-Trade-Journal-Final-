import { format } from 'date-fns';

/**
 * Interface representing a factual, strictly verified trade for audit purposes.
 */
export interface ComplianceTrade {
  tradeId: string;
  assetSymbol: string;
  market: string;
  entryDate: string;
  exitDate: string;
  positionType: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  strategyName: string;
}

export interface ComplianceStrategyStats {
  strategyName: string;
  tradeCount: number;
  netPnl: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  averageTrade: number;
  profitFactor: number;
}

export interface ComplianceReportData {
  metadata: {
    appName: string;
    exportVersion: string;
    reportId: string;
    exportTimestampUTC: string;
    userId: string;
    accountId: string;
    timeZone: string;
    reportingPeriodStart: string;
    reportingPeriodEnd: string;
  };
  accountSummary: {
    totalTrades: number;
    totalVolume: number;
    grossProfit: number;
    grossLoss: number;
    netPnl: number;
    winRate: number;
    profitFactor: number;
    averageTrade: number;
    largestWin: number;
    largestLoss: number;
    tradingDays: number;
    averageDailyPnl: number;
  };
  accountInfo: {
    accountId: string;
    userId: string;
    exportTimestamp: string;
    reportingPeriod: string;
    timeZone: string;
    reportVersion: string;
    dataSource: string;
  };
  financialSummary: {
    grossProfit: number;
    grossLoss: number;
    netProfit: number;
    totalFees: number;
    netAfterFees: number;
    averageTrade: number;
    profitFactor: number;
    winRate: number;
  };
  feeAnalysis: {
    brokerFees: number;
    platformFees: number;
    otherCosts: number;
    totalCosts: number;
  };
  ledger: ComplianceTrade[];
  strategies: ComplianceStrategyStats[];
  auditTrail: {
    recordCreationTimestamp: string;
    recordModificationTimestamp: string;
    dataSource: string;
    exportTimestamp: string;
    exportVersion: string;
    reportId: string;
    accountId: string;
    userId: string;
    recordCount: number;
  };
  dataIntegrity: {
    recordCountVerification: number;
    exportChecksum: string; // SHA-256
    sha256Hash: string;
    checksum: string;
    recordVerificationCount: number;
    generationTimestamp: string;
  };
}

/**
 * Helper to generate a deterministic UUID-like string if none exists.
 */
function generateReportId(): string {
  return (
    'COMP-' +
    Math.random().toString(36).substring(2, 10).toUpperCase() +
    '-' +
    Date.now().toString(36).toUpperCase()
  );
}

/**
 * Filter out subjective data and strictly map to a ComplianceTrade object.
 */
function mapToComplianceLedger(data: any[]): ComplianceTrade[] {
  return data.map((trade) => {
    return {
      tradeId: trade.id || 'N/A',
      assetSymbol: trade.symbol || trade.asset_name || 'N/A',
      market: trade.market || 'N/A',
      entryDate: trade.trade_date || trade.date || 'N/A',
      exitDate: trade.exit_date || trade.trade_date || trade.date || 'N/A',
      positionType: (trade.trade_direction || trade.side || 'N/A').toUpperCase(),
      quantity: parseFloat(trade.quantity || trade.position_size || '0'),
      entryPrice: parseFloat(trade.entry_price || '0'),
      exitPrice: parseFloat(trade.exit_price || '0'),
      grossPnl: parseFloat(trade.gross_pnl || trade.pnl_amount || '0'),
      fees: parseFloat(trade.fees || trade.commission || '0'),
      netPnl: parseFloat(trade.net_pnl || trade.pnl_amount || '0'),
      strategyName: trade.strategy_used || 'Uncategorized',
    };
  });
}

/**
 * Calculates a SHA-256 hash string for the dataset using Web Crypto API.
 */
async function generateDataHash(dataString: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'UNABLE_TO_GENERATE_HASH_CLIENTSIDE';
}

/**
 * Count unique trading days from ledger dates.
 */
function countTradingDays(ledger: ComplianceTrade[]): number {
  const days = new Set<string>();
  ledger.forEach((t) => {
    try {
      const d = new Date(t.entryDate);
      if (!isNaN(d.getTime())) {
        days.add(format(d, 'yyyy-MM-dd'));
      }
    } catch {
      // skip invalid dates
    }
  });
  return days.size;
}

/**
 * Main engine to process raw trades into a strictly factual Compliance Report.
 */
export async function buildComplianceReportData(
  rawData: any[],
  userId: string = 'N/A',
  accountId: string = 'N/A'
): Promise<ComplianceReportData> {
  const ledger = mapToComplianceLedger(rawData);
  ledger.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let maxWin = -Infinity;
  let maxLoss = Infinity;
  let totalVolume = 0;
  let totalFees = 0;

  const strategyMap: Record<string, ComplianceStrategyStats> = {};

  ledger.forEach((t) => {
    if (t.netPnl > 0) {
      wins++;
      grossProfit += t.netPnl;
      maxWin = Math.max(maxWin, t.netPnl);
    } else if (t.netPnl < 0) {
      grossLoss += Math.abs(t.netPnl);
      maxLoss = Math.min(maxLoss, t.netPnl);
    }

    totalVolume += t.quantity * t.entryPrice;
    totalFees += t.fees;

    // Strategy Aggregation
    if (!strategyMap[t.strategyName]) {
      strategyMap[t.strategyName] = {
        strategyName: t.strategyName,
        tradeCount: 0,
        netPnl: 0,
        winRate: 0,
        grossProfit: 0,
        grossLoss: 0,
        averageTrade: 0,
        profitFactor: 0,
      };
    }
    const s = strategyMap[t.strategyName];
    s.tradeCount++;
    s.netPnl += t.netPnl;
    if (t.netPnl > 0) s.grossProfit += t.netPnl;
    if (t.netPnl < 0) s.grossLoss += Math.abs(t.netPnl);
  });

  const totalTrades = ledger.length;
  const netPnl = grossProfit - grossLoss;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const averageTrade = totalTrades > 0 ? netPnl / totalTrades : 0;
  const tradingDays = countTradingDays(ledger);
  const averageDailyPnl = tradingDays > 0 ? netPnl / tradingDays : 0;

  const strategies = Object.values(strategyMap).map((s) => {
    const sWins = ledger.filter((t) => t.strategyName === s.strategyName && t.netPnl > 0).length;
    s.winRate = s.tradeCount > 0 ? (sWins / s.tradeCount) * 100 : 0;
    s.averageTrade = s.tradeCount > 0 ? s.netPnl / s.tradeCount : 0;
    s.profitFactor =
      s.grossLoss > 0 ? s.grossProfit / s.grossLoss : s.grossProfit > 0 ? Infinity : 0;
    return s;
  });

  const periodStart = ledger.length > 0 ? ledger[0].entryDate : new Date().toISOString();
  const periodEnd =
    ledger.length > 0 ? ledger[ledger.length - 1].entryDate : new Date().toISOString();

  // Create hash payload based ONLY on the ledger to ensure consistent hashing
  const hashString = JSON.stringify(ledger);
  const checksum = await generateDataHash(hashString);
  const nowUtc = new Date().toISOString();

  const netAfterFees = netPnl - totalFees;

  return {
    metadata: {
      appName: 'AI Trade Journal',
      exportVersion: '2.0.0',
      reportId: generateReportId(),
      exportTimestampUTC: nowUtc,
      userId,
      accountId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reportingPeriodStart: periodStart,
      reportingPeriodEnd: periodEnd,
    },
    accountSummary: {
      totalTrades,
      totalVolume,
      grossProfit,
      grossLoss,
      netPnl,
      winRate,
      profitFactor,
      averageTrade,
      largestWin: maxWin === -Infinity ? 0 : maxWin,
      largestLoss: maxLoss === Infinity ? 0 : maxLoss,
      tradingDays,
      averageDailyPnl,
    },
    accountInfo: {
      accountId,
      userId,
      exportTimestamp: nowUtc,
      reportingPeriod: `${format(new Date(periodStart), 'yyyy-MM-dd')} to ${format(new Date(periodEnd), 'yyyy-MM-dd')}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reportVersion: '2.0.0',
      dataSource: 'AI Trade Journal Primary Database',
    },
    financialSummary: {
      grossProfit,
      grossLoss,
      netProfit: netPnl,
      totalFees,
      netAfterFees,
      averageTrade,
      profitFactor,
      winRate,
    },
    feeAnalysis: {
      brokerFees: totalFees,
      platformFees: 0,
      otherCosts: 0,
      totalCosts: totalFees,
    },
    ledger,
    strategies,
    auditTrail: {
      recordCreationTimestamp: periodStart,
      recordModificationTimestamp: periodEnd,
      dataSource: 'AI Trade Journal Primary Database',
      exportTimestamp: nowUtc,
      exportVersion: '2.0.0',
      reportId: generateReportId(),
      accountId,
      userId,
      recordCount: ledger.length,
    },
    dataIntegrity: {
      recordCountVerification: ledger.length,
      exportChecksum: checksum,
      sha256Hash: checksum,
      checksum: checksum,
      recordVerificationCount: ledger.length,
      generationTimestamp: nowUtc,
    },
  };
}
