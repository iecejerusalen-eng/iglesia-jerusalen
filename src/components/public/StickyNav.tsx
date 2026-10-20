import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp, Navigation as NavIcon, X } from 'lucide-react';
import { getSectionsForPath } from '../../config/sectionNavigationConfig';

export default function StickyNav() {
  const { pathname } = useLocation();
  const [activeSection, setActiveSection] = useState('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageNavInfo = useMemo(() => {
    return getSectionsForPath(pathname);
  }, [pathname]);

  const sections = useMemo(() => pageNavInfo?.sections ?? [], [pageNavInfo]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    let isTicking = false;
    let frameId: number | null = null;

    const getElementForSectionId = (id: string): HTMLElement | null => {
      return (
        document.getElementById(id) ||
        document.getElementById(id.replace('system_', 'home_')) ||
        document.getElementById(id.replace('home_', 'system_'))
      );
    };

    const handleScroll = () => {
      if (isTicking) return;
      isTicking = true;

      frameId = requestAnimationFrame(() => {
        let currentActive = sections[0].id;
        let maxVisibleHeight = 0;
        let minDistanceToCenter = Infinity;

        sections.forEach((section) => {
          const element = getElementForSectionId(section.id);
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
          setActiveSection((previous) => previous === currentActive ? previous : currentActive);
        }
        isTicking = false;
        frameId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    // Check after dynamic mounts
    const timeoutId = setTimeout(handleScroll, 200);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pathname, sections]);

  const scrollToSection = (id: string) => {
    const element =
      document.getElementById(id) ||
      document.getElementById(id.replace('system_', 'home_')) ||
      document.getElementById(id.replace('home_', 'system_'));
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
      {/* DESKTOP FLOATING SIDEBAR */}
      <nav
        aria-label="Navegación de secciones de página"
        className="fixed right-4 top-1/2 z-40 hidden max-h-[calc(100dvh-2rem)] -translate-y-1/2 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-[1.75rem] border border-white/80 bg-white/80 p-2 shadow-[0_16px_48px_-20px_rgba(15,23,42,.38)] backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-slate-950/80 lg:flex"
      >
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const isHovered = hoveredSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="relative flex items-center justify-center">
              {/* Botón de Sección */}
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                onFocus={() => setHoveredSection(section.id)}
                onBlur={() => setHoveredSection(null)}
                aria-label={`Navegar a ${section.label}`}
                aria-current={isActive ? 'location' : undefined}
                className={`relative flex size-10 shrink-0 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-amber-300/70 dark:bg-indigo-600 dark:ring-amber-300/50'
                    : isHovered
                    ? 'bg-amber-400 text-slate-900 shadow-sm dark:bg-amber-500'
                    : 'border border-slate-200/70 bg-white/90 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900 dark:border-white/10 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <Icon aria-hidden="true" className="size-[18px]" strokeWidth={isActive || isHovered ? 2.4 : 2} />
              </button>
            </div>
          );
        })}
      </nav>

      {/* MOBILE COMPACT FLOATING DOCK */}
      <div className="fixed right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 md:hidden flex flex-col items-end gap-2">
        {/* Desplegable de Secciones Móvil */}
        {isMobileMenuOpen && (
          <nav id="mobile-section-menu" aria-label="Secciones de la página" className="flex max-h-[60dvh] flex-col gap-1.5 overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/95 p-2 text-white shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 custom-scrollbar dark:bg-slate-950/95">
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
                  aria-current={isActive ? 'location' : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
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
          </nav>
        )}

        {/* Botón Gatillo Flotante Móvil */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-section-menu"
          className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-slate-900/95 text-white shadow-[0_12px_30px_-10px_rgba(15,23,42,.7)] backdrop-blur-xl transition-transform active:scale-95 dark:border-white/20 dark:bg-slate-800/95"
        >
          {isMobileMenuOpen ? <X className="size-5 text-amber-300" aria-hidden="true" /> : <NavIcon className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}
