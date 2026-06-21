import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Sun, 
  AlertTriangle, 
  Cross, 
  Gift, 
  RefreshCw, 
  Sparkles, 
  Activity, 
  Droplet, 
  Flame, 
  Wind, 
  Award, 
  Heart, 
  HeartPulse, 
  Crown, 
  Users, 
  Landmark, 
  Scale, 
  Cloud, 
  Globe, 
  Coins, 
  Search, 
  X,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic icon mapping to render icons dynamically based on string ID
const iconMap: { [key: string]: React.ComponentType<any> } = {
  BookOpen,
  Sun,
  AlertTriangle,
  Cross,
  Gift,
  RefreshCw,
  Sparkles,
  Activity,
  Droplet,
  Flame,
  Wind,
  Award,
  Heart,
  HeartPulse,
  Crown,
  Users,
  Landmark,
  Scale,
  Cloud,
  Globe,
  Coins,
  Compass
};

interface Principle {
  id: number;
  title: string;
  description: string;
  reference: string;
  iconName: string;
  iconColor: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  description: string;
  principles: Principle[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'la-biblia-y-dios',
    title: 'La Biblia y Dios',
    description: 'Nuestra fe en la revelación suprema de Dios y su naturaleza trinitaria.',
    principles: [
      {
        id: 1,
        title: 'Las Sagradas Escrituras',
        description: 'La Biblia es la Palabra inspirada de Dios, inerrante, infalible y la autoridad suprema para la fe y la conducta cristiana.',
        reference: '2 Timoteo 3:16-17',
        iconName: 'BookOpen',
        iconColor: 'text-blue-500 bg-blue-500/10'
      },
      {
        id: 2,
        title: 'La Divinidad Eterna',
        description: 'Dios existe eternamente en tres Personas coiguales y coeternas: el Padre, el Hijo y el Espíritu Santo.',
        reference: '2 Corintios 13:14',
        iconName: 'Sun',
        iconColor: 'text-amber-500 bg-amber-500/10'
      }
    ]
  },
  {
    id: 'el-hombre-y-la-salvacion',
    title: 'El Hombre y la Salvación',
    description: 'El propósito eterno de la redención humana mediante Jesucristo.',
    principles: [
      {
        id: 3,
        title: 'La Caída del Hombre',
        description: 'La humanidad, creada a imagen de Dios, cayó en pecado voluntariamente, trayendo consigo la separación espiritual de su Creador.',
        reference: 'Romanos 5:12',
        iconName: 'AlertTriangle',
        iconColor: 'text-red-500 bg-red-500/10'
      },
      {
        id: 4,
        title: 'El Plan de Salvación',
        description: 'Jesucristo, el Hijo de Dios, ofreció su vida voluntariamente en la cruz, muriendo por los pecadores y proveyendo redención para todos los que creen en Él.',
        reference: 'Juan 3:16; Romanos 5:8',
        iconName: 'Cross',
        iconColor: 'text-rose-500 bg-rose-500/10'
      },
      {
        id: 5,
        title: 'La Salvación por Gracia',
        description: 'La salvación no se obtiene por obras humanas, sino que es un don gratuito de Dios recibido mediante la fe en la obra redentora de Jesucristo.',
        reference: 'Efesios 2:8',
        iconName: 'Gift',
        iconColor: 'text-emerald-500 bg-emerald-500/10'
      },
      {
        id: 6,
        title: 'Arrepentimiento y Aceptación',
        description: 'La justificación y el perdón de pecados ocurren mediante un arrepentimiento genuino y la confesión de fe en Cristo Jesús como Señor y Salvador.',
        reference: 'Romanos 10:8-10; 1 Juan 1:9',
        iconName: 'RefreshCw',
        iconColor: 'text-indigo-500 bg-indigo-500/10'
      },
      {
        id: 7,
        title: 'El Nuevo Nacimiento',
        description: 'A través del poder del Espíritu Santo, los creyentes experimentan la regeneración espiritual, convirtiéndose en nuevas criaturas en Cristo.',
        reference: '2 Corintios 5:17; Gálatas 2:20',
        iconName: 'Sparkles',
        iconColor: 'text-teal-500 bg-teal-500/10'
      }
    ]
  },
  {
    id: 'vida-cristiana-diaria',
    title: 'Vida Cristiana Diaria',
    description: 'El camino de fe y santidad que recorremos cada día.',
    principles: [
      {
        id: 8,
        title: 'La Vida Cristiana Diaria',
        description: 'La santificación es un proceso continuo y progresivo que nos capacita para vivir una vida santa y consagrada a Dios.',
        reference: 'Hebreos 6:1',
        iconName: 'Activity',
        iconColor: 'text-green-500 bg-green-500/10'
      },
      {
        id: 11,
        title: 'La Vida Llena del Espíritu',
        description: 'Es el deber y privilegio de todo creyente caminar diariamente bajo la guianza, dirección y el poder del Espíritu Santo.',
        reference: 'Efesios 4:30-32',
        iconName: 'Wind',
        iconColor: 'text-sky-500 bg-sky-500/10'
      },
      {
        id: 13,
        title: 'La Moderación',
        description: 'La vida cristiana debe caracterizarse por la sobriedad, el equilibrio y la moderación, evitando los extremos legales o libertinos.',
        reference: 'Filipenses 4:5; Colosenses 3:12-13',
        iconName: 'Heart',
        iconColor: 'text-pink-500 bg-pink-500/10'
      }
    ]
  },
  {
    id: 'la-iglesia-y-las-ordenanzas',
    title: 'La Iglesia y las Ordenanzas',
    description: 'Los sacramentos divinos y la comunión en el cuerpo de Cristo.',
    principles: [
      {
        id: 9,
        title: 'El Bautismo y la Cena del Señor',
        description: 'El bautismo en agua por inmersión es un testimonio público de nuestra unión con Cristo. La Santa Cena es un memorial sagrado que conmemora el sacrificio de Jesús usando pan y vino.',
        reference: 'Mateo 28:19; Romanos 6:4; 1 Corintios 11:24-25',
        iconName: 'Droplet',
        iconColor: 'text-blue-600 bg-blue-600/10'
      },
      {
        id: 16,
        title: 'Relación con la Iglesia',
        description: 'Todo creyente tiene la responsabilidad de congregarse activamente y comprometerse con la comunión, el crecimiento y la misión de la iglesia local.',
        reference: 'Hebreos 10:24-25',
        iconName: 'Users',
        iconColor: 'text-cyan-500 bg-cyan-500/10'
      },
      {
        id: 17,
        title: 'El Gobierno Civil',
        description: 'Las autoridades civiles son puestas por Dios y debemos someternos a ellas en respeto y obediencia, excepto cuando entren en conflicto directo con los mandamientos divinos.',
        reference: 'Romanos 13:1-5',
        iconName: 'Landmark',
        iconColor: 'text-slate-500 bg-slate-500/10'
      },
      {
        id: 22,
        title: 'Diezmos y Ofrendas',
        description: 'El sostenimiento de la obra de Dios en la iglesia local y la obra misionera se realiza mediante la entrega fiel y sistemática de diezmos y ofrendas voluntarias.',
        reference: 'Malaquías 3:10; 2 Corintios 9:7',
        iconName: 'Coins',
        iconColor: 'text-amber-600 bg-amber-600/10'
      }
    ]
  },
  {
    id: 'el-espiritu-santo-y-sanidad',
    title: 'El Espíritu Santo y Sanidad',
    description: 'El poder empoderador y milagroso del Consolador en nosotros.',
    principles: [
      {
        id: 10,
        title: 'El Bautismo con el Espíritu Santo',
        description: 'Una experiencia posterior a la salvación que capacita y reviste de poder al creyente para el servicio, manifestándose inicialmente al hablar en otras lenguas según el Espíritu dirija.',
        reference: 'Hechos 2:4',
        iconName: 'Flame',
        iconColor: 'text-orange-500 bg-orange-500/10'
      },
      {
        id: 12,
        title: 'Los Dones y el Fruto del Espíritu',
        description: 'El Espíritu Santo otorga dones espirituales para la edificación de la Iglesia y produce fruto en el carácter de los creyentes para dar testimonio de su amor.',
        reference: '1 Corintios 12:1-11; Gálatas 5:22-25',
        iconName: 'Award',
        iconColor: 'text-purple-500 bg-purple-500/10'
      },
      {
        id: 14,
        title: 'La Sanidad Divina',
        description: 'La curación y restauración física, emocional y espiritual son provistas mediante el sacrificio expiatorio de Cristo y están vigentes a través de la oración de fe.',
        reference: 'Santiago 5:14-16',
        iconName: 'HeartPulse',
        iconColor: 'text-red-600 bg-red-600/10'
      }
    ]
  },
  {
    id: 'la-gran-comision',
    title: 'La Gran Comisión',
    description: 'Nuestra misión global de llevar esperanza a toda criatura.',
    principles: [
      {
        id: 21,
        title: 'El Evangelismo',
        description: 'La Gran Comisión encomendada por Jesús a su Iglesia consiste en proclamar el Evangelio a todas las naciones del mundo.',
        reference: 'Marcos 16:15; Mateo 28:19-20',
        iconName: 'Globe',
        iconColor: 'text-indigo-600 bg-indigo-600/10'
      }
    ]
  },
  {
    id: 'escatologia-y-fin-de-los-tiempos',
    title: 'Escatología y Fin',
    description: 'La consumación final de la historia y el reino de Dios.',
    principles: [
      {
        id: 15,
        title: 'La Segunda Venida de Cristo',
        description: 'El retorno de nuestro Señor Jesucristo a la tierra será personal, literal, inminente y glorioso.',
        reference: '1 Tesalonicenses 4:16-17; Tito 2:11-13',
        iconName: 'Crown',
        iconColor: 'text-yellow-600 bg-yellow-600/10'
      },
      {
        id: 18,
        title: 'El Juicio Final',
        description: 'Todos los seres humanos comparecerán ante el tribunal de Dios para dar cuenta de sus actos, recibiendo la retribución eterna según su fe y conducta.',
        reference: 'Apocalipsis 20:11-15; Hebreos 9:27; 2 Corintios 5:10',
        iconName: 'Scale',
        iconColor: 'text-amber-700 bg-amber-700/10'
      },
      {
        id: 19,
        title: 'El Cielo',
        description: 'El destino y la morada eterna de gozo absoluto prometida por Jesús para todos los redimidos por su gracia.',
        reference: 'Juan 14:1-3; Apocalipsis 7:15-17',
        iconName: 'Cloud',
        iconColor: 'text-sky-400 bg-sky-400/10'
      },
      {
        id: 20,
        title: 'El Infierno',
        description: 'El lugar de separación eterna de la presencia de Dios y castigo consciente para aquellos que rechacen el plan de salvación ofrecido en Cristo.',
        reference: 'Apocalipsis 20:10-15',
        iconName: 'Flame',
        iconColor: 'text-red-700 bg-red-700/10'
      }
    ]
  }
];

