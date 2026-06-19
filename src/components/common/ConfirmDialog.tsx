import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function ConfirmDialog() {
  const { isOpen, options, onConfirm, onCancel } = useConfirmStore();

  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning',
  } = options;

  // Configuration based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          iconBg: 'bg-red-500/10 border border-red-500/20',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-98',
          borderClass: 'border-red-500/20',
          glowClass: 'from-red-500/5 to-transparent',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-98',
          borderClass: 'border-emerald-500/20',
          glowClass: 'from-emerald-500/5 to-transparent',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-accent-blue" />,
          iconBg: 'bg-accent-blue/10 border border-accent-blue/20',
          confirmBtn: 'bg-accent-blue hover:bg-accent-blue/90 text-white shadow-lg shadow-accent-blue/20 active:scale-98',
          borderClass: 'border-accent-blue/20',
          glowClass: 'from-accent-blue/5 to-transparent',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gold" />,
          iconBg: 'bg-gold/10 border border-gold/20',
          confirmBtn: 'bg-gold hover:bg-gold/90 text-white shadow-lg shadow-gold/20 active:scale-98',
          borderClass: 'border-gold/20',
          glowClass: 'from-gold/5 to-transparent',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0F172A] border ${styles.borderClass} text-slate-100 shadow-2xl p-6 md:p-7`}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${styles.glowClass} pointer-events-none`} />

            {/* Close button (top right) */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Animated/Glowing Icon */}
              <div className={`p-3.5 rounded-full ${styles.iconBg} mb-5 flex items-center justify-center shadow-inner`}>
                {styles.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs md:max-w-sm mb-7 whitespace-pre-line">
                {message}
              </p>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-end">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${styles.confirmBtn}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
