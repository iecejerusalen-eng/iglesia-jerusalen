import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, ArrowRight, ShieldCheck, Heart, BookOpen, Calendar, Gift, Globe, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_MODULES } from '../../config/adminModules';

interface NavigationItem {
  id: string;
  title: string;
  category: 'admin' | 'public';
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const PUBLIC_NAV_ITEMS: NavigationItem[] = [
  { id: 'pub-1', title: 'Inicio / Portal Principal', category: 'public', path: '/', icon: Globe },
  { id: 'pub-2', title: 'Predicas & Sermones en Video', category: 'public', path: '/sermones', icon: BookOpen },
  { id: 'pub-3', title: 'Podcast & Audio Mensajes', category: 'public', path: '/podcast', icon: Sparkles },
  { id: 'pub-4', title: 'Donaciones, Diezmos y Ofrendas', category: 'public', path: '/donations', icon: Gift },
  { id: 'pub-5', title: 'Muro de la Comunidad', category: 'public', path: '/comunidad', icon: Heart },
  { id: 'pub-6', title: 'Juegos Bíblicos Educativos', category: 'public', path: '/recursos/juegos', icon: Sparkles },
  { id: 'pub-7', title: 'Biblioteca de Alabanzas & Letras', category: 'public', path: '/recursos/alabanzas', icon: Layers },
  { id: 'pub-8', title: 'Plan de Lectura Bíblica', category: 'public', path: '/plan-lectura', icon: BookOpen },
  { id: 'pub-9', title: 'Eventos & Calendario', category: 'public', path: '/eventos', icon: Calendar },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine Admin modules and Public items
  const allItems: NavigationItem[] = [
    ...PUBLIC_NAV_ITEMS,
    ...ADMIN_MODULES.map(m => ({
      id: `admin-${m.id}`,
      title: `${m.name} (${m.label})`,
      category: 'admin' as const,
      path: m.path,
      icon: (m.icon as React.ComponentType<{ className?: string }>) || ShieldCheck,
      keywords: [m.group, m.name.toLowerCase()],
    })),
  ];

  const filteredItems = allItems.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.some(k => k.toLowerCase().includes(q)))
    );
  });

  const openPalette = () => {
    setQuery('');
    setSelectedIndex(0);
    setIsOpen(true);
  };

  const closePalette = () => {
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) {
            setQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
      } else if (e.key === 'Escape' && isOpen) {
        closePalette();
      }
    };

    const handleCustomOpen = () => openPalette();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (path: string) => {
    closePalette();
    navigate(path);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            {/* SEARCH INPUT BAR */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-900/60">
              <Search className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Escribe un comando o busca un módulo (ej. sermones, miembros, donaciones)..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={closePalette}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-bold cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* RESULTS LIST */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron comandos o módulos para "{query}"
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-white border border-amber-500/30 font-semibold'
                          : 'text-slate-300 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.category === 'admin' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.path}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <span>Ir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* FOOTER */}
            <div className="px-4 py-2 bg-slate-900/90 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                Usa <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">↓</kbd> para navegar
              </span>
              <span className="flex items-center gap-1">
                Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">ENTER</kbd> para seleccionar
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
