import * as ExcelJS from 'exceljs';
import { ComplianceReportData } from './complianceEngine';
import { format } from 'date-fns';

/**
 * Builds the formal Compliance & Audit Report Excel Workbook.
 */
export async function buildComplianceExcel(data: ComplianceReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI Trade Journal Compliance System';
  workbook.created = new Date(data.metadata.exportTimestampUTC);

  // --- Executive Summary Sheet ---
  const execSheet = workbook.addWorksheet('Executive Summary');
  execSheet.columns = [{ width: 35 }, { width: 45 }];

  // Title
  const titleRow = execSheet.addRow(['COMPLIANCE & AUDIT REPORT']);
  titleRow.font = { bold: true, size: 16, color: { argb: '001F3F' } };
  execSheet.addRow(['Confidential - Factual Trade Ledger']);
  execSheet.addRow([]);

  // Metadata Block
  execSheet.addRow(['REPORT METADATA', 'VALUE']).font = { bold: true };
  execSheet.addRow(['Report ID', data.metadata.reportId]);
  execSheet.addRow(['Export Date (UTC)', format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss')]);
  execSheet.addRow(['App Name', data.metadata.appName]);
  execSheet.addRow(['Time Zone', data.metadata.timeZone]);
  execSheet.addRow(['User ID', data.metadata.userId]);
  execSheet.addRow(['Account ID', data.metadata.accountId]);
  execSheet.addRow(['Period Start', format(new Date(data.metadata.reportingPeriodStart), 'yyyy-MM-dd')]);
  execSheet.addRow(['Period End', format(new Date(data.metadata.reportingPeriodEnd), 'yyyy-MM-dd')]);
  execSheet.addRow([]);

  // Data Integrity Block
  execSheet.addRow(['DATA INTEGRITY VERIFICATION', 'VALUE']).font = { bold: true };
  execSheet.addRow(['SHA-256 Checksum', data.dataIntegrity.exportChecksum]);
  execSheet.addRow(['Record Count Verification', data.dataIntegrity.recordCountVerification]);
  execSheet.addRow(['Export Version', data.metadata.exportVersion]);
  execSheet.addRow([]);

  // Account Summary Block
  execSheet.addRow(['ACCOUNT SUMMARY & FEE ANALYSIS', 'VALUE']).font = { bold: true };
  execSheet.addRow(['Total Trades', data.accountSummary.totalTrades]);
  execSheet.addRow(['Total Volume', data.accountSummary.totalVolume]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Gross Profit', data.accountSummary.grossProfit]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Gross Loss', data.accountSummary.grossLoss]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Broker Fees', data.feeAnalysis.brokerFees]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Net Profit/Loss', data.accountSummary.netPnl]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Win Rate', data.accountSummary.winRate / 100]).getCell(2).numFmt = '0.00%';
  execSheet.addRow(['Profit Factor', data.accountSummary.profitFactor === Infinity ? 'Infinity' : data.accountSummary.profitFactor]);
  execSheet.addRow(['Largest Win', data.accountSummary.largestWin]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  execSheet.addRow(['Largest Loss', data.accountSummary.largestLoss]).getCell(2).numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  // Styling for specific headers
  [4, 14, 19].forEach(r => {
    execSheet.getRow(r).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    execSheet.getRow(r).border = { bottom: { style: 'thin' } };
  });

  // --- Trading Activity Ledger Sheet ---
  const ledgerSheet = workbook.addWorksheet('Trading Ledger');
  ledgerSheet.columns = [
    { header: 'TRADE ID', key: 'tradeId', width: 15 },
    { header: 'DATE/TIME', key: 'entryDate', width: 20 },
    { header: 'ASSET', key: 'assetSymbol', width: 15 },
    { header: 'MARKET', key: 'market', width: 15 },
    { header: 'TYPE', key: 'positionType', width: 12 },
    { header: 'QUANTITY', key: 'quantity', width: 12 },
    { header: 'ENTRY PRICE', key: 'entryPrice', width: 15 },
    { header: 'EXIT PRICE', key: 'exitPrice', width: 15 },
    { header: 'GROSS P&L', key: 'grossPnl', width: 15 },
    { header: 'FEES', key: 'fees', width: 12 },
    { header: 'NET P&L', key: 'netPnl', width: 15 },
    { header: 'STRATEGY', key: 'strategyName', width: 25 },
  ];

  // Freeze Header
  ledgerSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Header Styling
  ledgerSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  ledgerSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '001F3F' } };

  data.ledger.forEach(t => {
    ledgerSheet.addRow({
      tradeId: t.tradeId,
      entryDate: format(new Date(t.entryDate), 'yyyy-MM-dd HH:mm:ss'),
      assetSymbol: t.assetSymbol,
      market: t.market,
      positionType: t.positionType,
      quantity: t.quantity,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      grossPnl: t.grossPnl,
      fees: t.fees,
      netPnl: t.netPnl,
      strategyName: t.strategyName,
    });
  });

  // Ledger number formatting
  ledgerSheet.getColumn('entryPrice').numFmt = '#,##0.00####';
  ledgerSheet.getColumn('exitPrice').numFmt = '#,##0.00####';
  ledgerSheet.getColumn('grossPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  ledgerSheet.getColumn('fees').numFmt = '"$"#,##0.00';
  ledgerSheet.getColumn('netPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  // --- Strategy Attribution Sheet ---
  const stratSheet = workbook.addWorksheet('Strategy Attribution');
  stratSheet.columns = [
    { header: 'STRATEGY NAME', key: 'strategyName', width: 30 },
    { header: 'TRADE COUNT', key: 'tradeCount', width: 15 },
    { header: 'WIN RATE', key: 'winRate', width: 15 },
    { header: 'GROSS PROFIT', key: 'grossProfit', width: 20 },
    { header: 'GROSS LOSS', key: 'grossLoss', width: 20 },
    { header: 'NET P&L', key: 'netPnl', width: 20 },
  ];

  stratSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  stratSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  stratSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '001F3F' } };

  data.strategies.forEach(s => {
    stratSheet.addRow({
      strategyName: s.strategyName,
      tradeCount: s.tradeCount,
      winRate: s.winRate / 100,
      grossProfit: s.grossProfit,
      grossLoss: s.grossLoss,
      netPnl: s.netPnl,
    });
  });

  stratSheet.getColumn('winRate').numFmt = '0.00%';
  stratSheet.getColumn('grossProfit').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  stratSheet.getColumn('grossLoss').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  stratSheet.getColumn('netPnl').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  // --- Audit Trail Sheet ---
  const auditSheet = workbook.addWorksheet('Audit Trail');
  auditSheet.columns = [{ width: 40 }, { width: 50 }];
  auditSheet.addRow(['AUDIT TRAIL LOG', 'DETAILS']).font = { bold: true };
  auditSheet.addRow(['Record Creation Timestamp (Period Start)', format(new Date(data.auditTrail.recordCreationTimestamp), 'yyyy-MM-dd HH:mm:ss')]);
  auditSheet.addRow(['Record Modification Timestamp (Period End)', format(new Date(data.auditTrail.recordModificationTimestamp), 'yyyy-MM-dd HH:mm:ss')]);
  auditSheet.addRow(['Data Source', data.auditTrail.dataSource]);
  auditSheet.addRow(['Export Timestamp', format(new Date(data.auditTrail.exportTimestamp), 'yyyy-MM-dd HH:mm:ss')]);
  auditSheet.addRow(['Export Version', data.auditTrail.exportVersion]);

  auditSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };

  return workbook;
}
