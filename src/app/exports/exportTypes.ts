export interface ExportOptions {
  fileName: string;
  format: string;
  selectedFields?: string[];
  includeHeaders?: boolean;
  prettyPrint?: boolean;
  exportMode?: 'single' | 'separate';
}

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'txt' | 'zip';