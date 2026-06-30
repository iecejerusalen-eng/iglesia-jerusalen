import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';
import Section1Overview from './Section1Overview';
import Section2LMS from './Section2LMS';
import Section3MediaGames from './Section3MediaGames';
import Section4CommunityStore from './Section4CommunityStore';
import Section5Admin from './Section5Admin';
import Section6Tech from './Section6Tech';
import { Moon, Sun, Church } from 'lucide-react';

export default function PresentationLayout() {
  const [activeSection, setActiveSection] = useState(0);
  const { theme, setTheme } = useThemeStore();
  
  const sections = [
    { id: 'overview', title: 'Inicio' },
    { id: 'lms', title: 'Educación' },
    { id: 'media', title: 'Multimedia & Juegos' },
    { id: 'community', title: 'Comunidad & Tienda' },
    { id: 'admin', title: 'Centro Admin' },
    { id: 'tech', title: 'Arquitectura' }
  ];

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent multiple scroll triggers
      if (document.body.style.pointerEvents === 'none') return;
      
      // We only want to trigger next section if we are at the bottom of the current section, 
      // or at the top. Since these are full height sections, we check deltaY
      if (e.deltaY > 50) {
        document.body.style.pointerEvents = 'none';
        setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 1000);
        setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
      } else if (e.deltaY < -50) {
        document.body.style.pointerEvents = 'none';
        setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 1000);
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
    <div className="h-screen w-full overflow-hidden bg-surface dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans relative selection:bg-gold-500/30">
      
      {/* Background ambient effects - Gold & Primary */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 dark:bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C79D3F]/10 dark:bg-[#C79D3F]/15 blur-[120px]" />
      </div>

      {/* Floating Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#9D660E] to-[#FFD679] rounded-lg shadow-lg">
            <Church className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight hidden md:block">
            Jerusalén <span className="font-sans font-light text-gray-500 dark:text-gray-400 text-sm">| Ecosistema</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-full p-1.5 border border-gray-200 dark:border-white/10 shadow-sm">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(idx)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === idx 
                    ? 'bg-gold-gradient text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>

          <button 
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Slide transitions */}
      <main className="relative w-full h-full z-10 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {activeSection === 0 && <Section1Overview onNext={() => setActiveSection(1)} />}
            {activeSection === 1 && <Section2LMS onNext={() => setActiveSection(2)} />}
            {activeSection === 2 && <Section3MediaGames onNext={() => setActiveSection(3)} />}
            {activeSection === 3 && <Section4CommunityStore onNext={() => setActiveSection(4)} />}
            {activeSection === 4 && <Section5Admin onNext={() => setActiveSection(5)} />}
            {activeSection === 5 && <Section6Tech />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Progress Indicators (Mobile / Side) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 lg:hidden">
        {sections.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSection(idx)}
            className={`w-2.5 rounded-full transition-all duration-300 ${
              activeSection === idx 
                ? 'h-12 bg-gold-gradient shadow-[0_0_10px_rgba(199,157,63,0.5)]' 
                : 'h-2.5 bg-gray-300 dark:bg-gray-700'
            }`}
            aria-label={`Go to section ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
