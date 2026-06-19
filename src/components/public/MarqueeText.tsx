import { motion } from 'framer-motion';

export default function MarqueeText() {
  const phrase = "✦ SERVICIO DOMINICAL 10:00 AM ✦ ESTUDIO BÍBLICO JUEVES 7:00 PM ✦ REUNIÓN DE JÓVENES SÁBADOS ✦ ";
  const repeatedPhrase = Array(6).fill(phrase).join('');

  return (
    <div className="w-full bg-primary overflow-hidden py-3.5 sm:py-4.5 border-y border-white/10 select-none relative z-10 flex">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 35,
        }}
        className="flex whitespace-nowrap text-xs sm:text-sm font-sans font-black tracking-widest text-white uppercase"
      >
        <span className="inline-block pr-8">{repeatedPhrase}</span>
        <span className="inline-block pr-8">{repeatedPhrase}</span>
      </motion.div>
    </div>
  );
}
