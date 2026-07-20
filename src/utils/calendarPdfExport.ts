import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event as DbEvent, Member } from '../types';
import { toast } from 'sonner';

// Import SVG as raw text string so jsPDF can parse it
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

function drawHeader(doc: jsPDF, title: string, options: PdfExportOptions, pageWidth: number) {
  // Background
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Insert SVG Logo
  try {
    // Note: addSvgAsImage works directly with SVG string in modern jsPDF when used in browser
    doc.addSvgAsImage(logoSvg, 30, 20, 50, 50);
  } catch (err) {
    console.warn("Could not embed SVG logo:", err);
  }

  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Iglesia Ev. Cristiana Jerusalén', 90, 40);

  doc.setFontSize(14);
  doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
  doc.text(title, 90, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  
  const viewStr = `Vista: ${options.viewMode.toUpperCase()}`;
  const filterStr = options.filterLabel ? ` | Filtro: ${options.filterLabel}` : '';
  doc.text(`${viewStr}${filterStr}`, 90, 75);

  const genDate = `Generado: ${new Date().toLocaleString()}`;
  doc.setFontSize(9);
  doc.text(genDate, pageWidth - 30, 75, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pág ${i} de ${totalPages} • Iglesia Jerusalén`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }
}

export const exportBirthdaysPdf = (birthdays: BirthdayInfo[], options: PdfExportOptions) => {
  try {
    if (!birthdays || birthdays.length === 0) {
      toast.error('No hay cumpleañeros para exportar');
      return;
    }

    const doc = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    drawHeader(doc, 'Calendario de Cumpleaños', options, pageWidth);

    const startY = 110;

    if (options.viewMode === 'table') {
      const tableData = birthdays.map(b => [
        `${b.member.first_name} ${b.member.last_name}`,
        b.formattedDate,
        `${b.age} años`,
        b.isToday ? '¡Hoy!' : `En ${b.daysRemaining} días`
      ]);

      autoTable(doc, {
        head: [['Hermano(a)', 'Fecha', 'Edad a cumplir', 'Estado']],
        body: tableData,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 10 }
      });
    } else {
      // Cards / Calendar View - simplified rendering as grid
      const cols = options.orientation === 'landscape' ? 4 : 2;
      const cardWidth = (pageWidth - 60 - (cols - 1) * 20) / cols;
      const cardHeight = 80;
      let currentX = 30;
      let currentY = startY;

      birthdays.forEach((b, index) => {
        if (index > 0 && index % cols === 0) {
          currentX = 30;
          currentY += cardHeight + 20;
        }
        
        if (currentY + cardHeight > pageHeight - 40) {
          doc.addPage();
          drawHeader(doc, 'Calendario de Cumpleaños (Cont.)', options, pageWidth);
          currentY = 110;
          currentX = 30;
        }

        // Card border
        doc.setDrawColor(220, 220, 220);
        if (b.isToday) {
          doc.setDrawColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
          doc.setFillColor(255, 250, 240);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 6, 6, 'FD');

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        let name = `${b.member.first_name} ${b.member.last_name}`;
        if (doc.getTextWidth(name) > cardWidth - 20) {
          name = name.substring(0, 18) + '...';
        }
        doc.text(name, currentX + 10, currentY + 25);

        // Date & Age
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${b.formattedDate} • ${b.age} años`, currentX + 10, currentY + 45);

        // Status
        doc.setFont('helvetica', 'bold');
        if (b.isToday) {
          doc.setTextColor(220, 38, 38);
          doc.text('¡CUMPLEAÑOS HOY!', currentX + 10, currentY + 65);
        } else {
          doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
          doc.text(`Próximo: En ${b.daysRemaining} días`, currentX + 10, currentY + 65);
        }

        currentX += cardWidth + 20;
      });
    }

    drawFooter(doc, pageWidth, pageHeight);
    doc.save('Calendario_Cumpleanos.pdf');
    toast.success('PDF de cumpleaños generado con éxito');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Ocurrió un error al generar el PDF');
  }
};

export const exportEventsPdf = (events: DbEvent[], options: PdfExportOptions) => {
  try {
    if (!events || events.length === 0) {
      toast.error('No hay eventos para exportar');
      return;
    }

    const doc = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    drawHeader(doc, 'Calendario de Eventos', options, pageWidth);

    const startY = 110;

    if (options.viewMode === 'table') {
      const tableData = events.map(e => [
        e.title,
        `${e.start_date}${e.end_date !== e.start_date ? ' - ' + e.end_date : ''}`,
        e.start_time || 'Todo el día',
        e.ministries?.name || 'General',
        Array.isArray(e.leaders_in_charge) ? e.leaders_in_charge.join(', ') : 'Ninguno'
      ]);

      autoTable(doc, {
        head: [['Evento', 'Fecha', 'Horario', 'Ministerio', 'Líderes']],
        body: tableData,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 9 }
      });
    } else {
      // Grid / Calendar view (Cards representation)
      const cols = options.orientation === 'landscape' ? 3 : 2;
      const cardWidth = (pageWidth - 60 - (cols - 1) * 20) / cols;
      const cardHeight = 100;
      let currentX = 30;
      let currentY = startY;

      events.forEach((e, index) => {
        if (index > 0 && index % cols === 0) {
          currentX = 30;
          currentY += cardHeight + 20;
        }
        
        if (currentY + cardHeight > pageHeight - 40) {
          doc.addPage();
          drawHeader(doc, 'Calendario de Eventos (Cont.)', options, pageWidth);
          currentY = 110;
          currentX = 30;
        }

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 6, 6, 'FD');

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        let title = e.emoji ? `${e.emoji} ${e.title}` : e.title;
        if (doc.getTextWidth(title) > cardWidth - 20) {
          title = title.substring(0, 20) + '...';
        }
        doc.text(title, currentX + 10, currentY + 25);

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        let desc = e.description || 'Sin descripción';
        if (doc.getTextWidth(desc) > cardWidth - 20) desc = desc.substring(0, 30) + '...';
        doc.text(desc, currentX + 10, currentY + 40);

        // Date & Time
        doc.setFontSize(9);
        doc.setTextColor(GOLD_COLOR[0], GOLD_COLOR[1], GOLD_COLOR[2]);
        const dateStr = `${e.start_date}${e.end_date !== e.start_date ? ' - ' + e.end_date : ''}`;
        doc.text(`📅 ${dateStr}`, currentX + 10, currentY + 65);
        doc.text(`⏰ ${e.start_time || 'Todo el día'}`, currentX + 10, currentY + 80);

        // Ministry
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.text(e.ministries?.name || 'General', currentX + 10, currentY + 92);

        currentX += cardWidth + 20;
      });
    }

    drawFooter(doc, pageWidth, pageHeight);
    doc.save('Calendario_Eventos.pdf');
    toast.success('PDF de eventos generado con éxito');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Ocurrió un error al generar el PDF');
  }
};
