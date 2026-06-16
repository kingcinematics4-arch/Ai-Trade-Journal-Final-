export { PDF_THEME, PDF_LAYOUT, PERIOD_BADGE_COLORS } from './theme';
export { PdfDocumentContext } from './PdfDocumentContext';
export { buildPremiumTradingReport, exportPremiumTradingReport, resolveBrandedPdfFileName } from './pdfReportBuilder';
export type { PDFReportOptions } from './pdfReportBuilder';
export { drawSummaryCard, drawSummaryCardGrid, drawReportHeader } from './pdfSummaryCards';
export { drawTradeCard, drawTradeCardLayout } from './pdfTradeCard';
export { drawTradeTableLayout } from './pdfTableLayout';
export { drawStandardTradeTable } from './pdfStandardTable';
export {
  resolveReportIdentity,
  buildBrandedPdfFileName,
  type ReportPeriodIdentity,
  type ReportPeriodKind,
} from './pdfReportIdentity';
export { buildStandardSummaryMetrics, buildDetailedSummaryMetrics, buildSummaryMetrics, computeReportDateRange, getReportAnalytics } from './pdfAnalytics';
