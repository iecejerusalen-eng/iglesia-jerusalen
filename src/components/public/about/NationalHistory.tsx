import { motion } from 'framer-motion';
import { MapPin, Users, Flame, BookOpen } from 'lucide-react';

const ECUADOR_TIMELINE = [
  {
    year: '1956',
    title: 'Llegada al Ecuador',
    location: 'Guayaquil y Milagro',
    description: 'La obra del Evangelio Cuadrangular inicia oficialmente con la llegada de los misioneros Arthur y su esposa Gadberry, enviados desde Los Ángeles. El Rvdo. Arthur predicaba por las calles de Guayaquil y realizaba reuniones en una pequeña sala (Calles Los Ríos y Maldonado). Simultáneamente se abrían obras en el Callejón Parra y en Milagro.',
    icon: <MapPin size={24} />
  },
  {
    year: '1958',
    title: 'Relevo Misionero',
    location: 'Guayaquil',
    description: 'Los esposos Roberto y Alba Aguirre arriban al país para tomar el relevo de los Gadberry, fortaleciendo y consolidando a los primeros creyentes de la naciente iglesia ecuatoriana.',
    icon: <Users size={24} />
  },
  {
    year: '1960',
    title: 'Expansión a la Capital',
    location: 'Quito',
    description: 'Tras un breve tiempo en EE.UU., los esposos Gadberry retornan a Ecuador enfocándose en la capital. Allí logran establecer la primera Iglesia del Evangelio Cuadrangular en Quito, marcando la expansión nacional de la obra.',
    icon: <Flame size={24} />
  },
  {
    year: 'Desarrollo Nacional',
    title: 'Consolidación Legal y Ministerial',
    location: 'Todo el país',
    description: 'A través de las décadas, la institución se consolidó legalmente y forjó su propia identidad pastoral ecuatoriana, manteniendo el mensaje inmutable de Jesús como Salvador, Bautizador, Sanador y Rey que viene.',
    icon: <BookOpen size={24} />
  }
];

const NationalHistory = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 dark:text-white mb-4">
          La Obra en el Ecuador
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Un legado de fe y perseverancia que comenzó en las calles y se expandió a todo el país gracias a la visión de los primeros pioneros misioneros.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        
        {/* Lado izquierdo: Relato con mapa estilizado de fondo */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute inset-0 bg-primary/5 rounded-3xl -z-10" />
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-4 border-gray-200 dark:border-slate-800">
              Cronología Histórica
            </h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
              {ECUADOR_TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="scale-50">{item.icon}</div>
                  </div>
                  
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 group-hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-primary">{item.year}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white mb-1">{item.title}</h4>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                      📍 {item.location}
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

        {/* Lado derecho: Imagen de mapa representativa */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-1 lg:order-2 h-full min-h-[400px] rounded-3xl overflow-hidden relative shadow-2xl group"
        >
          {/* Usamos un placeholder vintage map (de unsplash) */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
            alt="Mapa Antiguo de Misiones" 
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 text-white w-full bg-gradient-to-t from-black/80 to-transparent">
            <h4 className="text-2xl font-serif font-bold mb-2">Un Mensaje Sin Fronteras</h4>
            <p className="text-sm text-gray-200">
              Desde California hasta las calles de Guayaquil, el fuego del Evangelio Cuadrangular ha iluminado miles de vidas a lo largo de las décadas.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default NationalHistory;
