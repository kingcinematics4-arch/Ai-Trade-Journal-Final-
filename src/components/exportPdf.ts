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

    // 1. Sort Data: Chronological Newest First
    const sortedData = [...data].sort((a, b) => {
      const timeA = a.trade_time || '00:00';
      const timeB = b.trade_time || '00:00';
      const dateTimeA = new Date(`${a.trade_date}T${timeA}`).getTime();
      const dateTimeB = new Date(`${b.trade_date}T${timeB}`).getTime();
      return dateTimeB - dateTimeA;
    });

    // 2. Professional Header
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont('helvetica', 'bold');
    doc.text('AI Trade Journal', 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'normal');
    doc.text('Institutional-Grade Performance Audit', 14, 26);
    doc.text(`Audit Timestamp: ${format(new Date(), 'PPP p')}`, 14, 31);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, pageWidth - 14, 36);

    // 3. Grouping Logic
    const tradesByMonth = new Map<string, Map<string, any[]>>();

    sortedData.forEach((trade) => {
      const d = new Date(trade.trade_date);
      const mKey = format(d, 'MMMM yyyy').toUpperCase();
      const dKey = format(d, 'dd MMM yyyy');

      if (!tradesByMonth.has(mKey)) tradesByMonth.set(mKey, new Map());
      const days = tradesByMonth.get(mKey)!;
      if (!days.has(dKey)) days.set(dKey, []);
      days.get(dKey)!.push(trade);
    });

    let cursorY = 45;

    // 4. Render Monthly and Daily Summaries
    for (const [month, days] of tradesByMonth) {
      // Page break check for new month
      if (cursorY > 180) {
        doc.addPage();
        cursorY = 20;
      }

      // ====================================================
      // 1. MONTH HEADER
      // ====================================================
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(month, 14, cursorY);
      cursorY += 12;

      // ====================================================
      // 2. MONTHLY SUMMARY (Consolidated Metrics)
      // ====================================================
      const allMonthTrades = Array.from(days.values()).flat();
      const totalTrades = allMonthTrades.length;
      const netPnL = allMonthTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
      const wins = allMonthTrades.filter((t) => normalizeStatus(t.trade_status) === 'win').length;
      const losses = allMonthTrades.filter(
        (t) => normalizeStatus(t.trade_status) === 'loss'
      ).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      autoTable(doc, {
        startY: cursorY,
        head: [['MONTHLY SUMMARY', 'VALUE']],
        body: [
          ['Total Trades', totalTrades.toString()],
          [
            'Net P&L',
            {
              content: formatCurrency(netPnL),
              styles: { textColor: netPnL >= 0 ? [5, 150, 105] : [220, 38, 38], fontStyle: 'bold' },
            },
          ],
          ['Win Rate', `${winRate.toFixed(1)}% (${wins} Wins / ${losses} Losses)`],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
        margin: { left: 14 },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 15;

      // ====================================================
      // 3. DAILY SUMMARY CARDS (Structural grouping)
      // ====================================================
      for (const [day, dayTrades] of days) {
        if (cursorY > 240) {
          doc.addPage();
          cursorY = 20;
        }

        const dayPnL = dayTrades.reduce((sum, t) => sum + getTradePnL(t), 0);
        const assets = Array.from(new Set(dayTrades.map((t) => t.asset_name || t.symbol || 'N/A')));
        const strategies = Array.from(new Set(dayTrades.map((t) => t.strategy_used || 'N/A')));

        // Card Separator Lines
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.setLineWidth(0.5);
        doc.line(14, cursorY, pageWidth - 14, cursorY);
        cursorY += 7;

        // Day Heading
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(day, 14, cursorY);
        cursorY += 8;

        // Daily Metrics
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);

        doc.text(`Trades Today: ${dayTrades.length}`, 14, cursorY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(dayPnL >= 0 ? 5 : 220, dayPnL >= 0 ? 150 : 38, dayPnL >= 0 ? 105 : 38);
        doc.text(`Net P&L Today: ${formatCurrency(dayPnL)}`, 60, cursorY);

        cursorY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Assets: ${assets.join(', ')}`, 14, cursorY);
        cursorY += 6;
        doc.text(`Strategies: ${strategies.join(', ')}`, 14, cursorY);

        cursorY += 12; // Gap between cards
      }
      cursorY += 10;
    }

    // ====================================================
    // 4. DETAILED TRADE LOG (Appears at the very end)
    // ====================================================
    doc.addPage();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('DETAILED TRADE LOG', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Asset', 'Strategy', 'Risk', 'PnL', 'Status']],
      body: sortedData.map((t) => {
        const pnl = getTradePnL(t);
        const result = normalizeStatus(t.trade_status);
        return [
          t.trade_date,
          t.asset_name || t.symbol || 'N/A',
          t.strategy_used || 'N/A',
          formatCurrency(t.risk_amount || 0),
          {
            content: formatCurrency(pnl),
            styles: { textColor: pnl >= 0 ? [5, 150, 105] : [220, 38, 38] },
          },
          {
            content: result.toUpperCase(),
            styles: {
              fontStyle: 'bold',
              textColor:
                result === 'win'
                  ? [5, 150, 105]
                  : result === 'loss'
                    ? [220, 38, 38]
                    : [100, 116, 139],
            },
          },
        ];
      }),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
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
