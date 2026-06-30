import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';
import { Moon, Sun, Church, Menu, X } from 'lucide-react';

import Section1Overview from './Section1Overview';
import Section2LMS from './Section2LMS';
import Section3Media from './Section3Media';
import Section4Community from './Section4Community';
import Section5Games from './Section5Games';
import Section6StoreFinance from './Section6StoreFinance';
import Section7Design from './Section7Design';
import Section8Logistics from './Section8Logistics';
import Section9Security from './Section9Security';
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
    { id: 'security', title: '9. Analíticas' },
    { id: 'tech', title: '10. Arquitectura' }
  ];

  // Keybindings and Scroll handling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (document.body.style.pointerEvents === 'none') return;
      
      // Target elements inside sections might need scrolling. 
      // Only trigger main navigation if the user scrolls on the main container.
      const target = e.target as HTMLElement;
      if (target.closest('.scrollable-content')) return; // Allow inner scroll

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans selection:bg-gold-500/30">
      
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 dark:bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C79D3F]/5 dark:bg-[#C79D3F]/10 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center glass-nav border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Church className="w-6 h-6 text-[#C79D3F]" />
          <span className="font-bold">Ecosistema Jerusalén</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 glass-nav border-r border-gray-200 dark:border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:relative lg:flex`}
      >
        <div className="p-6 hidden lg:flex items-center gap-3 border-b border-gray-200 dark:border-white/10">
          <div className="p-2 bg-gradient-to-br from-[#9D660E] to-[#FFD679] rounded-lg shadow-lg">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-none">Iglesia Jerusalén</h1>
            <span className="font-sans text-xs text-gray-500 dark:text-gray-400">Guía de la Plataforma</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 mt-16 lg:mt-0">
          {sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(idx);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm flex items-center justify-between ${
                activeSection === idx 
                  ? 'bg-gold-gradient text-white shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{section.title}</span>
              {activeSection === idx && <motion.div layoutId="active-dot" className="w-2 h-2 rounded-full bg-white" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 hidden lg:flex justify-between items-center">
          <span className="text-xs text-gray-500">Versión Interactiva 3.0</span>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-gray-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
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
            {activeSection === 9 && <Section10Architecture />}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
