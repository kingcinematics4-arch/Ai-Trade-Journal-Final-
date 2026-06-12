import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a professional PDF report with a styled table.
 * @param data - Array of objects to export
 * @param fileName - Target filename (default: 'Trade_Report')
 */
export function exportPDF(data: any[], fileName: string = 'Trade_Report') {
  if (!data || data.length === 0) return;

  const doc = new jsPDF({ 
    orientation: 'p', 
    unit: 'mm', 
    format: 'a4',
    putOnlyUsedFonts: true 
  });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- GLOBAL DARK THEME SETUP ---
  const colors = {
    bg: [11, 15, 25], // #0B0F19
    card: [17, 24, 39], // #111827
    header: [31, 41, 55], // #1F2937
    border: [55, 65, 81], // #374151
    text: [249, 250, 251], // #F9FAFB
    muted: [156, 163, 175], // #9CA3AF
    green: [34, 197, 94],
    red: [239, 68, 68]
  };

  // Function to draw page background
  const drawBackground = () => {
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Apply background to first page
  drawBackground();

  // --- 1. CALCULATE SUMMARY STATISTICS ---
  const stats = data.reduce((acc, item: any) => {
    const pnl = parseFloat(item.pnl_amount ?? item.profit ?? item.value ?? 0);
    acc.totalProfit += pnl;
    acc.totalTrades += 1;
    if (pnl > 0) acc.wins += 1;
    else if (pnl < 0) acc.losses += 1;
    return acc;
  }, { totalProfit: 0, totalTrades: 0, wins: 0, losses: 0 });

  // --- 2. HEADER SECTION ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(20);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text('Trading Report', 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text('Performance Summary', 14, 26);
  doc.text(`Period: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 26, { align: 'right' });

  // Horizontal separator line
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.line(14, 30, pageWidth - 14, 30);

  // --- 3. SUMMARY SECTION BOX ---
  const summaryY = 36;
  doc.setFillColor(colors.card[0], colors.card[1], colors.card[2]);
  doc.roundedRect(14, summaryY, pageWidth - 28, 22, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  
  // Labels
  doc.text('NET P&L', 20, summaryY + 7);
  doc.text('TOTAL TRADES', 70, summaryY + 7);
  doc.text('WINNING', 110, summaryY + 7);
  doc.text('LOSING', 160, summaryY + 7);

  // Values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const isProfit = stats.totalProfit >= 0;
  doc.setTextColor(isProfit ? colors.green[0] : colors.red[0], isProfit ? colors.green[1] : colors.red[1], isProfit ? colors.green[2] : colors.red[2]);
  doc.text(`${isProfit ? '+' : ''}${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, summaryY + 14);
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(stats.totalTrades.toString(), 70, summaryY + 16);
  doc.setTextColor(colors.green[0], colors.green[1], colors.green[2]);
  doc.text(stats.wins.toString(), 110, summaryY + 16);
  doc.setTextColor(colors.red[0], colors.red[1], colors.red[2]);
  doc.text(stats.losses.toString(), 160, summaryY + 16);

  // --- 4. TABLE SECTION ---
  // Table columns: Date | Name | Profit
  const body = data.map((item: any) => [
    item.trade_date || item.date ? format(new Date(item.trade_date || item.date), 'dd MMM yyyy') : '-',
    item.asset_name ?? item.title ?? item.name ?? 'N/A',
    item.pnl_amount ?? item.profit ?? item.value ?? 0,
  ]);

  autoTable(doc, {
    startY: summaryY + 30,
    head: [['Date', 'Name', 'Profit']],
    body: body,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle',
      font: 'helvetica',
      textColor: colors.text,
      lineColor: colors.bg,
      lineWidth: 0,
      fontStyle: 'normal',
      overflow: 'linebreak', // Prevents text/numbers from escaping cell boundaries
    },
    headStyles: {
      fillColor: colors.header,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      // Exact column distribution: Date (~25%) | Name (~45%) | Profit (~30%)
      0: { halign: 'center', cellWidth: 45 }, 
      1: { halign: 'left', cellWidth: 'auto' }, 
      2: { halign: 'center', cellWidth: 55 }, 
    },
    alternateRowStyles: {
      fillColor: colors.card,
    },
    bodyStyles: {
      fillColor: colors.bg,
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = parseFloat(data.cell.raw as string);
        if (val > 0) data.cell.styles.textColor = colors.green;
        else if (val < 0) data.cell.styles.textColor = colors.red;
        
        // Clean numeric formatting - removed the symbol artifact
        const formattedVal = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        data.cell.text = [formattedVal];
      }
    },
    didDrawPage: (data) => {
      // Fill background for new pages
      if (data.pageNumber > 1) {
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text('Generated by Trading Dashboard', 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${data.pageNumber}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    },
  });

  doc.save(`${fileName.replace(/\s+/g, '_')}.pdf`);
}