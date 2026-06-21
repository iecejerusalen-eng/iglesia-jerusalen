import { useState } from 'react';
import { 
  Palette, Type, Layers, Image as ImageIcon, Copy,
  Sparkles, CheckCircle2, Info, Code
} from 'lucide-react';
import { ScrollReveal, HoverCard } from '../../components/animations/MotionWrappers';

// SVG Logos Imports
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';
import soloLogoNegro from '../../assets/Jerusalén/solo logo negro.svg';
import logoCompletoColorido from '../../assets/Jerusalén/Logo completo colorido.svg';
import soloTextoColorido from '../../assets/Jerusalén/solo texto colorido.svg';
import textoBlanco from '../../assets/Jerusalén/texto blanco.svg';
import textoNegro from '../../assets/Jerusalén/texto negro.svg';
import logoHorizontalBlanco from '../../assets/Jerusalén/Logo Jerusalen Horizontal Blanco.png';
import logoHorizontalNegro from '../../assets/Jerusalén/Logo Jerusalen Horizontal Negro.png';

type CatalogTab = 'colors' | 'gradients' | 'typography' | 'logos';

interface BrandColor {
  name: string;
  variable: string;
  tailwindClass: string;
  hex: string;
  description: string;
  useCase: string;
}

const BRAND_COLORS: BrandColor[] = [
  // Dorados oficiales
  {
    name: 'Dorado Oficial (Base)',
    variable: '--color-church-gold-light',
    tailwindClass: 'bg-church-gold-light',
    hex: '#C79D3F',
    description: 'Tono dorado base utilizado en el logotipo oficial. Transmite elegancia y solemnidad.',
    useCase: 'Acentos principales, iconos de estado y bordes decorativos.'
  },
  {
    name: 'Dorado Oficial (Brillante)',
    variable: '--color-church-gold-bright',
    tailwindClass: 'bg-church-gold-bright',
    hex: '#FFD679',
    description: 'El tono más claro y brillante de la paleta. Añade un destello metálico de iluminación.',
    useCase: 'Brillos en degradados, enlaces interactivos en fondos oscuros.'
  },
  {
    name: 'Dorado Oficial (Medio)',
    variable: '--color-church-gold-medium',
    tailwindClass: 'bg-church-gold-medium',
    hex: '#AE8333',
    description: 'Dorado de tono medio para dar transición y profundidad en los degradados.',
    useCase: 'Degradados de fondo, tarjetas y textos destacados.'
  },
  {
    name: 'Dorado Oficial (Oscuro)',
    variable: '--color-church-gold-dark',
    tailwindClass: 'bg-church-gold-dark',
    hex: '#9D660E',
    description: 'Dorado profundo que simula el sombreado del oro bruñido del logotipo.',
    useCase: 'Sombras de degradados, textos en fondos claros y bordes contrastantes.'
  },
  {
    name: 'Dorado Oficial (Pálido)',
    variable: '--color-church-gold-pale',
    tailwindClass: 'bg-church-gold-pale',
    hex: '#EECF92',
    description: 'Tono arena dorado suave, ideal para fondos sutiles y textos secundarios discretos.',
    useCase: 'Fondos de badges, textos explicativos sutiles en modo oscuro.'
  },
  // Colores Base de la Marca
  {
    name: 'Azul de la Marca (Oscuro)',
    variable: '--color-slate-950',
    tailwindClass: 'bg-slate-950',
    hex: '#071330',
    description: 'Color de fondo corporativo principal. Aporta sobriedad y realza los acentos dorados.',
    useCase: 'Fondos inmersivos, banners de cabecera y modo oscuro.'
  },
  {
    name: 'Azul Primario (Admin)',
    variable: '--color-primary',
    tailwindClass: 'bg-primary',
    hex: '#1E3A8A',
    description: 'El tono de azul utilizado en la barra lateral del panel administrativo y botones de acción.',
    useCase: 'Botones principales, barras laterales del panel de control y headers.'
  },
  {
    name: 'Gris de Fondo (Claro)',
    variable: '--color-surface',
    tailwindClass: 'bg-surface',
    hex: '#F8FAFC',
    description: 'Color gris pizarra de fondo general para la interfaz pública en modo claro.',
    useCase: 'Fondo del cuerpo de la página pública en tema claro.'
  },
  // Acentos
  {
    name: 'Rojo Acento (Cadetes / Sangre)',
    variable: '--color-accent-red',
    tailwindClass: 'bg-accent-red',
    hex: '#DC2626',
    description: 'Color de acento que simboliza el sacrificio. Usado en el pilar "Jesucristo Salvador".',
    useCase: 'Iconografía del pilar Salvador y alertas urgentes.'
  },
  {
    name: 'Azul Acento (Sanador)',
    variable: '--color-accent-blue',
    tailwindClass: 'bg-accent-blue',
    hex: '#0EA5E9',
    description: 'Color de acento que representa la sanidad divina en el pilar "Jesucristo Sanador".',
    useCase: 'Iconografía del pilar Sanador y botones de descarga de recursos.'
  },
  {
    name: 'Morado Acento (El Rey que Viene)',
    variable: '--color-accent-purple',
    tailwindClass: 'bg-accent-purple',
    hex: '#7C3AED',
    description: 'Tono real que simboliza la soberanía y la realeza en el pilar "El Rey que Viene".',
    useCase: 'Iconografía del pilar Rey y badges de ciclos académicos.'
  }
];

