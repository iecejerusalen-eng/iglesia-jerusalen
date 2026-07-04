import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { FieldMapping } from '../types';
import { resolveFieldValue, applyTextTransform } from './fieldTransforms';

// Función para parsear color hexadecimal a rgb de pdf-lib
const parseColor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

export const generateCertificate = async (
  templatePdfUrl: string,
  fieldMappings: FieldMapping[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memberData: Record<string, any>,
  fonts: Map<string, string> // Map de fontId -> fontUrl
): Promise<Uint8Array> => {
  // 1. Descargar el PDF base
  const templateBytes = await fetch(templatePdfUrl).then((res) => res.arrayBuffer());
  
  // 2. Cargar el PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // 3. Descargar y embeber fuentes personalizadas
  const embeddedFonts = new Map<string, PDFFont>();
  for (const [fontId, fontUrl] of Array.from(fonts.entries())) {
    try {
      const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);
      embeddedFonts.set(fontId, customFont);
    } catch (e) {
      console.warn(`Error cargando fuente ${fontId}:`, e);
    }
  }

  // Fallback font
  const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 4. Obtener la primera página
  const pages = pdfDoc.getPages();
  const page = pages[0];

  // 5. Inyectar los datos en los campos mapeados
  for (const field of fieldMappings) {
    let text = resolveFieldValue(field.memberField, memberData);
    text = applyTextTransform(text, field.transform);

    if (!text) continue;

    const font = field.fontId && embeddedFonts.has(field.fontId) 
      ? embeddedFonts.get(field.fontId)! 
      : defaultFont;

    // Calcular el ancho del texto para la alineación
    const textWidth = font.widthOfTextAtSize(text, field.fontSize);
    
    // Ajustar X según la alineación
    let drawX = field.x;
    if (field.alignment === 'center') {
      drawX = field.x - (textWidth / 2);
    } else if (field.alignment === 'right') {
      drawX = field.x - textWidth;
    }

    // Ajustar si el texto excede el maxWidth (truncar u otra estrategia, simplificado aquí)
    const textToDraw = text;
    if (textWidth > field.maxWidth) {
       // Podríamos reducir el fontSize o truncar, aquí reducimos el tamaño dinámicamente o truncamos.
       // Para simplicidad, solo truncamos.
       // TODO: Implementar lógica de text wrapping o downscaling.
    }

    page.drawText(textToDraw, {
      x: drawX,
      y: field.y,
      size: field.fontSize,
      font: font,
      color: parseColor(field.color),
    });
  }

  // 6. Serializar y devolver
  return await pdfDoc.save();
};
