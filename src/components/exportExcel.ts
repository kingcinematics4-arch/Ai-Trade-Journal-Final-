import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { generateProfessionalExcelWorkbook } from '@/lib/exportExcel';

/**
 * Professional Excel Export UI Component.
 * Triggers the standardized generation logic from the library.
 */
export async function exportProfessionalExcel(
  trades: any[] = [],
  tasks: any[] = [],
  goals: any[] = [],
  fileName: string = 'TradingJournal',
  context: any = {}
): Promise<boolean> {
  try {
    const workbook = await generateProfessionalExcelWorkbook(trades, tasks, goals, context);
    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${fileName}_${dateStr}.xlsx`);
    return true;
  } catch (error) {
    console.error('[exportProfessionalExcel] Error:', error);
    return false;
  }
}