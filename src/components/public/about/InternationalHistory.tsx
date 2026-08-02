import { motion } from 'framer-motion';
import { Calendar, Globe, Radio, HeartHandshake, Building2 } from 'lucide-react';
import OptimizedMedia from '../../common/OptimizedMedia';

const TIMELINE_DATA = [
  {
    year: '1922',
    title: 'El Mensaje Cuadrangular',
    description: 'Durante una campaña de avivamiento en Oakland, California, Aimee Semple McPherson utiliza por primera vez el término "Evangelio Cuadrangular" para describir su mensaje cristocéntrico.',
    icon: <Building2 size={24} />,
    image: 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?auto=format&fit=crop&q=80&w=1000'
  },
  {
    year: '1923',
    title: 'Ángelus Temple y Entrenamiento',
    description: 'En enero, se inaugura el Ángelus Temple en Los Ángeles con capacidad para 5,300 personas. Un mes después, se abre el primer instituto bíblico (hoy Life Pacific University) para capacitar ministros y misioneros.',
    icon: <Building2 size={24} />,
    image: 'https://images.unsplash.com/photo-1548625361-ec853c6e9389?auto=format&fit=crop&q=80&w=1000'
  },
  {
    year: '1924',
    title: 'Pioneros en Radio y Misiones',
    description: 'Aimee se convierte en la primera mujer en operar una estación de radio (KFSG) para transmitir el evangelio. Simultáneamente, la iglesia envía a sus primeros misioneros a la India.',
    icon: <Radio size={24} />
  },
  {
    year: '1927',
    title: 'Consolidación Internacional',
    description: 'La organización se incorpora formalmente como la Iglesia Internacional del Evangelio Cuadrangular, contando ya con más de 100 iglesias plantadas y enviando misioneros a Filipinas.',
    icon: <Globe size={24} />,
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=1000'
  },
  {
    year: '1928',
    title: 'Obra Social en la Gran Depresión',
    description: 'Se abre el "Commissary" en el Ángelus Temple, proveyendo alimentos, ropa y asistencia a más de 1.5 millones de personas durante la Gran Depresión sin distinción de raza o credo.',
    icon: <HeartHandshake size={24} />
  },
  {
    year: 'Actualidad',
    title: 'Un Movimiento Global',
    description: 'Hoy, a través de Foursquare Missions International (FMI), la iglesia opera en más de 150 países, con más de 100,000 congregaciones y aproximadamente 8.8 millones de miembros en todo el mundo.',
    icon: <Globe size={24} />
  }
];

const InternationalHistory = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 dark:text-white mb-4">
          Un Movimiento Nacido del Espíritu
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Desde sus humildes comienzos en Los Ángeles hasta convertirse en una familia global, la Iglesia Cuadrangular fue concebida con un profundo llamado misionero.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Línea central */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent -translate-x-1/2" />

        <div className="space-y-12 md:space-y-24">
          {TIMELINE_DATA.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex flex-col md:flex-row items-start ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-[28px] md:left-1/2 w-10 h-10 bg-white dark:bg-slate-900 border-4 border-primary rounded-full flex items-center justify-center -translate-x-1/2 z-10 shadow-lg">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>

                {/* Contenido (Tarjeta) */}
                <div className={`ml-16 md:ml-0 md:w-1/2 flex ${isEven ? 'justify-start md:pl-12' : 'justify-end md:pr-12'}`}>
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/20 shadow-glass w-full hover:shadow-lg transition-all duration-300 group">
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                          <Calendar size={14} />
                          {item.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {item.image && (
                      <div className="mt-4 rounded-xl overflow-hidden shadow-md">
                        <OptimizedMedia
                          src={item.image}
                          alt={item.title}
                          className="w-full h-48 md:h-64 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InternationalHistory;
