import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ArrowUp,
  RotateCw,
  Copy,
  FileText,
  Megaphone,
  Music2,
  Sun,
  Moon,
  Search,
  MessageSquareHeart,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { toast } from 'sonner';
import { CONTEXT_MENU_GROUPS } from '@/components/common/contextMenuItems';
import type { ContextMenuNavItem, ContextMenuActionItem } from '@/components/common/contextMenuItems';

// ── Icon registry (mobile) ─────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Calendar,
  Globe2,
  GraduationCap,
  ShoppingBag,
  MessageSquareHeart,
  Megaphone,
  FileText,
  UsersRound,
  Music2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Copy,
  Search,
  Sun,
  Moon,
};

// ── Utility: flat list of nav items for the main grid ─────────────────────
const NAV_ITEMS = CONTEXT_MENU_GROUPS.flatMap((g) =>
  g.items.filter((i): i is ContextMenuNavItem => i.type === 'nav')
);

// Toolbar actions (flat): back, forward, reload, copy
const TOOLBAR_KEYS = ['historyBack', 'historyForward', 'reload', 'copyLink', 'copyTitle', 'scrollTop'];
const TOOLBAR_ITEMS = CONTEXT_MENU_GROUPS.flatMap((g) =>
  g.items.filter(
    (i): i is ContextMenuActionItem =>
      i.type === 'action' && TOOLBAR_KEYS.includes(i.actionKey)
  )
);

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
  const location = useLocation();
  const { setTheme, getEffectiveTheme } = useThemeStore();
  const isDarkMode = getEffectiveTheme() === 'dark';

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
    toast.success(`Modo ${isDarkMode ? 'claro' : 'oscuro'} activado`);
    onClose();
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      console.error('No se pudo copiar el enlace.', error);
      toast.error('El navegador no permitió copiar el enlace.');
    } finally {
      onClose();
    }
  };

  const handleCopyTitle = async () => {
    const title = document.title.trim() || document.querySelector('h1')?.textContent?.trim();
    if (!title) {
      toast.error('Esta página no tiene un título para copiar.');
      onClose();
      return;
    }
    try {
      await navigator.clipboard.writeText(title);
      toast.success('Título de página copiado');
    } catch (error) {
      console.error('No se pudo copiar el título de la página.', error);
      toast.error('El navegador no permitió copiar el título.');
    } finally {
      onClose();
    }
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  /** Resolve action callbacks for toolbar items */
  const resolveAction = (actionKey: string) => {
    switch (actionKey) {
      case 'historyBack':    return () => { onClose(); window.history.back(); };
      case 'historyForward': return () => { onClose(); window.history.forward(); };
      case 'reload':         return () => { onClose(); window.location.reload(); };
      case 'copyLink':       return () => { void handleCopyLink(); };
      case 'copyTitle':      return () => { void handleCopyTitle(); };
      case 'scrollTop':      return handleScrollTop;
      default:               return () => toast.error('Esta acción no está disponible en esta página.');
    }
  };

  const toolbarLabel = (actionKey: string, label: string) => {
    const short: Record<string, string> = {
      historyBack: 'Atrás',
      historyForward: 'Adelante',
      reload: 'Recargar',
      copyLink: 'Copiar',
      copyTitle: 'Copiar título',
      scrollTop: 'Arriba',
    };
    return short[actionKey] ?? label;
  };

  const resolveIcon = (iconKey: string, className = 'w-5 h-5'): React.ReactNode => {
    if (iconKey === 'ThemeToggle') {
      const Icon = isDarkMode ? Sun : Moon;
      return <Icon className={className} />;
    }
    const Icon = ICON_MAP[iconKey];
    return Icon ? <Icon className={className} /> : null;
  };

  const currentPageTitle = document.title.trim() || 'Página actual';

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
            className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-sm"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú contextual móvil"
            className="fixed bottom-0 left-0 right-0 z-[101] flex max-h-[min(92dvh,48rem)] flex-col overflow-hidden rounded-t-[2rem] border-t border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            {/* Grab Handle */}
            <button type="button" className="flex cursor-grab justify-center px-5 pb-2 pt-3 active:cursor-grabbing" onClick={onClose} aria-label="Cerrar menú contextual">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-white/5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-red dark:text-gold">Accesos rápidos</p>
                <h3 className="mt-1 truncate font-serif text-xl font-bold text-primary dark:text-white">
                  Menú de Jerusalén
                </h3>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{currentPageTitle}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar menú rápido"
                className="ml-3 flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:text-gray-800 dark:bg-slate-800 dark:text-gray-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">

              {/* ── Sección 1: Navegación (auto-generada desde CONTEXT_MENU_GROUPS) */}
              <div>
                <h4 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  Navegación Principal
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`flex min-h-14 items-center gap-2.5 rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'border-primary/20 bg-primary/5 dark:border-gold/20 dark:bg-gold/10' : 'border-gray-100 bg-gray-50/80 hover:bg-gray-100 dark:border-white/5 dark:bg-slate-800/60 dark:hover:bg-slate-800'}`}
                    >
                      <div className={`shrink-0 rounded-xl p-2 ${item.colorClasses}`}>
                        {resolveIcon(item.iconKey, 'h-4 w-4')}
                      </div>
                      <span className="line-clamp-2 text-xs font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        {/* Shorten label for grid readability */}
                        {item.label.replace(' y Horarios', '').replace(' Virtual', '').replace(' y Contacto', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sección 2: Ruta GPS (siempre presente) */}
              <div>
                <button
                  onClick={() => { onClose(); onOpenRoute(); }}
                  className="flex w-full items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 transition-all hover:bg-rose-500/20 active:scale-[0.99] dark:bg-rose-500/15"
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

              {/* ── Sección 3: Toolbar (auto-generado desde CONTEXT_MENU_GROUPS) */}
              <div>
                <h4 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  Herramientas y Navegador
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {TOOLBAR_ITEMS.map((item) => (
                    <button
                      key={item.actionKey}
                      onClick={resolveAction(item.actionKey)}
                      className="flex min-h-16 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/80 p-2 text-gray-700 transition-all hover:bg-gray-100 active:scale-[0.98] dark:border-white/5 dark:bg-slate-800/60 dark:text-gray-300 dark:hover:bg-slate-800"
                    >
                      <span className="mb-1 text-gray-500 dark:text-gray-400">
                        {resolveIcon(item.iconKey)}
                      </span>
                      <span className="text-xs font-medium">{toolbarLabel(item.actionKey, item.label)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sección 4: Preferencias (búsqueda + tema) */}
              <div>
                  <h4 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  Preferencias y Búsqueda
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {/* Buscar */}
                  <button
                    onClick={() => { onClose(); onOpenSearch(); }}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 text-left transition-all hover:bg-gray-100 active:scale-[0.98] dark:border-white/5 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Buscar...</span>
                  </button>

                  {/* Tema */}
                  <button
                    onClick={toggleTheme}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 text-left transition-all hover:bg-gray-100 active:scale-[0.98] dark:border-white/5 dark:bg-slate-800/60 dark:hover:bg-slate-800"
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
