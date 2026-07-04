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
  
  let currentY = margin;

  // Colors
  const primaryColor = '#0f172a'; // slate-900
  const secondaryColor = '#64748b'; // slate-500
  const chordColor = '#dc2626'; // red-600
  const blockColor = '#0284c7'; // sky-600

  // 1. Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  
  // Title wrapping
  const splitTitle = doc.splitTextToSize(song.title.toUpperCase(), pageWidth - margin * 2);
  doc.text(splitTitle, margin, currentY);
  currentY += (splitTitle.length * 28);

  // Artist
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor);
  const artistText = song.artist || 'Artista Desconocido';
  doc.text(artistText, margin, currentY);
  currentY += 25;

  // Metadata Row
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  
  const metadata = [];
  if (song.bpm) metadata.push(`BPM: ${song.bpm}`);
  if (options.originalKey) {
    const displayKey = options.nashvilleMode ? 'Nashville' : (options.originalKey /* TODO: transpose */); // Will show transpose via songUtils
    metadata.push(`Tono: ${displayKey}`); 
  }
  if (song.drum_style) metadata.push(`Batería: ${song.drum_style}`);
  
  if (metadata.length > 0) {
    doc.text(metadata.join('  |  '), margin, currentY);
    currentY += 15;
  }

  // Divider
  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 25;

  // 2. Prepare Lyrics
  // Convert everything to bracket text first, processed with transposed chords
  let processedText = '';
  
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
      currentY += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(blockColor);
      doc.text(blockName, margin, currentY);
      currentY += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      continue;
    }
    
    // Melody guides
    if (line.startsWith('(Guía:')) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor);
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
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize - 1);
          doc.setTextColor(chordColor);
          doc.text(chord, x, chordY);
          
          // To ensure chords don't overlap if lyric text is too short, we advance X slightly
          // But usually we just let it be at current X
          const chordWidth = doc.getTextWidth(chord);
          x += (chordWidth * 0.3); // minimal space
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
