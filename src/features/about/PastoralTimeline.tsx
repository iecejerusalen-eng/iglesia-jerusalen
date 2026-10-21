import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ImageIcon } from 'lucide-react';
import { pastoralEras, type PastorEra } from './churchHistoryData';
import './churchHistory.css';

export function PastorPortrait({ pastor, eager = false }: { pastor: PastorEra; eager?: boolean }) {
  const [original, setOriginal] = useState(false);
  const [failed, setFailed] = useState(false);
  return <figure className="pastor-portrait">
    <img src={original || failed ? pastor.original : pastor.image} alt={`${pastor.names} · ${original || failed ? 'fotografía de archivo' : 'retrato restaurado con fondo de estudio'}`} width="1448" height="1086" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    <figcaption><span>{original || failed ? 'Fotografía de archivo' : 'Restauración con IA · fondo de estudio'}</span><button type="button" aria-pressed={original} onClick={() => setOriginal(value => !value)}><ImageIcon size={14} aria-hidden="true" />{original ? 'Ver restauración' : 'Ver original'}</button></figcaption>
  </figure>;
}

export default function PastoralTimeline() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const updateActive = () => {
      const left = element.getBoundingClientRect().left;
      const cards = Array.from(element.querySelectorAll<HTMLElement>('[data-index]'));
      const nearest = cards.reduce<HTMLElement | undefined>((best, card) => !best || Math.abs(card.getBoundingClientRect().left - left) < Math.abs(best.getBoundingClientRect().left - left) ? card : best, undefined);
      if (nearest) setActive(Number(nearest.dataset.index));
    };
    const scheduleUpdate = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateActive); };
    element.addEventListener('scroll', scheduleUpdate, { passive: true });
    element.addEventListener('scrollend', updateActive);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);
    scheduleUpdate();
    return () => { cancelAnimationFrame(frame); element.removeEventListener('scroll', scheduleUpdate); element.removeEventListener('scrollend', updateActive); observer.disconnect(); };
  }, []);
  const goTo = (index: number) => {
    const element = track.current;
    const card = element?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (element && card) element.scrollTo({ left: element.scrollLeft + card.getBoundingClientRect().left - element.getBoundingClientRect().left - 2, behavior: reduced ? 'instant' : 'smooth' });
  };
  return <section className="pastoral-timeline" aria-labelledby="pastoral-timeline-heading">
    <div className="history-section-heading"><div><p className="history-eyebrow">Personas que dejaron huella</p><h2 id="pastoral-timeline-heading">Una misión. <span className="text-church-gold-gradient">Generaciones de servicio.</span></h2></div><div className="history-arrow-controls"><button aria-label="Pastores anteriores" disabled={active === 0} onClick={() => goTo(Math.max(0, active - 1))}><ArrowLeft size={20} /></button><button aria-label="Pastores siguientes" disabled={active === pastoralEras.length - 1} onClick={() => goTo(Math.min(pastoralEras.length - 1, active + 1))}><ArrowRight size={20} /></button></div></div>
    <p className="history-muted">Desliza para recorrer las familias pastorales, o usa las flechas y los nombres de cada etapa.</p>
    <div className="pastoral-era-nav" aria-label="Etapas pastorales">{pastoralEras.map((pastor, index) => <button key={pastor.id} aria-current={active === index ? 'step' : undefined} onClick={() => goTo(index)}><span>{String(index + 1).padStart(2, '0')}</span>{pastor.names.split(' y ')[0]}</button>)}</div>
    <div ref={track} className="pastoral-track" tabIndex={0} role="region" aria-label="Galería cronológica de pastores" onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goTo(Math.max(0, Math.min(pastoralEras.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1)))); } }}>
      {pastoralEras.map((pastor, index) => <motion.article className="pastoral-era" key={pastor.id} data-index={index} initial={reduced ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.4 }}>
        <div className="pastoral-era-date"><span aria-hidden="true" />{pastor.period}</div><PastorPortrait pastor={pastor} eager={index === 0} /><div className="pastoral-era-copy"><p className="history-eyebrow">{pastor.role}</p><h3>{pastor.names}</h3><p>{pastor.description}</p></div>
      </motion.article>)}
    </div>
    <p className="history-footnote">Los períodos siguen el relato histórico compartido por la iglesia. Cuando no se dispone de una fecha precisa, se conserva el orden de sucesión.</p>
  </section>;
}