const ALL_PRINCIPLES: Principle[] = CATEGORIES.flatMap(cat => cat.principles);

export default function PrinciplesOfFaith() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Update search status and filter items
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearching(value.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const filteredPrinciples = ALL_PRINCIPLES.filter(p => {
    const text = searchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(text) ||
      p.description.toLowerCase().includes(text) ||
      p.reference.toLowerCase().includes(text) ||
      p.id.toString() === text
    );
  });

  // ScrollSpy implementation: updates active category menu item as user scrolls
  useEffect(() => {
    if (isSearching) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            setActiveCategory(id);
            
            // Sync mobile horizontal scrolling list of categories
            const mobileTab = document.getElementById(`tab-m-${id}`);
            if (mobileTab && scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              const containerScrollLeft = container.scrollLeft;
              const tabRect = mobileTab.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              
              const relativeLeft = tabRect.left - containerRect.left + containerScrollLeft;
              const targetScroll = relativeLeft - (containerRect.width / 2) + (tabRect.width / 2);
              
              container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
              });
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    CATEGORIES.forEach(cat => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [isSearching]);

  // Smooth scroll to selected category section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100; // Header and tabs gap offset
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveCategory(id);
    }
  };

  return (
    <div className="space-y-10 text-left">
      {/* 1. Header with Info, Footnote, and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/60 dark:border-white/10 pb-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/25 px-3.5 py-1.5 rounded-full border border-amber-200/50 dark:border-amber-700/30 text-amber-800 dark:text-church-gold-bright text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Nuestras Doctrinas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white leading-tight">
            Principios de Fe
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
            La Iglesia Cuadrangular se adhiere a un conjunto de doctrinas fundamentales arraigadas en la teología pentecostal evangélica, articuladas a través de sus 22 principios de fe redactados originalmente por nuestra fundadora Aimee Semple McPherson.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80 group">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-church-gold-medium transition-colors">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar doctrina o versículo..."
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 text-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-church-gold-medium/40 focus:border-church-gold-medium transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Area */}
      {isSearching ? (
        /* SEARCH RESULTS VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 border border-gray-150 dark:border-white/5 rounded-2xl py-4 px-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Se encontraron <span className="font-semibold text-primary dark:text-church-gold-bright">{filteredPrinciples.length}</span> resultados para "<span className="text-gray-800 dark:text-gray-200 italic font-normal">{searchQuery}</span>"
            </p>
            <button
              onClick={clearSearch}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredPrinciples.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPrinciples.map((principle) => {
                  const IconComponent = iconMap[principle.iconName] || BookOpen;
                  return (
                    <motion.div
                      layout
                      key={principle.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 shadow-xs hover:shadow-md hover:border-church-gold-medium/30 dark:hover:border-church-gold-medium/30 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${principle.iconColor}`}>
                            <IconComponent size={20} />
                          </div>
                          <span className="text-2xl font-serif font-black text-slate-200 dark:text-slate-800/80 group-hover:text-church-gold-bright transition-colors">
                            {principle.id < 10 ? `0${principle.id}` : principle.id}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-church-gold-bright transition-colors leading-snug">
                          {principle.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed font-light">
                          {principle.description}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50 mt-5">
                        <span className="inline-block bg-primary/5 dark:bg-slate-800 border border-primary/10 dark:border-slate-700/60 px-3 py-1 rounded-full text-primary dark:text-church-gold-pale font-serif font-medium text-[10px] uppercase tracking-wider">
                          {principle.reference}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800"
              >
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto opacity-70 mb-4 animate-pulse" />
                <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-white">Sin resultados</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto px-4">
                  No pudimos encontrar ningún principio que coincida con tu criterio de búsqueda. Intenta con otros términos.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* STANDARD DUAL-COLUMN VIEW (GRID + STICKNAV) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* A. MOBILE STICKY NAVIGATION TABS */}
          <div className="lg:hidden sticky top-[72px] z-30 bg-surface/90 dark:bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-3 border-b border-gray-150 dark:border-white/5 transition-all">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`tab-m-${cat.id}`}
                  onClick={() => scrollToSection(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white border-primary shadow-xs dark:bg-church-gold-medium dark:border-church-gold-medium'
                      : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* B. DESKTOP STICKY SIDEBAR NAVIGATION */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 self-start space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-5 shadow-xs">
              <h3 className="font-serif font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4 px-2">
                Temas Doctrinales
              </h3>
              <nav className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center justify-between group ${
                      activeCategory === cat.id
                        ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-church-gold-bright border-primary/25 dark:border-church-gold-medium/25 border-l-4 border-l-primary dark:border-l-4 dark:border-l-gold shadow-xxs'
                        : 'bg-transparent text-gray-550 dark:text-gray-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <span>{cat.title}</span>
                    <span className={`text-[10px] py-0.5 px-2 rounded-full font-serif font-bold transition-colors ${
                      activeCategory === cat.id 
                        ? 'bg-primary text-white dark:bg-gold dark:text-slate-950' 
                        : 'bg-slate-100 dark:bg-slate-800 text-gray-450 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/60 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`}>
                      {cat.principles.length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-slate-900/60 dark:to-transparent border border-primary/10 dark:border-white/5 rounded-3xl p-6 space-y-3">
              <span className="text-[9px] font-black text-church-gold-medium dark:text-church-gold-bright uppercase tracking-widest block">Fundado en la Roca</span>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed font-light">
                "Jesucristo es el mismo ayer, y hoy, y por los siglos."
              </p>
              <span className="text-[10px] font-serif font-bold text-primary dark:text-church-gold-pale block">Hebreos 13:8</span>
            </div>
          </div>

          {/* C. CONTINUOUS LIST OF 22 PRINCIPLES */}
          <div className="lg:col-span-9 space-y-16">
            {CATEGORIES.map((category) => (
              <section 
                key={category.id} 
                id={category.id} 
                className="space-y-6 scroll-mt-28"
              >
                {/* Category Header */}
                <div className="border-b border-gray-100 dark:border-slate-800/80 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-white flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-gold-gradient" />
                      {category.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                      {category.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    {category.principles.length} {category.principles.length === 1 ? 'doctrina' : 'doctrinas'}
                  </span>
                </div>

                {/* Principles Cards Grid within Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.principles.map((principle) => {
                    const IconComponent = iconMap[principle.iconName] || BookOpen;
                    return (
                      <div
                        key={principle.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 shadow-xs hover:shadow-md hover:border-church-gold-medium/30 dark:hover:border-church-gold-medium/30 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                      >
                        {/* Background subtle light accent on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-transparent group-hover:from-primary/[0.02] dark:group-hover:from-church-gold-medium/[0.03] transition-all duration-500 pointer-events-none" />
                        
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform duration-500 group-hover:scale-110 ${principle.iconColor}`}>
                              <IconComponent size={20} />
                            </div>
                            <span className="text-2xl font-serif font-black text-slate-100 dark:text-slate-800/80 group-hover:text-church-gold-bright transition-colors">
                              {principle.id < 10 ? `0${principle.id}` : principle.id}
                            </span>
                          </div>
                          
                          <h4 className="font-serif font-bold text-base md:text-lg text-gray-800 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-church-gold-bright transition-colors leading-snug">
                            {principle.title}
                          </h4>
                          
                          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed font-light">
                            {principle.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50 mt-5 relative z-10">
                          <span className="inline-block bg-primary/5 dark:bg-slate-800/60 border border-primary/10 dark:border-slate-700/60 px-3 py-1 rounded-full text-primary dark:text-church-gold-pale font-serif font-medium text-[10px] uppercase tracking-wider">
                            {principle.reference}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
