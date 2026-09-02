import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

type ExportCell = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportCell>;

/**
 * Export tabular data as UTF-8 CSV. Excel opens this format natively and it
 * avoids shipping a vulnerable spreadsheet parser to the admin bundle.
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the sheet (optional)
 */
export const exportToCsv = (data: ExportRow[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const keys = Object.keys(data[0]);
    const escapeCell = (value: ExportCell) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [keys, ...data.map((row) => keys.map((key) => row[key]))]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo CSV exportado exitosamente (compatible con Excel)');
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    toast.error('Ocurrió un error al exportar los datos');
  }
};

/**
 * Export data to a PDF document with a table
 * @param title Document title
 * @param headers Array of column headers
 * @param data Array of arrays (rows) matching the headers
 * @param filename Name of the file (without extension)
 */
export const exportToPDF = (title: string, headers: string[], data: ExportCell[][], filename: string) => {
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
      body: data.map((row) => row.map((cell) => cell ?? '')),
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
