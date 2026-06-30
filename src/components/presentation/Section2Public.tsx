import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Heart, BookOpen, Music, ShoppingBag, Gamepad2, GraduationCap, X } from 'lucide-react';

const publicPages = [
  { id: 'inicio', title: 'Inicio', icon: Home, desc: 'La puerta principal del ministerio. Destaca próximos eventos y atajos rápidos.', admin: 'Banners, anuncios y atajos configurables.' },
  { id: 'nosotros', title: 'Nosotros', icon: Users, desc: 'Nuestra historia, visión y liderazgo.', admin: 'Editor de páginas dinámico.' },
  { id: 'ministerios', title: 'Ministerios', icon: Heart, desc: 'Páginas dedicadas a Niños, Jóvenes, Damas, etc.', admin: 'Creación ilimitada de ministerios y asignación de líderes.' },
  { id: 'biblia', title: 'Biblia y Recursos', icon: BookOpen, desc: 'Acceso a la Biblia online y planes de lectura.', admin: 'Configuración del plan de lectura anual.' },
  { id: 'multimedia', title: 'Sermones y Alabanzas', icon: Music, desc: 'Audios, videos, acordes y letras de canciones.', admin: 'Catálogo multimedia y Bóveda Media.' },
  { id: 'tienda', title: 'Tienda en Línea', icon: ShoppingBag, desc: 'Compra de libros, merchandising y recursos digitales.', admin: 'Inventario, pagos y órdenes.' },
  { id: 'lms', title: 'Aula Virtual', icon: GraduationCap, desc: 'Plataforma educativa para discipulado.', admin: 'Creación de cursos, lecciones y calificaciones.' },
  { id: 'juegos', title: 'Juegos Bíblicos', icon: Gamepad2, desc: 'Biblionario, Ahorcado, etc., para aprender jugando.', admin: 'Editor de preguntas y sonidos.' },
];

export default function Section2Public({ onNext }: { onNext: () => void }) {
  const [selectedPage, setSelectedPage] = useState<typeof publicPages[0] | null>(null);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 pt-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Experiencia del Congregante</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Navegación intuitiva con acceso a todos los recursos espirituales. Haz clic en una sección para descubrir su magia.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl relative z-10">
        {publicPages.map((page, idx) => {
          const Icon = page.icon;
          return (
            <motion.button
              key={page.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedPage(page)}
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{page.title}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full relative"
            >
              <button 
                onClick={() => setSelectedPage(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl">
                  <selectedPage.icon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedPage.title}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Para el Congregante</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{selectedPage.desc}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Control Admin</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedPage.admin}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="mt-12 px-8 py-3 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
      >
        Ver el Panel de Administración
      </motion.button>
    </div>
  );
}
