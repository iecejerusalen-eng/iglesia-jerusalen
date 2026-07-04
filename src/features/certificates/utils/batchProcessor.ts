import JSZip from 'jszip';
import { generateCertificate } from './pdfEngine';
import type { CertificateTemplate, FieldMapping } from '../types';

export interface BatchProgress {
  total: number;
  current: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
}

export const processBatchToZip = async (
  template: CertificateTemplate,
  membersData: Record<string, any>[],
  fonts: Map<string, string>,
  onProgress: (progress: BatchProgress) => void
): Promise<Blob> => {
  const zip = new JSZip();
  const total = membersData.length;
  
  onProgress({ total, current: 0, status: 'running' });

  for (let i = 0; i < total; i++) {
    const member = membersData[i];
    try {
      const pdfBytes = await generateCertificate(
        template.pdf_url,
        template.field_mappings,
        member,
        fonts
      );
      
      const fileName = `Certificado_${member.first_name || 'Miembro'}_${member.last_name || i}.pdf`.replace(/\s+/g, '_');
      zip.file(fileName, pdfBytes);
      
      onProgress({ total, current: i + 1, status: 'running' });
    } catch (e: any) {
      console.error(`Error generating certificate for ${member.id}:`, e);
      // Continuar con el resto aunque falle uno
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  onProgress({ total, current: total, status: 'completed' });
  return blob;
};

import { PDFDocument } from 'pdf-lib';

export const processBatchToSinglePdf = async (
  template: CertificateTemplate,
  membersData: Record<string, any>[],
  fonts: Map<string, string>,
  onProgress: (progress: BatchProgress) => void
): Promise<Uint8Array> => {
  const total = membersData.length;
  onProgress({ total, current: 0, status: 'running' });

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < total; i++) {
    const member = membersData[i];
    try {
      const pdfBytes = await generateCertificate(
        template.pdf_url,
        template.field_mappings,
        member,
        fonts
      );
      
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));

      onProgress({ total, current: i + 1, status: 'running' });
    } catch (e: any) {
      console.error(`Error generating certificate for ${member.id}:`, e);
    }
  }

  const bytes = await mergedPdf.save();
  onProgress({ total, current: total, status: 'completed' });
  return bytes;
};
