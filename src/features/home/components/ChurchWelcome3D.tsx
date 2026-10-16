import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import './church-welcome-3d.css';

const STORAGE_KEY = 'jerusalen_welcome_3d_seen_v1';

function wasSeen() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberVisit() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // La experiencia sigue funcionando aunque el navegador bloquee almacenamiento.
  }
}

function canShowIntro() {
  return !window.location.hash && !wasSeen() &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const ChurchStage = lazy(() => import('./ChurchStage3D'));

export function ChurchWelcome3D() {
  const [open, setOpen] = useState(canShowIntro);
  const [progress, setProgress] = useState(0);
  const [entering, setEntering] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const markUnavailable = useCallback(() => setUnavailable(true), []);

  const close = useCallback(() => {
    rememberVisit();
    setOpen(false);
    setEntering(false);
    setProgress(0);
    window.requestAnimationFrame(() => replayRef.current?.focus());
  }, []);

  const start = () => {
    setProgress(0);
    setEntering(false);
    setUnavailable(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setOpen(true);
    window.requestAnimationFrame(() => scrollerRef.current?.scrollTo(0, 0));
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => scrollerRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (event.key === ' ' && event.target instanceof HTMLButtonElement) return;
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault(); scroller.scrollBy({ top: scroller.clientHeight * 0.35, behavior: 'smooth' });
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault(); scroller.scrollBy({ top: -scroller.clientHeight * 0.35, behavior: 'smooth' });
    } else if (event.key === 'Tab') {
      const buttons = [...scroller.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (!buttons.length) return;
      const activeIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.shiftKey ? (activeIndex <= 0 ? buttons.length - 1 : activeIndex - 1) : (activeIndex + 1) % buttons.length;
      event.preventDefault(); buttons[next].focus();
    }
  };

  const updateProgress = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance = scroller.scrollHeight - scroller.clientHeight;
    setProgress(distance > 0 ? Math.min(1, scroller.scrollTop / distance) : 1);
  };

  return (
    <>
      {!open && <button ref={replayRef} className="church-welcome__replay" type="button" onClick={start} aria-label="Volver a ver la bienvenida 3D">Ver bienvenida 3D</button>}
      {open && (
        <div ref={scrollerRef} className="church-welcome" onScroll={updateProgress} onKeyDown={handleKeys} role="dialog" aria-modal="true" aria-label="Bienvenida a Iglesia Jerusalén" tabIndex={-1}>
          <div className="church-welcome__track">
            <div className="church-welcome__scene">
              <div className="church-welcome__sky" aria-hidden="true" />
              <div className="church-welcome__cloud church-welcome__cloud--left" aria-hidden="true" />
              <div className="church-welcome__cloud church-welcome__cloud--right" aria-hidden="true" />
              <div className="church-welcome__ground" aria-hidden="true" />
              <div className="church-welcome__shadow" style={{ opacity: progress * progress * 0.32, transform: `translateX(-50%) scale(${0.55 + progress * 0.45})` }} aria-hidden="true" />
              {!unavailable ? <Suspense fallback={null}><ChurchStage progress={progress} entering={entering} onUnavailable={markUnavailable} onEntered={close} /></Suspense> :
                <img className="church-welcome__fallback" src="/images/church-welcome-fallback.webp" alt="Ilustración limpia de la fachada de Iglesia Jerusalén" />}
              <div className="church-welcome__top">
                <span className="church-welcome__eyebrow">Iglesia del Evangelio Cuadrangular</span>
                <button type="button" className="church-welcome__skip" onClick={close}>Saltar e ir al inicio <span aria-hidden="true">↗</span></button>
              </div>
              <div className="church-welcome__copy">
                <span className="church-welcome__kicker">BIENVENIDO A CASA</span>
                <h1>Un lugar para <em>volver a creer.</em></h1>
                <p>Descubre nuestra casa. Aquí hay un lugar para ti.</p>
              </div>
              <div className="church-welcome__bottom">
                <span className="church-welcome__hint">{unavailable ? 'Explora nuestra casa' : progress < 0.96 ? 'Desliza para descubrir nuestra casa ↓' : 'Nuestra casa te espera'}</span>
                {(progress > 0.96 || unavailable) && <button type="button" className="church-welcome__enter" onClick={() => unavailable ? close() : setEntering(true)} disabled={entering}>{entering ? 'Entrando…' : 'Entrar a Jerusalén'} <span aria-hidden="true">→</span></button>}
                <span className="church-welcome__step">{Math.round(progress * 100)}%</span>
              </div>
              <div className="church-welcome__progress" aria-hidden="true"><div style={{ transform: `scaleX(${progress})` }} /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
