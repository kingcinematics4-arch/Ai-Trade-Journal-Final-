import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ComplianceReportData } from './complianceEngine';

/**
 * Generates the Annual Compliance Report PDF with full professional formatting.
 * Includes: Cover Page, Report ID, Export Date, Reporting Period, Account Summary,
 * Trading Ledger, Performance Statistics, Fee Analysis, Strategy Summary,
 * Audit Trail, Data Integrity Section, and Page Numbers.
 */
export async function exportAnnualComplianceReportPDF(data: ComplianceReportData): Promise<jsPDF> {
  console.log('[annualCompliancePdf] Starting PDF generation...');
  try {
    if (!data) throw new Error('exportAnnualComplianceReportPDF: data is undefined');
    if (!data.ledger) throw new Error('exportAnnualComplianceReportPDF: data.ledger is undefined');
    if (!Array.isArray(data.ledger)) throw new Error('exportAnnualComplianceReportPDF: data.ledger is not an array');
    if (!data.accountSummary) throw new Error('exportAnnualComplianceReportPDF: data.accountSummary is undefined');
    if (!data.feeAnalysis) throw new Error('exportAnnualComplianceReportPDF: data.feeAnalysis is undefined');
    if (!data.metadata) throw new Error('exportAnnualComplianceReportPDF: data.metadata is undefined');
    if (!data.auditTrail) throw new Error('exportAnnualComplianceReportPDF: data.auditTrail is undefined');
    if (!data.dataIntegrity) throw new Error('exportAnnualComplianceReportPDF: data.dataIntegrity is undefined');

    console.log('[annualCompliancePdf] Input validation passed:', {
      ledgerLength: data.ledger.length,
      strategiesCount: data.strategies?.length,
      totalTrades: data.accountSummary.totalTrades,
    });

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Helper: Add page number footer
    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} | Annual Compliance Report | ${format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm')} UTC`,
          margin,
          pageHeight - 10
        );
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      }
    };

    // ========== COVER PAGE ==========
    console.log('[annualCompliancePdf] Rendering cover page...');
    doc.setFillColor(0, 31, 63);
    doc.rect(0, 0, pageWidth, 80, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ANNUAL COMPLIANCE', margin, 35);
    doc.text('REPORT', margin, 55);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 220);
    doc.text('Official Financial Record — AI Trade Journal', margin, 70);

    doc.setFillColor(245, 247, 250);
    doc.rect(0, 80, pageWidth, pageHeight - 80, 'F');

    doc.setTextColor(0, 31, 63);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT IDENTIFICATION', margin, 100);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const coverMetadata: Array<{ label: string; value: string }> = [
      { label: 'Report ID', value: data.metadata.reportId || 'N/A' },
      { label: 'Report Type', value: 'Annual Compliance Report (Official Financial Record)' },
      { label: 'Generated (UTC)', value: format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss') + ' UTC' },
      { label: 'Generated (Local)', value: format(new Date(data.metadata.exportTimestampUTC), 'yyyy-MM-dd HH:mm:ss') + ' (' + (data.metadata.timeZone || 'UTC') + ')' },
      { label: 'Reporting Period Start', value: data.metadata.reportingPeriodStart ? format(new Date(String(data.metadata.reportingPeriodStart)), 'yyyy-MM-dd') : 'N/A' },
      { label: 'Reporting Period End', value: data.metadata.reportingPeriodEnd ? format(new Date(String(data.metadata.reportingPeriodEnd)), 'yyyy-MM-dd') : 'N/A' },
    ];

    let yPos = 115;
    coverMetadata.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, margin + 60, yPos);
      yPos += 7;
    });

    yPos += 5;
    doc.setDrawColor(0, 31, 63);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 31, 63);
    doc.text('DATA INTEGRITY & VERIFICATION', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('This report has been generated from the AI Trade Journal system and contains factual trade data.', margin, yPos);
    yPos += 5;

    const checksumStr: string = data.dataIntegrity?.exportChecksum || 'N/A';
    const recordCountStr: string = String(data.dataIntegrity?.recordCountVerification ?? data.ledger.length);
    const exportVerStr: string = data.metadata.exportVersion || '1.0.0';

    doc.text('SHA-256 Checksum: ' + checksumStr, margin, yPos);
    yPos += 5;
    doc.text('Record Count: ' + recordCountStr, margin, yPos);
    yPos += 5;
    doc.text('Export Version: ' + exportVerStr, margin, yPos);

    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('This document is an official financial record for accounting, auditing, and tax preparation purposes.', margin, yPos);
    yPos += 5;
    doc.text('All data presented is based on recorded trades and system calculations. Verify accuracy independently.', margin, yPos);

    doc.addPage();

    // ========== TABLE OF CONTENTS ==========
    console.log('[annualCompliancePdf] Rendering table of contents...');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('TABLE OF CONTENTS', margin, 30);

    const tocItems = [
      'Account Summary',
      'Trading Activity Ledger',
      'Performance Statistics',
      'Fee Analysis',
      'Strategy Attribution Summary',
      'Audit Trail',
      'Data Integrity Verification'
    ];

    yPos = 45;
    doc.setFontSize(11);
    tocItems.forEach((item, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${idx + 1}.  ${item}`, margin, yPos);
      yPos += 10;
    });

    // ========== SECTION 1: ACCOUNT SUMMARY ==========
    doc.addPage();
    console.log('[annualCompliancePdf] Rendering account summary...');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('1. Account Summary', margin, 30);

    doc.setDrawColor(0, 31, 63);
    doc.setLineWidth(0.3);
    doc.line(margin, 33, pageWidth - margin, 33);

    yPos = 45;
    const accountData: Array<{ label: string; value: string }> = [
      { label: 'Total Trades', value: data.accountSummary.totalTrades.toString() },
      { label: 'Total Volume', value: `$${(data.accountSummary.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Gross Profit', value: `$${(data.accountSummary.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Gross Loss', value: `$${(data.accountSummary.grossLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Net Profit / Loss', value: `$${(data.accountSummary.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Win Rate', value: `${((data.accountSummary.winRate || 0)).toFixed(2)}%` },
      { label: 'Profit Factor', value: data.accountSummary.profitFactor === Infinity ? 'Infinity' : (data.accountSummary.profitFactor || 0).toFixed(2) },
      { label: 'Average Trade', value: `$${(data.accountSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Largest Win', value: `$${(data.accountSummary.largestWin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Largest Loss', value: `$${(data.accountSummary.largestLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];

    accountData.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Color-code P&L
      if (item.label === 'Net Profit / Loss') {
        const netPnl = data.accountSummary.netPnl || 0;
        doc.setTextColor(netPnl >= 0 ? 0 : 200, netPnl >= 0 ? 150 : 0, netPnl >= 0 ? 0 : 0);
      } else if (item.label === 'Gross Profit') {
        doc.setTextColor(0, 120, 0);
      } else if (item.label === 'Gross Loss') {
        doc.setTextColor(200, 0, 0);
      }

      doc.text(item.value, margin + 70, yPos);
      yPos += 7;
    });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // ========== SECTION 2: TRADING LEDGER ==========
    doc.addPage();
    console.log('[annualCompliancePdf] Rendering trading ledger...');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('2. Trading Activity Ledger', margin, 30);

    doc.setDrawColor(0, 31, 63);
    doc.line(margin, 33, pageWidth - margin, 33);

    const ledgerHeaders = [['Trade ID', 'Date/Time', 'Asset', 'Market', 'Type', 'Quantity', 'Entry', 'Exit', 'Gross P&L', 'Fees', 'Net P&L', 'Strategy']];
    const ledgerRows = data.ledger.map(t => [
      t.tradeId || '',
      t.entryDate ? format(new Date(t.entryDate), 'yyyy-MM-dd HH:mm') : '',
      t.assetSymbol || '',
      t.market || '',
      t.positionType || '',
      (t.quantity || 0).toString(),
      `$${(t.entryPrice || 0).toFixed(2)}`,
      `$${(t.exitPrice || 0).toFixed(2)}`,
      `$${(t.grossPnl || 0).toFixed(2)}`,
      `$${(t.fees || 0).toFixed(2)}`,
      `$${(t.netPnl || 0).toFixed(2)}`,
      t.strategyName || '',
    ]);

    autoTable(doc, {
      head: ledgerHeaders,
      body: ledgerRows,
      startY: 40,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [0, 31, 63], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 22 },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
      },
      didParseCell: (cellData: any) => {
        if (cellData.column.index === 8 || cellData.column.index === 10) {
          const val = parseFloat(cellData.cell.raw?.toString().replace('$', '') || '0');
          if (val > 0) {
            cellData.cell.styles.textColor = [0, 128, 0];
          } else if (val < 0) {
            cellData.cell.styles.textColor = [200, 0, 0];
          }
        }
      },
    });

    // ========== SECTION 3: PERFORMANCE STATISTICS ==========
    doc.addPage();
    console.log('[annualCompliancePdf] Rendering performance statistics...');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('3. Performance Statistics', margin, 30);

    doc.setDrawColor(0, 31, 63);
    doc.line(margin, 33, pageWidth - margin, 33);

    yPos = 45;
    const perfStats: Array<{ label: string; value: string }> = [
      { label: 'Total Trades Executed', value: data.accountSummary.totalTrades.toString() },
      { label: 'Win Rate', value: `${(data.accountSummary.winRate || 0).toFixed(2)}%` },
      { label: 'Net Profit / Loss', value: `$${(data.accountSummary.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Profit Factor', value: data.accountSummary.profitFactor === Infinity ? 'Infinity' : (data.accountSummary.profitFactor || 0).toFixed(2) },
      { label: 'Average Trade Return', value: `$${(data.accountSummary.averageTrade || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Largest Winning Trade', value: `$${(data.accountSummary.largestWin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Largest Losing Trade', value: `$${(data.accountSummary.largestLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];

    perfStats.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      const isPnl = item.label.includes('Net Profit') || item.label.includes('Largest');
      if (isPnl) {
        const val = parseFloat(item.value.replace(/[^0-9.-]/g, ''));
        doc.setTextColor(val >= 0 ? 0 : 200, val >= 0 ? 150 : 0, 0);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(item.value, margin + 80, yPos);
      yPos += 7;
    });

    // ========== SECTION 4: FEE ANALYSIS ==========
    console.log('[annualCompliancePdf] Rendering fee analysis...');
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('4. Fee Analysis', margin, yPos);
    yPos += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

    const feeData: Array<{ label: string; value: string }> = [
      { label: 'Broker Fees', value: `$${(data.feeAnalysis.brokerFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Platform Fees', value: `$${(data.feeAnalysis.platformFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Other Costs', value: `$${(data.feeAnalysis.otherCosts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Total Costs', value: `$${(data.feeAnalysis.totalCosts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];

    feeData.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, margin + 60, yPos);
      yPos += 7;
    });

    // ========== SECTION 5: STRATEGY SUMMARY ==========
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('5. Strategy Attribution Summary', margin, yPos);
    yPos += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

    if (data.strategies && data.strategies.length > 0) {
      console.log('[annualCompliancePdf] Rendering strategy summary...');
      const stratHeaders = [['Strategy', 'Trades', 'Win Rate', 'Gross Profit', 'Gross Loss', 'Net P&L']];
      const stratRows = data.strategies.map(s => [
        s.strategyName || '',
        (s.tradeCount || 0).toString(),
        `${(s.winRate || 0).toFixed(2)}%`,
        `$${(s.grossProfit || 0).toFixed(2)}`,
        `$${(s.grossLoss || 0).toFixed(2)}`,
        `$${(s.netPnl || 0).toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: stratHeaders,
        body: stratRows,
        startY: yPos + 5,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [0, 31, 63], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
        didParseCell: (cellData: any) => {
          if (cellData.column.index === 5) {
            const val = parseFloat(cellData.cell.raw?.toString().replace('$', '') || '0');
            cellData.cell.styles.textColor = val >= 0 ? [0, 128, 0] : [200, 0, 0];
          }
        },
      });
    } else {
      console.log('[annualCompliancePdf] No strategy data to render');
    }

    // ========== SECTION 6: AUDIT TRAIL ==========
    doc.addPage();
    console.log('[annualCompliancePdf] Rendering audit trail...');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('6. Audit Trail', margin, 30);

    doc.setDrawColor(0, 31, 63);
    doc.line(margin, 33, pageWidth - margin, 33);

    yPos = 45;
    const auditData: Array<{ label: string; value: string }> = [
      { label: 'Record Creation', value: data.auditTrail.recordCreationTimestamp ? format(new Date(data.auditTrail.recordCreationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Last Modification', value: data.auditTrail.recordModificationTimestamp ? format(new Date(data.auditTrail.recordModificationTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Data Source', value: data.auditTrail.dataSource || 'N/A' },
      { label: 'Export Timestamp', value: data.auditTrail.exportTimestamp ? format(new Date(data.auditTrail.exportTimestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
      { label: 'Export Version', value: data.auditTrail.exportVersion || 'N/A' },
      { label: 'App Name', value: data.metadata.appName || 'AI Trade Journal' },
      { label: 'User ID', value: data.metadata.userId || 'N/A' },
      { label: 'Account ID', value: data.metadata.accountId || 'N/A' },
      { label: 'Time Zone', value: data.metadata.timeZone || 'UTC' },
    ];

    auditData.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, margin + 55, yPos);
      yPos += 7;
    });

    // ========== SECTION 7: DATA INTEGRITY ==========
    console.log('[annualCompliancePdf] Rendering data integrity...');
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 31, 63);
    doc.text('7. Data Integrity Verification', margin, yPos);

    doc.setDrawColor(0, 31, 63);
    doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('This report includes cryptographic verification to ensure data integrity:', margin, yPos);
    yPos += 8;

    const integrityData: Array<{ label: string; value: string }> = [
      { label: 'SHA-256 Checksum', value: checksumStr },
      { label: 'Record Count Verification', value: recordCountStr },
      { label: 'Export Version', value: exportVerStr },
    ];

    integrityData.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(item.label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Wrap long checksum
      if (item.value.length > 60) {
        doc.text(item.value.substring(0, 60), margin + 55, yPos);
        yPos += 5;
        doc.text(item.value.substring(60), margin + 55, yPos);
      } else {
        doc.text(item.value, margin + 55, yPos);
      }
      yPos += 7;
    });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('End of Report — This document is an official financial record generated by AI Trade Journal.', margin, yPos);
    yPos += 5;
    doc.text('The data presented is based on recorded trading activity and system calculations.', margin, yPos);
    yPos += 5;
    doc.text('Verify all figures independently. This is not legal advice or a guarantee of future performance.', margin, yPos);

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