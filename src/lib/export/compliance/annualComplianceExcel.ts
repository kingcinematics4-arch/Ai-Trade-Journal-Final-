import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import type { ComplianceReportData } from './complianceEngine';

/**
 * Builds the Annual Compliance Report Excel Workbook with multiple sheets:
 * Overview, Trading Ledger, Performance Metrics, Strategy Analysis,
 * Fees & Costs, Audit Trail. Professional formatting with branded header,
 * freeze panes, filters, professional styling, number formatting, date formatting.
 */
export async function exportAnnualComplianceReportExcel(data: ComplianceReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI Trade Journal — Annual Compliance Report';
  workbook.created = new Date(data.metadata.exportTimestampUTC);

  const brandColor = '001F3F';
  const headerBg = '001F3F';
  const headerText = 'FFFFFF';
  const altRow = 'F5F7FA';
  const profitColor = '059669';
  const lossColor = 'DC2626';

  // ========== Sheet 1: Overview ==========
  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { width: 35 },
    { width: 55 },
  ];

  // Branded header
  const brandRow = overview.addRow(['ANNUAL COMPLIANCE REPORT']);
  brandRow.font = { bold: true, size: 18, color: { argb: headerText } };
  brandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  overview.mergeCells('A1:B1');
  brandRow.height = 35;

  const subRow = overview.addRow(['Official Financial Record — AI Trade Journal']);
  subRow.font = { italic: true, size: 11, color: { argb: '64748B' } };
  overview.mergeCells('A2:B2');

  overview.addRow([]);

  // Metadata section
  overview.addRow(['REPORT METADATA', 'VALUE']).font = { bold: true, color: { argb: headerText } };
  overview.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const metaRows = [
    ['Report ID', data.metadata.reportId || 'N/A'],
    ['Report Type', 'Annual Compliance Report (Official Financial Record)'],
    ['Generated (UTC)', format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss')],
    ['Time Zone', data.metadata.timeZone || 'UTC'],
    ['User ID', data.metadata.userId || 'N/A'],
    ['Account ID', data.metadata.accountId || 'N/A'],
    ['Reporting Period Start', data.metadata.reportingPeriodStart ? format(new Date(data.metadata.reportingPeriodStart), 'yyyy-MM-dd') : 'N/A'],
    ['Reporting Period End', data.metadata.reportingPeriodEnd ? format(new Date(data.metadata.reportingPeriodEnd), 'yyyy-MM-dd') : 'N/A'],
  ];

  metaRows.forEach((row, idx) => {
    const r = overview.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
  });

  overview.addRow([]);

  // Account Summary section
  overview.addRow(['ACCOUNT SUMMARY', 'VALUE']).font = { bold: true, color: { argb: headerText } };
  const summaryHeaderRow = overview.getRow(metaRows.length + 6);
  summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const summaryRows: Array<{ label: string; value: string }> = [
    { label: 'Total Trades', value: data.accountSummary.totalTrades.toString() },
    { label: 'Total Volume', value: `$${(data.accountSummary.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Gross Profit', value: `$${(data.accountSummary.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Gross Loss', value: `$${(data.accountSummary.grossLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Net Profit / Loss', value: `$${(data.accountSummary.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Win Rate', value: `${(data.accountSummary.winRate || 0).toFixed(2)}%` },
    { label: 'Profit Factor', value: data.accountSummary.profitFactor === Infinity ? 'Infinity' : (data.accountSummary.profitFactor || 0).toFixed(2) },
    { label: 'Average Trade', value: `$${(data.accountSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Largest Win', value: `$${(data.accountSummary.largestWin || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Largest Loss', value: `$${(data.accountSummary.largestLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  ];

  summaryRows.forEach((item, idx) => {
    const r = overview.addRow([item.label, item.value]);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
    // Color P&L values
    if (item.label.includes('Net Profit') || item.label.includes('Gross Profit')) {
      const val = data.accountSummary.netPnl || 0;
      r.getCell(2).font = { bold: true, color: { argb: item.label.includes('Loss') && val < 0 ? lossColor : profitColor } };
    }
  });

  overview.addRow([]);

  // Data Integrity section
  overview.addRow(['DATA INTEGRITY', 'VALUE']).font = { bold: true, color: { argb: headerText } };
  const diHeaderRow = overview.getRow(metaRows.length + summaryRows.length + 8);
  diHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const integrityRows = [
    ['SHA-256 Checksum', data.dataIntegrity?.exportChecksum || 'N/A'],
    ['Record Count Verification', data.dataIntegrity?.recordCountVerification || data.ledger.length.toString()],
    ['Export Version', data.metadata.exportVersion || '1.0.0'],
  ];

  integrityRows.forEach((row, idx) => {
    const r = overview.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
  });

  // Freeze panes
  overview.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // ========== Sheet 2: Trading Ledger ==========
  const ledger = workbook.addWorksheet('Trading Ledger');
  ledger.columns = [
    { header: 'TRADE ID', key: 'tradeId', width: 16 },
    { header: 'DATE/TIME (UTC)', key: 'entryDate', width: 20 },
    { header: 'ASSET', key: 'assetSymbol', width: 14 },
    { header: 'MARKET', key: 'market', width: 14 },
    { header: 'TYPE', key: 'positionType', width: 10 },
    { header: 'QUANTITY', key: 'quantity', width: 10 },
    { header: 'ENTRY PRICE', key: 'entryPrice', width: 14 },
    { header: 'EXIT PRICE', key: 'exitPrice', width: 14 },
    { header: 'GROSS P&L', key: 'grossPnl', width: 14 },
    { header: 'FEES', key: 'fees', width: 12 },
    { header: 'NET P&L', key: 'netPnl', width: 14 },
    { header: 'STRATEGY', key: 'strategyName', width: 20 },
  ];

  // Branded header row
  const ledgerBrandRow = ledger.addRow(['ANNUAL COMPLIANCE REPORT — TRADING LEDGER']);
  ledgerBrandRow.font = { bold: true, size: 14, color: { argb: headerText } };
  ledgerBrandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  ledger.mergeCells('A1:L1');
  ledgerBrandRow.height = 30;

  ledger.addRow([]);

  // Actual header row
  const ledgerHeaderRow = ledger.getRow(3);
  ledgerHeaderRow.font = { bold: true, color: { argb: headerText }, size: 11 };
  ledgerHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  ledgerHeaderRow.height = 25;

  data.ledger.forEach((t, idx) => {
    const row = ledger.addRow({
      tradeId: t.tradeId || '',
      entryDate: t.entryDate ? format(new Date(t.entryDate), 'yyyy-MM-dd HH:mm') : '',
      assetSymbol: t.assetSymbol || '',
      market: t.market || '',
      positionType: t.positionType || '',
      quantity: t.quantity || 0,
      entryPrice: t.entryPrice || 0,
      exitPrice: t.exitPrice || 0,
      grossPnl: t.grossPnl || 0,
      fees: t.fees || 0,
      netPnl: t.netPnl || 0,
      strategyName: t.strategyName || '',
    });

    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }

    // Color P&L
    const netPnl = t.netPnl || 0;
    row.getCell('grossPnl').font = { bold: true, color: { argb: netPnl >= 0 ? profitColor : lossColor } };
    row.getCell('netPnl').font = { bold: true, color: { argb: netPnl >= 0 ? profitColor : lossColor } };

    // Position type coloring
    const type = (t.positionType || '').toUpperCase();
    if (type === 'BUY' || type === 'LONG') {
      row.getCell('positionType').font = { bold: true, color: { argb: profitColor } };
    } else if (type === 'SELL' || type === 'SHORT') {
      row.getCell('positionType').font = { bold: true, color: { argb: lossColor } };
    }
  });

  // Number formatting
  ledger.getColumn('entryPrice').numFmt = '#,##0.00';
  ledger.getColumn('exitPrice').numFmt = '#,##0.00';
  ledger.getColumn('grossPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  ledger.getColumn('fees').numFmt = '"$"#,##0.00';
  ledger.getColumn('netPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  // Freeze panes
  ledger.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
  // Auto filter
  ledger.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: 12 },
  };

  // ========== Sheet 3: Performance Metrics ==========
  const perf = workbook.addWorksheet('Performance Metrics');
  perf.columns = [
    { width: 35 },
    { width: 55 },
  ];

  const perfBrandRow = perf.addRow(['ANNUAL COMPLIANCE REPORT — PERFORMANCE METRICS']);
  perfBrandRow.font = { bold: true, size: 14, color: { argb: headerText } };
  perfBrandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  perf.mergeCells('A1:B1');
  perfBrandRow.height = 30;

  perf.addRow([]);

  perf.addRow(['METRIC', 'VALUE']).font = { bold: true, color: { argb: headerText } };
  perf.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const perfRows = [
    ['Total Trades Executed', data.accountSummary.totalTrades.toString()],
    ['Win Rate', `${(data.accountSummary.winRate || 0).toFixed(2)}%`],
    ['Net Profit / Loss', `$${(data.accountSummary.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Profit Factor', data.accountSummary.profitFactor === Infinity ? 'Infinity' : (data.accountSummary.profitFactor || 0).toFixed(2)],
    ['Average Trade Return', `$${(data.accountSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Largest Winning Trade', `$${(data.accountSummary.largestWin || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Largest Losing Trade', `$${(data.accountSummary.largestLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
  ];

  perfRows.forEach((row, idx) => {
    const r = perf.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
    // Color net profit
    if (row[0].includes('Net Profit')) {
      const val = data.accountSummary.netPnl || 0;
      r.getCell(2).font = { bold: true, color: { argb: val >= 0 ? profitColor : lossColor } };
    }
  });

  perf.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // ========== Sheet 4: Strategy Analysis ==========
  const strat = workbook.addWorksheet('Strategy Analysis');
  strat.columns = [
    { header: 'STRATEGY NAME', key: 'strategyName', width: 30 },
    { header: 'TRADE COUNT', key: 'tradeCount', width: 15 },
    { header: 'WIN RATE', key: 'winRate', width: 15 },
    { header: 'GROSS PROFIT', key: 'grossProfit', width: 20 },
    { header: 'GROSS LOSS', key: 'grossLoss', width: 20 },
    { header: 'NET P&L', key: 'netPnl', width: 20 },
  ];

  const stratBrandRow = strat.addRow(['ANNUAL COMPLIANCE REPORT — STRATEGY ANALYSIS']);
  stratBrandRow.font = { bold: true, size: 14, color: { argb: headerText } };
  stratBrandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  strat.mergeCells('A1:F1');
  stratBrandRow.height = 30;

  strat.addRow([]);

  const stratHeaderRow = strat.getRow(3);
  stratHeaderRow.font = { bold: true, color: { argb: headerText }, size: 11 };
  stratHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  stratHeaderRow.height = 25;

  if (data.strategies && data.strategies.length > 0) {
    data.strategies.forEach((s, idx) => {
      const row = strat.addRow({
        strategyName: s.strategyName || '',
        tradeCount: s.tradeCount || 0,
        winRate: (s.winRate || 0) / 100,
        grossProfit: s.grossProfit || 0,
        grossLoss: s.grossLoss || 0,
        netPnl: s.netPnl || 0,
      });

      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
      }

      const net = s.netPnl || 0;
      row.getCell('netPnl').font = { bold: true, color: { argb: net >= 0 ? profitColor : lossColor } };
    });
  }

  strat.getColumn('winRate').numFmt = '0.00%';
  strat.getColumn('grossProfit').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  strat.getColumn('grossLoss').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  strat.getColumn('netPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  strat.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }];
  strat.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: 6 },
  };

  // ========== Sheet 5: Fees & Costs ==========
  const fees = workbook.addWorksheet('Fees & Costs');
  fees.columns = [
    { width: 35 },
    { width: 25 },
  ];

  const feesBrandRow = fees.addRow(['ANNUAL COMPLIANCE REPORT — FEES & COSTS']);
  feesBrandRow.font = { bold: true, size: 14, color: { argb: headerText } };
  feesBrandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  fees.mergeCells('A1:B1');
  feesBrandRow.height = 30;

  fees.addRow([]);

  fees.addRow(['FEE CATEGORY', 'AMOUNT']).font = { bold: true, color: { argb: headerText } };
  fees.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const feeRows = [
    ['Broker Fees', data.feeAnalysis.brokerFees || 0],
    ['Platform Fees', data.feeAnalysis.platformFees || 0],
    ['Other Costs', data.feeAnalysis.otherCosts || 0],
    ['Total Costs', data.feeAnalysis.totalCosts || 0],
  ];

  feeRows.forEach((row, idx) => {
    const r = fees.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
    r.getCell(2).numFmt = '"$"#,##0.00';
    if (row[0] === 'Total Costs') {
      r.getCell(2).font = { bold: true };
    }
  });

  fees.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // ========== Sheet 6: Audit Trail ==========
  const audit = workbook.addWorksheet('Audit Trail');
  audit.columns = [
    { width: 40 },
    { width: 55 },
  ];

  const auditBrandRow = audit.addRow(['ANNUAL COMPLIANCE REPORT — AUDIT TRAIL']);
  auditBrandRow.font = { bold: true, size: 14, color: { argb: headerText } };
  auditBrandRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
  audit.mergeCells('A1:B1');
  auditBrandRow.height = 30;

  audit.addRow([]);

  audit.addRow(['AUDIT ATTRIBUTE', 'DETAILS']).font = { bold: true, color: { argb: headerText } };
  audit.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

  const auditRows = [
    ['Record Creation Timestamp', data.auditTrail.recordCreationTimestamp ? format(new Date(data.auditTrail.recordCreationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'],
    ['Record Modification Timestamp', data.auditTrail.recordModificationTimestamp ? format(new Date(data.auditTrail.recordModificationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'],
    ['Data Source', data.auditTrail.dataSource || 'N/A'],
    ['Export Timestamp', data.auditTrail.exportTimestamp ? format(new Date(data.auditTrail.exportTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'],
    ['Export Version', data.auditTrail.exportVersion || 'N/A'],
    ['App Name', data.metadata.appName || 'AI Trade Journal'],
    ['User ID', data.metadata.userId || 'N/A'],
    ['Account ID', data.metadata.accountId || 'N/A'],
    ['Time Zone', data.metadata.timeZone || 'UTC'],
    ['SHA-256 Checksum', data.dataIntegrity?.exportChecksum || 'N/A'],
    ['Record Count', data.dataIntegrity?.recordCountVerification || data.ledger.length.toString()],
  ];

  auditRows.forEach((row, idx) => {
    const r = audit.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow } };
    }
  });

  audit.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  return workbook;
}