import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';
import Section1Overview from './Section1Overview';
import Section2Public from './Section2Public';
import Section3Admin from './Section3Admin';
import Section4Technical from './Section4Technical';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function PresentationLayout() {
  const [activeSection, setActiveSection] = useState(0);
  const { theme, setTheme } = useThemeStore();
  
  const sections = [
    { id: 'overview', title: 'Resumen del Proyecto' },
    { id: 'public', title: 'Página Pública' },
    { id: 'admin', title: 'Panel de Administración' },
    { id: 'tech', title: 'Detalles Técnicos' }
  ];

  // Scroll handler for snapping between sections
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Small debounce to prevent multiple scroll fires
      if (document.body.style.pointerEvents === 'none') return;
      document.body.style.pointerEvents = 'none';
      setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 800);

      if (e.deltaY > 50) {
        setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
      } else if (e.deltaY < -50) {
        setActiveSection(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [sections.length]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(nextTheme);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans relative selection:bg-indigo-500/30">
      
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px]" />
      </div>

      {/* Floating Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <Monitor className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-xl tracking-tight hidden md:block">
            Iglesia Jerusalén <span className="font-light text-gray-500 dark:text-gray-400">| Plataforma Web</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-white/50 dark:bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border border-gray-200 dark:border-gray-800 shadow-sm">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(idx)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeSection === idx 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Slide transitions */}
      <main className="relative w-full h-full z-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {activeSection === 0 && <Section1Overview onNext={() => setActiveSection(1)} />}
            {activeSection === 1 && <Section2Public onNext={() => setActiveSection(2)} />}
            {activeSection === 2 && <Section3Admin onNext={() => setActiveSection(3)} />}
            {activeSection === 3 && <Section4Technical />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Progress Indicators (Mobile / Side) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSection(idx)}
            className={`w-3 rounded-full transition-all duration-300 ${
              activeSection === idx 
                ? 'h-10 bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
                : 'h-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
            }`}
            aria-label={`Go to section ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
