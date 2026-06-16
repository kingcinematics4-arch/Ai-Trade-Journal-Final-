import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, startOfWeek, startOfMonth, getWeek } from 'date-fns';

/**
 * Utility to recursively flatten nested objects and format values for Excel.
 * Ensures each record remains exactly one row with readable primitive properties.
 */
function flattenAndFormat(item: any): any {
  const result: any = {};

  function walk(obj: any, prefix = ''): void {
    if (obj === null || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'boolean') {
        result[newKey] = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        result[newKey] = format(value, 'yyyy-MM-dd HH:mm:ss'); // Consistent date format
      } else if (Array.isArray(value)) {
        // Convert arrays to readable comma-separated strings
        result[newKey] = value
          .map(v => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)))
          .join(', ');
      } else if (typeof value === 'object') {
        // Recursively flatten nested objects (strategy, goal, etc)
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
function addProfessionalDataSheet(
  workbook: ExcelJS.Workbook, 
  sheetName: string, 
  data: any[],
  isTradesSheet = false
): void {
  if (!data || data.length === 0) return;

  // Sort data by date if it's the trades sheet
  let processedData = data.map(item => flattenAndFormat(item));
  if (isTradesSheet) {
    processedData.sort((a, b) => new Date(a.trade_date || a.date || 0).getTime() - new Date(b.trade_date || b.date || 0).getTime());
  }

  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Detect all unique keys across the dataset for dynamic columns
  const allKeys = Array.from(new Set(processedData.flatMap(Object.keys)));

  if (isTradesSheet) {
    console.log('--- EXCEL EXPORT DEBUG: DISCOVERED TRADE FIELDS ---');
    console.log('Detected properties across all trade records:', allKeys);
    console.log(`Total unique columns to be generated: ${allKeys.length}`);
    console.log('--------------------------------------------------');
  }

  // 2a. Determine Column Order
  const priorityKeys = isTradesSheet ? [
    'trade_date', 'trade_time', 'id', 'asset_name', 'symbol', 'market', 'exchange', 'asset_type', 
    'side', 'trade_direction', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 
    'position_size', 'quantity', 'leverage', 'risk_amount', 'reward_amount', 'rr_ratio',
    'fees', 'commission', 'spread', 'slippage', 'gross_pnl', 'net_pnl', 'pnl_amount', 'pnl_percent',
    'strategy_used', 'strategy.name', 'strategy.category', 'setup', 'tags', 'confidence_level', 
    'execution_rating', 'psychology_rating', 'emotion_before', 'emotion_after', 'mistakes', 
    'lessons_learned', 'goal_id', 'goal.title', 'goal.status', 'task_id', 'task.title', 'task.status', 
    'notes', 'session', 'duration', 'screenshot_url', 'created_at', 'updated_at'
  ] : [];

  const remainingKeys = allKeys.filter(k => !priorityKeys.includes(k));
  const finalKeys = [...priorityKeys.filter(k => allKeys.includes(k)), ...remainingKeys];

  // 2. Define Columns with clean headers
  worksheet.columns = finalKeys.map(key => ({
    header: key.replace(/[._]/g, ' ').replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
    key: key,
    width: 20
  }));

  const colors = {
    headerBg: '0F172A', // Slate 900
    headerText: 'FFFFFF',
    alternateRow: 'F8FAFC',
    profit: '10B981', // Emerald 500
    loss: 'EF4444', // Red 500
    separator: 'F1F5F9',
    border: 'E2E8F0' // Slate 200
  };

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: colors.headerText }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { bottom: { style: 'thin', color: { argb: colors.border } } }
  };

  // 4. Populate Rows with Month Separators
  let currentMonthStr = '';
  processedData.forEach(rowData => {
    if (isTradesSheet && rowData.trade_date) {
      const date = new Date(rowData.trade_date);
      const monthStr = format(date, 'MMMM yyyy').toUpperCase();
      
      if (monthStr !== currentMonthStr) {
        const separatorRow = worksheet.addRow({ trade_date: `----- ${monthStr} -----` });
        worksheet.mergeCells(separatorRow.number, 1, separatorRow.number, worksheet.columns.length); // Merge across all columns
        
        separatorRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.separator } };
          cell.font = { bold: true, color: { argb: '64748B' }, size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        
        currentMonthStr = monthStr;
      }
    }

    const newRow = worksheet.addRow(rowData);
    
    // Conditional formatting for P&L columns on insertion
    const pnl = parseFloat(rowData.pnl_amount);
    const pnlCell = newRow.getCell('pnl_amount'); // Get P&L cell
    if (!isNaN(pnl)) pnlCell.font = { color: { argb: pnl >= 0 ? colors.profit : colors.loss }, bold: true };
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
      const firstCellVal = row.getCell(1).value?.toString();
      if (rowNumber % 2 === 0 && !firstCellVal?.startsWith('---')) {
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
            cell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00'; // Corrected negative currency format
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
        if (len > maxLen) maxLen = len; // Update max length
      }
    });
    column.width = Math.min(Math.max(12, maxLen + 3), 60);
  });
}

