import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

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
    text: 'Encontrar a la Iglesia Jerusalén fue una bendición enorme para mi familia. Aquí encontré una comunidad llena de amor y apoyo espiritual.',
    avatarUrl: ''
  },
  {
    id: '2',
    name: 'Familia Ramírez',
    location: 'Ministerio de Matrimonios',
    rating: 5,
    text: 'Los consejos y la guía pastoral que hemos recibido han transformado nuestro hogar. Damos gracias a Dios por esta hermosa familia espiritual.',
    avatarUrl: ''
  },
  {
    id: '3',
    name: 'José Luis Torres',
    location: 'Ministerio de Jóvenes',
    rating: 5,
    text: 'Los servicios de los sábados son increíbles. He podido conectar con Dios de una forma real y tener amigos con el mismo propósito.',
    avatarUrl: ''
  }
];

export default function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="text-center max-w-2xl mx-auto space-y-3"
      >
        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest border border-gold/25 bg-gold/5 px-4 py-1.5 rounded-full">
          Testimonios
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-primary">
          Historias de Transformación
        </h2>
        <p className="text-stone-500 text-sm md:text-base leading-relaxed">
          Lo que Dios está haciendo en medio de nuestra congregación.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between relative"
          >
            <div className="absolute top-6 right-6 text-primary/10">
              <Quote size={40} className="stroke-[3px]" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex gap-1 text-gold">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className="stroke-none" />
                ))}
              </div>

              <p className="text-stone-600 text-sm leading-relaxed italic">
                "{testimonial.text}"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-white/5 relative z-10">
              {testimonial.avatarUrl ? (
                <img
                  src={testimonial.avatarUrl}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover border border-primary/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {testimonial.name[0]}
                </div>
              )}
              <div className="text-left">
                <h4 className="font-bold text-xs text-primary">{testimonial.name}</h4>
                <p className="text-[10px] text-stone-400 font-medium">{testimonial.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
