import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { getTradePnL, normalizeStatus } from '@/lib/trades/analytics';

/**
 * Internal engine to build the Excel Workbook with professional styling.
 */
export async function generateProfessionalExcelWorkbook(
  trades: any[] = [],
  tasks: any[] = [],
  goals: any[] = []
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AITrade Intelligence';
  workbook.lastModifiedBy = 'AITrade Engine';
  workbook.created = new Date();

  // --- STYLING CONSTANTS ---
  const colors = {
    headerBg: '0F172A', // Slate 900
    headerText: 'FFFFFF',
    profit: '10B981', // Emerald 500
    loss: 'EF4444',   // Red 500
    pending: 'F59E0B', // Amber 500
    border: 'E2E8F0', // Slate 200
    alternateRow: 'F8FAFC'
  };

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: colors.headerText }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { bottom: { style: 'thin', color: { argb: colors.border } } }
  };

  const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };

  // --- SHEET 1: DASHBOARD SUMMARY ---
  const summaryWs = workbook.addWorksheet('Dashboard Summary', { views: [{ showGridLines: false }] });
  
  // Calculate Stats
  const totalPnL = trades.reduce((acc, t) => acc + (getTradePnL(t) || 0), 0);
  const winRate = trades.length > 0 ? (trades.filter(t => normalizeStatus(t.trade_status || t.result) === 'win').length / trades.length) * 100 : 0;
  const taskComp = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  summaryWs.columns = [{ width: 25 }, { width: 25 }];
  summaryWs.addRows([
    ['TRADING PERFORMANCE REPORT'],
    ['Generated On', format(new Date(), 'yyyy-MM-dd HH:mm')],
    [],
    ['METRIC', 'VALUE'],
    ['Total Net P&L', totalPnL],
    ['Total Trades', trades.length],
    ['Win Rate', `${winRate.toFixed(2)}%`],
    ['Total Tasks', tasks.length],
    ['Task Completion', `${taskComp.toFixed(2)}%`],
    ['Active Goals', goals.filter(g => g.status === 'active').length]
  ]);

  // Style Summary
  summaryWs.getRow(1).font = { size: 16, bold: true, color: { argb: '1E293B' } };
  summaryWs.getRow(4).eachCell(cell => Object.assign(cell, headerStyle));
  summaryWs.getCell('B5').font = { bold: true, color: { argb: totalPnL >= 0 ? colors.profit : colors.loss } };
  summaryWs.getCell('B5').numFmt = '"$"#,##0.00;[Red]"$"#,##0.00';

  // --- SHEET 2: TRADE LOGS ---
  const tradeWs = workbook.addWorksheet('Trade Logs');
  tradeWs.columns = [
    { header: 'Date', key: 'trade_date', width: 15 },
    { header: 'Asset', key: 'asset_name', width: 20 },
    { header: 'Type', key: 'trade_direction', width: 12 },
    { header: 'Entry', key: 'entry_price', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Exit', key: 'exit_price', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'P&L ($)', key: 'pnl_amount', width: 15, style: { numFmt: '"$"#,##0.00;[Red]"$"#,##0.00' } },
    { header: 'Status', key: 'trade_status', width: 12 },
    { header: 'Strategy', key: 'strategy_used', width: 20 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];

  trades.forEach(t => {
    const pnl = getTradePnL(t) || 0;
    const status = normalizeStatus(t.trade_status || t.result);

    const row = tradeWs.addRow({
      ...t,
      pnl_amount: pnl,
      trade_status: status.toUpperCase()
    });
    
    const pnlCell = row.getCell('pnl_amount');
    const statusCell = row.getCell('trade_status');

    pnlCell.font = { color: { argb: pnl >= 0 ? colors.profit : colors.loss }, bold: true };
    statusCell.font = { color: { argb: status === 'win' ? colors.profit : colors.loss }, bold: true };
    row.alignment = centerAlign;
  });

  // --- SHEET 3: TASKS ---
  const taskWs = workbook.addWorksheet('Tasks');
  taskWs.columns = [
    { header: 'Due Date', key: 'date', width: 15 },
    { header: 'Task Name', key: 'title', width: 30 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Time', key: 'startTime', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Description', key: 'description', width: 40 }
  ];

  tasks.forEach(t => {
    const status = t.completed ? 'COMPLETED' : 'PENDING';
    const row = taskWs.addRow({ ...t, status });
    const statusCell = row.getCell('status');
    statusCell.font = { color: { argb: t.completed ? colors.profit : colors.pending }, bold: true };
    
    const priorityCell = row.getCell('priority');
    if (t.priority === 'high') priorityCell.font = { color: { argb: colors.loss }, bold: true };
    
    row.alignment = centerAlign;
  });

  // --- SHEET 4: GOALS ---
  const goalWs = workbook.addWorksheet('Goals');
  goalWs.columns = [
    { header: 'Goal Title', key: 'title', width: 35 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Deadline', key: 'date', width: 15 }
  ];

  goals.forEach(g => {
    const row = goalWs.addRow(g);
    row.getCell('progress').value = `${g.progress || 0}%`;
    row.alignment = centerAlign;
  });

  // --- GLOBAL FORMATTING & DOWNLOAD ---
  [tradeWs, taskWs, goalWs].forEach(ws => {
    ws.getRow(1).height = 30;
    ws.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columnCount }
    };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.alternateRow } };
      }
    });
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
  fileName: string = 'TradingJournal'
): Promise<boolean> {
  try {
    const workbook = await generateProfessionalExcelWorkbook(trades, tasks, goals);
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