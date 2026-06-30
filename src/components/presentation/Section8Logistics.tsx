import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, CalendarDays, Truck, ChevronRight, UserCheck, PlusCircle } from 'lucide-react';

const schedule = [
  { time: '10:00 AM', title: 'Alabanza', leader: 'Hnos. Música', duration: '30 min', color: 'border-l-blue-500' },
  { time: '10:30 AM', title: 'Anuncios', leader: 'Diácono Juan', duration: '10 min', color: 'border-l-[#C79D3F]' },
  { time: '10:40 AM', title: 'Ofrenda', leader: 'Tesorero', duration: '5 min', color: 'border-l-green-500' },
  { time: '10:45 AM', title: 'Prédica', leader: 'Pastor Roberto', duration: '45 min', color: 'border-l-purple-500' },
  { time: '11:30 AM', title: 'Cierre y Oración', leader: 'Líder de Oración', duration: '15 min', color: 'border-l-red-400' },
];

const inventoryItems = [
  { name: 'Shure SM58 (x2)', category: 'Audio', status: 'En Uso', ministry: 'Alabanza', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { name: 'Consola Yamaha MG16', category: 'Audio', status: 'Mantenimiento', ministry: 'Sonido', statusColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { name: 'Cámara Sony A6400', category: 'Video', status: 'Disponible', ministry: 'Medios', statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: 'Proyector Epson EB', category: 'Visual', status: 'En Uso', ministry: 'Culto', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
];

export default function Section8Logistics({ onNext }: { onNext: () => void }) {
  const [activeItem, setActiveItem] = useState<number | null>(null);

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mb-4 font-semibold text-sm">
          <Truck className="w-5 h-5" /> Operaciones y Logística
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Gestión Detrás de Escena</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El Director de Servicio y los líderes de logística organizan los cronogramas dominicales y controlan 
          los activos físicos de la iglesia desde un panel dedicado.
        </p>
      </div>

      {/* Production Board */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-6 h-6 text-amber-500" />
          <h3 className="text-2xl font-bold dark:text-white">Production Board — Cronograma Dominical</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          El Director de Servicio puede crear y compartir el orden del culto con todos los líderes antes del domingo.
          Cada segmento tiene un responsable asignado, duración y notas adicionales.
        </p>

        <div className="space-y-3 max-w-2xl mb-4">
          {schedule.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border-l-4 ${item.color} hover:shadow-md transition-shadow`}>
              <div className="text-xs font-mono text-gray-500 w-16 flex-shrink-0">{item.time}</div>
              <div className="flex-1">
                <div className="font-bold text-sm dark:text-white">{item.title}</div>
                <div className="text-xs text-gray-400">{item.leader}</div>
              </div>
              <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-gray-600 dark:text-gray-300">{item.duration}</div>
            </motion.div>
          ))}
          <button className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-bold hover:underline">
            <PlusCircle className="w-4 h-4" /> Añadir segmento
          </button>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl max-w-2xl">
          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Asignación de Responsables
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Al asignar un líder a un segmento, ese líder recibe una notificación de recordatorio 
            automática 1 hora antes del servicio. Los cambios de último minuto se sincronizan 
            instantáneamente para todos los involucrados.
          </p>
        </div>
      </div>

      {/* Inventory Manager */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6 text-blue-500" />
          <h3 className="text-2xl font-bold dark:text-white">Gestor de Inventario</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Controla todos los activos físicos de la iglesia. Haz clic en un elemento para ver sus detalles.
        </p>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Equipo</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Categoría</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Ministerio</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {inventoryItems.map((item, i) => (
                <motion.tr key={i} onClick={() => setActiveItem(activeItem === i ? null : i)}
                  className={`cursor-pointer transition-colors ${activeItem === i ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}>
                  <td className="px-6 py-4 font-medium dark:text-white text-sm">{item.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm hidden md:table-cell">{item.category}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.ministry}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>{item.status}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          <strong>Guía para Líderes:</strong> Para registrar un nuevo activo, ve a Panel Admin → Logística → Inventario → "+ Nuevo Activo". 
          Rellena nombre, categoría, ministerio responsable y estado inicial.
        </p>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Analíticas <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
