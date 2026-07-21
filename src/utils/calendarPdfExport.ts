import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event as DbEvent, Member } from '../types';
import { toast } from 'sonner';

// Import SVG logo as raw text string so jsPDF can parse it
import logoSvg from '../assets/Jerusalén/solo logo colorido.svg?raw';

export interface BirthdayInfo {
  member: Member;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  day: number;
  month: number;
  age: number;
  daysRemaining: number;
  formattedDate: string;
}

export interface PdfExportOptions {
  viewMode: 'cards' | 'table' | 'calendar' | 'grid';
  orientation: 'portrait' | 'landscape';
  filterLabel?: string;
  calendarMonth?: string;
  calendarDate?: Date;
  calendarViewType?: 'day' | 'week' | 'month' | 'custom';
}

const PRIMARY_COLOR: [number, number, number] = [30, 58, 138]; // #1E3A8A
const GOLD_COLOR: [number, number, number] = [199, 157, 63]; // #C79D3F
const TEXT_MAIN: [number, number, number] = [15, 23, 42]; // #0F172A
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const CARD_BG: [number, number, number] = [255, 255, 255];
const CARD_BORDER: [number, number, number] = [226, 232, 240];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Removes raw UTF-8 emojis and unprintable Unicode characters
 * to prevent jsPDF Helvetica font corruption (Mojibake).
 */