const GRADIENTS = [
  {
    name: 'Degradado Dorado Jerusalén',
    bgClass: 'bg-gold-gradient',
    textClass: 'text-gold-gradient font-bold font-serif text-2xl',
    borderClass: 'border border-gold-gradient rounded-xl p-4 text-center',
    colors: ['#9D660E', '#AE8333', '#FFD679'],
    cssValue: 'linear-gradient(135deg, #9D660E 0%, #AE8333 50%, #FFD679 100%)',
    description: 'El degradado dorado principal que emula el logotipo tridimensional de la iglesia.',
    useCase: 'Tarjetas VIP (Domingo), botones premium y textos destacados de la cabecera.'
  },
  {
    name: 'Degradado Fondo Inmersivo',
    bgClass: 'bg-gradient-to-tr from-[#0a1c40] via-[#071330] to-[#0a1c40]',
    textClass: 'text-white font-bold text-2xl',
    borderClass: 'border border-blue-900 rounded-xl p-4 bg-gradient-to-tr from-[#0a1c40] via-[#071330] to-[#0a1c40]',
    colors: ['#0A1C40', '#071330'],
    cssValue: 'linear-gradient(to top right, #0a1c40, #071330, #0a1c40)',
    description: 'Degradado inmersivo en tonos azul oscuro para crear una atmósfera de solemnidad.',
    useCase: 'Fondo de la sección principal (Hero) y banners finales en modo oscuro.'
  },
  {
    name: 'Degradado Donaciones / Ofrendas',
    bgClass: 'bg-gradient-to-br from-[#0c1c42] to-amber-950',
    textClass: 'text-amber-500 font-serif font-bold text-2xl',
    borderClass: 'border border-amber-900/40 rounded-xl p-4 bg-gradient-to-br from-[#0c1c42] to-amber-950',
    colors: ['#0C1C42', '#451A03'],
    cssValue: 'linear-gradient(to bottom right, #0c1c42, #451a03)',
    description: 'Fusión de azul noche corporativo con un marrón/cobre cálido y acogedor.',
    useCase: 'Tarjeta de llamada a la acción (CTA) para diezmos y ofrendas.'
  }
];

