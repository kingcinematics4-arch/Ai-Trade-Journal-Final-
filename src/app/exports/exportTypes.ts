export type PdfReportType = 'standard' | 'detailed';

export interface ExportOptions {
  fileName: string;
  format: string;
  selectedFields?: string[];
  includeHeaders?: boolean;
  prettyPrint?: boolean;
  exportMode?: 'single' | 'separate';
  /** PDF only — defaults to standard compact report */
  pdfReportType?: PdfReportType;
}

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'txt' | 'zip';