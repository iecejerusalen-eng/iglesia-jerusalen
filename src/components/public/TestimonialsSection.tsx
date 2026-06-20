import { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatarUrl?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'María Gómez',
    location: 'Miembro desde 2020',
    rating: 5,
    text: 'Encontrar a la Iglesia Jerusalén fue una bendición enorme para mi familia. Aquí encontré una comunidad llena de amor y apoyo espiritual real que ha guiado nuestros pasos día a día.',
    avatarUrl: ''
  },
  {
    id: '2',
    name: 'Familia Ramírez',
    location: 'Ministerio de Matrimonios',
    rating: 5,
    text: 'Los consejos y la guía pastoral que hemos recibido han transformado nuestro hogar por completo. Damos gracias a Dios por esta hermosa familia espiritual que nos cobija y nos bendice.',
    avatarUrl: ''
  },
  {
    id: '3',
    name: 'José Luis Torres',
    location: 'Ministerio de Jóvenes',
    rating: 5,
    text: 'Los servicios de los sábados son increíbles. He podido conectar con Dios de una forma real y tener amigos genuinos con el mismo propósito de edificar sus vidas y servir.',
    avatarUrl: ''
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // -1 for left, 1 for right
  const [isHovered, setIsHovered] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex, isHovered]);

  useEffect(() => {
    if (slideRef.current) {
      anime({
        targets: slideRef.current,
        translateX: [direction > 0 ? 100 : -100, 0],
        opacity: [0, 1],
        scale: [0.95, 1],
        easing: 'easeOutElastic(1, 0.8)',
        duration: 800
      });
    }
  }, [currentIndex, direction]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const active = TESTIMONIALS[currentIndex];

  return (
    <section 
      className="max-w-4xl mx-auto px-6 py-20 space-y-12 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="inline-block text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest border border-amber-200 dark:border-amber-900/30 bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
          Testimonios
        </span>
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white">
          Historias de Transformación
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          Lo que Dios está haciendo en medio de nuestra congregación.
        </p>
      </div>

      <div className="relative min-h-[340px] md:min-h-[280px] flex items-center justify-center">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-0 md:-left-4 z-20 p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-350 hover:text-amber-500 dark:hover:text-amber-400 hover:shadow-lg transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 md:-right-4 z-20 p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-350 hover:text-amber-500 dark:hover:text-amber-400 hover:shadow-lg transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Carousel slide container */}
        <div className="w-full max-w-2xl overflow-hidden px-10 py-6">
          <div
            ref={slideRef}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-blue-950/15 flex flex-col justify-between items-center relative text-center"
          >
            {/* Quote Mark background */}
            <div className="absolute top-6 left-6 text-amber-500/10 dark:text-amber-500/5 pointer-events-none">
              <Quote size={80} className="stroke-[3px]" />
            </div>

            <div className="space-y-6 relative z-10 flex flex-col items-center">
              {/* 5 Stars */}
              <div className="flex gap-1.5 text-amber-500">
                {Array.from({ length: active.rating }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" className="stroke-none" />
                ))}
              </div>

              {/* Testimony text */}
              <p className="text-slate-700 dark:text-slate-200 text-lg md:text-xl font-serif font-light italic leading-relaxed max-w-xl">
                "{active.text}"
              </p>
            </div>

            {/* Avatar and Identity */}
            <div className="flex flex-col items-center gap-2 pt-6 mt-8 border-t border-slate-250 dark:border-white/5 w-full max-w-xs relative z-10">
              {active.avatarUrl ? (
                <img
                  src={active.avatarUrl}
                  alt={active.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-bold text-lg shadow-md select-none">
                  {active.name[0]}
                </div>
              )}
              <div className="text-center">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">{active.name}</h4>
                <p className="text-xs text-slate-400 font-medium">{active.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bullet Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {TESTIMONIALS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentIndex === idx ? 'w-6 bg-amber-500' : 'w-2 bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
