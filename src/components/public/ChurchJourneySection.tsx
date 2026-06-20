import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BookOpen, Heart, Users, Globe } from 'lucide-react';
import OptimizedMedia from '../common/OptimizedMedia';

const journeySteps = [
  {
    id: 'step-1',
    year: 'Visión',
    title: 'Nuestra Fe',
    description: 'Creemos en la Biblia como la Palabra infalible de Dios, y en el evangelio transformador de Jesucristo.',
    icon: <BookOpen size={24} className="text-primary" />,
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-2',
    year: 'Misión',
    title: 'Amar a Dios y al Prójimo',
    description: 'Buscamos adorar a Dios en espíritu y en verdad, mientras demostramos Su amor sirviendo a nuestra comunidad.',
    icon: <Heart size={24} className="text-primary" />,
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-3',
    year: 'Comunidad',
    title: 'Un Cuerpo en Cristo',
    description: 'Fomentamos relaciones profundas, discipulado mutuo y apoyo genuino entre todos los miembros de la iglesia.',
    icon: <Users size={24} className="text-primary" />,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-4',
    year: 'Alcance',
    title: 'Ir y Hacer Discípulos',
    description: 'Llevamos el mensaje de esperanza más allá de nuestras paredes, impactando nuestra ciudad y el mundo entero.',
    icon: <Globe size={24} className="text-primary" />,
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800'
  }
];

export default function ChurchJourneySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 relative overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gold font-bold tracking-widest uppercase text-sm mb-3 block"
          >
            Nuestro Propósito
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-6"
          >
            El Viaje de la Fe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed"
          >
            Acompáñanos en nuestro compromiso de glorificar a Dios, edificar Su iglesia y alcanzar al mundo.
          </motion.p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Animated Line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 w-full bg-gradient-to-b from-primary via-blue-500 to-gold"
              style={{ height: lineHeight, transformOrigin: 'top' }}
            />
          </div>

          <div className="space-y-24">
            {journeySteps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={step.id} className="relative flex flex-col md:flex-row items-center w-full">
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-[28px] md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white dark:bg-slate-800 rounded-full border-4 border-slate-100 dark:border-slate-700 flex items-center justify-center z-10 shadow-xl shadow-blue-900/5">
                    <motion.div
                      whileInView={{ scale: [0.5, 1.2, 1] }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="w-full h-full flex items-center justify-center rounded-full bg-blue-50"
                    >
                      {step.icon}
                    </motion.div>
                  </div>

                  {/* Content (Left or Right) */}
                  <div className={`w-full md:w-1/2 pl-20 md:pl-0 ${isEven ? 'md:pr-24 md:text-right' : 'md:pl-24 md:order-last'}`}>
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, type: 'spring' }}
                    >
                      <span className="inline-block px-3 py-1 rounded-full bg-gold/10 text-gold font-bold text-sm mb-4 border border-gold/20">
                        {step.year}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-4">{step.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">{step.description}</p>
                    </motion.div>
                  </div>

                  {/* Image (Left or Right) */}
                  <div className={`w-full md:w-1/2 pl-20 md:pl-0 mt-8 md:mt-0 ${isEven ? 'md:pl-24 md:order-last' : 'md:pr-24'}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, type: 'spring' }}
                      className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group"
                    >
                      <OptimizedMedia 
                        src={step.image} 
                        alt={step.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
