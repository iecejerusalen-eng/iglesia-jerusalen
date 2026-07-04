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
  const margin = 50;
  
  let currentY: number;

  // Colors
  const primaryColor = '#0f172a'; // slate-900
  const secondaryColor = '#475569'; // slate-600
  const chordColor = '#dc2626'; // red-600
  const blockColor = '#0284c7'; // sky-600
  
  // 1. Premium Header Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 120, 'F');
  
  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  
  // Title wrapping
  const titleStr = song.title.toUpperCase();
  const splitTitle = doc.splitTextToSize(titleStr, pageWidth - margin * 2);
  doc.text(splitTitle, margin, 50);
  const headerY = 50 + (splitTitle.length * 28);

  // Artist
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(203, 213, 225); // slate-300
  const artistText = song.artist || 'Artista Desconocido';
  doc.text(artistText, margin, headerY);
  
  // Metadata Pills
  currentY = 150;
  
  const drawPill = (text: string, x: number, y: number, bgColor: number[], textColor: number[]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(text);
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(x, y - 11, tw + 16, 16, 8, 8, 'F');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(text, x + 8, y);
    return tw + 24; // return width plus spacing
  };

  let currentX = margin;
  if (song.bpm) {
    currentX += drawPill(`BPM: ${song.bpm}`, currentX, currentY, [241, 245, 249], [15, 23, 42]);
  }
  if (options.originalKey) {
    const displayKey = options.nashvilleMode ? 'Nashville' : options.originalKey;
    currentX += drawPill(`Tono: ${displayKey}`, currentX, currentY, [254, 243, 199], [180, 83, 9]); // amber pill
  }
  if (song.drum_style) {
    drawPill(`Ritmo: ${song.drum_style}`, currentX, currentY, [241, 245, 249], [15, 23, 42]);
  }
  
  currentY += 30;

  // 2. Prepare Lyrics
  // Convert everything to bracket text first, processed with transposed chords
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

  // 3. Render Lyrics
  const lines = processedText.split('\n');
  
  doc.setFont('helvetica', 'normal');
  
  const fontSize = 12;
  const lineHeight = options.showChords ? 28 : 18; 
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check page break
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    if (line.trim() === '') {
      currentY += lineHeight * 0.5;
      continue;
    }

    // Block Headers
    if (line.startsWith('[BLOCK:')) {
      const blockName = line.replace('[BLOCK:', '').replace(']', '');
      currentY += 15;
      
      // Draw block background
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(margin, currentY - 12, pageWidth - margin * 2, 20, 4, 4, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      doc.text(blockName, margin + 10, currentY + 2);
      
      currentY += 25;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      continue;
    }
    
    // Melody guides
    if (line.startsWith('(Guía:')) {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(10);
      doc.setTextColor(blockColor);
      doc.text(line, margin, currentY);
      currentY += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      continue;
    }

    // Parse chords and lyrics inline
    // A line might look like: "Oh, amor[C] que no me dejarás[G]"
    let x = margin;

    if (options.showChords && line.includes('[')) {
      // We render chords above the text.
      // So we have two Y positions for this line: currentY (for chords), currentY + 14 (for lyrics)
      const chordY = currentY;
      const textY = currentY + 12;
      
      const segments = line.split(/(\[[^\]]+\])/g);
      
      for (const seg of segments) {
        if (!seg) continue;
        
        if (seg.startsWith('[') && seg.endsWith(']')) {
          const chord = seg.slice(1, -1);
          // Draw chord box slightly offset
          doc.setFillColor(254, 242, 242); // red-50
          doc.roundedRect(x - 2, chordY - 10, doc.getTextWidth(chord) + 4, 12, 2, 2, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize - 1);
          doc.setTextColor(chordColor);
          doc.text(chord, x, chordY);
          
          // Add just a tiny bit of horizontal spacing
          const chordWidth = doc.getTextWidth(chord);
          x += (chordWidth * 0.1);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(primaryColor);
          doc.text(seg, x, textY);
          x += doc.getTextWidth(seg);
        }
      }
      
      currentY += 28; // move down for next line
    } else {
      // No chords, just print lyrics
      // Strip brackets if showChords is false
      const cleanLine = options.showChords ? line : line.replace(/\[.*?\]/g, '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      doc.text(cleanLine, margin, currentY + 12);
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
