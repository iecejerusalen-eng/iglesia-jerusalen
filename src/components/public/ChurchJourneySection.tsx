import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { BookOpen, Heart, Users, Globe } from 'lucide-react';
import OptimizedMedia from '../common/OptimizedMedia';

interface Step {
  id: string;
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

const journeySteps: Step[] = [
  {
    id: 'step-1',
    year: 'Visión',
    title: 'Nuestra Fe',
    description: 'Creemos en la Biblia como la Palabra infalible de Dios, y en el evangelio transformador de Jesucristo.',
    icon: <BookOpen size={22} className="text-amber-500 dark:text-amber-400" />,
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-2',
    year: 'Misión',
    title: 'Amar a Dios y al Prójimo',
    description: 'Buscamos adorar a Dios en espíritu y en verdad, mientras demostramos Su amor sirviendo a nuestra comunidad.',
    icon: <Heart size={22} className="text-amber-500 dark:text-amber-400" />,
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-3',
    year: 'Comunidad',
    title: 'Un Cuerpo en Cristo',
    description: 'Fomentamos relaciones profundas, discipulado mutuo y apoyo genuino entre todos los miembros de la iglesia.',
    icon: <Users size={22} className="text-amber-500 dark:text-amber-400" />,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'step-4',
    year: 'Alcance',
    title: 'Ir y Hacer Discípulos',
    description: 'Llevamos el mensaje de esperanza más allá de nuestras paredes, impactando nuestra ciudad y el mundo entero.',
    icon: <Globe size={22} className="text-amber-500 dark:text-amber-400" />,
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
    <section className="py-24 bg-slate-50 dark:bg-[#071330] relative overflow-hidden transition-colors duration-300" ref={containerRef}>
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/3 left-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/30">
            Nuestro Propósito
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">
            El Viaje de la Fe
          </h2>
          <p className="text-slate-650 dark:text-slate-300 text-base md:text-lg leading-relaxed">
            Acompáñanos en nuestro compromiso de glorificar a Dios, edificar Su iglesia y alcanzar al mundo.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Animated central line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 w-full bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-400"
              style={{ height: lineHeight, transformOrigin: 'top' }}
            />
          </div>

          <div className="space-y-20">
            {journeySteps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <TimelineRow key={step.id} step={step} index={index} isEven={isEven} />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Separate subcomponent for clean in-view scroll animation
interface TimelineRowProps {
  step: Step;
  index: number;
  isEven: boolean;
}

const TimelineRow = ({ step, isEven }: TimelineRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-100px" });

  return (
    <div ref={rowRef} className="relative flex flex-col md:flex-row items-center w-full">
      
      {/* Glowing Timeline Node */}
      <div className="absolute left-[28px] md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isInView ? { 
            scale: [0.8, 1.2, 1], 
            opacity: 1,
            boxShadow: "0 0 20px rgba(217, 119, 6, 0.6)"
          } : {}}
          transition={{ duration: 0.6, type: 'spring' }}
          className="w-14 h-14 bg-white dark:bg-slate-900 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg dark:shadow-amber-500/10"
        >
          <div className="w-full h-full flex items-center justify-center rounded-full bg-amber-50/50 dark:bg-amber-950/20">
            {step.icon}
          </div>
        </motion.div>
      </div>

      {/* Content Side */}
      <div className={`w-full md:w-1/2 pl-20 md:pl-0 ${isEven ? 'md:pr-24 md:text-right' : 'md:pl-24 md:order-last'}`}>
        <motion.div
          initial={{ opacity: 0, x: isEven ? -40 : 40, y: 15 }}
          animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-blue-950/10 hover:border-amber-500/30 transition-all duration-300"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold text-xs mb-4 border border-amber-200 dark:border-amber-900/30">
            {step.year}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-3">
            {step.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-sm md:text-base font-light">
            {step.description}
          </p>
        </motion.div>
      </div>

      {/* Image Side */}
      <div className={`w-full md:w-1/2 pl-20 md:pl-0 mt-6 md:mt-0 ${isEven ? 'md:pl-24 md:order-last' : 'md:pr-24'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/25 aspect-[4/3] group border border-slate-200 dark:border-white/10"
        >
          <OptimizedMedia 
            src={step.image} 
            alt={step.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
      </div>

    </div>
  );
};
