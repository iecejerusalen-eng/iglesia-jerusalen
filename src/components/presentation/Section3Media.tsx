import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Search, ChevronRight, Tag, Eye, List } from 'lucide-react';

const sermonSteps = [
  { n: '1', title: 'Ir a "Sermones"', desc: 'En el Panel Admin, ve a Eventos y Medios → Sermones y haz clic en "+ Subir Sermón".' },
  { n: '2', title: 'Datos Básicos', desc: 'Escribe el título, selecciona el pastor predicador, la fecha y la categoría bíblica (ej. "Apocalipsis", "Salmos").' },
  { n: '3', title: 'Subir Video', desc: 'Arrastra el archivo de video. Se sube a Cloudinary y se genera automáticamente una miniatura del fotograma inicial.' },
  { n: '4', title: 'Miniatura', desc: 'Puedes reemplazar la miniatura automática subiendo una imagen personalizada de alta calidad.' },
  { n: '5', title: 'Publicar', desc: 'Haz clic en "Publicar". El sermón aparecerá en la sección pública inmediatamente y se podrá buscar por título, pastor o categoría.' },
];

const chordSong = [
  { chord: 'G', lyric: 'El esplendor de un Rey' },
  { chord: 'Em', lyric: 'Vestido en Majestad' },
  { chord: 'C', lyric: 'La tierra alegre está' },
  { chord: 'D', lyric: 'La tierra alegre está' },
];

const stats = [
  { label: 'Sermones subidos', val: '48', color: 'text-purple-500' },
  { label: 'Horas de contenido', val: '72h', color: 'text-blue-500' },
  { label: 'Canciones en catálogo', val: '120+', color: 'text-gold-500' },
];

export default function Section3Media({ onNext }: { onNext: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [tone, setTone] = useState(0);

  const chords = ['G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#'];
  const getChord = (base: string, delta: number) => {
    const idx = chords.indexOf(base);
    if (idx === -1) return base;
    return chords[(idx + delta + chords.length) % chords.length];
  };

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4 font-semibold text-sm">
          <Video className="w-5 h-5" /> Medios y Alabanzas
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">La Biblioteca Audiovisual</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Centralizamos las enseñanzas en video (Sermones) y el trabajo del ministerio de alabanza con un 
          cancionero digital inteligente. El equipo de medios controla todo desde el Panel Admin.
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-10 max-w-6xl w-full">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3">
            <span className={`text-3xl font-extrabold ${s.color}`}>{s.val}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sermon Upload Guide */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-2">Guía para el Equipo de Medios</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">¿Cómo subir un sermón nuevo? Sigue estos pasos.</p>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {sermonSteps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-3 rounded-xl text-left transition-all ${activeStep === i ? 'bg-purple-600 text-white shadow-lg' : 'glass-panel hover:scale-105'}`}>
              <div className={`text-lg font-black mb-1 ${activeStep === i ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`}>0{s.n}</div>
              <div className={`text-xs font-bold leading-tight ${activeStep === i ? 'text-white' : 'dark:text-gray-200'}`}>{s.title}</div>
            </button>
          ))}
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
          <h4 className="font-bold text-lg dark:text-white mb-2">Paso {sermonSteps[activeStep].n}: {sermonSteps[activeStep].title}</h4>
          <p className="text-gray-600 dark:text-gray-300">{sermonSteps[activeStep].desc}</p>
        </motion.div>
      </div>

      {/* Sermon Search Feature */}
      <div className="w-full max-w-6xl mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold dark:text-white">Búsqueda Inteligente de Sermones</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Los congregantes pueden buscar prédicas por múltiples criterios simultáneamente:
          </p>
          <ul className="space-y-2">
            {[
              { icon: <Tag className="w-4 h-4" />, text: 'Por categoría bíblica (libro de la Biblia)' },
              { icon: <Eye className="w-4 h-4" />, text: 'Por pastor o predicador invitado' },
              { icon: <List className="w-4 h-4" />, text: 'Por series de predicaciones' },
              { icon: <Video className="w-4 h-4" />, text: 'Por fecha (filtro de rango de tiempo)' },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-purple-500">{item.icon}</span>{item.text}
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-xs text-purple-800 dark:text-purple-300">
            <strong>Estadísticas:</strong> Cada sermón lleva un contador de reproducciones visible para el administrador, 
            lo que permite identificar qué temas conectan más con la congregación.
          </div>
        </div>

        {/* Interactive Chord Viewer */}
        <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700/50 flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Music className="w-5 h-5 text-[#C79D3F]" />
                <h4 className="text-white font-bold">Cancionero Interactivo</h4>
              </div>
              <h5 className="text-slate-300 font-bold text-xl">Cuán Grande Es Dios</h5>
              <span className="text-slate-500 text-xs">Tono original: G</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400 mb-1">Transposición</span>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <button onClick={() => setTone(t => t - 1)} className="px-3 py-1 rounded text-white hover:bg-slate-700 font-bold">-½</button>
                <span className={`font-bold px-2 min-w-[2.5rem] text-center ${tone !== 0 ? 'text-[#C79D3F]' : 'text-white'}`}>
                  {tone === 0 ? 'G' : getChord('G', tone)}
                </span>
                <button onClick={() => setTone(t => t + 1)} className="px-3 py-1 rounded text-white hover:bg-slate-700 font-bold">+½</button>
              </div>
              {tone !== 0 && <button onClick={() => setTone(0)} className="text-xs text-slate-500 hover:text-slate-300">Resetear</button>}
            </div>
          </div>
          <div className="flex-1 font-mono text-base space-y-4 text-slate-300 overflow-hidden">
            {chordSong.map((line, i) => (
              <div key={i}>
                <div className="text-[#C79D3F] font-bold text-lg">{getChord(line.chord, tone)}</div>
                <div className="text-slate-200">{line.lyric}</div>
              </div>
            ))}
            <div className="text-xs text-slate-500 italic pt-2">↑ El acordeón de acordes cambia de tono en tiempo real al presionar los botones</div>
          </div>
        </div>
      </div>

      {/* Playlist Management */}
      <div className="w-full max-w-6xl mb-12">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <List className="w-6 h-6 text-[#C79D3F]" />
            <h3 className="text-xl font-bold dark:text-white">Gestión de Playlist de Alabanzas</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            El Líder de Alabanza puede armar una lista de canciones para el servicio dominical, con las letras y acordes 
            de cada canción. Los músicos pueden acceder desde sus dispositivos durante el ensayo o el servicio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Servicio Dominical 06/30', songs: 5, color: 'border-l-[#C79D3F]' },
              { title: 'Ensayo Jóvenes Viernes', songs: 8, color: 'border-l-blue-500' },
              { title: 'Culto de Oración Martes', songs: 4, color: 'border-l-purple-500' },
            ].map((pl, i) => (
              <div key={i} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 ${pl.color} shadow-sm`}>
                <div className="font-bold text-sm dark:text-white mb-1">{pl.title}</div>
                <div className="text-xs text-gray-500">{pl.songs} canciones</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Comunidad CRM <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