/**
 * Generates summary statistics grouped by timeframe
 */
function addSummarySheet(
  workbook: ExcelJS.Workbook, 
  name: string, 
  trades: any[], 
  tasks: any[], 
  goals: any[], 
  type: 'weekly' | 'monthly'
): void {
  const worksheet = workbook.addWorksheet(name);
  const groupedData: Record<string, any> = {};

  trades.forEach(t => {
    const date = new Date(t.trade_date || t.date || 0); // Handle potentially missing date
    const key = type === 'weekly' ? format(startOfWeek(date), 'yyyy-MM-dd') : format(startOfMonth(date), 'MMM yyyy');
    
    if (!groupedData[key]) {
      groupedData[key] = {
        period: key, trades: 0, wins: 0, losses: 0, profit: 0, loss: 0, maxProfit: -Infinity, minProfit: Infinity,
        strategies: {} as Record<string, number>, assets: {} as Record<string, number>
      };
    }
    
    const stats = groupedData[key];
    const pnl = parseFloat(t.pnl_amount || 0); // Ensure pnl_amount is a number
    stats.trades++;
    if (pnl > 0) { stats.wins++; stats.profit += pnl; } else if (pnl < 0) { stats.losses++; stats.loss += Math.abs(pnl); }
    stats.maxProfit = Math.max(stats.maxProfit, pnl);
    stats.minProfit = Math.min(stats.minProfit, pnl);
    
    if (t.strategy_used) stats.strategies[t.strategy_used] = (stats.strategies[t.strategy_used] || 0) + 1;
    if (t.asset_name) stats.assets[t.asset_name] = (stats.assets[t.asset_name] || 0) + 1;
  });

  const rows = Object.values(groupedData).map(s => {
    const winRate = s.trades > 0 ? (s.wins / s.trades) * 100 : 0;
    const mostUsedStrategy = Object.entries(s.strategies).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
    const mostTradedAsset = Object.entries(s.assets).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return {
      [type === 'weekly' ? 'WEEK START' : 'MONTH']: s.period,
      'TOTAL TRADES': s.trades,
      'WINS': s.wins,
      'LOSSES': s.losses,
      'WIN RATE': winRate,
      'TOTAL PROFIT': s.profit,
      'TOTAL LOSS': s.loss,
      'NET P&L': s.profit - s.loss,
      'AVG WIN': s.wins > 0 ? s.profit / s.wins : 0,
      'AVG LOSS': s.losses > 0 ? s.loss / s.losses : 0,
      'BEST TRADE': s.maxProfit === -Infinity ? 0 : s.maxProfit,
      'WORST TRADE': s.minProfit === Infinity ? 0 : s.minProfit,
      'TOP STRATEGY': mostUsedStrategy,
      'TOP ASSET': mostTradedAsset
    };
  });

  if (rows.length === 0) return;
  
  worksheet.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k, width: 18 }));
  worksheet.addRows(rows); // Add all summary rows
  
  // Styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const pnl = row.getCell('NET P&L');
      const val = parseFloat(pnl.value?.toString() || '0'); // Parse P&L value
      pnl.font = { bold: true, color: { argb: val >= 0 ? '10B981' : 'EF4444' } };
      pnl.numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
      row.getCell('WIN RATE').numFmt = '0.0"%"';
      row.alignment = { horizontal: 'center' };
    }
  });
  
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

