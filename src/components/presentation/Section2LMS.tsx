import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, PlayCircle, BookOpen, ChevronRight, Award, FileText, HelpCircle, Video, Music, Archive } from 'lucide-react';

const contentTypes = [
  { icon: <Video className="w-5 h-5" />, label: 'Video (MP4)', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { icon: <FileText className="w-5 h-5" />, label: 'PDF / Doc', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  { icon: <HelpCircle className="w-5 h-5" />, label: 'Cuestionario', color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  { icon: <Music className="w-5 h-5" />, label: 'Audio (MP3)', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { icon: <Archive className="w-5 h-5" />, label: 'Archivos ZIP', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  { icon: <BookOpen className="w-5 h-5" />, label: 'Texto Rico', color: 'text-teal-500 bg-teal-100 dark:bg-teal-900/30' },
];

const steps = [
  { n: '1', title: 'Ir a "LMS Manager"', desc: 'En el panel admin, navega a Educación → LMS Manager y haz clic en "+ Nuevo Curso".' },
  { n: '2', title: 'Datos del Curso', desc: 'Rellena el título, descripción, categoría (ej. "Liderazgo") y sube una imagen de portada desde Cloudinary.' },
  { n: '3', title: 'Añadir Módulos', desc: 'Crea módulos (secciones) dentro del curso. Cada módulo puede tener múltiples lecciones del tipo que necesites.' },
  { n: '4', title: 'Subir Contenido', desc: 'Arrastra el video o sube el PDF directamente. El sistema lo procesa y lo optimiza automáticamente.' },
  { n: '5', title: 'Configurar Quiz', desc: 'Al final de cada módulo puedes añadir un cuestionario. Define las preguntas, opciones y la nota mínima de aprobación.' },
  { n: '6', title: 'Publicar', desc: 'Cambia el estado del curso de "Borrador" a "Publicado". Inmediatamente estará visible para la congregación.' },
];

const gradebookData = [
  { name: 'María González', progress: 90, score: 95, cert: true },
  { name: 'Carlos Rivera', progress: 65, score: 72, cert: false },
  { name: 'Ana Martínez', progress: 100, score: 88, cert: true },
  { name: 'Luis Herrera', progress: 40, score: null, cert: false },
];

export default function Section2LMS({ onNext }: { onNext: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4 font-semibold text-sm">
          <GraduationCap className="w-5 h-5" /> Módulo de Educación
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Aula Virtual Inteligente</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El sistema LMS (Learning Management System) permite a los líderes crear cursos completos y a la congregación 
          formarse espiritualmente desde cualquier dispositivo, a su propio ritmo.
        </p>
      </div>

      {/* Two column: Mockup + Content Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 w-full max-w-6xl">
        {/* Netflix Mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-700/50 h-[360px] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 rounded-t-2xl border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="mx-auto text-xs font-mono text-slate-400">Vista del Estudiante — Reproductor</div>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-end relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900 rounded-b-2xl" />
            <div className="relative z-10 flex flex-col gap-3">
              <PlayCircle className="w-14 h-14 text-white cursor-pointer hover:scale-110 transition-transform" />
              <div>
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Lección 3 • Curso de Liderazgo</div>
                <h4 className="text-white font-bold text-xl">La Visión Celular</h4>
                <p className="text-slate-400 text-xs mt-1">Pastor Roberto — 45 min</p>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progreso del curso</span><span>65%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: '0%' }} animate={{ width: '65%' }} transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-blue-500 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Types */}
        <div className="flex flex-col gap-4 justify-center">
          <h3 className="text-xl font-bold dark:text-white">Tipos de Contenido Soportados</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cada lección puede ser de uno de los siguientes formatos:</p>
          <div className="grid grid-cols-2 gap-3">
            {contentTypes.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="glass-panel p-4 rounded-xl flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.color}`}>{c.icon}</div>
                <span className="text-sm font-medium dark:text-gray-200">{c.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-step guide for Leader */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-2">Guía para el Líder Educativo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">¿Cómo crear un curso desde cero? Haz clic en cada paso.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-3 rounded-xl text-left transition-all ${activeStep === i ? 'bg-gold-gradient text-white shadow-lg' : 'glass-panel hover:scale-105'}`}>
              <div className={`text-lg font-black mb-1 ${activeStep === i ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`}>0{s.n}</div>
              <div className={`text-xs font-bold leading-tight ${activeStep === i ? 'text-white' : 'dark:text-gray-200'}`}>{s.title}</div>
            </button>
          ))}
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#C79D3F]">
          <h4 className="font-bold text-lg dark:text-white mb-2">Paso {steps[activeStep].n}: {steps[activeStep].title}</h4>
          <p className="text-gray-600 dark:text-gray-300">{steps[activeStep].desc}</p>
        </motion.div>
      </div>

      {/* Gradebook Simulation */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-2">Gradebook del Administrador</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Vista del avance de todos los estudiantes en un curso.</p>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estudiante</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Progreso</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nota Final</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {gradebookData.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium dark:text-white text-sm">{row.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {row.score ? <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>{row.score}/100</span>
                      : <span className="text-gray-400 text-xs">Pendiente</span>}
                  </td>
                  <td className="px-6 py-4">
                    {row.cert
                      ? <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400"><Award className="w-4 h-4" /> Emitido</span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Sistema de Certificados:</strong> El certificado se emite automáticamente cuando el estudiante completa el 100% del curso 
            y obtiene una nota igual o superior a la nota mínima configurada (ej. 70/100). El certificado es descargable en PDF con el sello de la iglesia.
          </p>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Multimedia <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
