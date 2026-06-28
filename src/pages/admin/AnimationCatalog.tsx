import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RefreshCw, Copy, Check, Sun, Moon, 
  Settings, Code, ArrowRight, Play, Pause, Touchpad, Eye,
  Type, Image, PenTool, Layers
} from 'lucide-react';
import { 
  ScrollReveal, StaggerContainer, StaggerItem, HoverCard, 
  TextReveal, SVGDrawReveal 
} from '../../components/animations/MotionWrappers';
import MagneticButton from '../../components/animations/MagneticButton';
import { AnimeReveal, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import 'animate.css';

// Types of animations supported in catalog
type AnimationType = 'scroll' | 'stagger' | 'hover' | 'magnetic' | 'text' | 'parallax' | 'svg' | 'css' | 'animejs';

const ANIMATE_CSS_GROUPS = [
  {
    name: 'Attention seekers',
    animations: ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat']
  },
  {
    name: 'Back entrances',
    animations: ['backInDown', 'backInLeft', 'backInRight', 'backInUp']
  },
  {
    name: 'Back exits',
    animations: ['backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp']
  },
  {
    name: 'Bouncing entrances',
    animations: ['bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp']
  },
  {
    name: 'Bouncing exits',
    animations: ['bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp']
  },
  {
    name: 'Fading entrances',
    animations: ['fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig', 'fadeInUp', 'fadeInUpBig', 'fadeInTopLeft', 'fadeInTopRight', 'fadeInBottomLeft', 'fadeInBottomRight']
  },
  {
    name: 'Fading exits',
    animations: ['fadeOut', 'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutRight', 'fadeOutRightBig', 'fadeOutUp', 'fadeOutUpBig', 'fadeOutTopLeft', 'fadeOutTopRight', 'fadeOutBottomRight', 'fadeOutBottomLeft']
  },
  {
    name: 'Flippers',
    animations: ['flip', 'flipInX', 'flipInY', 'flipOutX', 'flipOutY']
  },
  {
    name: 'Lightspeed',
    animations: ['lightSpeedInRight', 'lightSpeedInLeft', 'lightSpeedOutRight', 'lightSpeedOutLeft']
  },
  {
    name: 'Rotating entrances',
    animations: ['rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight']
  },
  {
    name: 'Rotating exits',
    animations: ['rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight']
  },
  {
    name: 'Specials',
    animations: ['hinge', 'jackInTheBox', 'rollIn', 'rollOut']
  },
  {
    name: 'Zooming entrances',
    animations: ['zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp']
  },
  {
    name: 'Zooming exits',
    animations: ['zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp']
  },
  {
    name: 'Sliding entrances',
    animations: ['slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp']
  },
  {
    name: 'Sliding exits',
    animations: ['slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp']
  }
];

function AnimateCssListItem({ 
  anim, 
  isSelected, 
  cssListPreviewMode, 
  onSelect 
}: { 
  anim: string; 
  isSelected: boolean; 
  cssListPreviewMode: 'hover' | 'loop';
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isAnimating = isHovered || cssListPreviewMode === 'loop';

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left flex items-center justify-between gap-1 transition-all cursor-pointer truncate ${
        isSelected
          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10'
          : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-350'
      }`}
    >
      <span className="truncate flex-1">{anim}</span>
      <span 
        className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-xs select-none ${
          isSelected 
            ? 'bg-white/20 text-white' 
            : 'bg-amber-500/10 text-amber-500'
        } ${
          isAnimating 
            ? `animate__animated animate__${anim} ${cssListPreviewMode === 'loop' ? 'animate__infinite' : ''}` 
            : ''
        }`}
        style={{
          animationDuration: '1.2s'
        }}
      >
        A
      </span>
    </button>
  );
}

