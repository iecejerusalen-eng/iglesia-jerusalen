import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, getEffectiveTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const effectiveTheme = getEffectiveTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = effectiveTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
        aria-label="Cambiar tema"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={effectiveTheme}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Icon size={18} />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 transform-gpu"
          >
            <div className="py-1">
              <button
                onClick={() => { setTheme('light'); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${theme === 'light' ? 'text-primary dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <Sun size={14} /> Claro
              </button>
              <button
                onClick={() => { setTheme('dark'); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${theme === 'dark' ? 'text-primary dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <Moon size={14} /> Oscuro
              </button>
              <button
                onClick={() => { setTheme('system'); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${theme === 'system' ? 'text-primary dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <Monitor size={14} /> Sistema
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
