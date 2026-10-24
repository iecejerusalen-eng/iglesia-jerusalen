import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, ChevronRight, CircleHelp, RotateCcw, Search, Sparkles, Users } from 'lucide-react';

type Stage = 'intro' | 'lamp' | 'sweep' | 'coin' | 'reflection' | 'complete';
type Step = Exclude<Stage, 'intro' | 'reflection' | 'complete'>;

const stepContent: Record<Step, { title: string; clue: string; action: string }> = {
  lamp: { title: 'Enciende la lámpara', clue: 'Toca la pequeña lámpara de aceite en la repisa izquierda para iluminar cada rincón.', action: 'La lámpara ilumina el hogar.' },
  sweep: { title: 'Barre con cuidado', clue: 'Busca la escoba apoyada junto a la pared y úsala para barrer con diligencia.', action: 'El suelo está despejado. Mira con atención.' },
  coin: { title: 'Encuentra la moneda', clue: 'Después del barrido, busca un pequeño destello junto al borde inferior de la alfombra.', action: '¡Encontraste la moneda perdida!' },
};

const stepOrder: Step[] = ['lamp', 'sweep', 'coin'];
const dustParticles = [
  { left: '32%', bottom: '19%', size: 5, delay: 0 },
  { left: '36%', bottom: '22%', size: 7, delay: 0.08 },
  { left: '40%', bottom: '18%', size: 4, delay: 0.16 },
  { left: '44%', bottom: '21%', size: 6, delay: 0.24 },
  { left: '48%', bottom: '17%', size: 5, delay: 0.32 },
];

