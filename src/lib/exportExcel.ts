import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

/**
 * Utility to recursively flatten nested objects and format values for Excel.
 * Ensures each record remains exactly one row with readable primitive properties.
 */
function flattenAndFormat(item: any): any {
  const result: any = {};

  function walk(obj: any, prefix = ''): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'boolean') {
        result[newKey] = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        result[newKey] = format(value, 'yyyy-MM-dd HH:mm:ss');
      } else if (Array.isArray(value)) {
        // Handle arrays (e.g., tags, images) as comma-separated text
        result[newKey] = value.map(v => (v && typeof v === 'object' ? JSON.stringify(v) : v)).join(', ');
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        const keys = Object.keys(value);
        if (keys.length === 0) {
          result[newKey] = '{}';
        } else {
          walk(value, newKey);
        }
      } else {
        result[newKey] = value;
      }
    });
  }

  walk(item);
  return result;
}

/**
 * Helper to build a dynamic, professional data sheet from any dataset.
 */
function addProfessionalDataSheet(workbook: ExcelJS.Workbook, sheetName: string, data: any[]): void {
  if (!data || data.length === 0) return;

  // Process and flatten data
  const flattenedData = data.map(item => flattenAndFormat(item));
  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Detect all unique keys across the dataset for dynamic columns
  const allKeys = Array.from(new Set(flattenedData.flatMap(Object.keys)));
  
  // 2. Define Columns with clean headers
  worksheet.columns = allKeys.map(key => ({
    header: key.replace(/[._]/g, ' ').replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
    key: key,
    width: 20
  }));

  // 3. Styling Constants
  const colors = {
    headerBg: '0F172A', // Slate 900
    headerText: 'FFFFFF',
    alternateRow: 'F8FAFC',
    border: 'E2E8F0',
    profit: '10B981', // Emerald 500
    loss: 'EF4444'    // Red 500
  };

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: colors.headerText }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { bottom: { style: 'thin', color: { argb: colors.border } } }
  };

  // 4. Populate Rows
  flattenedData.forEach(row => {
    worksheet.addRow(row);
  });

  // 5. Apply Professional Sheet Formatting
  worksheet.getRow(1).height = 32;
  worksheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

  // Freeze Headers
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Enable Column Filters
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  };

  // Alternate Row Colors & Intelligent Cell Formatting
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      if (rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.alternateRow } };
      }
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.height = 24;

      row.eachCell((cell, colNumber) => {
        const header = (worksheet.getColumn(colNumber).header as string) || '';
        const val = cell.value;

        if (typeof val === 'number') {
          // Apply Currency/Numeric formatting based on field detection
          if (header.match(/PNL|PROFIT|AMOUNT|PRICE|LOSS|COST|VALUE|RISK|EQUITY/)) {
            cell.numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
            if (header.match(/PNL|PROFIT|LOSS/)) {
              cell.font = { bold: true, color: { argb: val >= 0 ? colors.profit : colors.loss } };
            }
          } else if (header.match(/RATE|PROGRESS|%|PERCENT/)) {
            cell.numFmt = '0.00"%"';
          }
        } else if (typeof val === 'string') {
          // Semantic status coloring
          const upper = val.toUpperCase();
          if (['WIN', 'COMPLETED', 'SUCCESS', 'ACTIVE'].includes(upper)) {
            cell.font = { color: { argb: colors.profit }, bold: true };
          } else if (['LOSS', 'FAILED', 'HIGH'].includes(upper)) {
            cell.font = { color: { argb: colors.loss }, bold: true };
          }
        }
      });
    }
  });

  // 6. Dynamic Auto-Sizer
  worksheet.columns.forEach(column => {
    let maxLen = column.header ? column.header.toString().length : 10;
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const val = row.getCell(column.key!).value;
      if (val) {
        const len = val.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    column.width = Math.min(Math.max(12, maxLen + 3), 60);
  });
}

/**
 * Internal engine to build the Excel Workbook with professional styling.
 */
export async function generateProfessionalExcelWorkbook(
  trades: any[] = [],
  tasks: any[] = [],
  goals: any[] = [],
  context: Record<string, any> = {}
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AITrade Intelligence';
  workbook.created = new Date();

  // Map of Sheet Names to their corresponding data arrays
  const dataMap: Record<string, any[]> = {
    'Trades': trades,
    'Goals': goals,
    'Tasks': tasks,
    'Calendar': context.calendarEvents || [],
    'Journal': context.journalEntries || [],
    'Performance': context.performanceData || [],
    'Psychology': context.psychologyLogs || [],
    'Risk Management': context.riskData || [],
    'Strategies': context.strategyData || [],
    'Notes': context.notes || [],
  };

  // Iterate and create sheets ONLY if data exists for that module
  Object.entries(dataMap).forEach(([name, data]) => {
    if (data && data.length > 0) {
      addProfessionalDataSheet(workbook, name, data);
    }
  });

  return workbook;
}

/**
 * Generates and triggers a download of the professional Excel report.
 */
export async function exportProfessionalExcel(
  trades: any[] = [],
  tasks: any[] = [],
  goals: any[] = [],
  fileName: string = 'TradingJournal',
  context: Record<string, any> = {}
): Promise<boolean> {
  try {
    const workbook = await generateProfessionalExcelWorkbook(trades, tasks, goals, context);
    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}_${dateStr}.xlsx`);
    return true;
  } catch (error) {
    console.error('[exportProfessionalExcel] Error generating workbook:', error);
    return false;
  }
}