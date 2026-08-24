import React from 'react';
import { Download, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AnnualTaxReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorName: string;
  donorRucOrCedula?: string;
  year: number;
  totalDonated: number;
}

export const AnnualTaxReceiptModal: React.FC<AnnualTaxReceiptModalProps> = ({
  isOpen,
  onClose,
  donorName,
  donorRucOrCedula = '1790000000001',
  year,
  totalDonated,
}) => {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    toast.success(`Descargando certificado de contribución fiscal ${year}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Certificado de Aportes {year}
          </h3>
          <p className="text-xs text-slate-500">
            Comprobante oficial para deducción y deducibilidad de impuestos
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Institución Beneficiaria:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Iglesia del Evangelio Cuadrangular
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Nombre del Donante:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{donorName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">RUC / Cédula:</span>
            <span className="font-mono text-slate-800 dark:text-slate-100">{donorRucOrCedula}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Año Fiscal:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{year}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black">
            <span className="text-emerald-600 dark:text-emerald-400">Total Donado Acumulado:</span>
            <span className="text-slate-900 dark:text-white">${totalDonated.toFixed(2)} USD</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            Cerrar
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Descargar PDF Oficial
          </button>
        </div>
      </div>
    </div>
  );
};
