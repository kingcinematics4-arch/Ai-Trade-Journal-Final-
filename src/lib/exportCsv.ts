import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import {
  calculateReportAnalytics,
  flattenAndFormatTrade,
  formatCurrency,
  formatPercentage,
  getProfessionalColumnOrder,
} from './export/exportFormatting';

/**
 * Generates the professional CSV string content.
 */
export function buildProfessionalCsv(data: any[]): string {
  if (!data || data.length === 0) return '';

  // 1. Flatten and Format Data
  const processedData = data.map((item) => flattenAndFormatTrade(item));
  processedData.sort(
    (a, b) =>
      new Date(a.trade_date || a.date || 0).getTime() -
      new Date(b.trade_date || b.date || 0).getTime()
  );

  // 2. Determine Columns and Formatting
  const allKeys = Array.from(new Set(processedData.flatMap(Object.keys)));
  const columnOrder = getProfessionalColumnOrder(allKeys, true);

  // Format specific financial columns as strings with currency/percent for CSV readability
  const finalData = processedData.map((row) => {
    const formattedRow: Record<string, any> = {};
    columnOrder.forEach((key) => {
      let val = row[key];
      if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))) {
        if (
          key.match(/pnl|amount|price|loss|cost|value|risk|equity|fees|commission|spread|slippage/i)
        ) {
          val = formatCurrency(val);
        } else if (key.match(/rate|progress|percent/i)) {
          val = formatPercentage(val);
        }
      }
      formattedRow[key] = val !== undefined ? val : '';
    });
    return formattedRow;
  });

  // 3. Human-readable headers
  const humanHeaders = columnOrder.map((key) =>
    key
      .replace(/[._]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toUpperCase()
  );

  // 4. Calculate Analytics for Metadata Header
  const analytics = calculateReportAnalytics(data);
  const generatedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  // 5. Build CSV structure with metadata at top
  const metadataRows = [
    ['AI TRADE JOURNAL - PROFESSIONAL EXPORT', '', '', '', ''],
    ['Report Generated:', generatedDate, '', '', ''],
    ['Total Trades:', analytics.totalTrades.toString(), '', '', ''],
    ['Win Rate:', formatPercentage(analytics.winRate), '', '', ''],
    ['Net P&L:', formatCurrency(analytics.netPnl), '', '', ''],
    ['', '', '', '', ''], // Blank spacer row
  ];

  const dataRows = finalData.map((row) => columnOrder.map((key) => row[key]));

  const csvContentArray = [...metadataRows, humanHeaders, ...dataRows];

  return Papa.unparse(csvContentArray);
}

/**
 * Generates and downloads a professional, institutional-grade CSV export.
 */
export async function exportProfessionalCsv(
  data: any[],
  fileName: string = 'TradingJournal',
  context: { tasks?: any[]; goals?: any[] } = {}
): Promise<boolean> {
  if (!data || data.length === 0) return false;

  try {
    // 2. Determine Columns and Formatting
    const allKeys = Array.from(new Set(processedData.flatMap(Object.keys)));
    const columnOrder = getProfessionalColumnOrder(allKeys, true);

    // Format specific financial columns as strings with currency/percent for CSV readability
    const finalData = processedData.map((row) => {
      const formattedRow: Record<string, any> = {};
      columnOrder.forEach((key) => {
        let val = row[key];
        if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))) {
          if (
            key.match(
              /pnl|amount|price|loss|cost|value|risk|equity|fees|commission|spread|slippage/i
            )
          ) {
            val = formatCurrency(val);
          } else if (key.match(/rate|progress|percent/i)) {
            val = formatPercentage(val);
          }
        }
        formattedRow[key] = val !== undefined ? val : '';
      });
      return formattedRow;
    });

    const dateStr = format(new Date(), 'yyyy_MM_dd');

    const csvString = buildProfessionalCsv(data);

    // 7. Download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}_Export_${dateStr}.csv`);

    return true;
  } catch (error) {
    console.error('[exportProfessionalCsv] Error generating CSV:', error);
    return false;
  }
}
