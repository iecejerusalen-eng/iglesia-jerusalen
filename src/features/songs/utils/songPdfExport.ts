import jsPDF from 'jspdf';
import type { Song } from '../../../types';
import { htmlToBracketText, processBracketText } from './songUtils';

export interface PdfExportOptions {
  transposeAmount: number;
  nashvilleMode: boolean;
  originalKey: string | null;
  showChords: boolean;
  churchName?: string;
}

export const exportSongToPdf = (song: Song, options: PdfExportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 40;
  
  let currentY: number;
  let currentColumn = 0;
  const columnGap = 30;
  const columnWidth = (pageWidth - (margin * 2) - columnGap) / 2;

  // Colors
  const primaryColor = '#0f172a'; // slate-900
  const secondaryColor = '#475569'; // slate-600
  const chordColor = '#dc2626'; // red-600
  const blockColor = '#0284c7'; // sky-600
  
  // 1. Premium Header Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 110, 'F');
  
  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  
  const titleStr = song.title.toUpperCase();
  const splitTitle = doc.splitTextToSize(titleStr, pageWidth - margin * 2);
  doc.text(splitTitle, margin, 45);
  const headerY = 45 + ((splitTitle.length - 1) * 24) + 20;

  // Artist
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225); // slate-300
  const artistText = song.artist || 'Artista Desconocido';
  doc.text(artistText, margin, headerY);
  
  // Metadata Pills
  currentY = 135;
  const startContentY = 160;
  
  const drawPill = (text: string, x: number, y: number, bgColor: number[], textColor: number[]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(text);
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(x, y - 10, tw + 16, 14, 4, 4, 'F');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(text, x + 8, y);
    return tw + 24; // return width plus spacing
  };

  let pillX = margin;
  if (song.bpm) {
    pillX += drawPill(`BPM: ${song.bpm}`, pillX, currentY, [241, 245, 249], [15, 23, 42]);
  }
  if (options.originalKey) {
    const displayKey = options.nashvilleMode ? 'Nashville' : options.originalKey;
    pillX += drawPill(`Tono: ${displayKey}`, pillX, currentY, [254, 243, 199], [180, 83, 9]);
  }
  if (song.drum_style) {
    drawPill(`Ritmo: ${song.drum_style}`, pillX, currentY, [241, 245, 249], [15, 23, 42]);
  }
  
  currentY = startContentY;

  // 2. Prepare Lyrics
  let processedText: string;
  if (song.structure_blocks && song.structure_blocks.length > 0) {
    processedText = song.structure_blocks.map(b => {
      let blockStr = `[BLOCK:${b.label.toUpperCase()}]\n`;
      if (b.melody) blockStr += `(Guía: ${b.melody})\n`;
      blockStr += `${processBracketText(b.lyrics, options.transposeAmount, options.nashvilleMode, options.originalKey)}\n`;
      return blockStr;
    }).join('\n');
  } else {
    const baseText = htmlToBracketText(song.lyrics);
    processedText = processBracketText(baseText, options.transposeAmount, options.nashvilleMode, options.originalKey);
  }

  // 3. Render Lyrics in 2 Columns
  const lines = processedText.split('\n');
  const fontSize = 11;
  const lineHeight = options.showChords ? 26 : 16; 
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check page/column break
    if (currentY > pageHeight - margin - 20) {
      if (currentColumn === 0) {
        currentColumn = 1;
        currentY = startContentY; // Reset to top of column 2
      } else {
        doc.addPage();
        currentColumn = 0;
        currentY = margin + 20; // Some margin on new pages
      }
    }

    const currentX = margin + (currentColumn * (columnWidth + columnGap));

    if (line.trim() === '') {
      currentY += lineHeight * 0.4;
      continue;
    }

    // Block Headers
    if (line.startsWith('[BLOCK:')) {
      const blockName = line.replace('[BLOCK:', '').replace(']', '');
      currentY += 12;
      
      // Draw block background
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(currentX, currentY - 12, columnWidth, 18, 3, 3, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      doc.text(blockName, currentX + 8, currentY + 1);
      
      currentY += 20;
      continue;
    }
    
    // Melody guides
    if (line.startsWith('(Guía:')) {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(9);
      doc.setTextColor(blockColor);
      doc.text(line, currentX, currentY);
      currentY += 14;
      continue;
    }

    let lx = currentX;

    if (options.showChords && line.includes('[')) {
      const chordY = currentY;
      const textY = currentY + 12;
      const segments = line.split(/(\[[^\]]+\])/g);
      
      for (const seg of segments) {
        if (!seg) continue;
        
        if (seg.startsWith('[') && seg.endsWith(']')) {
          const chord = seg.slice(1, -1);
          // Draw chord box slightly offset
          doc.setFillColor(254, 242, 242); // red-50
          const cw = doc.getTextWidth(chord);
          doc.roundedRect(lx - 2, chordY - 9, cw + 4, 11, 2, 2, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize - 1);
          doc.setTextColor(chordColor);
          doc.text(chord, lx, chordY);
          
          lx += (cw * 0.2);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(primaryColor);
          
          // Truncate long lines so they don't overflow the column
          const maxAllowedWidth = columnWidth - (lx - currentX);
          let safeSeg = seg;
          if (doc.getTextWidth(safeSeg) > maxAllowedWidth) {
             safeSeg = safeSeg.slice(0, 30) + '...'; // Basic truncation fallback
          }
          
          doc.text(safeSeg, lx, textY);
          lx += doc.getTextWidth(safeSeg);
        }
      }
      currentY += 26; 
    } else {
      // No chords, just print lyrics
      const cleanLine = options.showChords ? line : line.replace(/\[.*?\]/g, '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      
      // Basic truncation logic if line overflows column
      let safeLine = cleanLine;
      if (doc.getTextWidth(safeLine) > columnWidth) {
        safeLine = safeLine.slice(0, 35) + '...';
      }
      
      doc.text(safeLine, currentX, currentY + 10);
      currentY += lineHeight;
    }
  }

  // 4. Footer
  const totalPages = doc.getNumberOfPages();
  const footerText = options.churchName || 'Iglesia Jerusalén - Módulo de Alabanzas';
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text(
      `${footerText}  |  Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // 5. Download
  const filename = `${song.title.replace(/\s+/g, '_').toLowerCase()}_acordes.pdf`;
  doc.save(filename);
};
