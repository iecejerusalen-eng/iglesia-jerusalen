import React, { useState } from 'react';
import { QrCode, CheckCircle2, ShieldAlert, User, Phone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const QRCheckInKiosk: React.FC = () => {
  const [eventType, setEventType] = useState<'sunday_service' | 'kids_ministry'>('sunday_service');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [allergyNotes, setAllergyNotes] = useState('');
  const [securityCode, setSecurityCode] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor escribe tu nombre');
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSecurityCode(code);
    setCheckedIn(true);
    toast.success('¡Check-in realizado con éxito!');
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setAllergyNotes('');
    setSecurityCode(null);
    setCheckedIn(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
          <QrCode className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Kiosko de Check-In Asistencia
        </h2>
        <p className="text-sm text-slate-500">
          Registra tu asistencia o la de tus hijos en segundos
        </p>
      </div>

      {checkedIn ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              ¡Bienvenido(a), {name}!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tu asistencia al servicio ha sido registrada.
            </p>
          </div>

          {eventType === 'kids_ministry' && securityCode && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-dashed border-amber-400 dark:border-amber-600 space-y-1">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                Código de Seguridad para Retiro de Niños
              </span>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-widest font-mono">
                {securityCode}
              </div>
              <p className="text-[11px] text-slate-400">
                Muestra este código al líder de Escuela Dominical para retirar a tu hijo(a).
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Registrar a otra persona
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEventType('sunday_service')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                eventType === 'sunday_service'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
              }`}
            >
              Culto Dominical
            </button>
            <button
              type="button"
              onClick={() => setEventType('kids_ministry')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                eventType === 'kids_ministry'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
              }`}
            >
              Escuela Dominical (Niños)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María López"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Teléfono (WhatsApp)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +593 99 123 4567"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {eventType === 'kids_ministry' && (
            <div>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Alergias / Indicaciones Médicas
              </label>
              <textarea
                value={allergyNotes}
                onChange={(e) => setAllergyNotes(e.target.value)}
                placeholder="Alergia a mani, gluten, medicinas..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm h-16"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Sparkles className="w-4 h-4" />
            Completar Check-In
          </button>
        </form>
      )}
    </div>
  );
};
