import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import DOMPurify from 'dompurify';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  unlocked_at: string;
}

interface BadgeShowcaseProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
  isNewUnlock?: boolean;
}

export function BadgeShowcase({ badge, isOpen, onClose, isNewUnlock = false }: BadgeShowcaseProps) {
  useEffect(() => {
    if (isOpen && badge && isNewUnlock) {
      // Fire confetti when a new badge is unlocked and shown
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, badge, isNewUnlock]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full relative overflow-hidden shadow-2xl border border-gray-150 dark:border-white/10 text-center"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors z-20"
              >
                <X size={20} />
              </button>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />
              
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-150" />
                <div className="w-32 h-32 mx-auto relative z-10 flex items-center justify-center text-7xl drop-shadow-2xl animate-bounce-slow">
                  {badge.icon_url.includes('<svg') ? (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(badge.icon_url) }} />
                  ) : (
                    badge.icon_url
                  )}
                </div>
              </div>

              {isNewUnlock && (
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  ¡Nueva Insignia Desbloqueada!
                </span>
              )}

              <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-2">
                {badge.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {badge.description}
              </p>

              <div className="flex gap-3">
                <button className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={18} />
                  Compartir
                </button>
                <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                  Genial
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
