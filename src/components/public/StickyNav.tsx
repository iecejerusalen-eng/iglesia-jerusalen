import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Home, Info, Calendar, Users, 
  MapPin, Send, BookOpen
} from 'lucide-react';
import { AnimeFadeUp } from '../animations/AnimeWrappers';

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

export default function StickyNav() {
  const { pathname } = useLocation();
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const [activeSection, setActiveSection] = useState('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const SECTIONS = useMemo(() => {
    let list: Section[] = [];
    if (cleanPath === '/' || cleanPath === '/inicio') {
      list = [
        { id: 'hero', label: 'Inicio', icon: Home },
        { id: 'about', label: 'Doctrina', icon: Info },
        { id: 'schedules', label: 'Horarios', icon: Calendar },
        { id: 'events', label: 'Eventos', icon: Users },
        { id: 'sermons', label: 'Prédicas', icon: BookOpen },
      ];
    } else if (cleanPath === '/contacto') {
      list = [
        { id: 'contact_hero', label: 'Contacto', icon: Send },
        { id: 'contact_info', label: 'Ubicación', icon: MapPin },
      ];
    }
    return list;
  }, [cleanPath]);

  useEffect(() => {
    if (SECTIONS.length > 0) {
      setActiveSection(SECTIONS[0].id);
    }
  }, [cleanPath, SECTIONS]);

  useEffect(() => {
    if (SECTIONS.length === 0) return;

    let isScrolling = false;
    const handleScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      requestAnimationFrame(() => {
        let currentSectionId = SECTIONS[0].id;
        let maxVisibleHeight = 0;
        let closestToCenterId = SECTIONS[0].id;
        let minDistanceToCenter = Infinity;

        SECTIONS.forEach((section) => {
          const element = document.getElementById(section.id);
          if (element) {
            const rect = element.getBoundingClientRect();
            // Calculate how much of the element is visible in the viewport
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(window.innerHeight, rect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);

            // Distance of the element's center to the viewport center
            const elementCenter = rect.top + rect.height / 2;
            const distanceToCenter = Math.abs(elementCenter - window.innerHeight / 2);

            if (visibleHeight > maxVisibleHeight) {
              maxVisibleHeight = visibleHeight;
              currentSectionId = section.id;
            }

            if (distanceToCenter < minDistanceToCenter) {
              minDistanceToCenter = distanceToCenter;
              closestToCenterId = section.id;
            }
          }
        });

        // Use the section with the maximum visible height if it's significant, otherwise closest to center
        const activeId = maxVisibleHeight > 100 ? currentSectionId : closestToCenterId;

        if (activeId) {
          setActiveSection(activeId);
        }
        isScrolling = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    // Check periodically to ensure dynamically loaded sections are captured
    const timeoutId = setTimeout(handleScroll, 100);
    const intervalId = setInterval(handleScroll, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [cleanPath, SECTIONS]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  if (SECTIONS.length === 0) {
    return null;
  }

  return (
    <AnimeFadeUp
      delay={0.2}
      duration={600}
      distance={50}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-6 glass-nav px-3.5 py-7 rounded-full"
    >
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        const isHovered = hoveredSection === section.id;
        const Icon = section.icon;

        return (
          <div
            key={section.id}
            className="relative flex items-center justify-center cursor-pointer group"
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => scrollToSection(section.id)}
          >
            <AnimatePresence>
              {isHovered && (
                 <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: -10, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-10 px-3 py-1.5 bg-primary dark:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md whitespace-nowrap border border-white/10 pointer-events-none"
                >
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-8 h-8 flex items-center justify-center">
              {isActive && (
                <motion.div
                  layoutId="activeStickyRing"
                  className="absolute inset-0 rounded-full border-2 border-primary dark:border-blue-500 bg-transparent shadow-xs"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.15 : isHovered ? 1.25 : 1,
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isActive 
                    ? 'bg-primary dark:bg-blue-600 text-white' 
                    : isHovered 
                    ? 'bg-gold text-white' 
                    : 'bg-white dark:bg-slate-800 text-primary dark:text-gray-300 border border-slate-200/50 dark:border-white/5'
                }`}
              >
                <Icon size={12} strokeWidth={isActive || isHovered ? 3 : 2} />
              </motion.div>
            </div>
          </div>
        );
      })}
    </AnimeFadeUp>
  );
}
