import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RefreshCw, Copy, Check, Sun, Moon, 
  Settings, Code, ArrowRight, Play, Pause, Touchpad
} from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard } from '../../components/animations/MotionWrappers';
import MagneticButton from '../../components/animations/MagneticButton';

// Types of animations supported in catalog
type AnimationType = 'scroll' | 'stagger' | 'hover' | 'magnetic';

export default function AnimationCatalog() {
  const [activeTab, setActiveTab] = useState<AnimationType>('scroll');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const [autoLoop, setAutoLoop] = useState(true);
  const [loopKey, setLoopKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animation settings states
  const [duration, setDuration] = useState(0.8);
  const [delay, setDelay] = useState(0.1);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | 'none'>('up');
  const [distance, setDistance] = useState(40);
  const [staggerChildren, setStaggerChildren] = useState(0.15);

  // Reset/Replay animation manually
  const triggerReplay = () => {
    setLoopKey(prev => prev + 1);
  };

  // Auto-looping logic (Fase 3 - User comment)
  useEffect(() => {
    if (!autoLoop) return;

    let intervalTime = (duration + delay) * 1000 + 2000; // duration + delay + 2s pause
    if (activeTab === 'stagger') {
      intervalTime = (delay + staggerChildren * 4 + 0.6) * 1000 + 2500;
    }

    const timer = setInterval(() => {
      setLoopKey(prev => prev + 1);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoLoop, duration, delay, staggerChildren, activeTab]);

  // Generate code snippet dynamically
  const generateSnippet = () => {
    switch (activeTab) {
      case 'scroll':
        return `import { ScrollReveal } from '../components/animations/MotionWrappers';

export default function MiComponente() {
  return (
    <ScrollReveal
      direction="${direction}"
      distance={${distance}}
      duration={${duration}}
      delay={${delay}}
      className="p-6 bg-white dark:bg-slate-900 rounded-3xl"
    >
      <h3 className="text-xl font-bold">¡Animación al hacer Scroll!</h3>
      <p>Este contenido aparece fluidamente cuando entra en el viewport.</p>
    </ScrollReveal>
  );
}`;
      case 'stagger':
        return `import { StaggerContainer, StaggerItem } from '../components/animations/MotionWrappers';

export default function MiLista() {
  return (
    <StaggerContainer 
      staggerChildren={${staggerChildren}} 
      delay={${delay}}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {[1, 2, 3].map((item) => (
        <StaggerItem key={item}>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md">
            <h4>Elemento #{item}</h4>
            <p>Aparición secuencial (staggered).</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}`;
      case 'hover':
        return `import { HoverCard } from '../components/animations/MotionWrappers';

export default function MiTarjeta() {
  return (
    <HoverCard className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
      <h3 className="text-lg font-bold">Tarjeta Interactiva</h3>
      <p>Pasa el cursor por encima para ver el efecto de elevación y escala.</p>
    </HoverCard>
  );
}`;
      case 'magnetic':
        return `import MagneticButton from '../components/animations/MagneticButton';

export default function MiBoton() {
  return (
    <MagneticButton>
      <button className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors">
        Botón Magnético
      </button>
    </MagneticButton>
  );
}`;
      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-100 transition-colors duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full w-fit">
            <Sparkles size={12} className="animate-pulse" />
            <span>Playground Visual</span>
          </div>
          <h1 className="text-3xl font-serif font-bold mt-2 text-slate-900 dark:text-white">
            Catálogo de Animaciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Explora, configura y previsualiza en tiempo real los componentes de Framer Motion diseñados para la plataforma de la Iglesia Jerusalén.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350 rounded-xl transition-all text-xs font-semibold cursor-pointer shadow-xs"
          >
            {previewTheme === 'light' ? (
              <>
                <Moon size={14} className="text-amber-500" />
                <span>Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-500" />
                <span>Modo Claro</span>
              </>
            )}
          </button>
          <button
            onClick={triggerReplay}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/15"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 pb-1 scroll-x overflow-x-auto gap-2">
        {(['scroll', 'stagger', 'hover', 'magnetic'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              triggerReplay();
            }}
            className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {tab === 'scroll' ? 'Scroll Reveal' : tab === 'stagger' ? 'Stagger List' : tab === 'hover' ? 'Hover Card' : 'Magnetic Button'}
          </button>
        ))}
      </div>

      {/* Main Grid: Preview + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic Preview Box */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-xl dark:shadow-none flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-white/5 pb-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vista Previa Interactiva ({previewTheme === 'light' ? 'Modo Claro' : 'Modo Oscuro'})
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => setAutoLoop(!autoLoop)}
                    className={`p-1 rounded cursor-pointer transition-all ${autoLoop ? 'text-amber-500' : 'text-slate-400'}`}
                  >
                    {autoLoop ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <span>Bucle Continuo</span>
                </label>
              </div>
            </div>

            {/* Sandbox Container with custom Theme Override */}
            <div className={`h-[350px] rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
              previewTheme === 'light' 
                ? 'bg-slate-50 border border-slate-200' 
                : 'bg-[#071330] border border-white/5 shadow-inner'
            }`}>
              
              {/* Grid Background Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <div key={loopKey} className="w-full flex items-center justify-center p-8 z-10">
                  {activeTab === 'scroll' && (
                    <ScrollReveal
                      direction={direction}
                      distance={distance}
                      duration={duration}
                      delay={delay}
                      className="max-w-md w-full"
                    >
                      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg text-center space-y-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 text-xl font-bold">
                          ✝
                        </div>
                        <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Iglesia Jerusalén</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                          La palabra revelada a tu vida. Estudiando y aplicando las sagradas escrituras.
                        </p>
                      </div>
                    </ScrollReveal>
                  )}

                  {activeTab === 'stagger' && (
                    <StaggerContainer
                      staggerChildren={staggerChildren}
                      delay={delay}
                      className="grid grid-cols-2 gap-4 max-w-lg w-full"
                    >
                      {[
                        { title: 'Salvador', icon: '✝', color: 'text-red-500 bg-red-500/10' },
                        { title: 'Bautizador', icon: '🕊', color: 'text-amber-500 bg-amber-500/10' },
                        { title: 'Sanador', icon: '🍷', color: 'text-blue-500 bg-blue-500/10' },
                        { title: 'Rey que Viene', icon: '👑', color: 'text-purple-500 bg-purple-500/10' }
                      ].map((item, index) => (
                        <StaggerItem key={index}>
                          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md text-center space-y-1">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto text-sm font-bold ${item.color}`}>
                              {item.icon}
                            </span>
                            <h4 className="font-serif text-xs font-bold text-slate-800 dark:text-white leading-normal mt-2">{item.title}</h4>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  )}

                  {activeTab === 'hover' && (
                    <HoverCard className="max-w-xs w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none hover:shadow-2xl dark:hover:shadow-amber-500/10 cursor-pointer text-center space-y-3 relative group">
                      <div className="absolute top-3 right-3 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider font-mono">
                        Pasa el Mouse
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-amber-500/10 group-hover:rotate-12 transition-transform duration-300">
                        🌟
                      </div>
                      <h3 className="font-serif text-md font-bold text-slate-800 dark:text-white">Micro-Interacción</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        Eleva levemente la tarjeta en el eje Y y agranda la escala para dar sensación física de profundidad.
                      </p>
                    </HoverCard>
                  )}

                  {activeTab === 'magnetic' && (
                    <div className="flex flex-col items-center space-y-4">
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
                        <Touchpad size={11} className="text-amber-500 animate-pulse" />
                        Pasa el cursor cerca del botón
                      </span>
                      <MagneticButton>
                        <button className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border-none">
                          Unirme al Grupo de Fe
                          <ArrowRight size={14} />
                        </button>
                      </MagneticButton>
                    </div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>

          {/* Dynamic Code Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl dark:shadow-none space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-white/5 pb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Code size={15} className="text-amber-500" />
                Snippet de Código React (TSX)
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-white/5"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-500">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="relative">
              <pre className="text-xs bg-slate-50 dark:bg-[#040c1e] text-slate-600 dark:text-slate-300 p-4 rounded-xl overflow-x-auto max-h-[300px] border border-slate-150 dark:border-white/5 font-mono leading-relaxed text-left">
                <code>{generateSnippet()}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right Side: Controllers Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl dark:shadow-none space-y-6">
          <div className="border-b border-slate-150 dark:border-white/5 pb-3 flex items-center gap-2">
            <Settings size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ajustes de Parámetros</h3>
          </div>

          <div className="space-y-6">
            {activeTab === 'scroll' && (
              <>
                {/* Duration Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Duración</span>
                    <span className="text-amber-500">{duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={duration}
                    onChange={(e) => {
                      setDuration(parseFloat(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Delay Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Retraso (Delay)</span>
                    <span className="text-amber-500">{delay}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={delay}
                    onChange={(e) => {
                      setDelay(parseFloat(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Distance Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Distancia de origen</span>
                    <span className="text-amber-500">{distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={distance}
                    onChange={(e) => {
                      setDistance(parseInt(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Direction Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Dirección de Origen</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['up', 'down', 'left', 'right', 'none'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => {
                          setDirection(dir);
                          triggerReplay();
                        }}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          direction === dir
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'stagger' && (
              <>
                {/* Delay Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Retraso Inicial</span>
                    <span className="text-amber-500">{delay}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={delay}
                    onChange={(e) => {
                      setDelay(parseFloat(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stagger Delay Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Retraso entre hijos (Stagger)</span>
                    <span className="text-amber-500">{staggerChildren}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={staggerChildren}
                    onChange={(e) => {
                      setStaggerChildren(parseFloat(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeTab === 'hover' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">
                  Propiedades Fijas
                </span>
                <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
                  <li className="flex justify-between">
                    <span>Desplazamiento Y:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">-8px</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Escalado:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">1.02x</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Curva de animación:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold font-mono">spring</span>
                  </li>
                  <li className="flex justify-between flex-wrap gap-1 leading-normal border-t border-slate-200 dark:border-white/5 pt-2 mt-2">
                    <span>Soporta elevación de sombras coloreadas automáticas en modo claro y glows en modo oscuro.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'magnetic' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">
                  Efecto Físico
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                  Usa hooks de eventos del cursor en Javascript combinados con transiciones de resorte (`spring`) en Framer Motion.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                  Atrae magnéticamente el botón a la posición del puntero cuando el cursor entra en una zona de influencia de hasta <span className="text-slate-700 dark:text-slate-200 font-bold">40 píxeles</span>.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-150 dark:border-white/5 pt-6 text-[10px] text-slate-400 leading-normal text-left font-medium">
            * Para añadir más animaciones al catálogo, actualiza la lista de wrappers en <code className="text-amber-500 font-mono">MotionWrappers.tsx</code> y mapea su playground correspondiente en esta vista.
          </div>
        </div>
        
      </div>
      
    </div>
  );
}
