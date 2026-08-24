import React, { useState, useEffect } from 'react';
import type { GivingFund } from '../types';
import { givingService } from '../services/givingService';
import { Heart, CreditCard, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface OnlineGivingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineGivingModal: React.FC<OnlineGivingModalProps> = ({ isOpen, onClose }) => {
  const [funds, setFunds] = useState<GivingFund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [coverFees, setCoverFees] = useState<boolean>(true);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      givingService.getActiveFunds().then((data) => {
        setFunds(data);
        if (data.length > 0) setSelectedFundId(data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const estimatedFee = coverFees ? Number((currentAmount * 0.029 + 0.3).toFixed(2)) : 0;
  const totalAmount = currentAmount + estimatedFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAmount || currentAmount <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }
    if (!donorName || !donorEmail) {
      toast.error('Por favor completa tus datos de contacto');
      return;
    }

    setLoading(true);
    try {
      await givingService.processDonation({
        donor_name: donorName,
        donor_email: donorEmail,
        amount: currentAmount,
        fund_id: selectedFundId,
        cover_fees: coverFees,
        is_recurring: isRecurring,
        frequency,
      });
      setCompleted(true);
      toast.success('¡Muchas gracias por tu siembra y generosidad!');
    } catch {
      toast.error('Ocurrió un error al procesar el aporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {completed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              ¡Aporte Recibido con Éxito!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gracias por impulsar la obra de Dios. Hemos enviado el comprobante a{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{donorEmail}</span>.
            </p>
            <button
              onClick={() => {
                setCompleted(false);
                onClose();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Dar Online — Iglesia Jerusalén
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Selecciona el Fondo
              </label>
              <select
                value={selectedFundId}
                onChange={(e) => setSelectedFundId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium"
              >
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Monto del Aporte
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-lg font-bold text-sm border transition-all ${
                      amount === val && !customAmount
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Otro monto personalizado ($)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Cubrir la comisión bancaria de ${estimatedFee.toFixed(2)} para que la iglesia reciba el 100%
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Convertir en donación periódica programada
                </span>
              </label>

              {isRecurring && (
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly')}
                    className={`flex-1 py-1 text-xs rounded border ${
                      frequency === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800'
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('monthly')}
                    className={`flex-1 py-1 text-xs rounded border ${
                      frequency === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800'
                    }`}
                  >
                    Mensual
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tu Nombre completo"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
              />
              <input
                type="email"
                placeholder="Tu Correo electrónico"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Tarjeta de Crédito / Débito</span>
                <span className="flex items-center gap-1 text-emerald-600 text-[10px]">
                  <ShieldCheck className="w-3 h-3" /> PCI Level 1 SSL
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Procesando aporte...' : `Donar $${totalAmount.toFixed(2)} USD`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
