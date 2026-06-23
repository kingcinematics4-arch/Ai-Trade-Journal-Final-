import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ComplianceReportData } from './complianceEngine';

// Brand colors - exact values from design spec
const COLORS = {
  navy: [15, 23, 42] as [number, number, number],       // #0F172A
  indigo: [67, 56, 202] as [number, number, number],     // #4338CA
  blue: [37, 99, 235] as [number, number, number],        // #2563EB
  gray: [100, 116, 139] as [number, number, number],      // #64748B
  darkGray: [55, 65, 81] as [number, number, number],     // #374151
  mediumGray: [107, 114, 128] as [number, number, number], // #6B7280
  lightGray: [156, 163, 175] as [number, number, number],  // #9CA3AF
  veryLightGray: [229, 231, 235] as [number, number, number], // #E5E7EB
  bgLight: [248, 250, 252] as [number, number, number],    // #F8FAFC
  profitGreen: [22, 163, 74] as [number, number, number],  // #16A34A
  lossRed: [220, 38, 38] as [number, number, number],      // #DC2626
  neutralBlue: [37, 99, 235] as [number, number, number],  // #2563EB
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  cardBg: [245, 247, 250] as [number, number, number],
};

const FONT_BOLD = 'helvetica';
const FONT_NORMAL = 'helvetica';
const FONT_SIZE_TITLE = 28;
const FONT_SIZE_SUBTITLE = 16;
const FONT_SIZE_SECTION = 14;
const FONT_SIZE_SUBSECTION = 12;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_TINY = 7;
const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

/**
 * Generates the Annual Compliance Report PDF with full institutional-grade formatting.
 */