export const ParableCode = () => {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>('intro');
  const [hintUsed, setHintUsed] = useState(false);
  const [answer, setAnswer] = useState<'joy' | 'other' | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);
  const [message, setMessage] = useState('Observa la habitación y sigue las pistas.');
  const currentStep: Step | null = stage === 'lamp' || stage === 'sweep' || stage === 'coin' ? stage : null;
  const completedSteps = stage === 'intro' ? 0 : stage === 'lamp' ? 0 : stage === 'sweep' ? 1 : stage === 'coin' ? 2 : 3;

  useEffect(() => {
    if (!isSweeping) return undefined;
    const timeout = window.setTimeout(() => {
      setStage('coin');
      setHintUsed(false);
      setMessage(stepContent.sweep.action);
      setIsSweeping(false);
    }, reduceMotion ? 80 : 1600);
    return () => window.clearTimeout(timeout);
  }, [isSweeping, reduceMotion]);

  const reset = () => {
    setStage('intro');
    setHintUsed(false);
    setAnswer(null);
    setIsSweeping(false);
    setMessage('Observa la habitación y sigue las pistas.');
  };

  const advance = () => {
    if (stage === 'lamp') { setStage('sweep'); setHintUsed(false); setMessage(stepContent.sweep.clue); }
    else if (stage === 'sweep') { setStage('coin'); setHintUsed(false); setMessage(stepContent.coin.clue); }
    else if (stage === 'coin') { setStage('reflection'); setMessage(''); }
  };

  const handleSceneAction = (action: Step) => {
    if (stage !== action) {
      setMessage(currentStep ? `Sigue la pista: ${stepContent[currentStep].title.toLowerCase()}.` : 'Entra a la habitación para comenzar.');
      return;
    }
    if (action === 'lamp') {
      setStage('sweep');
      setHintUsed(false);
      setMessage(stepContent.lamp.action);
      return;
    }
    if (action === 'sweep') {
      if (isSweeping) return;
      setIsSweeping(true);
      setHintUsed(true);
      setMessage('La escoba recorre el suelo…');
      return;
    }
    advance();
  };

  const hint = () => {
    setHintUsed(true);
    setMessage(stage === 'lamp' ? 'Mira la lámpara de aceite, en el lado izquierdo de la escena.' : stage === 'sweep' ? 'Toca la escoba que está apoyada junto a la pared.' : 'La moneda está en el suelo, cerca del borde inferior de la alfombra.');
  };

  const showReflection = () => {
    if (!answer) return;
    setStage('complete');
    setMessage('La historia quedó descifrada.');
  };

  return <>
    <Helmet><title>El Código de las Parábolas | Iglesia Jerusalén</title><meta name="description" content="Explora la parábola de la moneda perdida en una escena interactiva inspirada en Lucas 15:8–10." /></Helmet>
    <main className="min-h-screen overflow-hidden bg-[#f7f5ef] px-3 pb-16 pt-20 text-slate-900 dark:bg-[#070d19] dark:text-slate-100 sm:px-6 sm:pt-24">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-50 dark:opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, rgba(218,166,75,.16), transparent 30%), radial-gradient(circle at 86% 72%, rgba(25,58,98,.14), transparent 32%)' }} />
      <div className="relative mx-auto max-w-[1440px]">
        <Link to="/recursos/juegos" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-200 dark:hover:bg-white/10"><ArrowLeft size={17} /> Volver a juegos</Link>
        <header className="mt-5 flex flex-col gap-5 border-y border-[#b68a3c]/25 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-full border border-[#c99b49]/60 bg-gradient-to-br from-[#fff1c4] to-[#ba862e] text-[#17243a] shadow-md"><BookOpen size={23} /></div><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#96671e] dark:text-[#e7c47e]">Una parábola · una pista</p><h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">El Código de las Parábolas</h1></div></div>
          <div className="flex items-center justify-between gap-4 sm:justify-end"><div className="flex items-center gap-2" aria-label={`${completedSteps} de 3 acciones completadas`}>{stepOrder.map((item, index) => <span key={item} title={stepContent[item].title} className={`grid size-9 place-items-center rounded-full border text-xs font-bold ${index < completedSteps ? 'border-[#d9ac54] bg-gradient-to-br from-[#ffedb8] to-[#b77b22] text-slate-950' : 'border-slate-300/70 bg-white/70 text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400'}`}>{index < completedSteps ? <Check size={15} /> : `0${index + 1}`}</span>)}</div><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Lucas 15:8–10</span></div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.72fr)]">
          <section className="min-w-0" aria-label="Escena interactiva">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#c59a4f]/45 bg-[#101a27] shadow-[0_24px_80px_-38px_rgba(11,21,37,.72)]">
              <div className="relative aspect-[16/10] min-h-[245px] overflow-hidden sm:min-h-[390px]">
                <img src="/images/games/parables/lost-coin-room-v03-clean.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                <div aria-hidden="true" className={`pointer-events-none absolute inset-0 transition duration-700 ${stage === 'intro' || stage === 'lamp' ? '' : 'bg-gradient-to-t from-[#0b1119]/45 via-transparent to-[#0b1119]/10'}`} style={stage === 'intro' || stage === 'lamp' ? { backgroundColor: 'rgba(5,11,22,.45)' } : undefined} />
                {stage !== 'intro' && stage !== 'lamp' && <motion.div aria-hidden="true" initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="pointer-events-none absolute rounded-full blur-2xl" style={{ left: '3%', top: '25%', height: '26%', width: '22%', backgroundColor: 'rgba(252,211,77,.22)' }} />}
                {stage !== 'intro' && stage !== 'lamp' && <motion.svg aria-hidden="true" viewBox="0 0 32 40" initial={reduceMotion ? false : { opacity: 0, scale: 0.55, y: 5 }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: [0.55, 1.14, 0.97, 1], y: [5, -3, 1, 0], scaleY: [1, 0.88, 1.05, 0.98] }} transition={{ default: { type: 'spring', stiffness: 270, damping: 17 }, scaleY: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } }} className="pointer-events-none absolute z-10" style={{ left: '10.5%', top: '28%', width: '3.5%', height: '7%' }}><path d="M17 2C20 10 29 15 27 25a11 11 0 1 1-22 0c0-6 4-9 6-15 1 5 3 7 6 9C18 13 18 8 17 2Z" fill="#ffcd63" stroke="#fff1c5" strokeWidth="1.5" /><path d="M17 18c2 4 5 6 4 10a5 5 0 0 1-10 0c0-3 2-5 3-8 1 2 2 3 3 4 1-2 1-4 0-6Z" fill="#fff6d8" /></motion.svg>}
                {stage !== 'intro' && <motion.img aria-hidden="true" alt="" src="/images/games/parables/lost-coin-broom.webp" initial={false} animate={isSweeping && !reduceMotion ? { left: ['19%', '22%', '31%', '40%', '38%', '27%', '19%'], top: ['45%', '50%', '53%', '53%', '51%', '48%', '45%'], rotate: [-53, -48, -39, -46, -57, -49, -53], scale: [1, 1.03, 1.05, 1.02, 1, 1.02, 1] } : { left: '19%', top: '45%', rotate: -53, scale: 1 }} transition={isSweeping && !reduceMotion ? { duration: 1.52, ease: [0.42, 0, 0.58, 1], times: [0, 0.12, 0.3, 0.48, 0.63, 0.82, 1] } : { type: 'spring', stiffness: 210, damping: 22 }} className="pointer-events-none absolute" style={{ zIndex: 15, width: '18%', height: '30%', objectFit: 'contain', transformOrigin: '84% 16%', filter: 'drop-shadow(2px 4px 3px rgba(18,12,7,.55))' }} />}
                {isSweeping && !reduceMotion && dustParticles.map((particle, index) => <motion.span key={index} aria-hidden="true" initial={{ opacity: 0, scale: 0.25, x: 0, y: 0 }} animate={{ opacity: [0, 0.36, 0], scale: [0.25, 1, 0.45], x: [0, 8 + index * 4, 17 + index * 7], y: [0, -9 - index * 2, -3] }} transition={{ duration: 0.54, delay: particle.delay, repeat: 1, ease: 'easeOut' }} className="pointer-events-none absolute z-10 rounded-full" style={{ left: particle.left, bottom: particle.bottom, width: particle.size, height: particle.size, backgroundColor: 'rgba(225,191,137,.72)', boxShadow: '0 0 6px rgba(235,200,147,.35)' }} />)}
                {stage === 'sweep' && <motion.div aria-hidden="true" initial={{ opacity: 0, scaleX: 0.3 }} animate={isSweeping && !reduceMotion ? { opacity: [0, 0.35, 0.2, 0], scaleX: [0.35, 1, 0.72, 0.25], x: [0, 42, 93, 140], y: [0, 3, 0, 2] } : { opacity: 0, scaleX: 0.3 }} transition={{ duration: reduceMotion ? 0 : 1.46, ease: 'easeInOut' }} className="pointer-events-none absolute z-10 rounded-full" style={{ bottom: '20%', left: '24%', width: '19%', height: '0.5rem', transformOrigin: 'left center', background: 'linear-gradient(90deg, transparent, rgba(255,241,198,.7), transparent)', filter: 'blur(4px)' }} />}
                {stage === 'coin' && <motion.div aria-hidden="true" initial={reduceMotion ? false : { opacity: 0, x: -22, y: -5, rotate: -360, scaleX: 0.2, scaleY: 0.72 }} animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 230, damping: 16, mass: 0.55 }} className="pointer-events-none absolute z-10 size-5 rounded-full border-2 border-[#ffe6a1] bg-gradient-to-br from-[#fff2bb] via-[#d9a83f] to-[#7d4b12] sm:size-6" style={{ left: '54%', top: '68%', boxShadow: '0 0 8px 2px rgba(255,214,119,.38)' }} />}
                <div className="absolute left-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#08111e]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-white backdrop-blur sm:left-5 sm:top-5"><Search size={13} className="text-[#e9c06c]" /> La casa al anochecer</div>
                {currentStep === 'lamp' && <button type="button" aria-label="Encender la lámpara de aceite" onClick={() => handleSceneAction('lamp')} className="absolute z-20 cursor-pointer rounded-full border-2 border-transparent transition hover:border-amber-100/50 hover:bg-amber-100/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80" style={{ left: '6%', top: '29%', height: '17%', width: '15%', minHeight: 44, minWidth: 44 }}><span className="sr-only">Encender la lámpara de aceite</span></button>}
                {currentStep === 'sweep' && <button type="button" aria-label={isSweeping ? 'La escoba está barriendo' : 'Tomar la escoba y barrer la casa'} disabled={isSweeping} onClick={() => handleSceneAction('sweep')} className="absolute z-20 cursor-pointer rounded-full border-2 border-transparent transition hover:border-amber-100/70 hover:bg-amber-100/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80" style={{ left: '27%', top: '49%', height: '42%', width: '16%', minHeight: 44, minWidth: 44 }} />}
                {currentStep === 'coin' && <button type="button" aria-label="Recoger la moneda que encontraste en el suelo" onClick={() => handleSceneAction('coin')} className="absolute z-20 cursor-pointer rounded-full border-2 border-transparent transition hover:border-amber-100/50 hover:bg-amber-100/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80" style={{ left: '51%', top: '65%', height: '15%', width: '9%', minHeight: 44, minWidth: 44 }}><span className="sr-only">Recoger moneda</span></button>}
                {stage === 'intro' && <div className="absolute inset-0 z-40 grid place-items-center bg-[#07101c]/25 p-4"><div className="max-w-md rounded-[1.4rem] border border-[#e9c06c]/50 bg-[#081522]/95 p-5 text-center text-white shadow-2xl backdrop-blur-md sm:p-8"><span className="mx-auto grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#fff1bd] to-[#b47c28] text-[#1a2433]"><Sparkles size={22} /></span><p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-[#f0ca79]">Sala 01 · Una búsqueda cuidadosa</p><h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">La moneda perdida</h2><p className="mt-3 text-sm leading-6 text-slate-200">Explora el hogar, sigue las pistas y descubre por qué esta pequeña moneda provoca tanta alegría.</p><button type="button" onClick={() => { setStage('lamp'); setMessage(stepContent.lamp.clue); }} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffebad] via-[#dcb052] to-[#ad7625] px-6 font-bold text-[#1c2633] shadow-lg transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><span>Entrar a la habitación</span><ChevronRight size={18} /></button></div></div>}
                <AnimatePresence>{stage === 'complete' && <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#081320]/80 p-5 text-center text-white backdrop-blur-sm"><motion.div initial={reduceMotion ? false : { y: 12, scale: .96 }} animate={{ y: 0, scale: 1 }} transition={{ duration: .32 }} className="max-w-lg py-3"><span className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#fff2c5] to-[#bb852e] text-[#192337]"><Check size={25} /></span><p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-[#f0cd82]">La historia revelada</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Lo que se busca con amor, se celebra al encontrarlo.</h2><p className="mt-4 text-sm leading-6 text-slate-200">Jesús cuenta que la mujer comparte su alegría al recuperar la moneda. Con esta historia enseña la alegría que hay en el cielo cuando una persona se arrepiente y vuelve a Dios.</p><p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e7c477]/35 bg-white/5 px-4 py-2 text-sm font-bold text-[#f7dda2]"><BookOpen size={16} /> Lucas 15:8–10</p><div role="status" className="mx-auto mt-4 inline-flex items-center gap-3 rounded-2xl border border-[#e7c477]/45 bg-gradient-to-r from-[#e6ba56]/15 via-[#fff0c5]/10 to-[#d39833]/15 px-4 py-3 text-left shadow-lg"><span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#fff2c5] to-[#bb852e] text-[#192337]"><Sparkles size={20} /></span><span><span className="block text-[9px] font-black uppercase tracking-[.16em] text-[#f0cd82]">Emblema ganado</span><span className="mt-0.5 block text-sm font-bold text-[#fff5d8]">Mirada diligente</span></span></div><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"><RotateCcw size={15} /> Jugar otra vez</button><Link to="/recursos/juegos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">Otros juegos <ChevronRight size={15} /></Link></div></motion.div></motion.div>}</AnimatePresence>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 px-1 text-xs leading-5 text-slate-600 dark:text-slate-400"><CircleHelp size={15} className="mt-0.5 shrink-0 text-[#a87929]" /> Ilustración artística generada para este juego; no es una reconstrucción arqueológica del hogar de la parábola.</p>
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-[1.4rem] border border-[#c39a53]/35 bg-white/85 p-5 shadow-[0_18px_60px_-38px_rgba(21,35,51,.35)] dark:bg-[#101a2a]/85 sm:p-6" aria-labelledby="clue-title">
              <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.19em] text-[#97691f] dark:text-[#e7c67f]">Sala 01 · Lucas 15:8–10</p><h2 id="clue-title" className="mt-1 font-serif text-2xl font-semibold">La moneda perdida</h2></div><span className="grid size-11 place-items-center rounded-2xl bg-[#f5edda] text-[#966c28] dark:bg-amber-300/10 dark:text-amber-200"><BookOpen size={21} /></span></div>
              {currentStep && <div className="mt-5 rounded-2xl border border-[#d2aa62]/35 bg-[#fbf7ed] p-4 dark:bg-white/[.04]"><p className="text-xs font-black uppercase tracking-[.14em] text-[#90651f] dark:text-[#efcd84]">Acción {completedSteps + 1} de 3 · {stepContent[currentStep].title}</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{stepContent[currentStep].clue}</p></div>}
              {stage === 'intro' && <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Una mujer tiene diez monedas y nota que le falta una. Su búsqueda comienza con tres acciones importantes.</p>}
              {stage === 'reflection' && <div className="mt-5"><p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">¿Qué hacen los vecinos cuando la mujer encuentra la moneda?</p><div className="mt-3 grid gap-2">{([{ id: 'joy', label: 'Se alegran con ella' }, { id: 'other', label: 'Siguen con sus tareas' }] as const).map((option) => <button key={option.id} type="button" aria-pressed={answer === option.id} onClick={() => { setAnswer(option.id); setMessage(option.id === 'joy' ? 'Así es: ella invita a sus amigas y vecinas a compartir su alegría.' : 'Vuelve a pensar en el final del relato: la mujer invita a otras personas a celebrar.'); }} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${answer === option.id ? 'border-[#b6812b] bg-amber-100 text-slate-900 dark:bg-amber-300/15 dark:text-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-400 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-200'}`}>{option.label}</button>)}</div><p aria-live="polite" className="mt-3 min-h-10 text-xs leading-5 text-slate-600 dark:text-slate-300">{message}</p><button type="button" disabled={!answer} onClick={showReflection} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1e3a8a] px-5 text-sm font-bold text-white transition hover:bg-[#172d6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-45">Continuar <ChevronRight size={16} /></button></div>}
              {stage === 'complete' && <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">La mujer comparte su alegría con sus amigas y vecinas.</p>}
              {(currentStep || stage === 'intro') && <><p aria-live="polite" className="mt-4 min-h-10 rounded-xl bg-slate-100/80 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-600 dark:bg-white/[.045] dark:text-slate-300">{message}</p>{currentStep === 'coin' && message === stepContent.coin.action ? <button type="button" onClick={advance} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1e3a8a] px-5 text-sm font-bold text-white hover:bg-[#172d6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">Continuar <ChevronRight size={16} /></button> : currentStep && <button type="button" onClick={hint} disabled={hintUsed} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-bold text-[#8c611b] hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 dark:text-[#f0cf88] dark:hover:bg-white/10"><CircleHelp size={15} /> {hintUsed ? 'Pista mostrada' : 'Pedir una pista'}</button>}</>}
            </section>

            <section className="rounded-[1.4rem] border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[.035]" aria-label="Progreso"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-slate-500 dark:text-slate-400"><Search size={15} className="text-[#a67625]" /> Progreso</div><div className="mt-3 grid gap-2">{stepOrder.map((item, index) => <div key={item} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${index < completedSteps ? 'bg-[#f5edda] dark:bg-amber-300/10' : 'bg-slate-100/70 dark:bg-white/[.035]'}`}><span className={`grid size-7 place-items-center rounded-full text-xs font-black ${index < completedSteps ? 'bg-gradient-to-br from-[#fff0bd] to-[#b47c25] text-slate-900' : 'bg-white text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>{index < completedSteps ? <Check size={14} /> : index + 1}</span><span className={`text-xs font-semibold ${index < completedSteps ? 'text-slate-800 dark:text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>{stepContent[item].title}</span></div>)}</div></section>

            <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#c39a53]/25 bg-gradient-to-r from-[#fff9e9] to-white p-4 text-slate-700 dark:from-[#1b1a17] dark:to-[#101a2a] dark:text-slate-300"><Users size={18} className="mt-0.5 shrink-0 text-[#a67625] dark:text-[#e4c178]" /><p className="text-xs leading-5">Al finalizar, conversa: ¿qué nos enseña la alegría compartida cuando alguien se arrepiente y vuelve a Dios?</p></div>
          </aside>
        </div>
      </div>
      <style>{`@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }`}</style>
    </main>
  </>;
};
