import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShieldCheck, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalIDCardProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    email: string;
  };
}

export function DigitalIDCard({ isOpen, onClose, student }: DigitalIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const verificationUrl = `${window.location.origin}/verify/${student.id}`;

  const handleDownload = () => {
    // Basic download functionality for the future, perhaps using html2canvas
    alert('Funcionalidad de descarga en desarrollo. Por ahora puedes tomar una captura de pantalla.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative max-w-sm w-full"
        >
          {/* Card Container */}
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden border-2 border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-gold/10 relative"
          >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            {/* Header */}
            <div className="bg-gold text-slate-950 p-6 text-center relative z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <img src="/logo.png" alt="Iglesia Jerusalén" className="h-12 mx-auto mb-2 relative z-10 drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <h2 className="font-black font-serif text-xl tracking-tight relative z-10">IGLESIA JERUSALÉN</h2>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 relative z-10">Credencial Estudiantil</p>
            </div>

            {/* Body */}
            <div className="p-8 flex flex-col items-center text-center relative z-10">
              <div className="relative mb-6 w-32 h-32 shrink-0 mx-auto">
                <div className="absolute inset-0 bg-gold rounded-full blur-md opacity-30 animate-pulse"></div>
                {student.avatarUrl ? (
                  <img 
                    src={student.avatarUrl} 
                    alt={student.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-900 relative z-10 shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-gray-500 relative z-10 shadow-xl">
                    <User size={48} />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900 z-20 flex items-center justify-center shadow-lg" title="Estudiante Activo">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-1 leading-tight">{student.name}</h3>
              <p className="text-sm text-gray-400 font-medium mb-1">{student.email}</p>
              
              <div className="px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full mt-3 mb-6">
                <span className="text-sm font-bold text-gold uppercase tracking-wider">{student.role === 'student' ? 'Estudiante' : student.role}</span>
              </div>

              {/* QR Section */}
              <div className="bg-white p-4 rounded-2xl shadow-lg mb-2">
                <QRCodeSVG 
                  value={verificationUrl}
                  size={140}
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a" // slate-900
                />
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                Escanear para verificar validez
              </p>
            </div>

            {/* Footer */}
            <div className="bg-slate-950/80 backdrop-blur-md p-4 text-center border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-medium">
                Documento Personal e Intransferible<br/>
                Válido para el periodo académico actual
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              <Download size={18} /> Descargar
            </button>
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-xl transition-colors shadow-lg"
            >
              <X size={18} /> Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