function addDashboardSheet(workbook: ExcelJS.Workbook, trades: any[], tasks: any[], goals: any[]): void {
  const ws = workbook.addWorksheet('Dashboard');
  ws.columns = [{ width: 30 }, { width: 25 }];
  
  const totalPnL = trades.reduce((acc, t) => acc + (parseFloat(t.pnl_amount || 0)), 0);
  const winRate = trades.length > 0 ? (trades.filter(t => (parseFloat(t.pnl_amount || 0)) > 0).length / trades.length) * 100 : 0;
  const totalProfit = trades.reduce((acc, t) => acc + Math.max(0, parseFloat(t.pnl_amount || 0)), 0);
  const totalLoss = trades.reduce((acc, t) => acc + Math.abs(Math.min(0, parseFloat(t.pnl_amount || 0))), 0);

  ws.addRows([
    ['HEDGE FUND PERFORMANCE REPORT'],
    ['Generated On', format(new Date(), 'yyyy-MM-dd HH:mm')],
    [],
    ['KEY PERFORMANCE INDICATORS', 'VALUE'],
    ['Net Cumulative P&L', totalPnL],
    ['Gross Profits', totalProfit],
    ['Gross Losses', totalLoss],
    ['Win Rate Percentage', winRate / 100],
    ['Total Executed Trades', trades.length],
    [],
    ['DISCIPLINE & UTILITY', 'COUNT'],
    ['Active Performance Goals', goals.filter(g => g.status !== 'completed').length],
    ['Completed Goals', goals.filter(g => g.status === 'completed').length], // Filter completed goals
    ['Pending Tasks', tasks.filter(t => !t.completed).length], // Filter pending tasks
    ['Completed Tasks', tasks.filter(t => t.completed).length], // Filter completed tasks
  ]);

  // Styling
  ws.getCell('A1').font = { size: 16, bold: true, color: { argb: '1E293B' } };
  ws.getRow(4).font = { bold: true };
  ws.getRow(4).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } });
  ws.getRow(11).font = { bold: true };
  ws.getRow(11).eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } });

  const pnlCell = ws.getCell('B5');
  pnlCell.numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';
  pnlCell.font = { bold: true, color: { argb: totalPnL >= 0 ? '10B981' : 'EF4444' } };
  
  ws.getCell('B8').numFmt = '0.0%';
  
  ws.getColumn(1).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getColumn(2).alignment = { horizontal: 'right', vertical: 'middle' };

  // Formatting border for "tables"
  [4, 11].forEach(rowIdx => {
    const row = ws.getRow(rowIdx);
    row.border = { bottom: { style: 'thin' } };
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

  const dataMap: Record<string, any[]> = {
    'Dashboard': [], // Placeholder for ordering, will be handled separately
    'Trades': trades,
    'Weekly Summary': [], // Placeholder for ordering
    'Monthly Summary': [], // Placeholder for ordering
    'Goals': goals,
    'Tasks': tasks,
    'Calendar': context.calendarEvents || [],
    'Journal': context.journalEntries || [],
    'Performance': context.performanceData || [],
    'Psychology': context.psychologyLogs || [],
    'Risk Management': context.riskData || [],
    'Strategies': context.strategyData || [], // Ensure strategies are included
    'Notes': context.notes || [],
  };

  // Define the desired sheet order
  const sheetOrder = [
    'Dashboard', 'Trades', 'Weekly Summary', 'Monthly Summary', 'Goals', 'Tasks', 'Calendar',
    'Journal', 'Performance', 'Psychology', 'Risk Management', 'Strategies', 'Notes'
  ];

  // Iterate and create sheets in the specified order, ONLY if data exists for that module
  sheetOrder.forEach(name => {
    const data = dataMap[name];
    if (data && data.length > 0) {
      if (name === 'Dashboard') {
        addDashboardSheet(workbook, trades, tasks, goals);
      } else if (name === 'Weekly Summary') {
        addSummarySheet(workbook, name, trades, tasks, goals, 'weekly');
      } else if (name === 'Monthly Summary') {
        addSummarySheet(workbook, name, trades, tasks, goals, 'monthly');
      } else {
        addProfessionalDataSheet(workbook, name, data, name === 'Trades');
      }
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
  context: Record<string, any> = {},
  exportMode: 'single' | 'separate' = 'single' // Added exportMode parameter
): Promise<boolean> {
  try {
    const dateStr = format(new Date(), 'yyyy_MM_dd');
    
    if (exportMode === 'single') {
      const workbook = await generateProfessionalExcelWorkbook(trades, tasks, goals, context);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}_Export_${dateStr}.xlsx`);
    } else {
      // Separate Files Logic
      const saveWb = async (wb: ExcelJS.Workbook, suffix: string, dataExists: boolean = true) => {
        if (!dataExists) return; // Only save if data exists for the sheet
        const buf = await wb.xlsx.writeBuffer();
        const b = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(b, `${fileName}_${suffix}_${dateStr}.xlsx`);
      };

      // 1. Dashboard
      if (trades.length > 0 || tasks.length > 0 || goals.length > 0) {
        const dashWb = new ExcelJS.Workbook();
        addDashboardSheet(dashWb, trades, tasks, goals);
        await saveWb(dashWb, 'Dashboard', true);
      }

      // 2. Trades & Summaries
      if (trades && trades.length > 0) {
        const tradesWb = new ExcelJS.Workbook(); // Create new workbook for Trades
        addProfessionalDataSheet(tradesWb, 'Trades', trades, true); // Add Trades sheet
        await saveWb(tradesWb, 'Trades', true); // Save Trades workbook

        const weeklyWb = new ExcelJS.Workbook(); // Create new workbook for Weekly Summary
        addSummarySheet(weeklyWb, 'Weekly_Summary', trades, tasks, goals, 'weekly'); // Add Weekly Summary sheet
        await saveWb(weeklyWb, 'Weekly_Summary', true); // Save Weekly Summary workbook

        const monthlyWb = new ExcelJS.Workbook(); // Create new workbook for Monthly Summary
        addSummarySheet(monthlyWb, 'Monthly_Summary', trades, tasks, goals, 'monthly'); // Add Monthly Summary sheet
        await saveWb(monthlyWb, 'Monthly_Summary', true); // Save Monthly Summary workbook
      }

      // 3. Data Modules
      const dataMap: Record<string, any[]> = {
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

      for (const [name, data] of Object.entries(dataMap)) {
        if (data && data.length > 0) {
          const wb = new ExcelJS.Workbook(); // Create new workbook for each module
          addProfessionalDataSheet(wb, name, data, name === 'Trades'); // Add module data
          await saveWb(wb, name.replace(/\s+/g, '_'), true); // Save module workbook
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[exportProfessionalExcel] Error generating workbook:', error);
    return false;
  }
}