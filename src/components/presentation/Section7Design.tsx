import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Layout, Wand2, ChevronRight, Image as ImageIcon, Type, Square, PlusCircle, Zap } from 'lucide-react';

const blocks = [
  { icon: <Type className="w-5 h-5" />, name: 'Encabezado (H1-H4)', desc: 'Texto de título con estilos personalizados', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { icon: <ImageIcon className="w-5 h-5" />, name: 'Imagen / Hero', desc: 'Imagen de fondo de pantalla completa con texto encima', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { icon: <Square className="w-5 h-5" />, name: 'Texto Rico (TipTap)', desc: 'Editor WYSIWYG con negritas, listas y tablas', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  { icon: <Layout className="w-5 h-5" />, name: 'Columnas', desc: 'Divide el contenido en 2 o 3 columnas', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  { icon: <Wand2 className="w-5 h-5" />, name: 'Botón (CTA)', desc: 'Botón animado con link de destino configurable', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
  { icon: <Zap className="w-5 h-5" />, name: 'Video Embed', desc: 'Incrusta un video de YouTube o Cloudinary', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
];

const pageSteps = [
  { n: '1', title: 'Page Manager', desc: 'En Panel Admin → Diseño → Páginas. Haz clic en "+ Nueva Página".' },
  { n: '2', title: 'Título y URL', desc: 'Escribe el título (ej. "Congreso Juvenil 2026") y define la URL amigable (ej. /congreso-2026).' },
  { n: '3', title: 'Añadir Bloques', desc: 'Usa la barra lateral del Editor para arrastrar bloques de contenido al lienzo (Encabezado, Imagen, Texto...).' },
  { n: '4', title: 'Personalizar', desc: 'Configura el color de fondo, fuente y animación de cada bloque individualmente.' },
  { n: '5', title: 'Publicar', desc: 'Cambia el estado a "Publicada". La página aparecerá en el menú de navegación del sitio.' },
];

const animations = ['Fade In', 'Slide Up', 'Zoom In', 'Bounce', 'Flip', 'Rotate'];

export default function Section7Design({ onNext }: { onNext: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 mb-4 font-semibold text-sm">
          <Palette className="w-5 h-5" /> Herramientas Visuales
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Diseño y Personalización</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El equipo de medios tiene control total sobre la estética de la plataforma. Pueden crear y publicar 
          nuevas páginas web sin tocar una sola línea de código, usando el Constructor de Bloques visual.
        </p>
      </div>

      {/* Page Builder Guide */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <PlusCircle className="w-6 h-6 text-pink-500" />
          <h3 className="text-2xl font-bold dark:text-white">Guía: Crear una Página Nueva</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Para el Equipo de Medios y Comunicaciones.</p>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {pageSteps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-3 rounded-xl text-left transition-all ${activeStep === i ? 'bg-pink-500 text-white shadow-lg' : 'glass-panel hover:scale-105'}`}>
              <div className={`text-lg font-black mb-1 ${activeStep === i ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`}>0{s.n}</div>
              <div className={`text-xs font-bold leading-tight ${activeStep === i ? 'text-white' : 'dark:text-gray-200'}`}>{s.title}</div>
            </button>
          ))}
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border-l-4 border-l-pink-500">
          <h4 className="font-bold text-lg dark:text-white mb-2">Paso {pageSteps[activeStep].n}: {pageSteps[activeStep].title}</h4>
          <p className="text-gray-600 dark:text-gray-300">{pageSteps[activeStep].desc}</p>
        </motion.div>
      </div>

      {/* Block types */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-6">Tipos de Bloques Disponibles</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {blocks.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-panel p-5 rounded-2xl flex items-start gap-4 hover:scale-102 transition-transform">
              <div className={`p-2 rounded-lg ${b.color} flex-shrink-0`}>{b.icon}</div>
              <div>
                <div className="font-bold text-sm dark:text-white mb-1">{b.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{b.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Animations + Logos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 w-full max-w-6xl">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Wand2 className="w-5 h-5 text-pink-500" /> Catálogo de Animaciones</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Cada bloque puede tener una animación de entrada. El administrador elige la animación desde un selector visual.
          </p>
          <div className="flex flex-wrap gap-2">
            {animations.map((anim, i) => (
              <span key={i} className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-bold">{anim}</span>
            ))}
          </div>
        </div>

        {/* Page Builder Mockup */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-mono text-gray-500">Editor de Página — Modo Diseño</span>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-gray-200 dark:bg-slate-800 rounded text-xs dark:text-white font-bold">Preview</span>
              <span className="px-3 py-1 bg-pink-500 text-white rounded text-xs font-bold">Publicar</span>
            </div>
          </div>
          <div className="flex-1 p-6 bg-gray-50 dark:bg-slate-900/50">
            <div className="bg-white dark:bg-slate-950 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center">
              <h4 className="text-xl font-bold dark:text-white mb-3">Congreso Juvenil 2026</h4>
              <div className="w-full h-24 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-gray-300 dark:text-slate-600" />
              </div>
              <button className="px-5 py-2 bg-gold-gradient text-white font-bold rounded-full text-sm">Comprar Entrada</button>
            </div>
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Logística <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
