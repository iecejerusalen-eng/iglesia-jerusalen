import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';
import { Moon, Sun, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';

import Section1Overview from './Section1Overview';
import Section2LMS from './Section2LMS';
import Section3Media from './Section3Media';
import Section4Community from './Section4Community';
import Section5Games from './Section5Games';
import Section6StoreFinance from './Section6StoreFinance';
import Section7Design from './Section7Design';
import Section8Logistics from './Section8Logistics';
import Section9Security from './Section9Security';
import Section10Departments from './Section10Departments';
import Section10Architecture from './Section10Architecture';

export default function PresentationLayout() {
  const [activeSection, setActiveSection] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  
  const sections = [
    { id: 'overview', title: '1. Ecosistema' },
    { id: 'lms', title: '2. Aula Virtual' },
    { id: 'media', title: '3. Multimedia' },
    { id: 'community', title: '4. Comunidad' },
    { id: 'games', title: '5. Juegos Bíblicos' },
    { id: 'store', title: '6. Tienda y Finanzas' },
    { id: 'design', title: '7. Diseño y Editor' },
    { id: 'logistics', title: '8. Logística' },
    { id: 'security', title: '9. Analíticas y Seguridad' },
    { id: 'departments', title: '10. Ministerios' },
    { id: 'tech', title: '11. Arquitectura' }
  ];

  // Keybindings and Scroll handling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (document.body.style.pointerEvents === 'none') return;
      
      const target = e.target as HTMLElement;
      if (target.closest('.scrollable-content')) return; 

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setActiveSection(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sections.length]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(nextTheme);
  };

  const handlePrev = () => setActiveSection(prev => Math.max(prev - 1, 0));
  const handleNext = () => setActiveSection(prev => Math.min(prev + 1, sections.length - 1));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans selection:bg-gold-500/30 relative">
      
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C79D3F]/5 dark:bg-[#C79D3F]/10 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center glass-nav border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <img src={soloLogoColorido} alt="Iglesia Jerusalén" className="w-6 h-6 object-contain" />
          <span className="font-bold truncate max-w-[200px]">Ecosistema Jerusalén</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 glass-nav border-r border-gray-200 dark:border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:relative lg:flex`}
      >
        <div className="p-6 hidden lg:flex items-center gap-3 border-b border-gray-200 dark:border-white/10">
          <div className="p-2 bg-gradient-to-br from-[#9D660E] to-[#FFD679] rounded-lg shadow-lg flex items-center justify-center">
            <img src={soloLogoBlanco} alt="Iglesia Jerusalén" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-none">Iglesia Jerusalén</h1>
            <span className="font-sans text-xs text-gray-500 dark:text-gray-400">Guía de la Plataforma</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 mt-16 lg:mt-0 relative">
          {/* Active section indicator line */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-white/10 rounded-full" />
          
          {sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(idx);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm flex items-center gap-3 relative z-10 ${
                activeSection === idx 
                  ? 'bg-gold-gradient text-white shadow-md font-bold' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 pl-6'
              }`}
            >
              {/* Vertical line connector logic */}
              <div className={`w-2 h-2 rounded-full absolute -left-1 ${activeSection === idx ? 'bg-[#C79D3F] ring-4 ring-[#C79D3F]/30' : 'bg-gray-300 dark:bg-gray-700'}`} />
              
              <span>{section.title}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 hidden lg:flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">Versión Interactiva 3.0</span>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full h-full pt-16 lg:pt-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            {activeSection === 0 && <Section1Overview onNext={() => setActiveSection(1)} />}
            {activeSection === 1 && <Section2LMS onNext={() => setActiveSection(2)} />}
            {activeSection === 2 && <Section3Media onNext={() => setActiveSection(3)} />}
            {activeSection === 3 && <Section4Community onNext={() => setActiveSection(4)} />}
            {activeSection === 4 && <Section5Games onNext={() => setActiveSection(5)} />}
            {activeSection === 5 && <Section6StoreFinance onNext={() => setActiveSection(6)} />}
            {activeSection === 6 && <Section7Design onNext={() => setActiveSection(7)} />}
            {activeSection === 7 && <Section8Logistics onNext={() => setActiveSection(8)} />}
            {activeSection === 8 && <Section9Security onNext={() => setActiveSection(9)} />}
            {activeSection === 9 && <Section10Departments onNext={() => setActiveSection(10)} />}
            {activeSection === 10 && <Section10Architecture />}
          </motion.div>
        </AnimatePresence>

        {/* Global Navigation Controls */}
        <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-50">
          <button 
            onClick={handlePrev}
            disabled={activeSection === 0}
            className="p-3 rounded-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Anterior"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNext}
            disabled={activeSection === sections.length - 1}
            className="p-3 rounded-full bg-[#C79D3F] text-white shadow-lg shadow-[#C79D3F]/30 hover:bg-[#b08b35] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Siguiente"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </main>

    </div>
  );
}
