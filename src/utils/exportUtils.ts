import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

/**
 * Export data to an Excel (.xlsx) file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the sheet (optional)
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Datos') => {
  try {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-adjust column widths based on content
    const colWidths = [];
    const keys = Object.keys(data[0]);
    for (let i = 0; i < keys.length; i++) {
      let maxWidth = keys[i].length;
      for (let j = 0; j < data.length; j++) {
        const val = data[j][keys[i]];
        if (val) {
          const valStr = val.toString();
          if (valStr.length > maxWidth) maxWidth = valStr.length;
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) }); // Cap at 50 chars
    }
    worksheet['!cols'] = colWidths;

    // Generate file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Archivo Excel exportado exitosamente');
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    toast.error('Ocurrió un error al exportar el archivo');
  }
};

/**
 * Export data to a PDF document with a table
 * @param title Document title
 * @param headers Array of column headers
 * @param data Array of arrays (rows) matching the headers
 * @param filename Name of the file (without extension)
 */
export const exportToPDF = (title: string, headers: string[], data: any[][], filename: string) => {
  try {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
    toast.success('Archivo PDF exportado exitosamente');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    toast.error('Ocurrió un error al exportar el documento');
  }
};
