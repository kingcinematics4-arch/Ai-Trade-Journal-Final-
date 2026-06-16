import { exportProfessionalExcel } from '@/lib/exportExcel';
import { exportProfessionalPdf } from '@/lib/exportPdf';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface ExportOptions {
  fileName: string;
  format: 'xlsx' | 'pdf' | 'csv' | 'json' | 'md' | 'zip' | 'txt';
  selectedFields?: string[];
  exportMode?: 'single' | 'separate';
  pdfReportType?: 'standard' | 'detailed';
}

/**
 * Core Export Dispatcher
 */
export async function exportData(
  data: any[],
  options: ExportOptions,
  context: { tasks: any[]; goals: any[] } = { tasks: [], goals: [] }
): Promise<boolean> {
  const { format: exportFormat, fileName } = options;

  if (exportFormat === 'xlsx') {
    return await exportProfessionalExcel(
      data, 
      context.tasks, 
      context.goals, 
      fileName, 
      {}, 
      options.exportMode || 'single'
    );
  }

  if (exportFormat === 'pdf') {
    return await exportProfessionalPdf(data, fileName, { 
      pdfReportType: options.pdfReportType 
    });
  }

  // Fallback for raw formats
  if (exportFormat === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyyMMdd')}.json`);
    return true;
  }

  // Note: CSV and other formats would be implemented here
  console.warn(`Export format ${exportFormat} is partially supported in this engine version.`);
  return false;
}