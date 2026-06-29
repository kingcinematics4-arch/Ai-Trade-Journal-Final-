import {
  exportPremiumTradingReport,
  type PDFReportOptions,
} from '@/lib/export/pdf/pdfReportBuilder';

export type { PDFReportOptions as PDFExportOptions };

/**
 * Generates a premium trading performance PDF report.
 * Uses the same export field selection as Excel (via selectedFields).
 */
export function exportPDF(
  data: any[],
  fileNameOrOptions: string | PDFReportOptions = 'Trade_Report',
  options?: PDFReportOptions
): void {
  if (!data?.length) return;

  const resolved: PDFReportOptions =
    typeof fileNameOrOptions === 'object' && fileNameOrOptions !== null
      ? fileNameOrOptions
      : {
          fileName: typeof fileNameOrOptions === 'string' ? fileNameOrOptions : 'Trade_Report',
          selectedFields: options?.selectedFields,
          pdfReportType: options?.pdfReportType,
        };

  if (!resolved.pdfReportType) {
    resolved.pdfReportType = 'standard';
  }

  exportPremiumTradingReport(data as Record<string, unknown>[], resolved);
}
