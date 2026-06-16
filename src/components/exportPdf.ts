import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getTradePnL, normalizeStatus, formatCurrency } from '@/lib/trades/analytics';

/**
 * Generates a professional grouped PDF report for trading activity.
 */
export async function exportProfessionalPdf(
  data: any[],
  fileName: string,
  options: { pdfReportType?: 'standard' | 'detailed' } = {}
): Promise<boolean> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 1. Sort Data: Month (Newest) -> Date (Newest) -> Time (Newest)
    const sortedData = [...data].sort((a, b) => {
      const timeA = a.trade_time || '00:00';
      const timeB = b.trade_time || '00:00';
      const dateTimeA = new Date(`${a.trade_date}T${timeA}`).getTime();
      const dateTimeB = new Date(`${b.trade_date}T${timeB}`).getTime();
      return dateTimeB - dateTimeA;
    });

    // 2. Branding Header
    doc.setFontSize(22);
    doc.setTextColor(0, 31, 63); // Navy
    doc.setFont('helvetica', 'bold');
    doc.text('AI Trade Journal', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Performance Report', 14, 27);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 32);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, pageWidth - 14, 36);

    // 3. Grouping Logic
    const tradesByMonth = new Map<string, Map<string, any[]>>();

    sortedData.forEach(trade => {
      const d = new Date(trade.trade_date);
      const mKey = format(d, 'MMMM yyyy').toUpperCase();
      const dKey = format(d, 'dd MMM yyyy');

      if (!tradesByMonth.has(mKey)) tradesByMonth.set(mKey, new Map());
      const days = tradesByMonth.get(mKey)!;
      if (!days.has(dKey)) days.set(dKey, []);
      days.get(dKey)!.push(trade);
    });

    let cursorY = 45;

    // 4. Render Groups
    for (const [month, days] of tradesByMonth) {
      // Check for page break before new month
      if (cursorY > 220) { doc.addPage(); cursorY = 20; }

      // ====================================================
      // MONTH HEADER (Large and Prominent)
      // ====================================================
      doc.setFontSize(26);
      doc.setTextColor(0, 31, 63);
      doc.setFont('helvetica', 'bold');
      doc.text(month, 14, cursorY);
      cursorY += 12;

      // ====================================================
      // MONTHLY PERFORMANCE SUMMARY
      // ====================================================
      const allMonthTrades = Array.from(days.values()).flat();
      const totalTrades = allMonthTrades.length;
      const netPnL = allMonthTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
      const wins = allMonthTrades.filter(t => normalizeStatus(t.trade_status) === 'win').length;
      const losses = allMonthTrades.filter(t => normalizeStatus(t.trade_status) === 'loss').length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      autoTable(doc, {
        startY: cursorY,
        head: [['MONTHLY SUMMARY', 'VALUE']],
        body: [
          ['Total Trades', totalTrades.toString()],
          ['Net P&L', { content: formatCurrency(netPnL), styles: { textColor: netPnL >= 0 ? [5, 150, 105] : [220, 38, 38], fontStyle: 'bold' } }],
          ['Win Rate', `${winRate.toFixed(1)}%`],
          ['Winning Trades', wins.toString()],
          ['Losing Trades', losses.toString()],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255] },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
        margin: { left: 14 },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 15;

      // ====================================================
      // DAILY SUMMARY CARDS
      // ====================================================
      for (const [day, dayTrades] of days) {
        // Page break check for daily card
        if (cursorY > 230) { doc.addPage(); cursorY = 20; }

        const dayPnL = dayTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
        const dayWins = dayTrades.filter(t => normalizeStatus(t.trade_status) === 'win').length;
        const dayLosses = dayTrades.filter(t => normalizeStatus(t.trade_status) === 'loss').length;
        const assets = Array.from(new Set(dayTrades.map(t => t.asset_name || t.symbol || 'N/A')));
        const strategies = Array.from(new Set(dayTrades.map(t => t.strategy_used || 'Standard')));

        // Render Daily Card using autoTable for layout control
        autoTable(doc, {
          startY: cursorY,
          body: [
            [
              { 
                content: day.toUpperCase(), 
                styles: { 
                  fontStyle: 'bold', 
                  textColor: [255, 255, 255], 
                  fillColor: dayPnL >= 0 ? [5, 150, 105] : [220, 38, 38],
                  halign: 'left'
                } 
              },
              { 
                content: `NET P&L: ${formatCurrency(dayPnL)}`, 
                styles: { 
                  fontStyle: 'bold', 
                  textColor: [255, 255, 255], 
                  fillColor: dayPnL >= 0 ? [5, 150, 105] : [220, 38, 38],
                  halign: 'right'
                } 
              }
            ],
            [
              { 
                content: `Trades: ${dayTrades.length}  |  Wins: ${dayWins}  |  Losses: ${dayLosses}`, 
                colSpan: 2,
                styles: { fontStyle: 'bold', textColor: [51, 65, 85] }
              }
            ],
            [
              { content: `Assets: ${assets.join(', ')}`, colSpan: 2 },
            ],
            [
              { content: `Strategies: ${strategies.join(', ')}`, colSpan: 2 },
            ]
          ],
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3, lineColor: [226, 232, 240] },
          margin: { left: 14, right: 14 }
        });

        cursorY = (doc as any).lastAutoTable.finalY + 6;
      }
      
      cursorY += 10; 
    }

    // ====================================================
    // DETAILED TRADE LOG (Global Section at End)
    // ====================================================
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(0, 31, 63);
    doc.text('DETAILED TRADE LOG', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Asset', 'Strategy', 'Amount', 'P&L', 'Result']],
      body: sortedData.map(t => {
        const pnl = getTradePnL(t);
        const result = normalizeStatus(t.trade_status);
        return [
          t.trade_date,
          t.asset_name || t.symbol || 'N/A',
          t.strategy_used || 'N/A',
          formatCurrency(t.risk_amount || 0),
          { content: formatCurrency(pnl), styles: { textColor: pnl >= 0 ? [5, 150, 105] : [220, 38, 38] } },
          { content: result.toUpperCase(), styles: { fontStyle: 'bold', textColor: result === 'win' ? [5, 150, 105] : result === 'loss' ? [220, 38, 38] : [100, 116, 139] } }
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // 5. Save Report
    doc.save(`${fileName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    return true;
  } catch (error) {
    console.error('[exportPdf] Error generating grouped PDF:', error);
    return false;
  }
}