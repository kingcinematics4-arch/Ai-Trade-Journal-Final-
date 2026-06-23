import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComplianceReportData } from './complianceEngine';
import { formatCurrency, formatPercentage } from '../exportFormatting';
import { format } from 'date-fns';

/**
 * Builds the formal Compliance & Audit Report PDF.
 */
export function buildCompliancePdf(data: ComplianceReportData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 20;

  const primaryColor: [number, number, number] = [0, 31, 63]; // Navy
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate

  // --- Title Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('COMPLIANCE & AUDIT REPORT', 14, cursorY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text('Confidential - Factual Trade Ledger', pageWidth - 14, cursorY, { align: 'right' });
  cursorY += 15;

  // --- 1. Report Metadata & 8. Executive Summary ---
  autoTable(doc, {
    startY: cursorY,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      ['Report ID:', data.metadata.reportId, 'Export Date:', format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss')],
      ['App Name:', data.metadata.appName, 'Time Zone:', data.metadata.timeZone],
      ['User ID:', data.metadata.userId, 'Account ID:', data.metadata.accountId],
      ['Period Start:', format(new Date(data.metadata.reportingPeriodStart), 'yyyy-MM-dd'), 'Period End:', format(new Date(data.metadata.reportingPeriodEnd), 'yyyy-MM-dd')]
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 60 }
    }
  });
  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // --- 7. Data Integrity Section ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Data Integrity Verification', 14, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    head: [['Integrity Metric', 'Verified Value']],
    body: [
      ['SHA-256 Checksum', data.dataIntegrity.exportChecksum],
      ['Record Count Verification', data.dataIntegrity.recordCountVerification.toString()],
      ['Export Version', data.metadata.exportVersion]
    ],
  });
  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // --- 2. Account Summary & 5. Fee Analysis ---
  doc.setFontSize(12);
  doc.text('Account Summary & Fee Analysis', 14, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: [
      ['Total Trades', data.accountSummary.totalTrades.toString(), 'Gross Profit', formatCurrency(data.accountSummary.grossProfit)],
      ['Win Rate', formatPercentage(data.accountSummary.winRate), 'Gross Loss', formatCurrency(data.accountSummary.grossLoss)],
      ['Profit Factor', data.accountSummary.profitFactor === Infinity ? 'Infinity' : data.accountSummary.profitFactor.toFixed(2), 'Total Volume', formatCurrency(data.accountSummary.totalVolume)],
      ['Largest Win', formatCurrency(data.accountSummary.largestWin), 'Largest Loss', formatCurrency(data.accountSummary.largestLoss)],
      ['Broker Fees', formatCurrency(data.feeAnalysis.brokerFees), 'Net Profit/Loss', formatCurrency(data.accountSummary.netPnl)]
    ]
  });
  cursorY = (doc as any).lastAutoTable.finalY + 15;

  // --- 4. Strategy Attribution ---
  doc.setFontSize(12);
  doc.text('Strategy Attribution', 14, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    head: [['Strategy Name', 'Trade Count', 'Win Rate', 'Gross Profit', 'Gross Loss', 'Net P&L']],
    body: data.strategies.map(s => [
      s.strategyName,
      s.tradeCount.toString(),
      formatPercentage(s.winRate),
      formatCurrency(s.grossProfit),
      formatCurrency(s.grossLoss),
      formatCurrency(s.netPnl)
    ])
  });

  // --- 3. Trading Activity Ledger ---
  doc.addPage();
  cursorY = 20;
  doc.setFontSize(14);
  doc.text('Trading Activity Ledger', 14, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    head: [['Trade ID', 'Date', 'Asset', 'Type', 'Qty', 'Entry', 'Exit', 'Gross P&L', 'Fees', 'Net P&L']],
    body: data.ledger.map(t => [
      (t.tradeId || 'N/A').substring(0, 8),
      format(new Date(t.entryDate), 'yyyy-MM-dd HH:mm'),
      t.assetSymbol,
      t.positionType,
      t.quantity.toString(),
      formatCurrency(t.entryPrice),
      formatCurrency(t.exitPrice),
      formatCurrency(t.grossPnl),
      formatCurrency(t.fees),
      formatCurrency(t.netPnl)
    ])
  });

  // --- 9. Compliance Appendix ---
  doc.addPage();
  cursorY = 20;
  doc.setFontSize(14);
  doc.text('Compliance Appendix: Methodology & Definitions', 14, cursorY);
  cursorY += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const appendixLines = [
    '1. Data Integrity: The SHA-256 Checksum on Page 1 is generated cryptographically from the exact ledger data exported.',
    '2. Exclusions: This report deliberately strips all subjective, UI-specific, and qualitative fields (e.g., emotional tags, journaling notes).',
    '3. Net Profit/Loss: Calculated as Gross Profit - Gross Loss - Fees.',
    '4. Profit Factor: Calculated as Gross Profit / Gross Loss.',
    '5. Date / Time: All timestamps are recorded and exported in UTC unless otherwise stated.',
    '',
    'This document is generated factually from user-provided or broker-synced trade data. It is intended to serve as a robust record for accountants, auditors, tax professionals, and compliance reviews. This system makes no claims of legal validity without independent broker verification.'
  ];

  doc.text(appendixLines, 14, cursorY);

  // Footer with Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} | Report ID: ${data.metadata.reportId} | Generated: ${data.metadata.exportTimestampUTC}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}
