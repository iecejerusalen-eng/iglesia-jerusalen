import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Calendar,
  Globe2,
  GraduationCap,
  ShoppingBag,
  MapPin,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Copy,
  Sun,
  Moon,
  Search,
  MessageSquareHeart,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { toast } from 'sonner';

interface MobileContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoute: () => void;
  onOpenSearch: () => void;
}

export function MobileContextDrawer({
  isOpen,
  onClose,
  onOpenRoute,
  onOpenSearch,
}: MobileContextDrawerProps) {
  const navigate = useNavigate();
  const { setTheme, getEffectiveTheme } = useThemeStore();
  const isDarkMode = getEffectiveTheme() === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
    toast.success(`Modo ${isDarkMode ? 'claro' : 'oscuro'} activado`);
    onClose();
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace copiado al portapapeles');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-gray-100 dark:border-white/10 md:hidden max-h-[85vh] flex flex-col overflow-hidden pb-safe"
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-2 flex justify-center cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="font-serif font-bold text-lg text-primary dark:text-white">
                  Menú Rápido de Jerusalén
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Acceso directo a funciones y navegación
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar menú rápido"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Sección 1: Navegación Principal */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Navegación Principal
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNavigate('/')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                      <Home className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Inicio</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/eventos')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Eventos</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/misiones')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Misiones</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/universidad')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aula Virtual</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/tienda')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tienda</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/contacto')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                      <MessageSquareHeart className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Contacto</span>
                  </button>
                </div>
              </div>

              {/* Sección 2: Ruta y Ubicación */}
              <div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenRoute();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-sm text-rose-600 dark:text-rose-400">
                        ¿Cómo llegar a la Iglesia?
                      </span>
                      <span className="text-xs text-rose-500/80 dark:text-rose-400/80">
                        Ver ruta interactiva en el mapa
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-rose-500 text-white px-2.5 py-1 rounded-full">
                    GPS
                  </span>
                </button>
              </div>

              {/* Sección 3: Herramientas y Navegador */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Herramientas y Navegador
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      window.history.back();
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium">Atrás</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      window.history.forward();
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-[0.98]"
                  >
                    <ArrowRight className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium">Adelante</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-[0.98]"
                  >
                    <RotateCw className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium">Recargar</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-[0.98]"
                  >
                    <Copy className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium">Copiar</span>
                  </button>
                </div>
              </div>

              {/* Sección 4: Preferencias */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Preferencias y Búsqueda
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSearch();
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Buscar...</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-all active:scale-[0.98]"
                  >
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' : 'bg-slate-100 text-slate-700'}`}>
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
