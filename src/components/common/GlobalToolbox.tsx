import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import {
  Activity,
  BriefcaseBusiness,
  ChevronLeft,
  GripHorizontal,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useToolboxStore, type ToolboxPanel } from '../../store/useToolboxStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { getToolDefinition, TOOLBOX_TOOLS, type ToolAccent } from './toolbox/toolRegistry';

const TOOL_COMPONENTS: Record<Exclude<ToolboxPanel, 'hub'>, LazyExoticComponent<ComponentType>> = {
  metronome: lazy(() => import('./toolbox/MetronomeTool').then((module) => ({ default: module.MetronomeTool }))),
  tuner: lazy(() => import('./toolbox/TunerTool').then((module) => ({ default: module.TunerTool }))),
  clicker: lazy(() => import('./toolbox/TallyClickerTool').then((module) => ({ default: module.TallyClickerTool }))),
  timer: lazy(() => import('./toolbox/SermonTimerTool').then((module) => ({ default: module.SermonTimerTool }))),
  bible: lazy(() => import('./toolbox/BibleScratchpadTool').then((module) => ({ default: module.BibleScratchpadTool }))),
  notes: lazy(() => import('./toolbox/QuickNotesTool').then((module) => ({ default: module.QuickNotesTool }))),
};

const ACCENT_CLASSES: Record<ToolAccent, { icon: string; border: string; glow: string; badge: string }> = {
  amber: {
    icon: 'text-amber-300',
    border: 'hover:border-amber-300/35 focus-visible:ring-amber-300/60',
    glow: 'from-amber-400/12',
    badge: 'bg-amber-300/15 text-amber-200',
  },
  sky: {
    icon: 'text-sky-300',
    border: 'hover:border-sky-300/35 focus-visible:ring-sky-300/60',
    glow: 'from-sky-400/12',
    badge: 'bg-sky-300/15 text-sky-200',
  },
  emerald: {
    icon: 'text-emerald-300',
    border: 'hover:border-emerald-300/35 focus-visible:ring-emerald-300/60',
    glow: 'from-emerald-400/12',
    badge: 'bg-emerald-300/15 text-emerald-200',
  },
  rose: {
    icon: 'text-rose-300',
    border: 'hover:border-rose-300/35 focus-visible:ring-rose-300/60',
    glow: 'from-rose-400/12',
    badge: 'bg-rose-300/15 text-rose-200',
  },
  violet: {
    icon: 'text-violet-300',
    border: 'hover:border-violet-300/35 focus-visible:ring-violet-300/60',
    glow: 'from-violet-400/12',
    badge: 'bg-violet-300/15 text-violet-200',
  },
};

