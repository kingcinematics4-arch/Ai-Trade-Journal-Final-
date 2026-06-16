import jsPDF from 'jspdf';
import { resolveExportColumns } from '@/lib/export/exportFields';
import { PDF_LAYOUT } from './theme';
import { PdfDocumentContext } from './PdfDocumentContext';
import {
  buildSummaryMetrics,
  computeReportDateRange,
  getReportAnalytics,
} from './pdfAnalytics';
import { drawReportHeader, drawSectionHeader, drawSummaryCardGrid } from './pdfSummaryCards';
import { drawTradeCardLayout } from './pdfTradeCard';
import { drawTradeTableLayout } from './pdfTableLayout';

export interface PDFReportOptions {
  fileName?: string;
  selectedFields?: string[];
}

export function buildPremiumTradingReport(
  data: Record<string, unknown>[],
  options: PDFReportOptions = {},
): jsPDF {
  const columns = resolveExportColumns(data, options.selectedFields);
  if (!columns.length) {
    throw new Error('No export fields available for PDF report');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
  const ctx = new PdfDocumentContext(doc);
  const analytics = getReportAnalytics(data);
  const dateRange = computeReportDateRange(data);
  const metrics = buildSummaryMetrics(analytics);

  drawReportHeader(ctx, {
    dateRangeLabel: dateRange.label,
    fieldCount: columns.length,
    tradeCount: data.length,
  });
  drawSummaryCardGrid(ctx, metrics);

  ctx.addPage('Trade Details');
  const layoutMode = columns.length <= PDF_LAYOUT.maxTableColumns ? 'table' : 'cards';
  drawSectionHeader(
    ctx,
    'Trade Details',
    layoutMode === 'table'
      ? 'Table view for selected export fields'
      : 'Card view — optimized for readability with many fields',
  );

  if (layoutMode === 'table') {
    drawTradeTableLayout(ctx, data, columns);
  } else {
    drawTradeCardLayout(ctx, data, columns);
  }

  return doc;
}

export function exportPremiumTradingReport(
  data: Record<string, unknown>[],
  options: PDFReportOptions = {},
): void {
  if (!data?.length) return;
  const fileName = (options.fileName ?? 'Trade_Report').replace(/\s+/g, '_');
  const doc = buildPremiumTradingReport(data, options);
  doc.save(`${fileName}.pdf`);
}
