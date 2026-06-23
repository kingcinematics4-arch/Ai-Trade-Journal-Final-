import { exportProfessionalExcel } from '@/lib/exportExcel';
import { exportProfessionalPdf } from '@/lib/exportPdf';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { exportProfessionalCsv } from '@/lib/exportCsv';
import { exportProfessionalJson } from '@/lib/exportJson';
import { exportProfessionalTxt } from '@/lib/exportTxt';

export interface ExportOptions {
  fileName: string;
  format: 'xlsx' | 'pdf' | 'csv' | 'json' | 'md' | 'txt' | 'compliance_report';
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

  if (exportFormat === 'csv') {
    return await exportProfessionalCsv(data, fileName, context);
  }

  if (exportFormat === 'json') {
    return await exportProfessionalJson(data, fileName, context);
  }

  if (exportFormat === 'txt') {
    return await exportProfessionalTxt(data, fileName, context);
  }

  if (exportFormat === 'compliance_report') {
    const { exportData } = await import('@/app/exports/exportEngine');
    return await exportData(data, { fileName, format: 'compliance_report', complianceFormat: 'pdf' });
  }

  // Fallback for md and unsupported
  if (exportFormat === 'md') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/markdown' });
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyyMMdd')}.md`);
    return true;
  }

  console.warn(`Export format ${exportFormat} is not fully supported yet.`);
  return false;
}