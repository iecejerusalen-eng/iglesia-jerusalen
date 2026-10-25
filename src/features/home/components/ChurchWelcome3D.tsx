import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Maximize2, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import './church-welcome-3d.css';

const STORAGE_KEY = 'jerusalen_welcome_3d_seen_v1';
const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';
type Phase = 'intro' | 'entering' | 'companion' | 'hidden';

function rememberVisit() {
  try { window.localStorage.setItem(STORAGE_KEY, '1'); }
  catch { /* La navegación funciona aunque el almacenamiento esté bloqueado. */ }
}

const ChurchStage = lazy(() => import('./ChurchStage3D'));

export function ChurchWelcome3D() {
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia(MOBILE_VIEWPORT_QUERY).matches);
  const [phase, setPhase] = useState<Phase>('hidden');
  const [unavailable, setUnavailable] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [command, setCommand] = useState<{ id: number; action: 'zoom-in' | 'zoom-out' | 'reset' } | null>(null);
  const commandId = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const markUnavailable = useCallback(() => setUnavailable(true), []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const syncViewport = () => {
      setIsMobileViewport(media.matches);
      if (media.matches) setPhase('hidden');
    };

    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

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
    setAutoRotate(true);
    setCommand(null);
    setPhase('intro');
  };

  const sendCommand = (action: 'zoom-in' | 'zoom-out' | 'reset') => {
    if (action === 'reset') setAutoRotate(false);
    setCommand({ id: ++commandId.current, action });
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

  if (isMobileViewport) return null;

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
            <Suspense fallback={null}><ChurchStage mode={phase} onUnavailable={markUnavailable} autoRotate={autoRotate} command={command} /></Suspense>
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
          <p className="sr-only">Arrastra o usa las flechas para girar. Acerca con la rueda, pellizca en pantalla táctil o usa los controles. Pulsa Entrar para ir al inicio. Presiona Escape para omitir la bienvenida.</p>
          {phase === 'intro' && !unavailable && (
            <>
              <div className="church-welcome__tools" role="group" aria-label="Controles del modelo 3D">
                <button type="button" onClick={() => sendCommand('zoom-in')} aria-label="Acercar modelo" title="Acercar"><Plus size={19} aria-hidden="true" /></button>
                <button type="button" onClick={() => sendCommand('zoom-out')} aria-label="Alejar modelo" title="Alejar"><Minus size={19} aria-hidden="true" /></button>
                <span className="church-welcome__tools-divider" aria-hidden="true" />
                <button type="button" onClick={() => setAutoRotate(value => !value)} aria-label={autoRotate ? 'Pausar giro automático' : 'Reanudar giro automático'} title={autoRotate ? 'Pausar giro' : 'Reanudar giro'}>{autoRotate ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}</button>
                <button type="button" onClick={() => sendCommand('reset')} aria-label="Volver a la vista frontal" title="Vista frontal"><RotateCcw size={17} aria-hidden="true" /></button>
              </div>
              <p className="church-welcome__hint"><Maximize2 size={14} aria-hidden="true" /><span className="church-welcome__hint-desktop">Arrastra para girar · Rueda para acercar</span><span className="church-welcome__hint-mobile">Desliza para girar · Pellizca para acercar</span></p>
            </>
          )}
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