const LOGO_ASSETS = [
  {
    name: 'Logotipo Completo Colorido',
    src: logoCompletoColorido,
    fileName: 'Logo completo colorido.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Logotipo principal con el isotipo de la paloma y cruz en dorado y el texto completo.'
  },
  {
    name: 'Logo Circular Colorido',
    src: soloLogoColorido,
    fileName: 'solo logo colorido.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Solo el isotipo colorido (paloma y cruz) con relieve dorado. Ideal para avatares y botones.'
  },
  {
    name: 'Logo Circular Blanco',
    src: soloLogoBlanco,
    fileName: 'solo logo blanco.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Isotipo monocromático blanco. Útil en fondos oscuros planos o fotográficos.'
  },
  {
    name: 'Logo Circular Negro',
    src: soloLogoNegro,
    fileName: 'solo logo negro.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Isotipo monocromático negro. Útil en fondos claros planos.'
  },
  {
    name: 'Logo Horizontal Blanco (Fondo Oscuro)',
    src: logoHorizontalBlanco,
    fileName: 'Logo Jerusalen Horizontal Blanco.png',
    dimensions: 'Alta Resolución (PNG)',
    format: 'PNG',
    notes: 'Logotipo horizontal de alta resolución diseñado especialmente para fondos oscuros.'
  },
  {
    name: 'Logo Horizontal Negro (Fondo Claro)',
    src: logoHorizontalNegro,
    fileName: 'Logo Jerusalen Horizontal Negro.png',
    dimensions: 'Alta Resolución (PNG)',
    format: 'PNG',
    notes: 'Logotipo horizontal de alta resolución diseñado para papelería o interfaces claras.'
  },
  {
    name: 'Texto Logo Colorido',
    src: soloTextoColorido,
    fileName: 'solo texto colorido.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Texto JERUSALÉN con el degradado dorado oficial.'
  },
  {
    name: 'Texto Blanco',
    src: textoBlanco,
    fileName: 'texto blanco.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Texto JERUSALÉN en blanco plano para cabeceras oscuras.'
  },
  {
    name: 'Texto Negro',
    src: textoNegro,
    fileName: 'texto negro.svg',
    dimensions: 'Vectorial (SVG)',
    format: 'SVG',
    notes: 'Texto JERUSALÉN en negro plano para cabeceras claras.'
  }
];

