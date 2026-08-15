import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Copy,
  Drum,
  ExternalLink,
  Eye,
  EyeOff,
  FileMusic,
  FileText,
  Film,
  Guitar,
  Hash,
  Headphones,
  KeyboardMusic,
  Link2,
  ListMusic,
  Maximize2,
  Minimize2,
  Minus,
  Music2,
  PauseCircle,
  Play,
  PlayCircle,
  Plus,
  Printer,
  Settings2,
  Share2,
  SlidersHorizontal,
  Send,
  Sparkles,
  Type,
  Mic,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AccidentalPreference, MediaCategory, Song, SongStructureBlock } from '../../../types';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}
import { exportSongToPdf } from '../utils/songPdfExport';
import {
  extractChords,
  generateHarmonyScoreAbc,
  getSongChordText,
  transposeBracketText,
  transposeChord,
  transposeNote,
} from '../utils/musicEngine';
import { bracketTextToHtml, getOriginalKey, htmlToBracketText } from '../utils/songUtils';
import type { InstrumentType } from '../utils/chordDictionary';
import { InstrumentChordCard } from './musical/InstrumentChordCard';
import { SheetMusicViewer } from './musical/SheetMusicViewer';
import { DrumTabViewer } from './musical/DrumTabViewer';
import { useToolboxStore } from '../../../store/useToolboxStore';
import RichTextRenderer from '../../../components/common/RichTextRenderer';
import { formatProPresenterImportText, type ProPresenterContentMode } from '../utils/propresenterPayload';

type ViewerMode = 'lyrics' | 'lyrics-chords' | 'chords' | 'diagrams' | 'score';

interface SongViewerProps {
  selectedSong: Song;
  setSelectedSong: (song: Song | null) => void;
  showChords: boolean;
  setShowChords: (show: boolean) => void;
  fontFamily: 'mono' | 'serif' | 'sans';
  setFontFamily: (font: 'mono' | 'serif' | 'sans') => void;
  activeTab: 'lyrics' | 'resources';
  setActiveTab: (tab: 'lyrics' | 'resources') => void;
  onClose?: () => void;
}

interface StoredViewerPreferences {
  instrument: InstrumentType;
  fontSize: number;
  accidentalPreference: AccidentalPreference;
  mode: ViewerMode;
}

const DEFAULT_PREFERENCES: StoredViewerPreferences = {
  instrument: 'guitarra',
  fontSize: 100,
  accidentalPreference: 'auto',
  mode: 'lyrics-chords',
};

const INSTRUMENTS: Array<{ id: InstrumentType; label: string; icon: typeof Guitar }> = [
  { id: 'guitarra', label: 'Guitarra', icon: Guitar },
  { id: 'electrica', label: 'Eléctrica', icon: Guitar },
  { id: 'piano', label: 'Piano', icon: KeyboardMusic },
  { id: 'bajo', label: 'Bajo', icon: Music2 },
  { id: 'ukelele', label: 'Ukelele', icon: Guitar },
  { id: 'bateria', label: 'Batería', icon: Drum },
  { id: 'ninguno', label: 'Sin diagrama', icon: EyeOff },
];

const MODES: Array<{ id: ViewerMode; label: string; icon: typeof FileText }> = [
  { id: 'lyrics', label: 'Solo letra', icon: FileText },
  { id: 'lyrics-chords', label: 'Letra + acordes', icon: Music2 },
  { id: 'chords', label: 'Solo acordes', icon: Hash },
  { id: 'diagrams', label: 'Diagramas', icon: Guitar },
  { id: 'score', label: 'Partitura', icon: FileMusic },
];

function readPreferences(): StoredViewerPreferences {
  try {
    const stored = window.localStorage.getItem('song-viewer-preferences-v2');
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) as Partial<StoredViewerPreferences> } : DEFAULT_PREFERENCES;
  } catch (error) {
    console.warn('No fue posible leer las preferencias del visor musical.', error);
    return DEFAULT_PREFERENCES;
  }
}

function lyricsBlocks(song: Song): Array<Extract<SongStructureBlock, { type: 'lyrics' }>> {
  return (song.structure_blocks ?? []).filter((block): block is Extract<SongStructureBlock, { type: 'lyrics' }> => block.type === 'lyrics');
}

function legacyText(song: Song): string {
  return htmlToBracketText(song.lyrics ?? '');
}

function safeBracketHtml(
  text: string,
  transpose: number,
  nashville: boolean,
  key: string | null,
  preference: AccidentalPreference,
): string {
  return DOMPurify.sanitize(bracketTextToHtml(text, transpose, nashville, key, preference), {
    ADD_ATTR: ['data-chord', 'data-chord-node'],
  });
}

function manualScores(blocks: SongStructureBlock[] | null | undefined) {
  return (blocks ?? []).filter((block): block is Extract<SongStructureBlock, { type: 'sheet_music' }> => (
    block.type === 'sheet_music'
    && ((block.notation_type === 'abc' && Boolean(block.abc_code)) || (block.notation_type === 'image' && Boolean(block.image_url)))
  ));
}

