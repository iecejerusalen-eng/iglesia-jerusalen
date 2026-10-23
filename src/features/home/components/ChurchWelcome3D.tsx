import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import './church-welcome-3d.css';

const STORAGE_KEY = 'jerusalen_welcome_3d_seen_v1';
type Phase = 'intro' | 'entering' | 'companion' | 'hidden';

function wasSeen() {
  try { return window.localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

function rememberVisit() {
  try { window.localStorage.setItem(STORAGE_KEY, '1'); }
  catch { /* La navegación funciona aunque el almacenamiento esté bloqueado. */ }
}

function canShowIntro() {
  return !window.location.hash && !wasSeen() &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const ChurchStage = lazy(() => import('./ChurchStage3D'));

export function ChurchWelcome3D() {
  const [phase, setPhase] = useState<Phase>(() => canShowIntro() ? 'intro' : 'hidden');
  const [unavailable, setUnavailable] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const markUnavailable = useCallback(() => setUnavailable(true), []);

  const finish = useCallback(() => {
    rememberVisit();
    setPhase('companion');
  }, []);

  const enter = useCallback(() => {
    if (phase !== 'intro') return;
    if (unavailable || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rememberVisit();
      setPhase('hidden');
      return;
    }
    setPhase('entering');
  }, [phase, unavailable]);

  const skip = useCallback(() => {
    rememberVisit();
    setPhase('hidden');
    window.requestAnimationFrame(() => replayRef.current?.focus());
  }, []);

  const start = () => {
    setUnavailable(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setPhase('intro');
  };

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'entering') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (phase === 'intro') window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const timer = window.setTimeout(finish, 1100);
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'entering') return;
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); skip(); }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [phase, skip]);

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.target === dialogRef.current) { event.preventDefault(); enter(); }
  };

  const visible = phase !== 'hidden';
  const overlay = phase === 'intro' || phase === 'entering';

  return (
    <>
      {visible && (
        <div className={`church-welcome__stage church-welcome__stage--${phase}`}>
          <div className="church-welcome__sky" aria-hidden="true" />
          <div className="church-welcome__cloud church-welcome__cloud--left" aria-hidden="true" />
          <div className="church-welcome__cloud church-welcome__cloud--right" aria-hidden="true" />
          <div className="church-welcome__cloud church-welcome__cloud--high" aria-hidden="true" />
          <div className="church-welcome__ground" aria-hidden="true" />
          {!unavailable ? (
            <Suspense fallback={null}><ChurchStage mode={phase} onUnavailable={markUnavailable} /></Suspense>
          ) : (
            <img className="church-welcome__fallback" src="/images/church-welcome-fallback.webp" alt="Fachada de Iglesia Jerusalén" />
          )}
        </div>
      )}
      {overlay && (
        <div
          ref={dialogRef}
          className={`church-welcome__overlay church-welcome__overlay--${phase}`}
          onKeyDown={handleKeys}
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenida a Iglesia Jerusalén"
          tabIndex={-1}
        >
          <p className="sr-only">La iglesia gira automáticamente. Arrástrala para explorarla y pulsa Entrar para ir al inicio. Presiona Escape para omitir la bienvenida.</p>
          <button type="button" className="church-welcome__enter" onClick={enter} disabled={phase === 'entering'}>
            Entrar <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
      {!overlay && (
        <button ref={replayRef} className="church-welcome__replay" type="button" onClick={start} aria-label="Volver a ver la bienvenida 3D">
          Ver bienvenida 3D
        </button>
      )}
    </>
  );
}
