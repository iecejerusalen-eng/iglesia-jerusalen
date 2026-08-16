import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { ArrowUpRight, Compass, Cross, Crown, Flame, HeartPulse, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import BibleVerseLink from '../../../components/ui/BibleVerseLink';

interface DoctrinePillar {
  title: string;
  eyebrow: string;
  description: string;
  reference: string;
  icon: typeof Cross;
  tone: string;
  softTone: string;
  iconTone: string;
}

const DOCTRINE_PILLARS: DoctrinePillar[] = [
  { title: 'Jesucristo Salvador', eyebrow: 'Redención', description: 'El único camino al Padre, quien dio su vida en la cruz para perdonar nuestros pecados y otorgar salvación a todo el que cree.', reference: 'Juan 3:16', icon: Cross, tone: 'from-rose-500 via-red-500 to-orange-400', softTone: 'bg-rose-500/10 dark:bg-rose-400/10', iconTone: 'text-rose-600 dark:text-rose-300' },
  { title: 'Jesucristo Bautizador', eyebrow: 'Poder para servir', description: 'El dador del Espíritu Santo, capacitándonos con poder y dones para testificar y vivir una vida de santidad activa y con propósito.', reference: 'Hechos 1:8', icon: Flame, tone: 'from-amber-400 via-orange-500 to-yellow-500', softTone: 'bg-amber-500/10 dark:bg-amber-400/10', iconTone: 'text-amber-600 dark:text-amber-300' },
  { title: 'Jesucristo Sanador', eyebrow: 'Restauración', description: 'El gran médico de almas y cuerpos, quien llevó nuestras dolencias y continúa sanando por medio de la fe cada día.', reference: 'Santiago 5:14-15', icon: HeartPulse, tone: 'from-sky-400 via-blue-500 to-indigo-500', softTone: 'bg-sky-500/10 dark:bg-sky-400/10', iconTone: 'text-sky-600 dark:text-sky-300' },
  { title: 'El Rey que Viene', eyebrow: 'Esperanza futura', description: 'El Rey que regresará con poder y gran gloria por su iglesia para reinar eternamente en victoria definitiva.', reference: '1 Tes. 4:16', icon: Crown, tone: 'from-violet-500 via-fuchsia-500 to-indigo-500', softTone: 'bg-violet-500/10 dark:bg-violet-400/10', iconTone: 'text-violet-600 dark:text-violet-300' },
];

type DoctrineCardStyle = CSSProperties & {
  '--pillar-rotate-x': string;
  '--pillar-rotate-y': string;
  '--pillar-pointer-x': string;
  '--pillar-pointer-y': string;
};

interface PremiumDoctrineCardProps {
  pillar: DoctrinePillar;
  index: number;
  reduceMotion: boolean;
}

function PremiumDoctrineCard({ pillar, index, reduceMotion }: PremiumDoctrineCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerTargetRef = useRef({ rotateX: 0, rotateY: 0, x: '50%', y: '50%' });
  const Icon = pillar.icon;

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const resetCard = () => {
    if (!cardRef.current) return;
    pointerTargetRef.current = { rotateX: 0, rotateY: 0, x: '50%', y: '50%' };
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    cardRef.current.style.setProperty('--pillar-rotate-x', '0deg');
    cardRef.current.style.setProperty('--pillar-rotate-y', '0deg');
    cardRef.current.style.setProperty('--pillar-pointer-x', '50%');
    cardRef.current.style.setProperty('--pillar-pointer-y', '50%');
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType === 'touch' || !cardRef.current) return;
    const bounds = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    pointerTargetRef.current = {
      rotateX: Math.max(-1, Math.min(1, 0.5 - y)) * 5,
      rotateY: Math.max(-1, Math.min(1, x - 0.5)) * 6,
      x: `${Math.round(x * 100)}%`,
      y: `${Math.round(y * 100)}%`,
    };
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const target = pointerTargetRef.current;
      cardRef.current.style.setProperty('--pillar-rotate-x', `${target.rotateX}deg`);
      cardRef.current.style.setProperty('--pillar-rotate-y', `${target.rotateY}deg`);
      cardRef.current.style.setProperty('--pillar-pointer-x', target.x);
      cardRef.current.style.setProperty('--pillar-pointer-y', target.y);
      frameRef.current = null;
    });
  };

  const style: DoctrineCardStyle = {
    '--pillar-rotate-x': '0deg',
    '--pillar-rotate-y': '0deg',
    '--pillar-pointer-x': '50%',
    '--pillar-pointer-y': '50%',
  };

  return (
    <motion.article
      ref={cardRef}
      style={style}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -7 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCard}
      className="group relative min-h-[25rem] [perspective:1200px]"
    >
      <div className="relative h-full min-h-[25rem] transform-gpu overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,.55)] backdrop-blur-xl transition-[border-color,box-shadow] duration-500 [transform:rotateX(var(--pillar-rotate-x))_rotateY(var(--pillar-rotate-y))] group-hover:border-slate-300 group-focus-within:border-slate-300 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_25px_70px_-40px_rgba(0,0,0,.8)] dark:group-hover:border-white/20 dark:group-focus-within:border-white/20 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" style={{ background: 'radial-gradient(260px circle at var(--pillar-pointer-x) var(--pillar-pointer-y), rgba(255,255,255,.42), transparent 70%)' }} />
        <div aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br ${pillar.tone} opacity-[.08] blur-2xl transition duration-700 group-hover:scale-150 group-hover:opacity-[.15]`} />
        <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${pillar.tone} opacity-80`} />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full bg-gradient-to-r ${pillar.tone}`} />Verdad {String(index + 1).padStart(2, '0')}</span>
            <span>{pillar.eyebrow}</span>
          </div>

          <div className={`relative mt-8 flex size-[4.25rem] items-center justify-center rounded-[1.4rem] ${pillar.softTone} ${pillar.iconTone} shadow-inner`}>
            <div aria-hidden="true" className={`absolute -inset-2 rounded-[1.7rem] border border-current opacity-20 transition duration-500 group-hover:scale-110 group-hover:opacity-50 ${reduceMotion ? '' : 'group-hover:rotate-12'}`} />
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] border border-dashed border-current opacity-0 transition duration-700 group-hover:rotate-45 group-hover:opacity-20" />
            <Icon size={29} strokeWidth={1.8} className="relative transition duration-500 group-hover:scale-110" />
          </div>

          <h3 className="relative mt-7 font-serif text-[1.42rem] font-black leading-tight tracking-[-.02em] text-slate-950 dark:text-white">{pillar.title}</h3>
          <p className="relative mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{pillar.description}</p>

          <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-slate-200/80 pt-5 dark:border-white/10">
            <span className={`inline-flex min-h-9 items-center rounded-full ${pillar.softTone} px-3 text-[10px] font-black uppercase tracking-[.13em] ${pillar.iconTone}`}>
              <BibleVerseLink reference={pillar.reference} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900" />
            </span>
            <span aria-hidden="true" className="inline-flex items-center text-slate-400 transition-colors group-hover:text-slate-700 group-focus-within:text-slate-700 dark:text-slate-500 dark:group-hover:text-white dark:group-focus-within:text-white"><ArrowUpRight size={14} /></span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function PremiumDoctrineCards() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section aria-labelledby="doctrine-title" className="relative mx-auto max-w-7xl px-4 py-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:px-8 md:pb-8">
      <style>{`@media (prefers-reduced-motion: reduce) { .doctrine-premium *, .doctrine-premium *::before, .doctrine-premium *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; } }`}</style>
      <div className="doctrine-premium">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 15 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: reduceMotion ? 0 : 0.6 }} className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-amber-700 shadow-sm dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-200"><Compass size={14} /> Verdades centrales</span>
          <h2 id="doctrine-title" className="mt-5 font-serif text-4xl font-black tracking-[-.04em] text-slate-950 dark:text-white sm:text-5xl">Nuestra <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-blue-700 bg-clip-text text-transparent dark:from-amber-200 dark:via-orange-300 dark:to-blue-300">Doctrina</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">Cuatro verdades que nos orientan hacia un mismo centro: Jesucristo, nuestra esperanza presente y futura.</p>
          <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400 dark:text-slate-500"><Sparkles size={13} className="text-amber-500" /> Una misma fe · cuatro expresiones</div>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {DOCTRINE_PILLARS.map((pillar, index) => <PremiumDoctrineCard key={pillar.title} pillar={pillar} index={index} reduceMotion={reduceMotion} />)}
        </div>
      </div>
    </section>
  );
}