export function sanitizePdfText(text: string | null | undefined): string {
  if (!text) return '';

  return (
    text
      // Remove emoji surrogate pairs and symbols
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/gu,
        ''
      )
      // Remove unprintable control characters except standard whitespace
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Converts hex color string (#1E3A8A) to RGB array
 */
function hexToRgb(hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return fallback;
  }
  try {
    let cleanHex = hex.slice(1);
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  } catch {
    return fallback;
  }
}

function drawHeader(doc: jsPDF, title: string, options: PdfExportOptions, pageWidth: number) {
  // Background Header Bar
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Gold accent bottom line
  doc.setFillColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
  doc.rect(0, 72, pageWidth, 3, 'F');

  // Insert SVG Logo
  try {
    doc.addSvgAsImage(logoSvg, 25, 12, 50, 50);
  } catch (err) {
    console.warn('Could not embed SVG logo in PDF:', err);
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Iglesia Ev. Cristiana Jerusalén', 85, 34);

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
  doc.text(sanitizePdfText(title), 85, 52);

  // Metadata Right Side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);

  const viewStr = `Estilo: ${options.viewMode === 'table' ? 'Tabla Ejecutiva' : 'Tarjetas Visuales'}`;
  const filterStr = options.filterLabel ? ` | Filtro: ${sanitizePdfText(options.filterLabel)}` : '';
  doc.text(`${viewStr}${filterStr}`, pageWidth - 25, 34, { align: 'right' });

  const genDate = `Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFontSize(8);
  doc.setTextColor(190, 200, 220);
  doc.text(genDate, pageWidth - 25, 52, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider line above footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(25, pageHeight - 30, pageWidth - 25, pageHeight - 30);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(
      `Página ${i} de ${totalPages} • Iglesia Ev. Cristiana Jerusalén • Reporte Oficial`,
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );
  }
}

export const exportEventsPdf = (events: DbEvent[], options: PdfExportOptions) => {
  try {
    if (!events || events.length === 0) {
      toast.error('No hay eventos para exportar');
      return;
    }

    const doc = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    drawHeader(doc, 'Calendario Oficial de Actividades', options, pageWidth);

    const startY = 95;

    // Sort events chronologically by start_date
    const sortedEvents = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));

    if (options.viewMode === 'table') {
      const tableData = sortedEvents.map((e) => {
        const title = sanitizePdfText(e.title);
        const dateRange =
          e.start_date === e.end_date
            ? e.start_date
            : `${e.start_date} al ${e.end_date}`;
        const time = e.start_time ? sanitizePdfText(e.start_time) : 'Todo el día';
        const ministry = sanitizePdfText(e.ministries?.name || 'General');

        return [title, dateRange, time, ministry];
      });

      autoTable(doc, {
        head: [['Actividad / Evento', 'Fecha / Período', 'Horario', 'Ministerio Organizador']],
        body: tableData,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: PRIMARY_COLOR,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9.5,
          cellPadding: 6,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor: TEXT_MAIN,
          cellPadding: 5,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { cellWidth: 110 },
          2: { cellWidth: 85 },
          3: { cellWidth: 140 },
        },
        margin: { left: 25, right: 25 },
      });
    } else {
      // Cards Grid View grouped by Month
      const cols = options.orientation === 'landscape' ? 3 : 2;
      const marginX = 25;
      const colGap = 15;
      const cardWidth = (pageWidth - marginX * 2 - (cols - 1) * colGap) / cols;

      // Group events by Month (YYYY-MM)
      const groupedByMonth: Record<string, DbEvent[]> = {};
      sortedEvents.forEach((ev) => {
        const key = ev.start_date ? ev.start_date.slice(0, 7) : 'Sin Fecha';
        if (!groupedByMonth[key]) groupedByMonth[key] = [];
        groupedByMonth[key].push(ev);
      });

      let currentX = marginX;
      let currentY = startY;
      let colIndex = 0;

      Object.entries(groupedByMonth).forEach(([monthKey, monthEvents]) => {
        // Month Title Banner
        let monthLabel = monthKey;
        if (monthKey.includes('-')) {
          const [year, month] = monthKey.split('-').map(Number);
          monthLabel = `${MONTH_NAMES[month - 1] || ''} ${year}`.toUpperCase();
        }

        // Check space for Month Header
        if (currentY + 40 > pageHeight - 45) {
          doc.addPage();
          drawHeader(doc, 'Calendario Oficial de Actividades (Cont.)', options, pageWidth);
          currentY = startY;
          currentX = marginX;
          colIndex = 0;
        } else if (colIndex !== 0) {
          // Wrap to new row before month banner
          currentY += 120;
          currentX = marginX;
          colIndex = 0;
        }

        // Render Month Banner Header
        doc.setFillColor(241, 245, 249); // slate-100
        doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 22, 4, 4, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text(monthLabel, marginX + 10, currentY + 14);

        currentY += 28;

        monthEvents.forEach((e) => {
          const titleText = sanitizePdfText(e.title);
          const descText = sanitizePdfText(e.description);
          const ministryText = sanitizePdfText(e.ministries?.name || 'General');
          const ministryColor = hexToRgb(e.ministries?.theme_color, PRIMARY_COLOR);

          // Calculate multi-line text height using splitTextToSize
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          const titleLines = doc.splitTextToSize(titleText, cardWidth - 22);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          const descLines = descText ? doc.splitTextToSize(descText, cardWidth - 22) : [];

          // Limit lines to prevent vertical card explosion
          const visibleTitleLines = titleLines.slice(0, 2);
          const visibleDescLines = descLines.slice(0, 2);

          const cardHeight = Math.max(
            95,
            45 + visibleTitleLines.length * 12 + visibleDescLines.length * 10
          );

          // Check if card fits on page
          if (currentY + cardHeight > pageHeight - 40) {
            doc.addPage();
            drawHeader(doc, 'Calendario Oficial de Actividades (Cont.)', options, pageWidth);
            currentY = startY;
            currentX = marginX;
            colIndex = 0;
          }

          // Card Background & Border
          doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
          doc.setDrawColor(CARD_BORDER[0], CARD_BORDER[1], CARD_BORDER[2]);
          doc.setLineWidth(0.75);
          doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 6, 6, 'FD');

          // Left Ministry Accent Stripe
          doc.setFillColor(ministryColor[0], ministryColor[1], ministryColor[2]);
          doc.roundedRect(currentX, currentY, 4, cardHeight, 4, 0, 'F');

          // Title rendering (clean multi-line)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
          doc.text(visibleTitleLines, currentX + 12, currentY + 16);

          let offsetY = currentY + 16 + visibleTitleLines.length * 12;

          // Date & Time badges
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);

          const dateStr =
            e.start_date === e.end_date
              ? `FECHA: ${e.start_date}`
              : `PERIODO: ${e.start_date} al ${e.end_date}`;
          const timeStr = `HORA: ${e.start_time ? sanitizePdfText(e.start_time) : 'Todo el dia'}`;

          doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
          doc.text(`${dateStr}  |  ${timeStr}`, currentX + 12, offsetY);

          offsetY += 12;

          // Ministry Badge
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          doc.text(`MINISTERIO: ${ministryText}`.toUpperCase(), currentX + 12, offsetY);

          offsetY += 12;

          // Description rendering (clean multi-line)
          if (visibleDescLines.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
            doc.text(visibleDescLines, currentX + 12, offsetY);
          }

          // Advance column position
          colIndex++;
          if (colIndex >= cols) {
            colIndex = 0;
            currentX = marginX;
            currentY += cardHeight + colGap;
          } else {
            currentX += cardWidth + colGap;
          }
        });

        // Add spacing after month section
        if (colIndex !== 0) {
          currentY += 105;
          currentX = marginX;
          colIndex = 0;
        }
      });
    }

    drawFooter(doc, pageWidth, pageHeight);

    const filename = `Calendario_Jerusalen_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success('PDF de eventos generado con éxito');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Ocurrió un error al generar el PDF de eventos');
  }
};

export const exportBirthdaysPdf = (birthdays: BirthdayInfo[], options: PdfExportOptions) => {
  try {
    if (!birthdays || birthdays.length === 0) {
      toast.error('No hay cumpleañeros para exportar');
      return;
    }

    const doc = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    drawHeader(doc, 'Calendario de Cumpleaños', options, pageWidth);

    const startY = 95;

    if (options.viewMode === 'table') {
      const tableData = birthdays.map((b) => [
        sanitizePdfText(`${b.member.first_name} ${b.member.last_name}`),
        sanitizePdfText(b.formattedDate),
        `${b.age} años`,
        b.isToday ? '¡Hoy!' : `En ${b.daysRemaining} días`,
      ]);

      autoTable(doc, {
        head: [['Hermano(a)', 'Fecha', 'Edad a Cumplir', 'Estado']],
        body: tableData,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 9 },
        margin: { left: 25, right: 25 },
      });
    } else {
      const cols = options.orientation === 'landscape' ? 4 : 2;
      const marginX = 25;
      const colGap = 15;
      const cardWidth = (pageWidth - marginX * 2 - (cols - 1) * colGap) / cols;
      const cardHeight = 75;

      let currentX = marginX;
      let currentY = startY;
      let colIndex = 0;

      birthdays.forEach((b) => {
        if (currentY + cardHeight > pageHeight - 40) {
          doc.addPage();
          drawHeader(doc, 'Calendario de Cumpleaños (Cont.)', options, pageWidth);
          currentY = startY;
          currentX = marginX;
          colIndex = 0;
        }

        doc.setDrawColor(CARD_BORDER[0], CARD_BORDER[1], CARD_BORDER[2]);
        if (b.isToday) {
          doc.setDrawColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
          doc.setFillColor(255, 250, 240);
        } else {
          doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
        }
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 6, 6, 'FD');

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
        const name = sanitizePdfText(`${b.member.first_name} ${b.member.last_name}`);
        const nameLines = doc.splitTextToSize(name, cardWidth - 16);
        doc.text(nameLines.slice(0, 1), currentX + 10, currentY + 20);

        // Date & Age
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text(`${sanitizePdfText(b.formattedDate)} • ${b.age} años`, currentX + 10, currentY + 38);

        // Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        if (b.isToday) {
          doc.setTextColor(220, 38, 38);
          doc.text('¡CUMPLEAÑOS HOY!', currentX + 10, currentY + 56);
        } else {
          doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
          doc.text(`Próximo: En ${b.daysRemaining} días`, currentX + 10, currentY + 56);
        }

        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          currentX = marginX;
          currentY += cardHeight + colGap;
        } else {
          currentX += cardWidth + colGap;
        }
      });
    }

    drawFooter(doc, pageWidth, pageHeight);

    const filename = `Cumpleanos_Jerusalen_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success('PDF de cumpleaños generado con éxito');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Ocurrió un error al generar el PDF de cumpleaños');
  }
};