export default function GlobalToolbox() {
  const store = useToolboxStore(useShallow((state) => ({
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    activePanel: state.activePanel,
    bpm: state.bpm,
    isPlaying: state.isPlaying,
    timerIsRunning: state.timerIsRunning,
    timerTimeLeft: state.timerTimeLeft,
    tallyCount: state.tallyCount,
    position: state.position,
    open: state.open,
    close: state.close,
    toggleMinimized: state.toggleMinimized,
    setActivePanel: state.setActivePanel,
    setPosition: state.setPosition,
    setPlaying: state.setPlaying,
    setTimerIsRunning: state.setTimerIsRunning,
  })));
  const role = useAuthStore((state) => state.role);
  const location = useLocation();
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(store.isOpen);
  const dragRef = useRef<{ offsetX: number; offsetY: number; baseX: number; baseY: number; x: number; y: number } | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const availableTools = useMemo(
    () => TOOLBOX_TOOLS.filter((tool) => tool.isAvailable(role, location.pathname)),
    [location.pathname, role],
  );
  const activeDefinition = getToolDefinition(store.activePanel);
  const hasBackgroundActivity = store.isPlaying || store.timerIsRunning;

  const clampPosition = useCallback((x: number, y: number) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? (store.isMinimized ? 260 : 400);
    const height = panel?.offsetHeight ?? 92;
    return {
      x: Math.max(8, Math.min(window.innerWidth - width - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - height - 8, y)),
    };
  }, [store.isMinimized]);

  useEffect(() => {
    if (!wasOpenRef.current && store.isOpen) {
      window.requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    }
    if (wasOpenRef.current && !store.isOpen) {
      window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
    }
    wasOpenRef.current = store.isOpen;
  }, [store.isOpen]);

  useEffect(() => () => {
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
  }, []);

  useEffect(() => {
    const keepInsideViewport = () => {
      if (!store.position || !panelRef.current || window.innerWidth < 640) return;
      const next = clampPosition(store.position.x, store.position.y);
      if (next.x !== store.position.x || next.y !== store.position.y) store.setPosition(next);
    };
    const frame = window.requestAnimationFrame(keepInsideViewport);
    window.addEventListener('resize', keepInsideViewport, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', keepInsideViewport);
    };
  }, [clampPosition, store]);

  useEffect(() => {
    if (!store.isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || showCloseDialog) return;
      event.preventDefault();
      if (store.isMinimized) {
        store.toggleMinimized();
      } else if (store.activePanel !== 'hub') {
        store.setActivePanel('hub');
      } else if (hasBackgroundActivity) {
        setShowCloseDialog(true);
      } else {
        store.close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasBackgroundActivity, showCloseDialog, store]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth < 640 || event.button !== 0) return;
    const panel = panelRef.current?.getBoundingClientRect();
    if (!panel) return;
    dragRef.current = {
      offsetX: event.clientX - panel.left,
      offsetY: event.clientY - panel.top,
      baseX: panel.left,
      baseY: panel.top,
      x: panel.left,
      y: panel.top,
    };
    panelRef.current?.style.setProperty('will-change', 'transform');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const next = clampPosition(event.clientX - dragRef.current.offsetX, event.clientY - dragRef.current.offsetY);
    dragRef.current.x = next.x;
    dragRef.current.y = next.y;
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      if (panelRef.current && dragRef.current) {
        panelRef.current.style.transform = `translate3d(${dragRef.current.x - dragRef.current.baseX}px, ${dragRef.current.y - dragRef.current.baseY}px, 0)`;
      }
      dragFrameRef.current = null;
    });
  };

  const finishDrag = () => {
    if (!dragRef.current) return;
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    const { x, y } = dragRef.current;
    panelRef.current?.style.removeProperty('transform');
    panelRef.current?.style.removeProperty('will-change');
    dragRef.current = null;
    dragFrameRef.current = null;
    store.setPosition({ x, y });
  };

  const requestClose = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const state = useToolboxStore.getState();
    state.setPlaying(false);
    state.setTimerIsRunning(false);
    state.close();
    setShowCloseDialog(false);
  };

  const stopAndClose = () => {
    const state = useToolboxStore.getState();
    state.setPlaying(false);
    state.setTimerIsRunning(false);
    state.close();
    setShowCloseDialog(false);
  };

  const minimizeAndContinue = () => {
    if (!store.isMinimized) store.toggleMinimized();
    setShowCloseDialog(false);
  };

  if (!store.isOpen) {
    return (
      <button
        ref={launcherRef}
        type="button"
        onClick={() => store.open('hub')}
        className="group fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[85] flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/80 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:bottom-6 sm:right-6"
        aria-label="Abrir centro de herramientas"
      >
        <BriefcaseBusiness size={23} aria-hidden="true" />
        {hasBackgroundActivity && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-amber-300" aria-label="Hay herramientas activas" />
        )}
      </button>
    );
  }

  const panelStyle = store.position ? { left: store.position.x, top: store.position.y } : undefined;
  const minimizedStatus = getMinimizedStatus(store.activePanel, store.bpm, store.tallyCount, store.timerTimeLeft, store.isPlaying, store.timerIsRunning);

  return (
    <>
      <aside
        ref={panelRef}
        data-toolbox-panel
        style={panelStyle}
        tabIndex={-1}
        className={`fixed z-[90] flex max-h-[calc(100dvh-16px)] flex-col overflow-hidden border border-white/10 bg-slate-950/88 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-[width,height,opacity,box-shadow] duration-200 focus:outline-none motion-reduce:transition-none max-sm:!inset-x-2 max-sm:!bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-sm:!top-auto max-sm:!w-auto max-sm:max-h-[calc(100dvh-5.5rem)] max-sm:rounded-[1.5rem] ${store.position ? '' : 'bottom-6 right-6'} ${store.isMinimized ? 'w-[280px] rounded-2xl' : 'w-[min(400px,calc(100vw-16px))] rounded-[1.75rem]'}`}
        aria-label="Centro de herramientas global"
      >
        <header className="grid min-h-14 grid-cols-[44px_1fr_auto] items-center border-b border-white/10 bg-white/[0.035] px-2">
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            className="flex h-11 w-11 touch-none items-center justify-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 max-sm:cursor-default sm:cursor-grab sm:active:cursor-grabbing"
            aria-label="Mover panel de herramientas"
            title="Arrastra para mover"
          >
            <GripHorizontal size={18} aria-hidden="true" />
          </button>

          <div className="flex min-w-0 items-center gap-1.5 px-1">
            {store.activePanel !== 'hub' && !store.isMinimized && (
              <button
                type="button"
                onClick={() => store.setActivePanel('hub')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                aria-label="Volver a todas las herramientas"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white/95">
                {activeDefinition?.label ?? 'Herramientas'}
              </p>
              {!store.isMinimized && (
                <p className="truncate text-xs text-white/55">
                  {activeDefinition?.shortDescription ?? 'Accesos rápidos para servir mejor'}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                store.toggleMinimized();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label={store.isMinimized ? 'Restaurar herramientas' : 'Minimizar herramientas'}
            >
              {store.isMinimized ? <Maximize2 size={17} aria-hidden="true" /> : <Minimize2 size={17} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white/60 transition hover:bg-rose-400/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              aria-label="Cerrar herramientas"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {store.isMinimized && (
          <button
            type="button"
            onClick={store.toggleMinimized}
            className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300"
          >
            <span className="min-w-0 truncate text-sm font-medium text-white/85" aria-live="polite">{minimizedStatus}</span>
            <Activity size={18} className={hasBackgroundActivity ? 'shrink-0 animate-pulse text-amber-300 motion-reduce:animate-none' : 'shrink-0 text-white/35'} aria-hidden="true" />
          </button>
        )}

        {!store.isMinimized && store.activePanel === 'hub' && (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {availableTools.map((tool) => (
              <ToolButton
                key={tool.id}
                definition={tool}
                status={getToolStatus(tool.id, store.isPlaying, store.timerIsRunning, store.tallyCount)}
                onClick={() => store.setActivePanel(tool.id)}
              />
            ))}
          </div>
        )}

        <div className={store.isMinimized || store.activePanel === 'hub' ? 'hidden' : 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-3'}>
          {TOOLBOX_TOOLS.map((tool) => {
            const ToolComponent = TOOL_COMPONENTS[tool.id];
            return (
              <div key={tool.id} hidden={tool.id !== store.activePanel}>
                <Suspense fallback={<ToolLoadingState />}>
                  <ToolComponent />
                </Suspense>
              </div>
            );
          })}
        </div>
      </aside>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent position="bottom-center">
          <AlertDialogHeader>
            <AlertDialogTitle>Hay herramientas en funcionamiento</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes minimizarlas para que continúen, o detenerlas antes de cerrar el panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={minimizeAndContinue}>Minimizar y continuar</AlertDialogAction>
            <AlertDialogAction onClick={stopAndClose} className="bg-rose-600 text-white hover:bg-rose-500">
              Detener y cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ToolButton({
  definition,
  status,
  onClick,
}: {
  definition: (typeof TOOLBOX_TOOLS)[number];
  status: string | null;
  onClick: () => void;
}) {
  const Icon = definition.icon;
  const accent = ACCENT_CLASSES[definition.accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-28 flex-col items-start justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent.glow} to-white/[0.025] p-4 text-left shadow-[0_12px_30px_-20px_rgba(0,0,0,0.85)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none ${accent.border}`}
      aria-label={`${definition.label}. ${definition.shortDescription}${status ? `. ${status}` : ''}`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] ${accent.icon}`}>
          <Icon size={21} aria-hidden="true" />
        </span>
        {status && <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${accent.badge}`}>{status}</span>}
      </div>
      <span>
        <span className="block text-sm font-semibold text-white/95">{definition.label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-white/60">{definition.shortDescription}</span>
      </span>
    </button>
  );
}

function ToolLoadingState() {
  return (
    <div className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-white/60" role="status">
      <Activity size={17} className="animate-pulse text-amber-300 motion-reduce:animate-none" aria-hidden="true" />
      Cargando herramienta…
    </div>
  );
}

function getToolStatus(panel: Exclude<ToolboxPanel, 'hub'>, metronomePlaying: boolean, timerRunning: boolean, tallyCount: number): string | null {
  if (panel === 'metronome' && metronomePlaying) return 'Activo';
  if (panel === 'timer' && timerRunning) return 'En curso';
  if (panel === 'clicker' && tallyCount > 0) return `${tallyCount}`;
  return null;
}

function getMinimizedStatus(
  panel: ToolboxPanel,
  bpm: number,
  tallyCount: number,
  timerTimeLeft: number,
  metronomePlaying: boolean,
  timerRunning: boolean,
): string {
  if (timerRunning) return `Temporizador: ${formatCompactTime(timerTimeLeft)}`;
  if (metronomePlaying) return `Metrónomo activo: ${bpm} BPM`;
  if (panel === 'clicker') return `Aforo: ${tallyCount} personas`;
  return getToolDefinition(panel)?.label ?? 'Abrir herramientas';
}

function formatCompactTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
