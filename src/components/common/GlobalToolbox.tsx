import { lazy, Suspense, useCallback, useRef, type PointerEvent as ReactPointerEvent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { 
  Activity, 
  Briefcase, 
  ChevronLeft, 
  Gauge, 
  GripHorizontal, 
  Mic, 
  Minimize2, 
  Users, 
  X 
} from 'lucide-react';
import { useToolboxStore } from '../../store/useToolboxStore';
import { useAuthStore } from '../../store/useAuthStore';
const MetronomeTool = lazy(() => import('./toolbox/MetronomeTool').then((module) => ({ default: module.MetronomeTool })));
const TunerTool = lazy(() => import('./toolbox/TunerTool').then((module) => ({ default: module.TunerTool })));
const TallyClickerTool = lazy(() => import('./toolbox/TallyClickerTool').then((module) => ({ default: module.TallyClickerTool })));
const SermonTimerTool = lazy(() => import('./toolbox/SermonTimerTool').then((module) => ({ default: module.SermonTimerTool })));
const BibleScratchpadTool = lazy(() => import('./toolbox/BibleScratchpadTool').then((module) => ({ default: module.BibleScratchpadTool })));
const QuickNotesTool = lazy(() => import('./toolbox/QuickNotesTool').then((module) => ({ default: module.QuickNotesTool })));
import { BookOpen, Timer, PenTool } from 'lucide-react';

export default function GlobalToolbox() {
  const store = useToolboxStore(useShallow((state) => ({
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    activePanel: state.activePanel,
    bpm: state.bpm,
    isPlaying: state.isPlaying,
    timerIsRunning: state.timerIsRunning,
    tallyCount: state.tallyCount,
    position: state.position,
    open: state.open,
    close: state.close,
    toggleMinimized: state.toggleMinimized,
    setActivePanel: state.setActivePanel,
    setPosition: state.setPosition,
  })));
  const { role } = useAuthStore();
  const location = useLocation();
  const toolboxPosition = store.position;
  const setToolboxPosition = store.setPosition;
  const panelRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number; baseX: number; baseY: number; x: number; y: number } | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  const clampPosition = useCallback((x: number, y: number) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? (store.isMinimized ? 220 : 340);
    const height = panel?.offsetHeight ?? 90;
    return {
      x: Math.max(8, Math.min(window.innerWidth - width - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - height - 8, y)),
    };
  }, [store.isMinimized]);

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const keepInsideViewport = () => {
      if (!toolboxPosition || !panelRef.current) return;
      const next = clampPosition(toolboxPosition.x, toolboxPosition.y);
      if (next.x !== toolboxPosition.x || next.y !== toolboxPosition.y) setToolboxPosition(next);
    };
    const frame = window.requestAnimationFrame(keepInsideViewport);
    window.addEventListener('resize', keepInsideViewport, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', keepInsideViewport);
    };
  }, [clampPosition, setToolboxPosition, toolboxPosition]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current?.getBoundingClientRect();
    if (!panel) return;
    dragRef.current = { offsetX: event.clientX - panel.left, offsetY: event.clientY - panel.top, baseX: panel.left, baseY: panel.top, x: panel.left, y: panel.top };
    if (panelRef.current) panelRef.current.style.willChange = 'transform';
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const next = clampPosition(event.clientX - dragRef.current.offsetX, event.clientY - dragRef.current.offsetY);
    dragRef.current.x = next.x;
    dragRef.current.y = next.y;
    if (dragFrameRef.current === null) {
      dragFrameRef.current = window.requestAnimationFrame(() => {
        if (panelRef.current && dragRef.current) {
          panelRef.current.style.transform = `translate3d(${dragRef.current.x - dragRef.current.baseX}px, ${dragRef.current.y - dragRef.current.baseY}px, 0)`;
        }
        dragFrameRef.current = null;
      });
    }
  };

  const finishDrag = () => {
    if (!dragRef.current) return;
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    const { x, y } = dragRef.current;
    if (panelRef.current) {
      panelRef.current.style.transform = '';
      panelRef.current.style.willChange = '';
    }
    dragRef.current = null;
    dragFrameRef.current = null;
    store.setPosition({ x, y });
  };

  const isLogisticsRole = role === 'admin' || role === 'leader' || role === 'apoyo';
  const isMusicRole = role === 'musico' || role === 'admin' || location.pathname.includes('/canciones');
  const isTeacherRole = role === 'admin' || role === 'pastor' || role === 'maestro' || role === 'docente' || location.pathname.includes('/sermones');

  if (!store.isOpen) {
    return (
      <button 
        onClick={() => store.open('hub')} 
        className="fixed bottom-6 right-6 z-[85] group flex items-center justify-center h-14 w-14 rounded-full border border-white/10 bg-black/40 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black/60 hover:border-white/20 active:scale-95" 
        aria-label="Abrir centro de herramientas"
      >
        <Briefcase size={22} className="text-white/80 group-hover:text-amber-400 transition-colors" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </button>
    );
  }

  const panelStyle = store.position ? { left: store.position.x, top: store.position.y } : undefined;

  const renderActiveTool = () => {
    switch (store.activePanel) {
      case 'metronome': return <MetronomeTool />;
      case 'tuner': return <TunerTool />;
      case 'clicker': return <TallyClickerTool />;
      case 'timer': return <SermonTimerTool />;
      case 'bible': return <BibleScratchpadTool />;
      case 'notes': return <QuickNotesTool />;
      default: return null;
    }
  };

  return (
    <aside
      ref={panelRef}
      data-toolbox-panel 
      style={panelStyle} 
      className={`fixed z-[90] flex max-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#09090b]/70 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-[40px] transition-[width,opacity,box-shadow] duration-300 ${store.position ? '' : 'bottom-2 right-2 sm:bottom-6 sm:right-6'} ${store.isMinimized ? 'w-[220px]' : 'w-[min(340px,calc(100vw-16px))]'}`}
      aria-label="Centro de herramientas global"
    >
      {/* Top Drag & Control Bar */}
      <div className="relative flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <button onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag} className="cursor-grab touch-none rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white active:cursor-grabbing" aria-label="Mover herramientas">
          <GripHorizontal size={16} />
        </button>
        
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
          {store.activePanel !== 'hub' && !store.isMinimized && (
            <button onClick={() => store.setActivePanel('hub')} className="rounded-full bg-white/5 p-1 text-white/60 transition hover:bg-white/20 hover:text-white" aria-label="Volver al inicio">
              <ChevronLeft size={14} />
            </button>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            {store.activePanel === 'hub' ? 'Toolbox' : 
             store.activePanel === 'clicker' ? 'Aforo' : 
             store.activePanel === 'timer' ? 'Temporizador' : 
             store.activePanel === 'bible' ? 'Biblia' : 
             store.activePanel === 'notes' ? 'Notas Rápidas' : 'Herramienta'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={store.toggleMinimized} className="rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white" aria-label="Minimizar">
            <Minimize2 size={14} />
          </button>
          <button onClick={() => store.close()} className="rounded-full p-1.5 text-white/40 transition hover:bg-rose-500/20 hover:text-rose-400" aria-label="Cerrar herramientas">
            <X size={14} />
          </button>
        </div>
      </div>

      {store.isMinimized ? (
        <button onClick={store.toggleMinimized} className="flex w-full items-center justify-between bg-transparent px-5 py-4 text-left transition hover:bg-white/[0.03]">
          <span className="text-[11px] font-medium tracking-wide text-white/80">
            {store.activePanel === 'metronome' ? `${store.bpm} BPM` : 
             store.activePanel === 'tuner' ? 'Afinador Activo' : 
             store.activePanel === 'timer' ? 'Temporizador en curso' :
             store.activePanel === 'bible' ? 'Buscador Bíblico' :
             store.activePanel === 'notes' ? 'Notas Rápidas' :
             store.activePanel === 'clicker' ? `${store.tallyCount} Personas` : 'Abrir Herramientas'}
          </span>
          <Activity size={16} className={(store.isPlaying || store.activePanel === 'tuner' || store.timerIsRunning) ? 'animate-pulse text-amber-400' : 'text-white/30'} />
        </button>
      ) : (
        <div className="flex flex-1 flex-col">
          {store.activePanel === 'hub' ? (
            <div className="grid grid-cols-2 gap-3 p-5">
              
              {/* Contextual Logic */}
              {isMusicRole && (
                <ToolButton 
                  icon={<Gauge size={22} className="mb-2 text-white/70 group-hover:text-amber-400 transition-colors" />} 
                  label="Metrónomo" 
                  onClick={() => store.setActivePanel('metronome')} 
                />
              )}
              {isMusicRole && (
                <ToolButton 
                  icon={<Mic size={22} className="mb-2 text-white/70 group-hover:text-amber-400 transition-colors" />} 
                  label="Afinador" 
                  onClick={() => store.setActivePanel('tuner')} 
                />
              )}

              {isLogisticsRole && (
                <ToolButton 
                  icon={<Users size={22} className="mb-2 text-white/70 group-hover:text-emerald-400 transition-colors" />} 
                  label="Aforo" 
                  onClick={() => store.setActivePanel('clicker')} 
                />
              )}
              
              {isTeacherRole && (
                <ToolButton 
                  icon={<Timer size={22} className="mb-2 text-white/70 group-hover:text-rose-400 transition-colors" />} 
                  label="Timer" 
                  onClick={() => store.setActivePanel('timer')} 
                />
              )}
              {isTeacherRole && (
                <ToolButton 
                  icon={<BookOpen size={22} className="mb-2 text-white/70 group-hover:text-sky-400 transition-colors" />} 
                  label="Biblia" 
                  onClick={() => store.setActivePanel('bible')} 
                />
              )}
              <ToolButton 
                icon={<PenTool size={22} className="mb-2 text-white/70 group-hover:text-purple-400 transition-colors" />} 
                label="Notas" 
                onClick={() => store.setActivePanel('notes')} 
              />
              
            </div>
          ) : (
            <div className="min-h-0 overflow-y-auto overscroll-contain p-1">
              <Suspense fallback={<div className="p-6 text-center text-xs text-white/50">Cargando herramienta…</div>}>{renderActiveTool()}</Suspense>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.12] hover:from-white/[0.1] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] active:scale-95"
    >
      {icon}
      <span className="text-[10px] font-semibold tracking-wide text-white/60 transition-colors group-hover:text-white/90">{label}</span>
      
      {/* Glossy reflection highlight */}
      <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-all duration-700 group-hover:left-[200%]" />
    </button>
  );
}