export default function DesignCatalog() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('colors');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState('Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar.');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-primary text-white p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-church-gold/10 blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-2 text-left">
          <div className="inline-flex items-center gap-2 bg-church-gold/20 border border-church-gold-bright/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-church-gold-bright">
            <Sparkles size={13} className="animate-pulse" />
            Guía de Identidad Visual
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Catálogo de Diseño</h1>
          <p className="text-slate-350 text-xs md:text-sm font-light max-w-xl">
            Estilos tipográficos, degradados dorados del logotipo y assets gráficos oficiales de la Iglesia Jerusalén. Úsalos para mantener la consistencia estética en toda la web.
          </p>
        </div>
        <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md hidden md:flex items-center gap-2">
          <Palette className="text-church-gold-bright animate-spin-slow" size={28} />
          <div className="text-left">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Diseño Web</span>
            <span className="text-xs font-bold text-white">Consistencia de Marca</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-px scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-300 ${
            activeTab === 'colors'
              ? 'border-church-gold text-church-gold dark:text-church-gold-bright bg-church-gold/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <Palette size={16} />
          Colores de la Marca
        </button>
        <button
          onClick={() => setActiveTab('gradients')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-300 ${
            activeTab === 'gradients'
              ? 'border-church-gold text-church-gold dark:text-church-gold-bright bg-church-gold/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <Layers size={16} />
          Degradados y Acabados
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-300 ${
            activeTab === 'typography'
              ? 'border-church-gold text-church-gold dark:text-church-gold-bright bg-church-gold/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <Type size={16} />
          Tipografía y Tamaños
        </button>
        <button
          onClick={() => setActiveTab('logos')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-300 ${
            activeTab === 'logos'
              ? 'border-church-gold text-church-gold dark:text-church-gold-bright bg-church-gold/5 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <ImageIcon size={16} />
          Logotipos y Símbolos
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* Tab 1: Colors */}
        {activeTab === 'colors' && (
          <ScrollReveal direction="up" duration={0.8} className="space-y-6">
            <div className="bg-blue-50/50 dark:bg-[#071330]/30 border border-blue-200/50 dark:border-blue-900/30 p-4 rounded-2xl flex gap-3 text-left">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Uso de la Paleta de Dorado</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Para emular fielmente el color del logotipo de la iglesia, se ha implementado una escala de dorados que va desde el dorado oscuro (`#9D660E`) hasta el brillante (`#FFD679`). Evita colores planos genéricos y prioriza el uso de degradados combinando estos tonos para mantener el estilo premium de la marca.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BRAND_COLORS.map((col, idx) => {
                const copyIdHex = `color-hex-${idx}`;
                const copyIdClass = `color-class-${idx}`;
                return (
                  <HoverCard
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-lg dark:hover:border-church-gold/25 transition-all text-left"
                  >
                    <div className="space-y-3">
                      {/* Color Preview Block */}
                      <div className={`w-full h-24 rounded-2xl ${col.tailwindClass} shadow-inner flex items-end justify-end p-2 relative overflow-hidden border border-slate-100 dark:border-white/10`}>
                        <span className="text-[10px] font-bold bg-slate-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                          {col.hex}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">{col.name}</h3>
                        <p className="text-xs text-slate-400 font-mono truncate">{col.variable}</p>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                        {col.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="text-[11px] font-medium">
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">Uso Recomendado:</span>
                        <span className="text-slate-700 dark:text-slate-350">{col.useCase}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleCopy(col.hex, copyIdHex)}
                          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdHex ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedText === copyIdHex ? 'Copiado HEX' : 'Copiar HEX'}
                        </button>

                        <button
                          onClick={() => handleCopy(col.tailwindClass, copyIdClass)}
                          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdClass ? <CheckCircle2 size={12} className="text-green-500" /> : <Code size={12} />}
                          {copiedText === copyIdClass ? 'Clase Copiada' : 'Copiar Clase'}
                        </button>
                      </div>
                    </div>
                  </HoverCard>
                );
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Tab 2: Gradients */}
        {activeTab === 'gradients' && (
          <ScrollReveal direction="up" duration={0.8} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {GRADIENTS.map((grad, idx) => {
                const copyIdBg = `grad-bg-${idx}`;
                const copyIdCss = `grad-css-${idx}`;
                return (
                  <HoverCard
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-lg dark:hover:border-church-gold/25 transition-all text-left"
                  >
                    <div className="space-y-4">
                      {/* Gradient preview box */}
                      <div className={`w-full h-32 rounded-2xl ${grad.bgClass} shadow-md flex items-center justify-center p-4 border border-white/10`}>
                        <span className="text-white text-base font-bold drop-shadow-md select-none font-serif">
                          Previsualización de Degradado
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">{grad.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                          {grad.description}
                        </p>
                      </div>

                      {/* Display CSS representation */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Código CSS</span>
                        <code className="text-[10px] text-church-gold-dark dark:text-church-gold-bright font-mono block break-all leading-normal">
                          {grad.cssValue}
                        </code>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="text-[11px] font-medium">
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-0.5">Uso Recomendado:</span>
                        <span className="text-slate-700 dark:text-slate-350">{grad.useCase}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(grad.bgClass, copyIdBg)}
                          className="flex-1 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdBg ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedText === copyIdBg ? 'Clase Copiada' : 'Copiar Clase Tailwind'}
                        </button>

                        <button
                          onClick={() => handleCopy(grad.cssValue, copyIdCss)}
                          className="flex-1 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdCss ? <CheckCircle2 size={12} className="text-green-500" /> : <Code size={12} />}
                          {copiedText === copyIdCss ? 'CSS Copiado' : 'Copiar Código CSS'}
                        </button>
                      </div>
                    </div>
                  </HoverCard>
                );
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Tab 3: Typography */}
        {activeTab === 'typography' && (
          <ScrollReveal direction="up" duration={0.8} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left panels: Editable sample */}
            <div className="lg:col-span-1 space-y-6 text-left">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">Prueba Tipográfica</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-normal">
                  Escribe un versículo, aviso o texto a continuación para previsualizar cómo se despliega en las fuentes oficiales de la página.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Texto de Previsualización</label>
                  <textarea
                    rows={4}
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-church-gold focus:border-church-gold font-sans font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                <h4 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">Reglas Tipográficas</h4>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed font-light list-disc pl-4">
                  <li><strong>Playfair Display</strong> es de uso limitado. Solo debe aparecer en títulos de sección y versículos bíblicos destacados.</li>
                  <li><strong>Inter</strong> es la tipografía utilitaria principal. Utilízala en párrafos, etiquetas, botones y paneles de datos para garantizar legibilidad.</li>
                  <li>La escala tipográfica sigue múltiplos armónicos de base 4px.</li>
                </ul>
              </div>
            </div>

            {/* Right panels: Typography scale showcase */}
            <div className="lg:col-span-2 space-y-6 text-left">
              {/* Playfair Display */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100">Playfair Display</h3>
                    <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Fuente Serif de la Marca (`font-serif`)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('font-serif', 'font-serif')}
                    className="py-1 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-white/5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText === 'font-serif' ? <CheckCircle2 size={11} className="text-green-500" /> : <Copy size={11} />}
                    {copiedText === 'font-serif' ? 'Copiada' : 'Copiar Clase'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-5xl (Título Principal)</span>
                    <h1 className="font-serif text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-church-gold-dark to-church-gold-bright leading-tight">
                      {sampleText.slice(0, 45)}...
                    </h1>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-3xl (Encabezado de Sección)</span>
                    <h2 className="font-serif text-3xl font-bold text-slate-800 dark:text-white">
                      {sampleText.slice(0, 65)}...
                    </h2>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-xl italic (Cita o Versículo)</span>
                    <p className="font-serif text-xl italic text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      "{sampleText}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Inter */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-sans font-bold text-xl text-slate-800 dark:text-slate-100">Inter</h3>
                    <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Fuente Sans-serif de la Marca (`font-sans`)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('font-sans', 'font-sans')}
                    className="py-1 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-white/5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText === 'font-sans' ? <CheckCircle2 size={11} className="text-green-500" /> : <Copy size={11} />}
                    {copiedText === 'font-sans' ? 'Copiada' : 'Copiar Clase'}
                  </button>
                </div>

                <div className="space-y-6 font-sans">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-sm font-bold uppercase (Badges / Botones)</span>
                    <span className="inline-block text-sm font-bold uppercase tracking-wider bg-gold-gradient text-slate-950 px-4 py-1.5 rounded-full shadow-md">
                      Acción Destacada
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-base font-normal (Cuerpo del Párrafo)</span>
                    <p className="text-base font-normal text-slate-650 dark:text-slate-300 leading-relaxed max-w-xl">
                      {sampleText}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">text-xs text-slate-400 (Etiquetas secundarias)</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                      * Este texto pequeño es ideal para comentarios, metadatos y notas explicativas a pie de página.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Tab 4: Logos */}
        {activeTab === 'logos' && (
          <ScrollReveal direction="up" duration={0.8} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LOGO_ASSETS.map((logo, idx) => {
                const copyIdPath = `logo-path-${idx}`;
                const importString = `import ${logo.fileName.split('.')[0].replace(/[^a-zA-Z]/g, '')} from '../../assets/Jerusalén/${logo.fileName}';`;
                const copyIdImport = `logo-import-${idx}`;

                return (
                  <HoverCard
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-lg dark:hover:border-church-gold/25 transition-all text-left"
                  >
                    <div className="space-y-4">
                      {/* Logo container with checkers pattern background to show alpha transparent */}
                      <div className="w-full h-40 rounded-2xl bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 border border-slate-100 dark:border-white/5 shadow-inner">
                        <img 
                          src={logo.src} 
                          alt={logo.name} 
                          className="max-h-full max-w-full object-contain filter drop-shadow-sm select-none" 
                        />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">{logo.name}</h3>
                        <div className="flex gap-2 items-center text-[10px] font-mono text-slate-400 font-semibold uppercase">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{logo.format}</span>
                          <span>{logo.dimensions}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-light">
                        {logo.notes}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-white/5 break-all leading-normal text-slate-650 dark:text-slate-350">
                        {logo.fileName}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(`../../assets/Jerusalén/${logo.fileName}`, copyIdPath)}
                          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdPath ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedText === copyIdPath ? 'Ruta Copiada' : 'Copiar Ruta'}
                        </button>

                        <button
                          onClick={() => handleCopy(importString, copyIdImport)}
                          className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedText === copyIdImport ? <CheckCircle2 size={12} className="text-green-500" /> : <Code size={12} />}
                          {copiedText === copyIdImport ? 'Import Copiado' : 'Copiar Import'}
                        </button>
                      </div>
                    </div>
                  </HoverCard>
                );
              })}
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
