import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { generateProfessionalExcelWorkbook, exportProfessionalExcel as libExport } from '@/lib/exportExcel';

/**
 * Professional Excel Export UI Component.
 * Triggers the standardized generation logic from the library.
 */
export async function exportProfessionalExcel(
  trades: any[] = [],
  tasks: any[] = [],
  goals: any[] = [],
  fileName: string = 'TradingJournal',
  context: any = {},
  exportMode: 'single' | 'separate' = 'single' // Added exportMode parameter
): Promise<boolean> {
  // Centralize logic by delegating to lib implementation
  return libExport(trades, tasks, goals, fileName, context, exportMode);
}