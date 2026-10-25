import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import BibleVerseLink from '../../../components/ui/BibleVerseLink';
import QuadrangularSymbol, { type QuadrangularSymbolName } from '../../../components/public/QuadrangularSymbol';

interface DoctrinePillar {
  title: string;
  eyebrow: string;
  description: string;
  reference: string;
  symbol: QuadrangularSymbolName;
  tone: string;
  softTone: string;
  iconTone: string;
}

const DOCTRINE_PILLARS: DoctrinePillar[] = [
  { title: 'Jesucristo Salvador', eyebrow: 'Redención', description: 'El único camino al Padre, quien dio su vida en la cruz para perdonar nuestros pecados y otorgar salvación a todo el que cree.', reference: 'Juan 3:16', symbol: 'cross', tone: 'from-rose-500 via-red-500 to-orange-400', softTone: 'bg-rose-500/10 dark:bg-rose-400/10', iconTone: 'text-rose-600 dark:text-rose-300' },
  { title: 'Jesucristo Bautizador', eyebrow: 'Poder para servir', description: 'El dador del Espíritu Santo, capacitándonos con poder y dones para testificar y vivir una vida de santidad activa y con propósito.', reference: 'Hechos 1:8', symbol: 'dove', tone: 'from-amber-400 via-orange-500 to-yellow-500', softTone: 'bg-amber-500/10 dark:bg-amber-400/10', iconTone: 'text-amber-600 dark:text-amber-300' },
  { title: 'Jesucristo Sanador', eyebrow: 'Restauración', description: 'El gran médico de almas y cuerpos, quien llevó nuestras dolencias y continúa sanando por medio de la fe cada día.', reference: 'Santiago 5:14-15', symbol: 'cup', tone: 'from-sky-400 via-blue-500 to-indigo-500', softTone: 'bg-sky-500/10 dark:bg-sky-400/10', iconTone: 'text-sky-600 dark:text-sky-300' },
  { title: 'El Rey que Viene', eyebrow: 'Esperanza futura', description: 'El Rey que regresará con poder y gran gloria por su iglesia para reinar eternamente en victoria definitiva.', reference: '1 Tes. 4:16', symbol: 'crown', tone: 'from-violet-500 via-fuchsia-500 to-indigo-500', softTone: 'bg-violet-500/10 dark:bg-violet-400/10', iconTone: 'text-violet-600 dark:text-violet-300' },
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
      className="group relative z-0 min-h-[21rem] [perspective:1200px] hover:z-20 focus-within:z-20 sm:min-h-[25rem]"
    >
      <div className="relative h-full min-h-[21rem] transform-gpu rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_22px_60px_-38px_rgba(15,23,42,.55)] backdrop-blur-xl transition-[border-color,box-shadow] duration-500 [transform:rotateX(var(--pillar-rotate-x))_rotateY(var(--pillar-rotate-y))] group-hover:border-slate-300 group-focus-within:border-slate-300 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-[0_25px_70px_-40px_rgba(0,0,0,.8)] dark:group-hover:border-white/20 dark:group-focus-within:border-white/20 sm:min-h-[25rem] sm:rounded-[2rem] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" style={{ background: 'radial-gradient(260px circle at var(--pillar-pointer-x) var(--pillar-pointer-y), rgba(255,255,255,.42), transparent 70%)' }} />
          <div className={`absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br ${pillar.tone} opacity-[.08] blur-2xl transition duration-700 group-hover:scale-150 group-hover:opacity-[.15]`} />
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${pillar.tone} opacity-80`} />
        </div>

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full bg-gradient-to-r ${pillar.tone}`} />Verdad {String(index + 1).padStart(2, '0')}</span>
            <span>{pillar.eyebrow}</span>
          </div>

          <div className={`relative mt-5 flex size-14 items-center justify-center rounded-2xl ${pillar.softTone} ${pillar.iconTone} shadow-inner sm:mt-8 sm:size-[4.25rem] sm:rounded-[1.4rem]`}>
            <div aria-hidden="true" className={`absolute -inset-1.5 rounded-[1.35rem] border border-current opacity-20 transition duration-500 group-hover:scale-110 group-hover:opacity-50 sm:-inset-2 sm:rounded-[1.7rem] ${reduceMotion ? '' : 'group-hover:rotate-12'}`} />
            <div aria-hidden="true" className="absolute -inset-3 rounded-[1.6rem] border border-dashed border-current opacity-0 transition duration-700 group-hover:rotate-45 group-hover:opacity-20 sm:-inset-4 sm:rounded-[2rem]" />
            <QuadrangularSymbol symbol={pillar.symbol} className="relative size-14 rounded-2xl transition duration-500 group-hover:scale-110 sm:size-[4.25rem] sm:rounded-[1.4rem]" />
          </div>

          <h3 className="relative mt-5 font-serif text-xl font-black leading-tight tracking-[-.02em] text-slate-950 dark:text-white sm:mt-7 sm:text-[1.42rem]">{pillar.title}</h3>
          <p className="relative mt-3 text-[13px] leading-5 text-slate-600 dark:text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">{pillar.description}</p>

          <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-white/10 sm:pt-5">
            <span className={`inline-flex min-h-9 items-center rounded-full ${pillar.softTone} px-3 text-[10px] font-black uppercase tracking-[.13em] ${pillar.iconTone}`}>
              <BibleVerseLink reference={pillar.reference} preview className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900" />
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
    <section aria-labelledby="doctrine-title" className="relative mx-auto max-w-7xl px-4 py-2 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-4 md:pb-8">
      <style>{`@media (prefers-reduced-motion: reduce) { .doctrine-premium *, .doctrine-premium *::before, .doctrine-premium *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; } }`}</style>
      <div className="doctrine-premium">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 15 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: reduceMotion ? 0 : 0.6 }} className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-amber-700 shadow-sm dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-200 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[.22em]"><Compass size={13} /> Verdades centrales</span>
          <h2 id="doctrine-title" className="mt-3 font-serif text-3xl font-black tracking-[-.04em] text-slate-950 dark:text-white sm:mt-5 sm:text-5xl">Nuestra <span className="text-church-gold-gradient">Doctrina</span></h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-slate-600 dark:text-slate-300 sm:mt-4 sm:text-base sm:leading-7">Cuatro verdades que nos orientan hacia un mismo centro: Jesucristo, nuestra esperanza presente y futura.</p>
          <div className="mt-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400 dark:text-slate-500 sm:mt-5 sm:text-[10px] sm:tracking-[.18em]"><Sparkles size={12} className="text-amber-500" /> Una misma fe · cuatro expresiones</div>
        </motion.div>

        <div className="mt-7 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {DOCTRINE_PILLARS.map((pillar, index) => <PremiumDoctrineCard key={pillar.title} pillar={pillar} index={index} reduceMotion={reduceMotion} />)}
        </div>
      </div>
    </section>
  );
}
