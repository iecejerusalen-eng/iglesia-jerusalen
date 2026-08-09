import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp, Navigation as NavIcon } from 'lucide-react';
import { getSectionsForPath } from '../../config/sectionNavigationConfig';

export default function StickyNav() {
  const { pathname } = useLocation();
  const [activeSection, setActiveSection] = useState('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageNavInfo = useMemo(() => {
    return getSectionsForPath(pathname);
  }, [pathname]);

  const sections = pageNavInfo?.sections || [];

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSection('');
      return;
    }

    let isTicking = false;

    const handleScroll = () => {
      if (isTicking) return;
      isTicking = true;

      requestAnimationFrame(() => {
        let currentActive = sections[0].id;
        let maxVisibleHeight = 0;
        let minDistanceToCenter = Infinity;

        sections.forEach((section) => {
          const element = document.getElementById(section.id);
          if (element) {
            const rect = element.getBoundingClientRect();
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(window.innerHeight, rect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);

            const elementCenter = rect.top + rect.height / 2;
            const distanceToCenter = Math.abs(elementCenter - window.innerHeight / 2);

            if (visibleHeight > maxVisibleHeight) {
              maxVisibleHeight = visibleHeight;
              currentActive = section.id;
            }

            if (distanceToCenter < minDistanceToCenter) {
              minDistanceToCenter = distanceToCenter;
              if (maxVisibleHeight < 120) {
                currentActive = section.id;
              }
            }
          }
        });

        if (currentActive) {
          setActiveSection(currentActive);
        }
        isTicking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    // Check after dynamic mounts
    const timeoutId = setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pathname, sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {/* DESKTOP FLOATING SIDEBAR (GLASSMORPHISM) */}
      <aside 
        aria-label="Navegación de secciones de página"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3 p-2.5 rounded-full backdrop-blur-xl bg-white/40 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.12)] transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/80 group/sidebar"
      >
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const isHovered = hoveredSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="relative flex items-center justify-center">
              {/* Tooltip flotante */}
              <div
                className={`absolute right-12 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none transition-all duration-200 backdrop-blur-md ${
                  isHovered
                    ? 'opacity-100 -translate-x-1 scale-100'
                    : 'opacity-0 translate-x-3 scale-95'
                }`}
              >
                {section.label}
              </div>

              {/* Botón de Sección */}
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                aria-label={`Navegar a ${section.label}`}
                title={section.label}
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary dark:bg-indigo-600 text-white shadow-md shadow-primary/30 scale-110'
                    : isHovered
                    ? 'bg-amber-400 dark:bg-amber-500 text-slate-900 scale-105 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-white/5'
                }`}
              >
                {/* Anillo de pulso/resaltado para sección activa */}
                {isActive && (
                  <span className="absolute -inset-1 rounded-full border-2 border-primary/40 dark:border-indigo-400/40 animate-pulse pointer-events-none" />
                )}

                {/* Ícono SVG minimalista */}
                <Icon className="w-4 h-4" strokeWidth={isActive || isHovered ? 2.5 : 2} />
              </button>
            </div>
          );
        })}
      </aside>

      {/* MOBILE COMPACT FLOATING DOCK */}
      <div className="fixed right-3 bottom-24 z-40 md:hidden flex flex-col items-end gap-2">
        {/* Desplegable de Secciones Móvil */}
        {isMobileMenuOpen && (
          <div className="flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-2xl bg-slate-900/90 dark:bg-slate-950/95 text-white border border-white/15 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-0.5 border-b border-white/10">
              Secciones
            </span>
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-400 hover:bg-white/10 border-t border-white/10 mt-1"
            >
              <ChevronUp className="w-3.5 h-3.5" /> Ir al inicio
            </button>
          </div>
        )}

        {/* Botón Gatillo Flotante Móvil */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Abrir menú de secciones"
          className="flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-xl bg-slate-900/90 dark:bg-slate-800/90 text-white border border-white/20 shadow-lg active:scale-95 transition-transform"
        >
          <NavIcon className={`w-5 h-5 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 text-amber-400' : ''}`} />
        </button>
      </div>
    </>
  );
}
