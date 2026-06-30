import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Star, ChevronRight, Upload, Settings, RotateCcw } from 'lucide-react';

const scoring = [
  { action: 'Respuesta correcta (Biblionario)', points: '+100 pts', color: 'text-green-600 dark:text-green-400' },
  { action: 'Respuesta correcta con velocidad < 5s', points: '+50 pts bonus', color: 'text-blue-600 dark:text-blue-400' },
  { action: 'Respuesta incorrecta', points: '-25 pts', color: 'text-red-600 dark:text-red-400' },
  { action: 'Usar comodín "50/50"', points: '0 pts (sin penalización)', color: 'text-gray-500' },
  { action: 'Memorama completado (< 30 movimientos)', points: '+200 pts bonus', color: 'text-purple-600 dark:text-purple-400' },
  { action: 'Ahorcado resuelto sin errores', points: '+150 pts bonus', color: 'text-amber-600 dark:text-amber-400' },
];

const leaderboard = [
  { pos: 1, name: 'María González', score: 2480, badge: '🏆' },
  { pos: 2, name: 'Carlos Rivera', score: 2150, badge: '🥈' },
  { pos: 3, name: 'Ana Martínez', score: 1990, badge: '🥉' },
  { pos: 4, name: 'Luis Herrera', score: 1720, badge: '' },
  { pos: 5, name: 'Sofía Rojas', score: 1650, badge: '' },
];

export default function Section5Games({ onNext }: { onNext: () => void }) {
  const [activeGame, setActiveGame] = useState(0);

  const games = [
    {
      name: 'Biblionario',
      color: 'orange',
      icon: <Star className="w-6 h-6" />,
      desc: 'Modo tipo "¿Quién quiere ser Millonario?" con preguntas de conocimiento bíblico, 3 comodines y dificultad progresiva.',
      adminTip: 'El administrador puede importar bancos de preguntas desde un archivo CSV o crearlas una por una desde el editor visual. Cada pregunta necesita: enunciado, 4 opciones y la respuesta correcta marcada.',
    },
    {
      name: 'Memorama Bíblico',
      color: 'blue',
      icon: <Gamepad2 className="w-6 h-6" />,
      desc: 'Emparejamiento de personajes, versículos y conceptos bíblicos. Requiere memoria y concentración. Ideal para jóvenes.',
      adminTip: 'El administrador configura el tamaño del tablero (4x4, 6x6) y las imágenes de las tarjetas. Se puede vincular con el contenido del Aula Virtual (ej. cartas de personajes del curso que se está estudiando).',
    },
    {
      name: 'Ahorcado',
      color: 'purple',
      icon: <Trophy className="w-6 h-6" />,
      desc: 'Adivina palabras o nombres bíblicos letra por letra. Tiene 6 intentos antes de perder. Las palabras se sacan de la base de datos de la Biblia.',
      adminTip: 'Se puede configurar la categoría de palabras: nombres de personajes, libros de la Biblia, términos doctrinales. También se puede limitar a vocabulario relacionado con el tema del servicio del domingo.',
    },
  ];

  const g = games[activeGame];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mb-4 font-semibold text-sm">
          <Gamepad2 className="w-5 h-5" /> Gamificación
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Aprender Jugando</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Convertimos el aprendizaje bíblico en un hábito atractivo mediante 3 juegos interactivos conectados 
          a un sistema de puntuación y tabla de clasificación global en tiempo real.
        </p>
      </div>

      {/* Game Selector */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex gap-3 mb-6 flex-wrap">
          {games.map((game, i) => (
            <button key={i} onClick={() => setActiveGame(i)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all ${activeGame === i ? 'bg-orange-500 text-white shadow-lg scale-105' : 'glass-panel dark:text-gray-300'}`}>
              {game.icon} {game.name}
            </button>
          ))}
        </div>

        <motion.div key={activeGame} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-xl font-bold dark:text-white mb-3">{g.name} — ¿Cómo funciona?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{g.desc}</p>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-orange-500" />
                <h4 className="font-bold text-sm text-orange-800 dark:text-orange-300">Guía para el Admin</h4>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">{g.adminTip}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-5 h-5 text-blue-500" />
                <h4 className="font-bold dark:text-white">Configuración de Torneos</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2"><span className="text-blue-400">→</span> Activar o desactivar juegos individuales desde el admin.</li>
                <li className="flex gap-2"><span className="text-blue-400">→</span> Configurar ventanas de tiempo (ej. "Solo disponible el domingo").</li>
                <li className="flex gap-2"><span className="text-blue-400">→</span> Resetear el Leaderboard para un evento o congreso especial.</li>
              </ul>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-green-500" />
                <h4 className="font-bold dark:text-white">Importar Preguntas (CSV)</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                El formato del CSV es: <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">pregunta, opción_a, opción_b, opción_c, opción_d, respuesta_correcta</code>. 
                Se pueden importar cientos de preguntas de una sola vez.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scoring Table */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-6">Mecánica de Puntuación</h3>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Acción</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {scoring.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-3 text-sm dark:text-gray-300">{row.action}</td>
                  <td className={`px-6 py-3 text-sm font-bold ${row.color}`}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h3 className="text-2xl font-bold dark:text-white">Tabla de Clasificación (Leaderboard)</h3>
        </div>
        <div className="glass-panel rounded-2xl overflow-hidden max-w-xl">
          {leaderboard.map((row, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-4 px-6 py-4 ${i < leaderboard.length - 1 ? 'border-b border-gray-100 dark:border-slate-800' : ''} ${i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
              <span className="text-2xl w-8">{row.badge || `#${row.pos}`}</span>
              <span className="flex-1 font-medium dark:text-white text-sm">{row.name}</span>
              <span className="font-bold text-[#C79D3F]">{row.score.toLocaleString()} pts</span>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Los puntos se sincronizan con Supabase en tiempo real. El Leaderboard actualiza automáticamente sin recargar la página.</p>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Tienda y Finanzas <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
