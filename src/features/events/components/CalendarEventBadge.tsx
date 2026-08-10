import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Users } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';

interface CalendarEventBadgeProps {
  event: DbEvent;
  onClick: () => void;
}

const CalendarEventBadge: React.FC<CalendarEventBadgeProps> = ({ event, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [align, setAlign] = useState<'left' | 'right' | 'center'>('center');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    
    // Calcular posición antes de mostrar
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Decidir si abrir hacia arriba o abajo
      if (rect.bottom > viewportHeight - 200) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }

      // Decidir alineación horizontal para evitar desborde a la derecha o izquierda
      if (rect.left < 150) {
        setAlign('left');
      } else if (rect.right > viewportWidth - 150) {
        setAlign('right');
      } else {
        setAlign('center');
      }
    }

    // Pequeño retraso para evitar destellos
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  // Limpiar timeout si se desmonta
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="block w-full truncate rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-left text-[10px] font-bold text-indigo-950 transition-colors hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/10 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
      >
        {event.start_time?.slice(0, 5) && (
          <span className="mr-1 opacity-60">{event.start_time.slice(0, 5)}</span>
        )}
        {event.emoji} {event.title}
      </button>

      {/* Portal/Absolute Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[100] w-64 rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 ${
              position === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
            } ${
              align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                {event.emoji} {event.title}
              </h4>
            </div>

            <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {event.start_time && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500" />
                  <span>
                    {event.start_time.slice(0, 5)} {event.end_time ? `- ${event.end_time.slice(0, 5)}` : ''}
                  </span>
                </div>
              )}
              
              {event.location_name && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <span className="line-clamp-2">{event.location_name}</span>
                </div>
              )}

              {event.ministries?.name && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-emerald-500" />
                  <span>{event.ministries.name}</span>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Haz clic para ver más información
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarEventBadge;
