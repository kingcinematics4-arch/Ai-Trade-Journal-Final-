import jsPDF from 'jspdf';
import { resolveExportColumns, type PdfReportType } from '@/lib/export/exportFields';
import { PDF_LAYOUT } from './theme';
import { PdfDocumentContext } from './PdfDocumentContext';
import {
  buildDetailedSummaryMetrics,
  buildStandardSummaryMetrics,
  getReportAnalytics,
} from './pdfAnalytics';
import { buildBrandedPdfFileName, resolveReportIdentity } from './pdfReportIdentity';
import { drawReportHeader, drawSectionHeader, drawSummaryCardGrid } from './pdfSummaryCards';
import { drawStandardTradeTable } from './pdfStandardTable';
import { drawTradeCardLayout } from './pdfTradeCard';
import { drawTradeTableLayout } from './pdfTableLayout';

export type { PdfReportType };
export interface PDFReportOptions {
  fileName?: string;
  selectedFields?: string[];
  pdfReportType?: PdfReportType;
}

function drawBrandedHeader(
  ctx: PdfDocumentContext,
  data: Record<string, unknown>[],
  meta: { fieldCount: number; reportLabel?: string },
): ReturnType<typeof resolveReportIdentity> {
  const identity = resolveReportIdentity(data);
  drawReportHeader(ctx, identity, {
    tradeCount: data.length,
    fieldCount: meta.fieldCount,
    reportLabel: meta.reportLabel,
  });
  return identity;
}

function buildStandardReport(data: Record<string, unknown>[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
  const ctx = new PdfDocumentContext(doc);
  const analytics = getReportAnalytics(data);

  drawBrandedHeader(ctx, data, { fieldCount: 6, reportLabel: 'Standard Report' });
  drawSummaryCardGrid(ctx, buildStandardSummaryMetrics(analytics));

  drawSectionHeader(ctx, 'Trade Log', 'Compact overview — optimized for quick review');
  drawStandardTradeTable(ctx, data);

  return doc;
}

function buildDetailedReport(
  data: Record<string, unknown>[],
  options: PDFReportOptions,
): jsPDF {
  const columns = resolveExportColumns(data, options.selectedFields);
  if (!columns.length) {
    throw new Error('No export fields available for PDF report');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
  const ctx = new PdfDocumentContext(doc);
  const analytics = getReportAnalytics(data);

  drawBrandedHeader(ctx, data, { fieldCount: columns.length, reportLabel: 'Detailed Report' });
  drawSummaryCardGrid(ctx, buildDetailedSummaryMetrics(analytics));

  ctx.addPage('Trade Details');
  const layoutMode = columns.length <= PDF_LAYOUT.maxTableColumns ? 'table' : 'cards';
  drawSectionHeader(
    ctx,
    'Trade Details',
    layoutMode === 'table'
      ? 'All selected export fields'
      : 'Card view — optimized for readability with many fields',
  );

  if (layoutMode === 'table') {
    drawTradeTableLayout(ctx, data, columns);
  } else {
    drawTradeCardLayout(ctx, data, columns);
  }

  return doc;
}

export function buildPremiumTradingReport(
  data: Record<string, unknown>[],
  options: PDFReportOptions = {},
): jsPDF {
  const reportType = options.pdfReportType ?? 'standard';
  if (reportType === 'standard') {
    return buildStandardReport(data);
  }
  return buildDetailedReport(data, options);
}

export function exportPremiumTradingReport(
  data: Record<string, unknown>[],
  options: PDFReportOptions = {},
): void {
  if (!data?.length) return;

  const identity = resolveReportIdentity(data);
  const brandedName = buildBrandedPdfFileName(identity);
  const doc = buildPremiumTradingReport(data, options);
  doc.save(`${brandedName}.pdf`);
}

/** Resolve branded filename without generating the PDF */
export function resolveBrandedPdfFileName(data: Record<string, unknown>[]): string {
  return buildBrandedPdfFileName(resolveReportIdentity(data));
}