export const SongViewer = ({
  selectedSong: rootSong,
  setSelectedSong,
  showChords,
  setShowChords,
  fontFamily,
  setFontFamily,
  activeTab,
  setActiveTab,
  onClose,
}: SongViewerProps) => {
  const [arrangementId, setArrangementId] = useState(() => rootSong.song_arrangements?.find((version) => version.is_default)?.id ?? 'original');
  const selectedSong = useMemo<Song>(() => {
    const arrangement = rootSong.song_arrangements?.find((version) => version.id === arrangementId);
    if (!arrangement) return rootSong;
    return {
      ...rootSong,
      lyrics: arrangement.lyrics,
      structure_blocks: arrangement.structure_blocks,
      resource_links: arrangement.resource_links,
      original_key: arrangement.original_key,
      preferred_accidentals: arrangement.preferred_accidentals,
      capo: arrangement.capo,
      bpm: arrangement.bpm,
      time_signature: arrangement.time_signature,
    };
  }, [arrangementId, rootSong]);
  const [initialPreferences] = useState(readPreferences);
  const [mode, setMode] = useState<ViewerMode>(showChords ? initialPreferences.mode : 'lyrics');
  const [instrument, setInstrument] = useState<InstrumentType>(initialPreferences.instrument);
  const [fontSize, setFontSize] = useState(initialPreferences.fontSize);
  const [accidentalPreference, setAccidentalPreference] = useState<AccidentalPreference>(initialPreferences.accidentalPreference);
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [capo, setCapo] = useState(selectedSong.capo ?? 0);
  const [nashvilleMode, setNashvilleMode] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(28);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [autoScrollProgress, setAutoScrollProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [resourceAnswers, setResourceAnswers] = useState<Record<string, string[]>>({});
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<MediaCategory>('all');
  const [activeEmbedVideoUrl, setActiveEmbedVideoUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastProgressUpdateRef = useRef(0);

  const sourceText = useMemo(
    () => getSongChordText(selectedSong.structure_blocks, legacyText(selectedSong)),
    [selectedSong],
  );
  const originalKey = selectedSong.original_key ?? getOriginalKey(sourceText);
  const usesCapoShapes = instrument === 'guitarra' || instrument === 'electrica' || instrument === 'ukelele';
  const chordTransposeAmount = nashvilleMode ? transposeAmount : transposeAmount - (usesCapoShapes ? capo : 0);
  const currentKey = originalKey
    ? transposeNote(originalKey, transposeAmount, accidentalPreference, originalKey)
    : null;
  const displayedChords = useMemo(() => {
    const unique = [...new Set(extractChords(sourceText))];
    return unique.map((chord) => transposeChord(chord, chordTransposeAmount, accidentalPreference, originalKey));
  }, [accidentalPreference, chordTransposeAmount, originalKey, sourceText]);
  const generatedScore = useMemo(() => generateHarmonyScoreAbc({
    title: selectedSong.title,
    artist: selectedSong.artist,
    key: originalKey,
    timeSignature: selectedSong.time_signature,
    blocks: selectedSong.structure_blocks ?? [],
    fallbackText: sourceText,
    transpose: transposeAmount,
    accidentalPreference,
  }), [accidentalPreference, originalKey, selectedSong, sourceText, transposeAmount]);
  const scores = useMemo(() => manualScores(selectedSong.structure_blocks), [selectedSong.structure_blocks]);
  const structuredLyrics = useMemo(() => lyricsBlocks(selectedSong), [selectedSong]);
  const loadSongTempo = useToolboxStore((state) => state.loadSongTempo);
  const openTool = useToolboxStore((state) => state.open);

  const close = useCallback(() => {
    if (onClose) onClose();
    else setSelectedSong(null);
  }, [onClose, setSelectedSong]);

  useEffect(() => {
    try {
      window.localStorage.setItem('song-viewer-preferences-v2', JSON.stringify({ instrument, fontSize, accidentalPreference, mode } satisfies StoredViewerPreferences));
    } catch (error) {
      console.warn('No fue posible guardar las preferencias del visor musical.', error);
    }
  }, [accidentalPreference, fontSize, instrument, mode]);

  useEffect(() => {
    setShowChords(mode !== 'lyrics');
  }, [mode, setShowChords]);

  useEffect(() => {
    if (!autoScrollActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      lastProgressUpdateRef.current = 0;
      return;
    }
    const pixelsPerSecond = 4 + autoScrollSpeed * 0.72;
    const animate = (time: number) => {
      if (lastFrameRef.current !== null && scrollRef.current) {
        scrollRef.current.scrollTop += ((time - lastFrameRef.current) / 1000) * pixelsPerSecond;
        const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        if (time - lastProgressUpdateRef.current >= 120 || scrollRef.current.scrollTop >= maxScroll - 1) {
          setAutoScrollProgress(maxScroll > 0 ? Math.min(100, (scrollRef.current.scrollTop / maxScroll) * 100) : 100);
          lastProgressUpdateRef.current = time;
        }
        if (maxScroll > 0 && scrollRef.current.scrollTop >= maxScroll - 1) setAutoScrollActive(false);
      }
      lastFrameRef.current = time;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScrollActive, autoScrollSpeed]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  // Lock body scroll while the viewer is open so scrolling inside it
  // never leaks through to the page behind.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        if (showMobileTools) setShowMobileTools(false);
        else close();
      }
      if (event.key === ' ') {
        event.preventDefault();
        setAutoScrollActive((active) => !active);
      }
      if (event.key === 'ArrowUp' && event.shiftKey) setTransposeAmount((value) => value + 1);
      if (event.key === 'ArrowDown' && event.shiftKey) setTransposeAmount((value) => value - 1);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close, showMobileTools]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch (error) {
      console.error('No se pudo cambiar el modo de pantalla completa.', error);
      toast.error('El navegador no permitió activar la pantalla completa.');
    }
  };

  const copyForProPresenter = async (contentMode: ProPresenterContentMode) => {
    const processed = transposeBracketText(sourceText, contentMode === 'lyrics' ? transposeAmount : chordTransposeAmount, {
      nashville: nashvilleMode,
      key: originalKey,
      preference: accidentalPreference,
    });
    const result = formatProPresenterImportText(processed, {
      mode: contentMode,
      linesPerSlide: contentMode === 'lyrics' ? 2 : 1,
    });
    if (!result) {
      toast.error('Esta versión no contiene texto que se pueda importar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(result);
      toast.success(contentMode === 'lyrics'
        ? 'Letra copiada en bloques de dos líneas para ProPresenter'
        : 'Acordes y letra copiados en pares para Stage');
    } catch (error) {
      console.error('No se pudo copiar el texto para ProPresenter.', error);
      toast.error('El navegador no permitió copiar el contenido.');
    }
  };

  const shareSong = async () => {
    const shareData = { title: selectedSong.title, text: `${selectedSong.title}${currentKey ? ` · Tono ${currentKey}` : ''}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Enlace copiado');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('No se pudo compartir la canción.', error);
      toast.error('No fue posible compartir la canción.');
    }
  };

  const printSong = () => {
    exportSongToPdf(selectedSong, { transposeAmount, nashvilleMode, originalKey, showChords: mode !== 'lyrics' });
    toast.success('Preparando el PDF de la canción');
  };

  const renderLyrics = () => {
    const withChords = mode !== 'lyrics';
    const renderText = (text: string) => (
      <div
        className={`song-workspace-lyrics ${withChords ? '' : 'song-workspace-hide-chords'}`}
        dangerouslySetInnerHTML={{ __html: safeBracketHtml(text, chordTransposeAmount, nashvilleMode, originalKey, accidentalPreference) }}
      />
    );
    if (!structuredLyrics.length) return renderText(legacyText(selectedSong));
    return structuredLyrics.map((block) => (
      <section key={block.id} className="song-section-glass">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-amber-400" />
          <h3 className="text-[11px] font-black uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">{block.label}</h3>
        </div>
        {block.melody_guide && <p className="mb-4 rounded-xl bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">Guía: {block.melody_guide}</p>}
        {renderText(block.lyrics)}
      </section>
    ));
  };

  const renderChordChart = () => {
    const blocks = structuredLyrics.length ? structuredLyrics : [{ id: 'legacy', label: 'Canción', lyrics: sourceText }];
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((block) => {
          const chords = extractChords(block.lyrics).map((chord) => {
            const transposed = transposeChord(chord, chordTransposeAmount, accidentalPreference, originalKey);
            return nashvilleMode ? transposeBracketText(`[${chord}]`, transposeAmount, { nashville: true, key: originalKey, preference: accidentalPreference }).slice(1, -1) : transposed;
          });
          if (!chords.length) return null;
          return (
            <section key={block.id} className="song-section-glass">
              <h3 className="mb-4 text-[11px] font-black uppercase tracking-[.2em] text-slate-500">{block.label}</h3>
              <div className="flex flex-wrap gap-2">
                {chords.map((chord, index) => <span key={`${block.id}-${index}`} className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 font-mono text-sm font-black text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">{chord}</span>)}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderScores = () => (
    <div className="space-y-6">
      {scores.map((score) => (
        <section key={score.id} className="song-section-glass">
          <div className="mb-4 flex items-center gap-2"><Check size={15} className="text-emerald-500" /><h3 className="font-bold text-slate-800 dark:text-white">{score.title || 'Partitura de melodía'}</h3></div>
          {score.notation_type === 'abc' ? (
            <SheetMusicViewer abcNotation={score.abc_code ?? ''} responsive audioEnabled instrument={instrument} />
          ) : (
            <img src={score.image_url} alt={score.title || 'Partitura exacta'} className="max-h-[70vh] w-full rounded-xl border border-slate-200 object-contain dark:border-white/10" />
          )}
        </section>
      ))}
      {generatedScore && (
        <section className="song-section-glass">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2"><Sparkles size={15} className="text-amber-500" /><h3 className="font-bold text-slate-800 dark:text-white">Partitura armónica generada</h3></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acordes sobre pulso · no inventa melodía</span>
          </div>
          <SheetMusicViewer abcNotation={generatedScore} responsive instrument={instrument} />
        </section>
      )}
      {!scores.length && !generatedScore && <EmptyState icon={FileMusic} title="Aún no hay material para generar una partitura" description="Agrega acordes, una melodía ABC o una imagen exacta desde el editor." />}
    </div>
  );

  const renderResources = () => {
    const rawLinks = (selectedSong.resource_links ?? []).filter((link) => (link.visibility ?? 'public') === 'public');
    const blocks = (selectedSong.structure_blocks ?? []).filter((block) => block.type !== 'lyrics' && block.type !== 'sheet_music' && block.type !== 'chord_diagram' && (block.audience ?? 'public') === 'public');

    const filteredLinks = rawLinks.filter((link) => {
      if (mediaCategoryFilter === 'all') return true;
      return (link.category ?? 'all') === mediaCategoryFilter;
    });

    const categoryLabels: Record<string, string> = {
      all: 'Todos los vídeos',
      video_clip: 'Video clip (En vivo / Oficial)',
      lesson: 'Video lecciones / Tutoriales',
      backing_track: 'Backing tracks / Secuencia',
      lyrics_video: 'Video de letras',
      other: 'Otros recursos',
    };

    if (!rawLinks.length && !blocks.length) {
      return <EmptyState icon={Headphones} title="Sin recursos complementarios" description="Agrega texto, enlaces, notas por instrumento, preguntas, encuestas o tablaturas desde el editor por bloques." />;
    }

    return (
      <div className="space-y-6">
        {/* Media Drawer Header & Category Pills */}
        {rawLinks.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-slate-900/90 p-5 text-white shadow-xl backdrop-blur-xl dark:border-white/10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Film className="text-amber-400" size={20} />
                <h3 className="font-serif text-lg font-bold">Galería Multimedia & Recursos</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredLinks.length} {filteredLinks.length === 1 ? 'recurso' : 'recursos'}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(() => {
                const getCount = (catId: string) => {
                  if (catId === 'all') return rawLinks.length;
                  return rawLinks.filter((l) => (l.category ?? 'other') === catId).length;
                };

                return [
                  { id: 'all', label: 'Todos' },
                  { id: 'video_clip', label: 'Video clip' },
                  { id: 'lesson', label: 'Lecciones / Tutoriales' },
                  { id: 'backing_track', label: 'Backing tracks' },
                  { id: 'lyrics_video', label: 'Con Letra' },
                  { id: 'sheet_music', label: 'Partituras / Cifrados' },
                  { id: 'other', label: 'Otros' },
                ]
                  .map((cat) => {
                    const count = getCount(cat.id);
                    if (cat.id !== 'all' && count === 0) return null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMediaCategoryFilter(cat.id as MediaCategory)}
                        className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                          mediaCategoryFilter === cat.id
                            ? 'bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                          mediaCategoryFilter === cat.id ? 'bg-slate-950/20 text-slate-950' : 'bg-white/15 text-slate-300'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                  .filter(Boolean);
              })()}
            </div>

            {/* Media Items Cards */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLinks.map((link) => {
                const ytId = extractYouTubeId(link.url);
                const isPlaying = activeEmbedVideoUrl === link.url;
                const catLabel = categoryLabels[link.category ?? 'other'] || 'Recurso';

                if (ytId) {
                  return (
                    <article
                      key={link.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-lg transition hover:border-amber-400/40"
                    >
                      {isPlaying ? (
                        <div className="relative aspect-video w-full">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
                            title={link.title || 'Video YouTube'}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <button
                            type="button"
                            onClick={() => setActiveEmbedVideoUrl(null)}
                            className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-white hover:bg-slate-900"
                            title="Cerrar video"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={link.title || 'Miniatura video'}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          <button
                            type="button"
                            onClick={() => setActiveEmbedVideoUrl(link.url)}
                            className="absolute inset-0 grid place-items-center bg-slate-950/30 transition group-hover:bg-slate-950/10"
                            aria-label={`Reproducir ${link.title || 'Video'}`}
                          >
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-600/90 text-white shadow-xl transition group-hover:scale-110 group-hover:bg-rose-500">
                              <Play size={22} className="ml-0.5 fill-current" />
                            </span>
                          </button>
                          <span className="absolute left-2.5 top-2.5 rounded-full border border-white/20 bg-slate-950/70 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
                            {catLabel}
                          </span>
                          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/20 bg-slate-950/70 px-2 py-0.5 text-[9px] font-bold text-slate-300 backdrop-blur-md">
                            {link.instrument}
                          </span>
                        </div>
                      )}
                      <div className="p-3.5">
                        <h4 className="line-clamp-2 text-xs font-bold text-white group-hover:text-amber-300">
                          {link.title || link.comment || 'Video de referencia'}
                        </h4>
                        {link.comment && link.title && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{link.comment}</p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-amber-300"
                        >
                          Abrir en YouTube <ExternalLink size={11} />
                        </a>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={link.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-lg transition hover:border-amber-400/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
                        {catLabel}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{link.instrument}</span>
                    </div>
                    <h4 className="mt-3 text-xs font-bold text-white group-hover:text-amber-300">
                      {link.title || link.comment || 'Abrir enlace'}
                    </h4>
                    {link.comment && link.title && (
                      <p className="mt-1 text-[11px] text-slate-400">{link.comment}</p>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                    >
                      <Link2 size={13} /> Visitar enlace
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Structured Blocks (Musician notes, Tablatures, Polls) */}
        <div className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => {
            if (block.type === 'musician_note') {
              const target = (block.target_instrument ?? 'General').toLowerCase();
              let Icon = Music2;
              let badgeBg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
              if (target.includes('batería') || target.includes('drum')) {
                Icon = Drum;
                badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20';
              } else if (target.includes('guitarr') || target.includes('bajo') || target.includes('bass')) {
                Icon = Guitar;
                badgeBg = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20';
              } else if (target.includes('piano') || target.includes('teclado') || target.includes('key')) {
                Icon = KeyboardMusic;
                badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20';
              } else if (target.includes('voz') || target.includes('vocal') || target.includes('canto')) {
                Icon = Mic;
                badgeBg = 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/20';
              }

              return (
                <article key={block.id} className="song-section-glass border-l-4 border-l-amber-500/70">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeBg}`}>
                      <Icon size={13} /> Nota para {block.target_instrument}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {block.content}
                  </p>
                </article>
              );
            }
            if (block.type === 'rich_text' && (block.audience ?? 'public') === 'public') return <article key={block.id} className="song-section-glass md:col-span-2">{block.title && <h3 className="mb-3 font-serif text-xl font-black text-slate-900 dark:text-white">{block.title}</h3>}<RichTextRenderer html={DOMPurify.sanitize(block.content)} className="text-sm leading-7 text-slate-700 dark:text-slate-200" /></article>;
            if (block.type === 'tablature') {
              if (block.instrument === 'drums') {
                return (
                  <article key={block.id} className="song-section-glass md:col-span-2">
                    <DrumTabViewer song={selectedSong} tabContent={block.content} title={block.title} tuning={block.tuning} />
                  </article>
                );
              }
              return (
                <article key={block.id} className="song-section-glass md:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600">
                        {`${block.instrument ?? 'guitar'} tab`}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{block.title || 'Tablatura'}</h3>
                    </div>
                    {block.tuning && (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 dark:bg-white/10">
                        Afinación {block.tuning}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded-xl bg-slate-950 p-4">
                    <pre className="min-w-max font-mono text-xs leading-6 text-emerald-300">{block.content}</pre>
                  </div>
                </article>
              );
            }
            if (block.type === 'media_embed') return <article key={block.id} className="song-section-glass"><span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Media de ensayo</span><h3 className="mt-2 font-bold text-slate-900 dark:text-white">{block.title || 'Referencia multimedia'}</h3><a href={block.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"><Play size={14} /> Abrir recurso</a></article>;
            if (block.type === 'poll') {
              const selected = resourceAnswers[block.id] ?? [];
              return <article key={block.id} className="song-section-glass"><span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-500">Encuesta de preparación</span><h3 className="mt-2 font-bold text-slate-900 dark:text-white">{block.question}</h3><div className="mt-4 space-y-2">{block.options.map((option) => <button key={option} onClick={() => setResourceAnswers((answers) => ({ ...answers, [block.id]: block.allow_multiple ? selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] : [option] }))} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${selected.includes(option) ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300' : 'border-slate-200 dark:border-white/10'}`}><span className={`h-3 w-3 rounded-full border ${selected.includes(option) ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-slate-300'}`} />{option}</button>)}</div><p className="mt-3 text-[9px] text-slate-400">Respuesta guardada sólo durante esta sesión de preparación.</p></article>;
            }
            if (block.type === 'question') return <article key={block.id} className="song-section-glass"><span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Pregunta</span><h3 className="mt-2 font-bold text-slate-900 dark:text-white">{block.question}</h3>{block.helper_text && <p className="mt-1 text-xs text-slate-500">{block.helper_text}</p>}{block.answer_type === 'yes_no' ? <div className="mt-4 grid grid-cols-2 gap-2">{['Sí', 'No'].map((value) => <button key={value} onClick={() => setResourceAnswers((answers) => ({ ...answers, [block.id]: [value] }))} className={`rounded-xl border px-3 py-2 text-xs font-bold ${(resourceAnswers[block.id] ?? []).includes(value) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 dark:border-white/10'}`}>{value}</button>)}</div> : block.answer_type === 'long' ? <textarea onChange={(event) => setResourceAnswers((answers) => ({ ...answers, [block.id]: [event.target.value] }))} className="mt-4 w-full rounded-xl border border-slate-200 bg-white/60 p-3 text-sm outline-none dark:border-white/10 dark:bg-white/5" rows={4} placeholder="Escribe una respuesta para el ensayo…" /> : <input onChange={(event) => setResourceAnswers((answers) => ({ ...answers, [block.id]: [event.target.value] }))} className="mt-4 w-full rounded-xl border border-slate-200 bg-white/60 p-3 text-sm outline-none dark:border-white/10 dark:bg-white/5" placeholder="Respuesta" />}</article>;
            if (block.type === 'link_collection') return <article key={block.id} className="song-section-glass"><h3 className="font-bold text-slate-900 dark:text-white">{block.title || 'Enlaces'}</h3><div className="mt-3 space-y-2">{block.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-200 p-3 transition hover:border-amber-300 dark:border-white/10"><span className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">{link.label}<Link2 size={13} /></span>{link.description && <p className="mt-1 text-[11px] text-slate-500">{link.description}</p>}</a>)}</div></article>;
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[80] bg-slate-950/65 p-0 backdrop-blur-md md:p-4 lg:p-7 print:static print:bg-white print:p-0" role="dialog" aria-modal="true" aria-labelledby="song-viewer-title">
      <button className="absolute inset-0 cursor-default" onClick={() => !isFullscreen && close()} aria-label="Cerrar visor" />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[1500px] overflow-hidden bg-slate-50/95 shadow-2xl dark:bg-slate-950/95 md:h-[calc(100dvh-2rem)] md:rounded-[2rem] md:border md:border-white/20 lg:h-[calc(100dvh-3.5rem)] print:h-auto print:max-w-none print:overflow-visible print:bg-white">
        <aside className={`${showTools ? 'w-[280px]' : 'w-0'} hidden shrink-0 overflow-hidden border-r border-white/50 bg-white/55 backdrop-blur-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-slate-900/55 lg:block print:hidden`}>
          <div className="flex h-full w-[280px] flex-col overflow-y-auto overscroll-contain p-4">
            <ToolSection title="Vista" icon={Eye}>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map((item) => <ModeButton key={item.id} active={mode === item.id} label={item.label} icon={item.icon} onClick={() => setMode(item.id)} />)}
              </div>
            </ToolSection>
            <ToolSection title="Instrumento" icon={Guitar}>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENTS.map((item) => <ModeButton key={item.id} active={instrument === item.id} label={item.label} icon={item.icon} onClick={() => setInstrument(item.id)} />)}
              </div>
            </ToolSection>
            {usesCapoShapes && <ToolSection title="Capo y posiciones" icon={Guitar}>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2"><button onClick={() => setCapo((value) => Math.max(0, value - 1))} className="tool-icon-button" aria-label="Bajar capo"><Minus size={14} /></button><div className="flex-1 text-center"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Traste</span><strong className="text-lg text-amber-700 dark:text-amber-300">{capo || 'Sin capo'}</strong></div><button onClick={() => setCapo((value) => Math.min(12, value + 1))} className="tool-icon-button" aria-label="Subir capo"><Plus size={14} /></button></div>
                {capo > 0 && <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">Suena en {currentKey}; muestra las formas que debes tocar con capo.</p>}
              </div>
            </ToolSection>}
            <ToolSection title="Lectura" icon={Type}>
              <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                <button onClick={() => setFontSize((value) => Math.max(70, value - 10))} className="tool-icon-button" aria-label="Reducir texto"><Minus size={15} /></button>
                <span className="flex-1 text-center text-xs font-black text-slate-700 dark:text-slate-200">{fontSize}%</span>
                <button onClick={() => setFontSize((value) => Math.min(180, value + 10))} className="tool-icon-button" aria-label="Aumentar texto"><Plus size={15} /></button>
              </div>
              <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value as 'mono' | 'serif' | 'sans')} className="song-select" aria-label="Tipografía">
                <option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Monospace</option>
              </select>
            </ToolSection>
            <ToolSection title="Escritura musical" icon={SlidersHorizontal}>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'sharp', 'flat'] as AccidentalPreference[]).map((value) => <button key={value} onClick={() => setAccidentalPreference(value)} className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase ${accidentalPreference === value ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'border-white/70 bg-white/60 text-slate-500 dark:border-white/10 dark:bg-white/5'}`}>{value === 'auto' ? 'Auto' : value === 'sharp' ? '♯' : '♭'}</button>)}
              </div>
              <button onClick={() => setNashvilleMode((value) => !value)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${nashvilleMode ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300' : 'border-white/70 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><span className="flex items-center gap-2"><Hash size={14} /> Grados romanos</span><span>{nashvilleMode ? 'I · ii · iii' : 'Inactivo'}</span></button>
            </ToolSection>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative z-20 border-b border-white/60 bg-white/65 px-4 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 sm:px-6 print:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-amber-600 dark:text-amber-300">
                  <span>{selectedSong.song_types?.name || 'Canción'}</span>{selectedSong.time_signature && <><span>•</span><span>{selectedSong.time_signature}</span></>}{selectedSong.bpm && <><span>•</span><span>{selectedSong.bpm} BPM</span></>}
                </div>
                <h2 id="song-viewer-title" className="mt-1 truncate font-serif text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{selectedSong.title}</h2>
                {selectedSong.artist && <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedSong.artist}</p>}
                {(rootSong.song_arrangements?.length ?? 0) > 0 && <label className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/70 px-2 py-1 text-[10px] font-black text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"><ListMusic size={12} /> Versión<select value={arrangementId} onChange={(event) => { const nextId = event.target.value; const version = rootSong.song_arrangements?.find((item) => item.id === nextId); setCapo(version?.capo ?? rootSong.capo ?? 0); setTransposeAmount(0); setArrangementId(nextId); }} className="bg-transparent outline-none"><option value="original">Original</option>{rootSong.song_arrangements?.map((version) => <option key={version.id} value={version.id} className="text-slate-900">{version.name}</option>)}</select></label>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    if (window.innerWidth >= 1024) setShowTools((v) => !v);
                    else setShowMobileTools(true);
                  }}
                  className="header-icon-button"
                  aria-label="Herramientas musicales"
                >
                  <Settings2 size={17} />
                </button>
                <button onClick={() => void shareSong()} className="header-icon-button" aria-label="Compartir"><Share2 size={17} /></button>
                <button onClick={() => void toggleFullscreen()} className="header-icon-button hidden sm:grid" aria-label="Pantalla completa">{isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
                <button onClick={close} className="header-icon-button" aria-label="Cerrar"><X size={19} /></button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <div className="flex shrink-0 items-center rounded-2xl border border-white/70 bg-white/75 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                <button onClick={() => setTransposeAmount((value) => value - 1)} className="transpose-button" aria-label="Bajar semitono"><Minus size={14} /></button>
                <button onClick={() => setTransposeAmount(0)} className="min-w-[86px] px-3 py-1 text-center" title="Restaurar tono">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Tonalidad</span>
                  <strong className="text-sm text-amber-700 dark:text-amber-300">{currentKey || (transposeAmount ? `${transposeAmount > 0 ? '+' : ''}${transposeAmount}` : 'Original')}</strong>
                </button>
                <button onClick={() => setTransposeAmount((value) => value + 1)} className="transpose-button" aria-label="Subir semitono"><Plus size={14} /></button>
              </div>
              {capo && usesCapoShapes ? <span className="toolbar-chip">Capo {capo} · forma {transposeNote(originalKey || 'C', chordTransposeAmount, accidentalPreference, originalKey)}</span> : null}
              {selectedSong.bpm ? <button onClick={() => { loadSongTempo(selectedSong.bpm ?? 80, selectedSong.time_signature, selectedSong.title); toast.success(`${selectedSong.bpm} BPM enviados al metrónomo`); }} className="toolbar-chip border-amber-200/70 text-amber-700 dark:text-amber-300"><Send size={13} /> Mandar {selectedSong.bpm} BPM</button> : <button onClick={() => openTool('metronome')} className="toolbar-chip"><Music2 size={13} /> Metrónomo</button>}
              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => setAutoScrollActive((active) => !active)}
                  className={`transpose-button ${autoScrollActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300' : ''}`}
                  aria-label={autoScrollActive ? 'Pausar desplazamiento automático' : 'Iniciar desplazamiento automático'}
                  title={autoScrollActive ? 'Pausar autoscroll' : 'Activar autoscroll'}
                >
                  {autoScrollActive ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                </button>
                <input type="range" min="5" max="100" value={autoScrollSpeed} onChange={(event) => setAutoScrollSpeed(Number(event.target.value))} className="w-20 accent-indigo-500" aria-label="Velocidad del autoscroll" />
                <span className="w-7 text-[9px] font-black text-slate-400">{Math.round(autoScrollProgress)}%</span>
                <button
                  onClick={() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); setAutoScrollProgress(0); }}
                  className="transpose-button"
                  aria-label="Volver al inicio"
                  title="Volver arriba"
                >
                  <ChevronsUp size={16} />
                </button>
              </div>
              <button onClick={printSong} className="toolbar-chip"><Printer size={13} /> PDF</button>
              <button onClick={() => void copyForProPresenter('lyrics')} className="toolbar-chip" title="Dos líneas de letra por diapositiva"><FileText size={13} /> Letra → ProPresenter</button>
              <button onClick={() => void copyForProPresenter('lyrics-chords')} className="toolbar-chip border-indigo-200/70 text-indigo-700 dark:text-indigo-300" title="Una frase por diapositiva: acordes arriba y letra abajo"><Copy size={13} /> Stage + acordes</button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-950/60">
                <button onClick={() => setActiveTab('lyrics')} className={`workspace-tab ${activeTab === 'lyrics' ? 'workspace-tab-active' : ''}`}><BookOpenText size={14} /> Canción</button>
                <button onClick={() => setActiveTab('resources')} className={`workspace-tab ${activeTab === 'resources' ? 'workspace-tab-active' : ''}`}><Headphones size={14} /> Recursos</button>
              </div>
              <div className="flex gap-1 overflow-x-auto lg:hidden">
                {MODES.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setMode(item.id)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${mode === item.id ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' : 'text-slate-400'}`} title={item.label}><Icon size={15} /></button>; })}
              </div>
            </div>
          </header>

          <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_15%_10%,rgba(251,191,36,.09),transparent_28%),radial-gradient(circle_at_85%_5%,rgba(99,102,241,.08),transparent_24%)] px-4 py-6 sm:px-6 lg:px-10 print:overflow-visible print:bg-white print:p-0">
            <div className="mx-auto max-w-5xl">
              {activeTab === 'resources' ? renderResources() : (
                <>
                  {(mode === 'diagrams' || (mode === 'lyrics-chords' && instrument !== 'ninguno' && (displayedChords.length > 0 || instrument === 'bateria'))) && (
                    <section className="mb-6 print:hidden">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">
                          {instrument === 'bateria' ? 'Batería · Visualizador de Ritmo' : `Acordes · ${INSTRUMENTS.find((item) => item.id === instrument)?.label}`}
                        </h3>
                        {instrument !== 'bateria' && <button onClick={() => setMode('diagrams')} className="text-[10px] font-bold text-amber-600">Ver todos</button>}
                      </div>
                      {instrument === 'bateria' ? (
                        <DrumTabViewer song={selectedSong} compact={mode !== 'diagrams'} />
                      ) : (
                        <div className={`flex gap-3 overflow-x-auto pb-3 ${mode === 'diagrams' ? 'flex-wrap overflow-visible' : ''}`}>
                          {instrument !== 'ninguno' && displayedChords.map((chord) => <InstrumentChordCard key={chord} chord={chord} instrument={instrument} compact={mode !== 'diagrams'} />)}
                        </div>
                      )}
                    </section>
                  )}
                  <div className={`font-${fontFamily}`} style={{ '--song-font-scale': fontSize / 100 } as CSSProperties}>
                    {(mode === 'lyrics' || mode === 'lyrics-chords') && renderLyrics()}
                    {mode === 'chords' && renderChordChart()}
                    {mode === 'score' && renderScores()}
                    {mode === 'diagrams' && instrument !== 'bateria' && displayedChords.length === 0 && <EmptyState icon={Guitar} title="No se encontraron acordes" description="Revisa el formato de la canción desde el editor." />}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {showMobileTools && (
          <div className="absolute inset-0 z-40 flex items-end bg-slate-950/45 p-3 backdrop-blur-sm lg:hidden print:hidden" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowMobileTools(false)}>
            <section className="max-h-[82dvh] w-full overflow-y-auto overscroll-contain rounded-[1.75rem] border border-white/70 bg-white/95 p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950/95" role="dialog" aria-modal="true" aria-labelledby="mobile-song-tools-title">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Espacio musical</p><h3 id="mobile-song-tools-title" className="mt-0.5 font-serif text-xl font-black text-slate-900 dark:text-white">Herramientas de lectura</h3></div>
                <button type="button" onClick={() => setShowMobileTools(false)} className="header-icon-button" aria-label="Cerrar herramientas"><X size={18} /></button>
              </div>

              <div className="mt-4 space-y-4">
                <div><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Vista</p><div className="grid grid-cols-3 gap-2">{MODES.map((item) => <ModeButton key={item.id} active={mode === item.id} label={item.label} icon={item.icon} onClick={() => setMode(item.id)} />)}</div></div>
                <div><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Instrumento</p><div className="grid grid-cols-3 gap-2">{INSTRUMENTS.map((item) => <ModeButton key={item.id} active={instrument === item.id} label={item.label} icon={item.icon} onClick={() => setInstrument(item.id)} />)}</div></div>

                {usesCapoShapes && <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5"><div className="flex items-center gap-2"><button onClick={() => setCapo((value) => Math.max(0, value - 1))} className="tool-icon-button" aria-label="Bajar capo"><Minus size={14} /></button><div className="flex-1 text-center"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Capo</span><strong className="text-lg text-amber-700 dark:text-amber-300">{capo ? `Traste ${capo}` : 'Sin capo'}</strong></div><button onClick={() => setCapo((value) => Math.min(12, value + 1))} className="tool-icon-button" aria-label="Subir capo"><Plus size={14} /></button></div></div>}

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 dark:border-white/10 dark:bg-white/5"><button onClick={() => setFontSize((value) => Math.max(70, value - 10))} className="tool-icon-button" aria-label="Reducir texto"><Minus size={15} /></button><span className="flex-1 text-center text-xs font-black text-slate-700 dark:text-slate-200">Texto {fontSize}%</span><button onClick={() => setFontSize((value) => Math.min(180, value + 10))} className="tool-icon-button" aria-label="Aumentar texto"><Plus size={15} /></button></div>
                  <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value as 'mono' | 'serif' | 'sans')} className="song-select w-28" aria-label="Tipografía"><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select>
                </div>

                <div className="grid grid-cols-4 gap-2">{(['auto', 'sharp', 'flat'] as AccidentalPreference[]).map((value) => <button key={value} onClick={() => setAccidentalPreference(value)} className={`rounded-xl border px-2 py-2.5 text-[10px] font-black uppercase ${accidentalPreference === value ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' : 'border-slate-200 text-slate-500 dark:border-white/10'}`}>{value === 'auto' ? 'Auto' : value === 'sharp' ? '♯' : '♭'}</button>)}<button onClick={() => setNashvilleMode((value) => !value)} className={`rounded-xl border px-2 py-2.5 text-[10px] font-black ${nashvilleMode ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300' : 'border-slate-200 text-slate-500 dark:border-white/10'}`}>Grados</button></div>
              </div>
            </section>
          </div>
        )}
      </div>

      <style>{`
        .song-section-glass { border: 1px solid rgb(255 255 255 / .68); background: rgb(255 255 255 / .72); border-radius: 1.5rem; padding: 1.25rem; box-shadow: 0 18px 55px -42px rgb(15 23 42 / .65); backdrop-filter: blur(22px); }
        .dark .song-section-glass { border-color: rgb(255 255 255 / .09); background: rgb(15 23 42 / .62); }
        .song-workspace-lyrics { font-size: calc(1.05rem * var(--song-font-scale)); line-height: 2.45; color: rgb(30 41 59); }
        .dark .song-workspace-lyrics { color: rgb(226 232 240); }
        .song-workspace-lyrics .lyrics-line { margin: .25rem 0; min-height: 1.5em; }
        .song-workspace-lyrics .chord-node-wrapper { display: inline-block; position: relative; width: .05em; height: 1em; vertical-align: baseline; margin-right: .15em; }
        .song-workspace-lyrics .chord-node-wrapper::before { content: attr(data-chord); position: absolute; bottom: .92em; left: 0; color: rgb(180 83 9); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72em; font-weight: 900; line-height: 1; white-space: nowrap; }
        .dark .song-workspace-lyrics .chord-node-wrapper::before { color: rgb(252 211 77); }
        .song-workspace-lyrics .chord-only-line { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: .6rem 0; min-height: 2em; }
        .song-workspace-lyrics .chord-only-badge { display: inline-flex; align-items: center; justify-content: center; position: relative; width: auto; min-width: 2.2rem; padding: .2rem .6rem; border-radius: .6rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .82rem; font-weight: 900; line-height: 1; color: rgb(180 83 9); background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
        .dark .song-workspace-lyrics .chord-only-badge { color: rgb(252 211 77); background: rgba(245, 158, 11, 0.16); border-color: rgba(245, 158, 11, 0.35); }
        .song-workspace-lyrics .chord-only-badge::before { display: none !important; }
        .song-workspace-hide-chords .chord-node-wrapper { display: none; }
        .tool-icon-button,.header-icon-button,.transpose-button { place-items:center; border-radius:.75rem; color:rgb(100 116 139); transition:.2s; }
        .tool-icon-button { display:grid; width:2.25rem;height:2.25rem;background:rgb(241 245 249 / .8); }
        .header-icon-button { display:grid; width:2.5rem;height:2.5rem;background:rgb(255 255 255 / .65);border:1px solid rgb(255 255 255 / .75); }
        .transpose-button { display:grid; width:2rem;height:2rem; }
        .tool-icon-button:hover,.header-icon-button:hover,.transpose-button:hover { color:rgb(180 83 9);background:rgb(254 243 199 / .8); }
        .dark .tool-icon-button,.dark .header-icon-button { background:rgb(255 255 255 / .06);border-color:rgb(255 255 255 / .1);color:rgb(203 213 225); }
        .song-select { width:100%;border-radius:.8rem;border:1px solid rgb(255 255 255 / .7);background:rgb(255 255 255 / .7);padding:.65rem .75rem;font-size:.75rem;font-weight:700;color:rgb(71 85 105);outline:none; }
        .dark .song-select { border-color:rgb(255 255 255 / .1);background:rgb(255 255 255 / .05);color:rgb(226 232 240); }
        .toolbar-chip { display:flex;align-items:center;gap:.4rem;flex-shrink:0;border:1px solid rgb(255 255 255 / .7);background:rgb(255 255 255 / .72);padding:.55rem .75rem;border-radius:1rem;color:rgb(71 85 105);font-size:.68rem;font-weight:800; }
        .dark .toolbar-chip { border-color:rgb(255 255 255 / .1);background:rgb(255 255 255 / .05);color:rgb(203 213 225); }
        .workspace-tab { display:flex;align-items:center;gap:.4rem;border-radius:.75rem;padding:.45rem .75rem;font-size:.7rem;font-weight:800;color:rgb(100 116 139); }
        .workspace-tab-active { background:white;color:rgb(180 83 9);box-shadow:0 2px 8px rgb(15 23 42 / .08); }
        .dark .workspace-tab-active { background:rgb(30 41 59);color:rgb(252 211 77); }
        @media print { .song-section-glass { break-inside:avoid;border:0;background:white;box-shadow:none;padding:.5rem 0; } }
      `}</style>
    </div>
  );
};

function ToolSection({ title, icon: Icon, children }: { title: string; icon: typeof Eye; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-3 rounded-2xl border border-white/60 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[.03]">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500 dark:text-slate-300"><Icon size={14} className="text-amber-500" /><span className="flex-1 text-left">{title}</span>{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  );
}

function ModeButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Eye; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[9px] font-black transition ${active ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300' : 'border-white/70 bg-white/55 text-slate-500 hover:border-amber-200 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-400'}`}><Icon size={16} /><span>{label}</span></button>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Eye; title: string; description: string }) {
  return <div className="song-section-glass py-14 text-center"><Icon size={34} className="mx-auto text-slate-300" /><h3 className="mt-4 font-bold text-slate-700 dark:text-slate-200">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p></div>;
}

export default SongViewer;