export default function AnimationCatalog() {
  const [activeTab, setActiveTab] = useState<AnimationType>('scroll');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');
  const [autoLoop, setAutoLoop] = useState(true);
  const [loopKey, setLoopKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animate.css States
  const [selectedCssGroupIndex, setSelectedCssGroupIndex] = useState(0);
  const [selectedCssAnimation, setSelectedCssAnimation] = useState('bounce');
  const [cssRepeat, setCssRepeat] = useState<'once' | 'twice' | 'thrice' | 'infinite'>('once');
  const [cssListPreviewMode, setCssListPreviewMode] = useState<'hover' | 'loop'>('hover');

  // Text Reveal States
  const [textValue, setTextValue] = useState('Bienvenidos a la Iglesia Jerusalén, Casa de Dios y Puerta del Cielo.');
  const [textMode, setTextMode] = useState<'words' | 'chars'>('words');
  const [textStagger, setTextStagger] = useState(0.06);

  // Parallax Image States
  const [parallaxScrollSim, setParallaxScrollSim] = useState(50); // 0 to 100 range simulating scroll offset

  // SVG Draw States
  const [svgIcon, setSvgIcon] = useState<'cross' | 'dove' | 'bible' | 'crown'>('cross');

  // AnimeJS States
  const [animejsMode, setAnimejsMode] = useState<'reveal' | 'stagger'>('reveal');

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

  // Auto-looping logic
  useEffect(() => {
    if (!autoLoop) return;

    let intervalTime = (duration + delay) * 1000 + 2000; // duration + delay + 2s pause
    if (activeTab === 'stagger') {
      intervalTime = (delay + staggerChildren * 4 + 0.6) * 1000 + 2500;
    } else if (activeTab === 'text') {
      const partCount = textMode === 'words' ? textValue.split(' ').length : textValue.length;
      intervalTime = (delay + textStagger * partCount + duration) * 1000 + 2500;
    } else if (activeTab === 'svg') {
      intervalTime = (duration + delay) * 1000 + 2000;
    } else if (activeTab === 'animejs') {
      intervalTime = (duration + delay) * 1000 + 2500;
    }

    const timer = setInterval(() => {
      setLoopKey(prev => prev + 1);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoLoop, duration, delay, staggerChildren, activeTab, textValue, textMode, textStagger]);

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
      case 'text':
        return `import { TextReveal } from '../components/animations/MotionWrappers';

export default function MiTextoAnimado() {
  return (
    <h2 className="font-serif text-3xl font-bold">
      <TextReveal
        text="${textValue}"
        mode="${textMode}"
        stagger={${textStagger}}
        duration={${duration}}
        delay={${delay}}
      />
    </h2>
  );
}`;
      case 'parallax':
        return `import { ParallaxImage } from '../components/animations/MotionWrappers';

export default function BannerParallax() {
  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden relative">
      <ParallaxImage
        src="https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200&q=80"
        alt="Altar de la Iglesia"
        yOffset={${distance}}
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <h1 className="text-white text-4xl font-bold">Experiencia Sagrada</h1>
      </div>
    </div>
  );
}`;
      case 'svg': {
        const svgContent = svgIcon === 'cross'
          ? `<path d="M 50 15 L 50 85 M 30 35 L 70 35" strokeWidth={3} />`
          : svgIcon === 'dove'
          ? `<path d="M 20 55 C 25 35, 45 35, 50 50 C 55 35, 75 35, 80 55 C 70 65, 30 65, 20 55" strokeWidth={2} />`
          : svgIcon === 'bible'
          ? `<path d="M 25 20 H 75 V 80 H 25 Z M 35 30 H 65 M 35 45 H 65 M 35 60 H 65" strokeWidth={2.5} />`
          : `<path d="M 15 70 L 25 35 L 42 50 L 50 30 L 58 50 L 75 35 L 85 70 Z M 15 70 H 85" strokeWidth={2.5} />`;
        return `import { SVGDrawReveal } from '../components/animations/MotionWrappers';

export default function MiIconoAnimado() {
  return (
    <SVGDrawReveal
      duration={${duration}}
      delay={${delay}}
      strokeColor="currentColor"
      strokeWidth={2}
      viewBox="0 0 100 100"
      className="w-16 h-16 text-amber-500"
    >
      ${svgContent}
    </SVGDrawReveal>
  );
}`;
      }
      case 'css': {
        const repeatClass = cssRepeat === 'infinite' 
          ? 'animate__infinite' 
          : cssRepeat === 'twice' 
          ? 'animate__repeat-2' 
          : cssRepeat === 'thrice' 
          ? 'animate__repeat-3' 
          : '';
        return `// Asegúrate de tener instalado animate.css: npm install animate.css
import 'animate.css';

export default function MiElementoAnimado() {
  return (
    <div 
      className="animate__animated animate__${selectedCssAnimation}${repeatClass ? ' ' + repeatClass : ''}"
      style={{
        '--animate-duration': '${duration}s',
        '--animate-delay': '${delay}s'
      } as React.CSSProperties}
    >
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-lg">
        <h3 className="text-xl font-bold">¡Efecto Animate.css!</h3>
        <p>Esta tarjeta tiene aplicada la animación "${selectedCssAnimation}".</p>
      </div>
    </div>
  );
}`;
      }
      case 'animejs': {
        if (animejsMode === 'reveal') {
          return `import { AnimeReveal } from '../components/animations/AnimeWrappers';

export default function MiElementoAnimeJS() {
  return (
    <AnimeReveal
      direction="${direction}"
      distance={${distance}}
      duration={${duration * 1000}}
      delay={${delay * 1000}}
    >
      <div className="p-6 bg-slate-100 rounded-xl">
        <h3 className="font-bold">¡Anime.js Reveal!</h3>
      </div>
    </AnimeReveal>
  );
}`;
        } else {
          return `import { AnimeStaggerGrid } from '../components/animations/AnimeWrappers';

export default function MiGrillaAnimeJS() {
  return (
    <AnimeStaggerGrid
      staggerDelay={${staggerChildren * 1000}}
      duration={${duration * 1000}}
      items={[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 bg-slate-100 rounded-xl">Elemento {i}</div>
      ))}
    />
  );
}`;
        }
      }
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
        {(['scroll', 'stagger', 'hover', 'magnetic', 'text', 'parallax', 'svg', 'css', 'animejs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              triggerReplay();
            }}
            className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {tab === 'scroll' && <Layers size={14} />}
            {tab === 'stagger' && <RefreshCw size={14} />}
            {tab === 'hover' && <Sparkles size={14} />}
            {tab === 'magnetic' && <Touchpad size={14} />}
            {tab === 'text' && <Type size={14} />}
            {tab === 'parallax' && <Image size={14} />}
            {tab === 'svg' && <PenTool size={14} />}
            {tab === 'css' && <Code size={14} />}
            {tab === 'animejs' && <Layers size={14} />}
            {tab === 'scroll' ? 'Scroll Reveal' : tab === 'stagger' ? 'Stagger List' : tab === 'hover' ? 'Hover Card' : tab === 'magnetic' ? 'Magnetic Button' : tab === 'text' ? 'Text Reveal' : tab === 'parallax' ? 'Parallax Image' : tab === 'svg' ? 'Dibujo SVG' : tab === 'css' ? 'Biblioteca CSS' : 'Anime.js'}
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

                  {activeTab === 'text' && (
                    <div className="w-full flex items-center justify-center text-center px-4">
                      <TextReveal
                        key={loopKey + textMode}
                        text={textValue}
                        mode={textMode}
                        stagger={textStagger}
                        duration={duration}
                        delay={delay}
                        className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed max-w-lg"
                      />
                    </div>
                  )}

                  {activeTab === 'parallax' && (
                    <div className="w-full max-w-md h-[220px] rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/10 shadow-lg">
                      {/* We simulate scroll by sliding the image container up/down using State */}
                      <div 
                        className="absolute inset-0 scale-125"
                        style={{ 
                          transform: `translateY(${(parallaxScrollSim - 50) * -0.6}px) scale(1.2)`,
                          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <img loading="lazy" 
                          src="https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=800&q=80" 
                          alt="Paralaje Simulada"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/45 flex flex-col justify-center items-center text-center p-4">
                        <h4 className="text-white font-serif text-lg font-bold">Parallax Simulador</h4>
                        <p className="text-white/80 text-[10px] mt-1.5 uppercase tracking-wider font-semibold">
                          Mueve el control de Scroll en el panel derecho para ver el efecto físico
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'svg' && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-slate-100/55 dark:bg-white/5 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <SVGDrawReveal
                          key={loopKey + svgIcon}
                          duration={duration}
                          delay={delay}
                          viewBox="0 0 100 100"
                          strokeColor="#f59e0b"
                          strokeWidth={2.5}
                          className="w-24 h-24"
                        >
                          {svgIcon === 'cross' && (
                            <path d="M 50 15 L 50 85 M 30 35 L 70 35" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          {svgIcon === 'dove' && (
                            <path d="M 20 55 C 25 35, 45 35, 50 50 C 55 35, 75 35, 80 55 C 70 65, 30 65, 20 55" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          {svgIcon === 'bible' && (
                            <path d="M 25 20 H 75 V 80 H 25 Z M 35 30 H 65 M 35 45 H 65 M 35 60 H 65" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          {svgIcon === 'crown' && (
                            <path d="M 15 70 L 25 35 L 42 50 L 50 30 L 58 50 L 75 35 L 85 70 Z M 15 70 H 85" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                        </SVGDrawReveal>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500">
                        Icono Sagrado: {svgIcon}
                      </span>
                    </div>
                  )}

                  {activeTab === 'css' && (
                    <div 
                      className={`animate__animated animate__${selectedCssAnimation} ${
                        cssRepeat === 'infinite' 
                          ? 'animate__infinite' 
                          : cssRepeat === 'twice' 
                          ? 'animate__repeat-2' 
                          : cssRepeat === 'thrice' 
                          ? 'animate__repeat-3' 
                          : ''
                      } max-w-xs w-full`}
                      style={{
                        '--animate-duration': `${duration}s`,
                        '--animate-delay': `${delay}s`
                      } as React.CSSProperties}
                    >
                      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg text-center space-y-3 relative group">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 text-xl font-bold">
                          🔔
                        </div>
                        <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white capitalize">
                          {selectedCssAnimation}
                        </h3>
                        <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                          Visualizando efecto Animate.css en tiempo real. Configura la duración y repetición en el panel lateral.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'animejs' && (
                    <div className="w-full flex items-center justify-center p-8">
                      {animejsMode === 'reveal' ? (
                        <AnimeReveal
                          key={loopKey + 'reveal'}
                          direction={direction}
                          distance={distance}
                          duration={duration * 1000}
                          delay={delay * 1000}
                        >
                          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg text-center">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 text-xl font-bold mb-3">
                              ✨
                            </div>
                            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Anime.js Reveal</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mt-2">
                              Animación suave y fluida creada con Anime.js.
                            </p>
                          </div>
                        </AnimeReveal>
                      ) : (
                        <AnimeStaggerGrid
                          key={loopKey + 'stagger'}
                          staggerDelay={staggerChildren * 1000}
                          duration={duration * 1000}
                          className="grid grid-cols-2 gap-4 max-w-sm w-full"
                          items={[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md text-center">
                              <span className="text-amber-500 text-lg font-bold">A{i}</span>
                            </div>
                          ))}
                        />
                      )}
                    </div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>

          {activeTab === 'css' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl dark:shadow-none space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 dark:border-white/5 pb-4">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Eye size={16} className="text-amber-500 animate-pulse" />
                    Biblioteca de Efectos Animate.css
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Selecciona una categoría y previsualiza en miniatura.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Preview Mode Selector */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[10px] font-bold border border-slate-200/50 dark:border-white/5">
                    <button
                      onClick={() => setCssListPreviewMode('hover')}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        cssListPreviewMode === 'hover' 
                          ? 'bg-amber-500 text-white' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                      }`}
                    >
                      Hover
                    </button>
                    <button
                      onClick={() => setCssListPreviewMode('loop')}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        cssListPreviewMode === 'loop' 
                          ? 'bg-amber-500 text-white' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                      }`}
                    >
                      Bucle
                    </button>
                  </div>

                  {/* Category Dropdown Selector */}
                  <select
                    value={selectedCssGroupIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      setSelectedCssGroupIndex(idx);
                      const defaultAnim = ANIMATE_CSS_GROUPS[idx].animations[0];
                      setSelectedCssAnimation(defaultAnim);
                      triggerReplay();
                    }}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow-xs"
                  >
                    {ANIMATE_CSS_GROUPS.map((group, idx) => (
                      <option key={idx} value={idx}>
                        {group.name} ({group.animations.length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of animations within the selected group with LIVE mini-previews (Fase 8 comments) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {ANIMATE_CSS_GROUPS[selectedCssGroupIndex].animations.map((anim) => (
                  <AnimateCssListItem
                    key={anim}
                    anim={anim}
                    isSelected={selectedCssAnimation === anim}
                    cssListPreviewMode={cssListPreviewMode}
                    onSelect={() => {
                      setSelectedCssAnimation(anim);
                      triggerReplay();
                    }}
                  />
                ))}
              </div>
            </div>
          )}

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
            {(activeTab === 'scroll' || activeTab === 'css' || activeTab === 'text' || activeTab === 'svg' || activeTab === 'animejs') && (
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
              </>
            )}

            {/* Conditional sub-controls */}
            {(activeTab === 'scroll' || activeTab === 'animejs') && (
              <>
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

            {activeTab === 'css' && (
              <>
                {/* Repeat Selector for CSS */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Repeticiones</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'once', label: '1 vez' },
                      { value: 'twice', label: '2 veces' },
                      { value: 'thrice', label: '3 veces' },
                      { value: 'infinite', label: 'Infinito' }
                    ].map((rep) => (
                      <button
                        key={rep.value}
                        onClick={() => {
                          setCssRepeat(rep.value as any);
                          triggerReplay();
                        }}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          cssRepeat === rep.value
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rep.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'animejs' && (
              <>
                {/* AnimeJS Mode Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Modo Anime.js</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['reveal', 'stagger'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setAnimejsMode(mode);
                          triggerReplay();
                        }}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          animejsMode === mode
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {mode === 'reveal' ? 'Reveal Simple' : 'Stagger Grid'}
                      </button>
                    ))}
                  </div>
                </div>

                {animejsMode === 'stagger' && (
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
                )}
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

            {activeTab === 'text' && (
              <>
                {/* Text input control */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Texto a Revelar</label>
                  <textarea
                    rows={3}
                    value={textValue}
                    onChange={(e) => {
                      setTextValue(e.target.value);
                      triggerReplay();
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 text-xs rounded-xl px-3 py-2 outline-none resize-none font-medium"
                  />
                </div>

                {/* Div Mode Selection */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Modo de División</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['words', 'chars'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setTextMode(mode);
                          triggerReplay();
                        }}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          textMode === mode
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {mode === 'words' ? 'Palabras' : 'Letras'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stagger control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Retraso Secuencial (Stagger)</span>
                    <span className="text-amber-500">{textStagger}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.01"
                    value={textStagger}
                    onChange={(e) => {
                      setTextStagger(parseFloat(e.target.value));
                      triggerReplay();
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}

            {activeTab === 'parallax' && (
              <>
                {/* Simulated Scroll offset control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Desplazamiento Scroll (Simulado)</span>
                    <span className="text-amber-500">{parallaxScrollSim}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={parallaxScrollSim}
                    onChange={(e) => setParallaxScrollSim(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Amplitude Control */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Fuerza Desplazamiento (yOffset)</span>
                    <span className="text-amber-500">{distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={distance}
                    onChange={(e) => {
                      setDistance(parseInt(e.target.value));
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded-2xl text-left text-xs text-slate-500 dark:text-slate-400 space-y-2 font-medium">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">Información</span>
                  <p>En producción, este componente escucha el scroll global de la ventana usando el hook `useScroll` de Framer Motion.</p>
                  <p>Aquí simulamos el scroll moviendo la imagen en base a la interpolación del valor del control deslizante.</p>
                </div>
              </>
            )}

            {activeTab === 'svg' && (
              <>
                {/* SVG Icon Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-500 block">Seleccionar Icono Sagrado</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cross', 'dove', 'bible', 'crown'] as const).map((icon) => (
                      <button
                        key={icon}
                        onClick={() => {
                          setSvgIcon(icon);
                          triggerReplay();
                        }}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer capitalize ${
                          svgIcon === icon
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {icon === 'cross' ? 'Cruz ✝' : icon === 'dove' ? 'Paloma 🕊' : icon === 'bible' ? 'Biblia 📖' : 'Corona 👑'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-white/5 rounded-2xl text-left text-xs text-slate-500 dark:text-slate-400 space-y-2 font-medium">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">Dibujo de Rutas</span>
                  <p>Utiliza la propiedad `pathLength` de Framer Motion para animar dinámicamente la propiedad CSS `stroke-dashoffset` de los elementos vectoriales en SVG.</p>
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