export async function exportAnnualComplianceReportPDF(data: ComplianceReportData): Promise<jsPDF> {
  console.log('[annualCompliancePdf] Starting institutional-grade PDF generation...');
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    // ========== HELPER: Page header ==========
    const addPageHeader = (pageNum: number) => {
      // Top bar
      doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
      doc.rect(MARGIN, 10, CONTENT_WIDTH, 0.5, 'F');

      doc.setFont(FONT_NORMAL, 'normal');
      doc.setFontSize(FONT_SIZE_TINY);
      doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
      doc.text('AI TRADE JOURNAL — ANNUAL COMPLIANCE REPORT', MARGIN, 8);

      doc.setFont(FONT_NORMAL, 'normal');
      doc.setFontSize(FONT_SIZE_TINY);
      doc.text(`Report ID: ${data.metadata.reportId}`, MARGIN, 15);
      doc.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN, 15, { align: 'right' });
    };

    // ========== HELPER: Section divider ==========
    const addSectionDivider = (y: number) => {
      doc.setDrawColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    };

    // ========== HELPER: Page number footer ==========
    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Bottom bar
        doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
        doc.rect(MARGIN, PAGE_HEIGHT - 15, CONTENT_WIDTH, 0.3, 'F');

        doc.setFont(FONT_NORMAL, 'normal');
        doc.setFontSize(FONT_SIZE_TINY);
        doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
        doc.text(
          `Page ${i} of ${pageCount}`,
          MARGIN,
          PAGE_HEIGHT - 10
        );
        doc.text(
          `Generated ${format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm')} UTC | Report ${data.metadata.reportId}`,
          PAGE_WIDTH - MARGIN,
          PAGE_HEIGHT - 10,
          { align: 'right' }
        );

        // Confidential label
        doc.setFont(FONT_NORMAL, 'bold');
        doc.setFontSize(FONT_SIZE_TINY);
        doc.setTextColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
        doc.text(
          'CONFIDENTIAL — FOR AUTHORIZED RECIPIENTS ONLY',
          MARGIN,
          PAGE_HEIGHT - 4
        );
      }
    };

    // ====================================================================
    // PAGE 1: COVER PAGE
    // ====================================================================
    console.log('[annualCompliancePdf] Rendering cover page...');

    // Full dark navy background
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

    // Accent stripe top
    doc.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.rect(0, 0, PAGE_WIDTH, 4, 'F');

    // Decorative line
    doc.setDrawColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 45, PAGE_WIDTH - MARGIN, 45);

    // Application Name
    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.text('AI TRADE JOURNAL', MARGIN, 30);

    // Main Title: Annual Compliance Report
    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(32);
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.text('ANNUAL COMPLIANCE', MARGIN, 65);
    doc.text('REPORT', MARGIN, 90);

    // Tagline
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.veryLightGray[0], COLORS.veryLightGray[1], COLORS.veryLightGray[2]);
    doc.text('Official Financial Record — Institutional Trade Documentation', MARGIN, 108);

    // Decorative line
    doc.setDrawColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 118, PAGE_WIDTH - MARGIN, 118);

    // Reporting Period
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_SECTION);
    doc.setTextColor(COLORS.bgLight[0], COLORS.bgLight[1], COLORS.bgLight[2]);
    const reportPeriodLabel = data.metadata.reportingPeriodStart
      ? `${format(new Date(data.metadata.reportingPeriodStart), 'MMMM d, yyyy')} — ${format(new Date(data.metadata.reportingPeriodEnd), 'MMMM d, yyyy')}`
      : 'Not specified';
    doc.text(reportPeriodLabel, MARGIN, 140);

    // Report Information block
    doc.setFillColor(COLORS.bgLight[0], COLORS.bgLight[1], COLORS.bgLight[2]);
    doc.roundedRect(MARGIN, 165, CONTENT_WIDTH, 100, 3, 3, 'F');

    // Title for info section
    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(FONT_SIZE_SUBSECTION);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('REPORT IDENTIFICATION', MARGIN + 8, 185);

    // Divider line
    doc.setDrawColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + 8, 190, PAGE_WIDTH - MARGIN - 8, 190);

    // Report metadata
    const coverFields: Array<{ label: string; value: string }> = [
      { label: 'Report ID', value: data.metadata.reportId },
      { label: 'Account ID', value: data.metadata.accountId || 'N/A' },
      { label: 'User ID', value: data.metadata.userId || 'N/A' },
      { label: 'Generated Date', value: `${format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss')} UTC` },
      { label: 'Reporting Period', value: reportPeriodLabel },
      { label: 'Export Version', value: data.metadata.exportVersion },
      { label: 'Report Type', value: 'Annual Compliance Report (Official Financial Record)' },
      { label: 'Time Zone', value: data.metadata.timeZone || 'UTC' },
    ];

    let yPos = 198;
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_SMALL);

    for (let i = 0; i < coverFields.length; i += 2) {
      const field = coverFields[i];
      if (i % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(MARGIN + 8, yPos - 2, (CONTENT_WIDTH - 16) / 2, 7, 'F');
      }
      doc.setFont(FONT_NORMAL, 'bold');
      doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
      doc.text(field.label + ':', MARGIN + 8, yPos + 2);
      doc.setFont(FONT_NORMAL, 'normal');
      doc.setTextColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
      doc.text(field.value, MARGIN + 55, yPos + 2);

      // Second column
      if (i + 1 < coverFields.length) {
        const nextField = coverFields[i + 1];
        doc.setFont(FONT_NORMAL, 'bold');
        doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
        doc.text(nextField.label + ':', MARGIN + 8 + (CONTENT_WIDTH - 16) / 2, yPos + 2);
        doc.setFont(FONT_NORMAL, 'normal');
        doc.setTextColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
        doc.text(nextField.value, MARGIN + 55 + (CONTENT_WIDTH - 16) / 2, yPos + 2);
      }

      yPos += 8;
    }

    // Confidential document label at bottom
    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.text('— CONFIDENTIAL DOCUMENT —', PAGE_WIDTH / 2, PAGE_HEIGHT - 40, { align: 'center' });

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_TINY);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text('This document is an official financial record intended for authorized recipients only.', PAGE_WIDTH / 2, PAGE_HEIGHT - 32, { align: 'center' });
    doc.text('Unauthorized distribution or reproduction is prohibited.', PAGE_WIDTH / 2, PAGE_HEIGHT - 25, { align: 'center' });

    // ====================================================================
    // PAGE 2: EXECUTIVE SUMMARY — Metric Cards
    // ====================================================================
    doc.addPage();
    addPageHeader(1);
    console.log('[annualCompliancePdf] Rendering executive summary...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('EXECUTIVE SUMMARY', MARGIN, 35);

    addSectionDivider(39);

    // Subtitle
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_BODY);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text('Key performance metrics for the reporting period', MARGIN, 48);

    // Metric Cards — 2 rows of 5
    const metrics: Array<{ label: string; value: string; color: [number, number, number] }> = [
      { label: 'Total Trades', value: data.accountSummary.totalTrades.toString(), color: COLORS.navy },
      { label: 'Gross Profit', value: `$${(data.accountSummary.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.profitGreen },
      { label: 'Gross Loss', value: `$${(data.accountSummary.grossLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.lossRed },
      { label: 'Net P&L', value: `$${(data.accountSummary.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: data.accountSummary.netPnl >= 0 ? COLORS.profitGreen : COLORS.lossRed },
      { label: 'Profit Factor', value: data.accountSummary.profitFactor === Infinity ? '∞' : (data.accountSummary.profitFactor || 0).toFixed(2), color: COLORS.indigo },
    ];

    const metricsRow2: Array<{ label: string; value: string; color: [number, number, number] }> = [
      { label: 'Win Rate', value: `${(data.accountSummary.winRate || 0).toFixed(2)}%`, color: COLORS.neutralBlue },
      { label: 'Average Trade', value: `$${(data.accountSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.darkGray },
      { label: 'Largest Win', value: `$${(data.accountSummary.largestWin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.profitGreen },
      { label: 'Largest Loss', value: `$${(data.accountSummary.largestLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.lossRed },
      { label: 'Trading Days', value: (data.accountSummary.tradingDays || 0).toString(), color: COLORS.darkGray },
    ];

    const metricsRow3: Array<{ label: string; value: string; color: [number, number, number] }> = [
      { label: 'Avg Daily P&L', value: `$${(data.accountSummary.averageDailyPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: COLORS.indigo },
    ];

    const cardW = (CONTENT_WIDTH - 16) / 5; // 5 cards per row
    const cardH = 28;
    const cardGap = 4;
    const cardY = 56;

    const drawMetricRow = (metricsArr: typeof metrics, y: number) => {
      metricsArr.forEach((m, idx) => {
        const x = MARGIN + idx * (cardW + cardGap);

        // Card background
        doc.setFillColor(COLORS.cardBg[0], COLORS.cardBg[1], COLORS.cardBg[2]);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

        // Colored top accent
        doc.setFillColor(m.color[0], m.color[1], m.color[2]);
        doc.rect(x, y, cardW, 3, 'F');

        // Label
        doc.setFont(FONT_NORMAL, 'bold');
        doc.setFontSize(FONT_SIZE_TINY);
        doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
        doc.text(m.label.toUpperCase(), x + 4, y + 11);

        // Value
        doc.setFont(FONT_NORMAL, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.value, x + 4, y + 23);
      });
    };

    drawMetricRow(metrics, cardY);
    drawMetricRow(metricsRow2, cardY + cardH + cardGap);
    drawMetricRow(metricsRow3, cardY + (cardH + cardGap) * 2);

    // ====================================================================
    // PAGE 3: ACCOUNT INFORMATION
    // ====================================================================
    doc.addPage();
    addPageHeader(2);
    console.log('[annualCompliancePdf] Rendering account information...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('ACCOUNT INFORMATION', MARGIN, 35);

    addSectionDivider(39);

    // Account info table
    const accountInfoData: Array<{ label: string; value: string }> = [
      { label: 'Account ID', value: data.accountInfo.accountId || 'N/A' },
      { label: 'User ID', value: data.accountInfo.userId || 'N/A' },
      { label: 'Export Timestamp', value: `${format(new Date(data.accountInfo.exportTimestamp), 'yyyy-MM-dd HH:mm:ss')} UTC` },
      { label: 'Reporting Period', value: data.accountInfo.reportingPeriod },
      { label: 'Time Zone', value: data.accountInfo.timeZone || 'UTC' },
      { label: 'Report Version', value: data.accountInfo.reportVersion },
      { label: 'Data Source', value: data.accountInfo.dataSource },
    ];

    autoTable(doc, {
      body: accountInfoData.map(row => [row.label, row.value]),
      startY: 48,
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        fontSize: FONT_SIZE_BODY,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: COLORS.darkGray },
        1: { fontStyle: 'normal', cellWidth: 'auto', textColor: COLORS.black },
      },
      theme: 'grid',
      tableLineColor: COLORS.veryLightGray,
      tableLineWidth: 0.3,
      didParseCell: (cellData) => {
        if (cellData.row.index % 2 === 0) {
          cellData.cell.styles.fillColor = [245, 247, 250];
        }
      },
    });

    // ====================================================================
    // PAGE 4: FINANCIAL SUMMARY
    // ====================================================================
    doc.addPage();
    addPageHeader(3);
    console.log('[annualCompliancePdf] Rendering financial summary...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('FINANCIAL SUMMARY', MARGIN, 35);

    addSectionDivider(39);

    // Financial summary with color coding
    const finSummary: Array<{ label: string; value: string; type: 'positive' | 'negative' | 'neutral' }> = [
      { label: 'Gross Profit', value: `$${(data.financialSummary.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: 'positive' },
      { label: 'Gross Loss', value: `($${(data.financialSummary.grossLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})`, type: 'negative' },
      { label: 'Net Profit', value: `$${(data.financialSummary.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: data.financialSummary.netProfit >= 0 ? 'positive' : 'negative' },
      { label: 'Total Fees', value: `$${(data.financialSummary.totalFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: 'neutral' },
      { label: 'Net After Fees', value: `$${(data.financialSummary.netAfterFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: data.financialSummary.netAfterFees >= 0 ? 'positive' : 'negative' },
      { label: 'Average Trade', value: `$${(data.financialSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: 'neutral' },
      { label: 'Profit Factor', value: data.financialSummary.profitFactor === Infinity ? '∞' : (data.financialSummary.profitFactor || 0).toFixed(2), type: 'neutral' },
      { label: 'Win Rate', value: `${(data.financialSummary.winRate || 0).toFixed(2)}%`, type: 'neutral' },
    ];

    const getColorForType = (type: 'positive' | 'negative' | 'neutral'): [number, number, number] => {
      switch (type) {
        case 'positive': return COLORS.profitGreen;
        case 'negative': return COLORS.lossRed;
        case 'neutral': return COLORS.neutralBlue;
      }
    };

    autoTable(doc, {
      body: finSummary.map(row => [row.label, row.value]),
      startY: 48,
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        fontSize: FONT_SIZE_BODY,
        cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80, textColor: COLORS.darkGray },
        1: { cellWidth: 'auto', halign: 'right' },
      },
      theme: 'grid',
      tableLineColor: COLORS.veryLightGray,
      tableLineWidth: 0.3,
      didParseCell: (cellData) => {
        if (cellData.column.index === 1 && cellData.row.raw) {
          const rowData = finSummary[cellData.row.index];
          if (rowData) {
            cellData.cell.styles.textColor = getColorForType(rowData.type);
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
        if (cellData.row.index % 2 === 0) {
          cellData.cell.styles.fillColor = [245, 247, 250];
        }
      },
    });

    // ====================================================================
    // PAGE 5: TRADING LEDGER
    // ====================================================================
    doc.addPage();
    addPageHeader(4);
    console.log('[annualCompliancePdf] Rendering trading ledger...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('TRADING LEDGER', MARGIN, 35);

    addSectionDivider(39);

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text(`Record Count: ${data.ledger.length} trades`, MARGIN, 48);

    const ledgerHeaders = [['Trade ID', 'Symbol', 'Market', 'Entry Date', 'Exit Date', 'Side', 'Qty', 'Entry', 'Exit', 'Fees', 'Net P&L']];

    const ledgerRows = data.ledger.map(t => [
      t.tradeId || '',
      t.assetSymbol || '',
      t.market || '',
      t.entryDate ? format(new Date(t.entryDate), 'yyyy-MM-dd') : '',
      t.exitDate ? format(new Date(t.exitDate), 'yyyy-MM-dd') : '',
      t.positionType || '',
      (t.quantity || 0).toLocaleString(),
      `$${(t.entryPrice || 0).toFixed(2)}`,
      `$${(t.exitPrice || 0).toFixed(2)}`,
      `$${(t.fees || 0).toFixed(2)}`,
      `$${(t.netPnl || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: ledgerHeaders,
      body: ledgerRows,
      startY: 54,
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        fontSize: FONT_SIZE_TINY,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
      headStyles: {
        fillColor: COLORS.navy,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: FONT_SIZE_TINY,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold' },
        1: { cellWidth: 12 },
        2: { cellWidth: 12 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 12, halign: 'right' },
        7: { cellWidth: 12, halign: 'right' },
        8: { cellWidth: 12, halign: 'right' },
        9: { cellWidth: 12, halign: 'right' },
        10: { cellWidth: 14, halign: 'right' },
      },
      didParseCell: (cellData: any) => {
        // Color Net P&L
        if (cellData.column.index === 10) {
          const val = parseFloat(cellData.cell.raw?.toString().replace(/[$,]/g, '') || '0');
          cellData.cell.styles.textColor = val >= 0 ? COLORS.profitGreen : COLORS.lossRed;
          cellData.cell.styles.fontStyle = 'bold';
        }
        // Color Side
        if (cellData.column.index === 5) {
          const side = (cellData.cell.raw as string || '').toUpperCase();
          if (side === 'BUY' || side === 'LONG') {
            cellData.cell.styles.textColor = COLORS.profitGreen;
          } else if (side === 'SELL' || side === 'SHORT') {
            cellData.cell.styles.textColor = COLORS.lossRed;
          }
        }
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2,
    });

    // ====================================================================
    // PAGE 6: STRATEGY ANALYSIS
    // ====================================================================
    doc.addPage();
    addPageHeader(5);
    console.log('[annualCompliancePdf] Rendering strategy analysis...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('STRATEGY ANALYSIS', MARGIN, 35);

    addSectionDivider(39);

    const stratHeaders = [['Strategy Name', 'Trade Count', 'Win Rate', 'Net P&L', 'Average Trade', 'Profit Factor']];

    const stratRows = data.strategies.map(s => [
      s.strategyName || '',
      (s.tradeCount || 0).toString(),
      `${(s.winRate || 0).toFixed(2)}%`,
      `$${(s.netPnl || 0).toFixed(2)}`,
      `$${(s.averageTrade || 0).toFixed(2)}`,
      s.profitFactor === Infinity ? '∞' : (s.profitFactor || 0).toFixed(2),
    ]);

    if (data.strategies && data.strategies.length > 0) {
      autoTable(doc, {
        head: stratHeaders,
        body: stratRows,
        startY: 48,
        margin: { left: MARGIN, right: MARGIN },
        styles: {
          fontSize: FONT_SIZE_BODY,
          cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
        },
        headStyles: {
          fillColor: COLORS.navy,
          textColor: COLORS.white,
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' },
        },
        didParseCell: (cellData: any) => {
          if (cellData.column.index === 3) {
            const val = parseFloat(cellData.cell.raw?.toString().replace(/[$,]/g, '') || '0');
            cellData.cell.styles.textColor = val >= 0 ? COLORS.profitGreen : COLORS.lossRed;
            cellData.cell.styles.fontStyle = 'bold';
          }
        },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.2,
      });
    } else {
      doc.setFont(FONT_NORMAL, 'normal');
      doc.setFontSize(FONT_SIZE_BODY);
      doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
      doc.text('No strategy data available for the reporting period.', MARGIN, 56);
    }

    // ====================================================================
    // PAGE 7: AUDIT TRAIL
    // ====================================================================
    doc.addPage();
    addPageHeader(6);
    console.log('[annualCompliancePdf] Rendering audit trail...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('AUDIT TRAIL', MARGIN, 35);

    addSectionDivider(39);

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_BODY);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text('Verification and tracking information for this report', MARGIN, 48);

    const auditFields: Array<{ label: string; value: string }> = [
      { label: 'Export Timestamp', value: format(new Date(data.auditTrail.exportTimestamp), 'yyyy-MM-dd HH:mm:ss') + ' UTC' },
      { label: 'Record Count', value: (data.auditTrail.recordCount || data.ledger.length).toString() },
      { label: 'Account ID', value: data.auditTrail.accountId || 'N/A' },
      { label: 'User ID', value: data.auditTrail.userId || 'N/A' },
      { label: 'Export Version', value: data.auditTrail.exportVersion },
      { label: 'Report ID', value: data.auditTrail.reportId },
      { label: 'Data Source', value: data.auditTrail.dataSource },
      { label: 'Record Created', value: data.auditTrail.recordCreationTimestamp ? format(new Date(data.auditTrail.recordCreationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Last Modified', value: data.auditTrail.recordModificationTimestamp ? format(new Date(data.auditTrail.recordModificationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
    ];

    autoTable(doc, {
      body: auditFields.map(row => [row.label, row.value]),
      startY: 56,
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        fontSize: FONT_SIZE_BODY,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: COLORS.darkGray },
        1: { fontStyle: 'normal', cellWidth: 'auto', textColor: COLORS.black },
      },
      theme: 'grid',
      tableLineColor: COLORS.veryLightGray,
      tableLineWidth: 0.3,
      didParseCell: (cellData) => {
        if (cellData.row.index % 2 === 0) {
          cellData.cell.styles.fillColor = [245, 247, 250];
        }
      },
    });

    // ====================================================================
    // PAGE 8: DATA INTEGRITY
    // ====================================================================
    doc.addPage();
    addPageHeader(7);
    console.log('[annualCompliancePdf] Rendering data integrity...');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text('DATA INTEGRITY', MARGIN, 35);

    addSectionDivider(39);

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_BODY);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text('Cryptographic verification ensures data has not been altered since generation.', MARGIN, 48);

    // Integrity verification box
    const integrityBoxY = 56;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(MARGIN, integrityBoxY, CONTENT_WIDTH, 60, 3, 3, 'F');
    doc.setDrawColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, integrityBoxY, CONTENT_WIDTH, 60, 3, 3, 'S');

    doc.setFont(FONT_NORMAL, 'bold');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);

    const integrityItems: Array<{ label: string; value: string }> = [
      { label: 'SHA-256 Hash', value: data.dataIntegrity.sha256Hash || 'N/A' },
      { label: 'Checksum', value: data.dataIntegrity.checksum || 'N/A' },
      { label: 'Record Verification Count', value: (data.dataIntegrity.recordVerificationCount || 0).toString() },
      { label: 'Generation Timestamp', value: data.dataIntegrity.generationTimestamp ? format(new Date(data.dataIntegrity.generationTimestamp), 'yyyy-MM-dd HH:mm:ss') + ' UTC' : 'N/A' },
    ];

    let diY = integrityBoxY + 12;
    integrityItems.forEach((item) => {
      doc.setFont(FONT_NORMAL, 'bold');
      doc.setFontSize(FONT_SIZE_SMALL);
      doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
      doc.text(item.label + ':', MARGIN + 8, diY);
      doc.setFont(FONT_NORMAL, 'normal');
      doc.setFontSize(FONT_SIZE_SMALL);

      // Wrap long SHA-256 hash
      if (item.value.length > 60) {
        doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
        doc.text(item.value.substring(0, 60), MARGIN + 80, diY);
        diY += 5;
        doc.text(item.value.substring(60), MARGIN + 80, diY);
      } else {
        doc.setTextColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
        doc.text(item.value, MARGIN + 80, diY);
      }
      diY += 8;
    });

    // Report closure section
    const closureY = integrityBoxY + 80;
    addSectionDivider(closureY);

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setTextColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
    doc.text('End of Report — This document is an official financial record generated by AI Trade Journal.', MARGIN, closureY + 8);
    doc.text('The data presented is based on recorded trading activity and system calculations.', MARGIN, closureY + 14);
    doc.text('Verify all figures independently. This is not legal advice or a guarantee of future performance.', MARGIN, closureY + 20);
    doc.text('For questions regarding this report, contact support with Report ID: ' + data.metadata.reportId, MARGIN, closureY + 28);

    addFooter();

    console.log('[annualCompliancePdf] PDF generation complete, returning doc');
    return doc;
  } catch (error) {
    console.error('[annualCompliancePdf] ERROR generating PDF:', error);
    if (error instanceof Error) {
      console.error('[annualCompliancePdf] Error name:', error.name);
      console.error('[annualCompliancePdf] Error message:', error.message);
      console.error('[annualCompliancePdf] Error stack:', error.stack);
    }
    throw error;
  }
}