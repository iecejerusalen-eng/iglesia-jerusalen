import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { AnimeZoomIn } from '../../../components/animations/AnimeWrappers';
import { X, Eye, EyeOff, Copy, ExternalLink, Info, PlayCircle, FileText, Printer, Maximize, Minimize, Hash, ArrowDownToLine, Volume2, VolumeX, Play, Square } from 'lucide-react';
import type { Song } from '../../../types';
import { htmlToBracketText, bracketTextToHtml, processBracketText, getOriginalKey, transposeNote } from '../utils/songUtils';
import { exportSongToPdf } from '../utils/songPdfExport';
import { useMetronome } from '../hooks/useMetronome';
import { toast } from 'sonner';

interface SongViewerProps {
  selectedSong: Song;
  setSelectedSong: (song: Song | null) => void;
  showChords: boolean;
  setShowChords: (show: boolean) => void;
  fontFamily: 'mono' | 'serif' | 'sans';
  setFontFamily: (font: 'mono' | 'serif' | 'sans') => void;
  activeTab: 'lyrics' | 'resources';
  setActiveTab: (tab: 'lyrics' | 'resources') => void;
}

export const SongViewer = ({
  selectedSong, setSelectedSong, showChords, setShowChords, 
  fontFamily, setFontFamily, activeTab, setActiveTab
}: SongViewerProps) => {
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [nashvilleMode, setNashvilleMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0);
  const [chordPosition, setChordPosition] = useState<'above' | 'inline'>('above');

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const { isPlaying: metronomePlaying, isMuted: metronomeMuted, currentBeat, togglePlay: toggleMetronome, toggleMute: toggleMetronomeMute } = useMetronome(selectedSong.bpm);

  const originalKey = (() => {
    let textToAnalyze;
    if (selectedSong.structure_blocks && selectedSong.structure_blocks.length > 0) {
      textToAnalyze = selectedSong.structure_blocks.map(b => b.lyrics).join('\n');
    } else {
      textToAnalyze = htmlToBracketText(selectedSong.lyrics);
    }
    return getOriginalKey(textToAnalyze);
  })();



  useEffect(() => {
    if (autoScrollSpeed > 0) {
      const scrollSpeedMap = { 1: 50, 2: 35, 3: 20, 4: 10, 5: 5 };
      scrollIntervalRef.current = window.setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += 1;
        }
      }, scrollSpeedMap[autoScrollSpeed as keyof typeof scrollSpeedMap]);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScrollSpeed]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = () => {
    exportSongToPdf(selectedSong, {
      transposeAmount,
      nashvilleMode,
      originalKey,
      showChords
    });
    toast.success('Generando PDF profesional...');
  };

  const copyChords = (song: Song) => {
    let result;
    if (song.structure_blocks && song.structure_blocks.length > 0) {
      result = song.structure_blocks.map(b => {
        let blockStr = `[${b.label.toUpperCase()}]\n`;
        if (b.melody) blockStr += `(Guía: ${b.melody})\n`;
        blockStr += `${processBracketText(b.lyrics, transposeAmount, nashvilleMode, originalKey)}\n`;
        return blockStr;
      }).join('\n');
    } else {
      result = processBracketText(htmlToBracketText(song.lyrics), transposeAmount, nashvilleMode, originalKey);
    }

    navigator.clipboard.writeText(result);
    toast.success('Letra y acordes copiados al portapapeles 🎸');
  };

  const copyOnlyLyrics = (song: Song) => {
    let result;
    if (song.structure_blocks && song.structure_blocks.length > 0) {
      result = song.structure_blocks.map(b => {
        let blockStr = `[${b.label.toUpperCase()}]\n`;
        const cleanLyrics = b.lyrics.replace(/\[([a-zA-Z0-9#/+\-.]+?)\]/g, '');
        blockStr += `${cleanLyrics}\n`;
        return blockStr;
      }).join('\n');
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = song.lyrics;
      temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation, ruby rt').forEach(el => el.remove());
      result = temp.textContent || '';
    }

    navigator.clipboard.writeText(result.trim());
    toast.success('Letra limpia copiada al portapapeles 🎤');
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-start justify-center p-0 md:p-4 md:pt-8 bg-slate-950/60 backdrop-blur-sm print:bg-white print:p-0 print:block">
      {/* Modal Backdrop overlay */}
      <div className="absolute inset-0" onClick={() => !isFullscreen && setSelectedSong(null)}></div>
      
      <AnimeZoomIn delay={0} duration={400} className={`relative w-full ${isFullscreen ? 'max-w-none h-full' : 'max-w-5xl h-[100dvh] md:h-auto max-h-[90vh]'} z-10 flex flex-col shadow-2xl overflow-hidden md:rounded-3xl bg-white dark:bg-slate-900 border-0 md:border border-gray-150 dark:border-white/10 print:border-none print:shadow-none print:max-h-none print:h-auto`}>
        <div className="flex-1 overflow-y-auto print:overflow-visible" ref={scrollContainerRef}>
          {/* Header block */}
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 relative print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-800 dark:text-white">{selectedSong.title}</h2>
                  {originalKey && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                      Tono Original: {originalKey}
                    </span>
                  )}
                </div>
                {selectedSong.artist && <p className="text-xs text-gray-400 dark:text-gray-450 font-bold">{selectedSong.artist}</p>}
                
                <div className="flex flex-wrap gap-2 mt-3 pt-1">
                  {selectedSong.song_types && (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold px-2.5 py-1 rounded-xl border border-amber-200/50 dark:border-amber-800/30 uppercase">{selectedSong.song_types.name}</span>
                  )}
                  {selectedSong.song_styles && (
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-extrabold px-2.5 py-1 rounded-xl border border-blue-200/50 dark:border-blue-800/30 uppercase">{selectedSong.song_styles.name}</span>
                  )}
                {selectedSong.bpm && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-0.5">
                      <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold font-mono">♩ {selectedSong.bpm} BPM</span>
                      
                      {/* Metronome Visual Indicator */}
                      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-300 dark:border-slate-600">
                        {metronomePlaying && (
                          <div className="flex gap-1 items-center mr-1">
                            {[1, 2, 3, 4].map((beat) => (
                              <div 
                                key={beat}
                                className={`w-2 h-2 rounded-full transition-all duration-75 ${
                                  currentBeat === beat 
                                    ? (beat === 1 ? 'bg-red-500 scale-125 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-green-500 scale-110 shadow-[0_0_5px_rgba(34,197,94,0.6)]') 
                                    : 'bg-gray-300 dark:bg-slate-700 scale-100'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        
                        <button 
                          onClick={toggleMetronome} 
                          className={`p-1 rounded-full transition-colors ${metronomePlaying ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 dark:hover:bg-slate-700'}`}
                          title={metronomePlaying ? "Detener metrónomo" : "Iniciar metrónomo"}
                        >
                          {metronomePlaying ? <Square size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                        </button>
                        
                        <button 
                          onClick={toggleMetronomeMute} 
                          className={`p-1 rounded-full transition-colors ${!metronomeMuted ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 dark:hover:bg-slate-700'}`}
                          title={metronomeMuted ? "Activar sonido" : "Silenciar sonido"}
                        >
                          {metronomeMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedSong.drum_style && (
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-xl border border-indigo-200/20">🥁 Batería: {selectedSong.drum_style}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto max-w-full justify-end">
                {/* Advanced Musician Controls Toolbar */}
                {selectedSong.has_chords && showChords && (
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-750 shadow-sm">
                    {/* Transposition */}
                    <div className="flex items-center">
                      <button 
                        onClick={() => setTransposeAmount(prev => prev - 1)}
                        className="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Bajar medio tono"
                      >
                        -½
                      </button>
                      <div className="px-2 flex flex-col items-center justify-center min-w-[3.5rem]" title="Resetear tono">
                        <span className="text-[10px] leading-tight font-extrabold text-amber-600 dark:text-amber-400">
                          {originalKey ? transposeNote(originalKey, transposeAmount) : (transposeAmount > 0 ? `+${transposeAmount}` : transposeAmount)}
                        </span>
                        {transposeAmount !== 0 && (
                          <button onClick={() => setTransposeAmount(0)} className="text-[8px] uppercase tracking-wider text-gray-400 hover:text-gray-600">Reset</button>
                        )}
                      </div>
                      <button 
                        onClick={() => setTransposeAmount(prev => prev + 1)}
                        className="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Subir medio tono"
                      >
                        +½
                      </button>
                    </div>

                    <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>

                    {/* Nashville Toggle */}
                    <button
                      onClick={() => setNashvilleMode(!nashvilleMode)}
                      className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                        nashvilleMode 
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' 
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      title="Sistema Nashville (Grados Numéricos)"
                    >
                      <Hash size={14} />
                    </button>

                    <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>

                    {/* Position Toggle */}
                    <button
                      onClick={() => setChordPosition(prev => prev === 'above' ? 'inline' : 'above')}
                      className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors uppercase tracking-wider"
                      title="Posición de Acordes"
                    >
                      {chordPosition === 'above' ? 'ARRIBA' : 'INLINE'}
                    </button>
                  </div>
                )}

                {/* Autoscroll */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl px-2 py-1 shadow-sm gap-1">
                  <ArrowDownToLine size={14} className="text-gray-400 mr-1" />
                  {[0, 1, 2, 3, 4, 5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setAutoScrollSpeed(speed)}
                      className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-md text-[9px] font-bold transition-all ${
                        autoScrollSpeed === speed 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {speed === 0 ? '■' : speed}
                    </button>
                  ))}
                </div>

                {/* Lyrics Font Selector */}
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as 'mono' | 'serif' | 'sans')}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm h-8"
                >
                  <option value="mono font-mono">Monospace</option>
                  <option value="serif font-serif">Serif</option>
                  <option value="sans font-sans">Sans</option>
                </select>

                {/* Utilities (Print, Fullscreen, Toggle Chords) */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-750 shadow-sm p-0.5 h-8">
                  <button onClick={handlePrint} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Imprimir">
                    <Printer size={14} />
                  </button>
                  
                  <button onClick={toggleFullscreen} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Pantalla Completa">
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  </button>

                  {selectedSong.has_chords && (
                    <button
                      onClick={() => setShowChords(!showChords)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xxs font-bold transition-all ml-1 ${
                        showChords
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {showChords ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span className="hidden md:inline">{showChords ? 'Acordes' : 'Sin acordes'}</span>
                    </button>
                  )}
                </div>

                {/* Close button */}
                <button 
                  onClick={() => setSelectedSong(null)} 
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs bar */}
            <div className="flex gap-4 mt-6 border-t border-gray-150 dark:border-white/5 pt-4">
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'lyrics'
                    ? 'border-gold text-amber-700 dark:text-gold'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'
                }`}
              >
                <FileText size={14} />
                <span>Letra y Partitura</span>
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer relative ${
                  activeTab === 'resources'
                    ? 'border-gold text-amber-700 dark:text-gold'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'
                }`}
              >
                <PlayCircle size={14} />
                <span>Recursos y Tutoriales</span>
                {selectedSong.resource_links && selectedSong.resource_links.length > 0 && (
                  <span className="absolute -top-1 -right-4 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                    {selectedSong.resource_links.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-4 md:p-6 pb-20 print:p-0 print:text-black">
            <style>{`
              .song-lyrics-wrapper.font-mono .song-lyrics {
                font-family: 'Courier New', Courier, monospace !important;
              }
              .song-lyrics-wrapper.font-serif .song-lyrics {
                font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
              }
              .song-lyrics-wrapper.font-sans .song-lyrics {
                font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              }
              .song-lyrics {
                font-size: 1rem;
                line-height: 2.3;
                white-space: pre-wrap;
                color: #1f2937;
              }
              .dark .song-lyrics {
                color: #d1d5db;
              }
              .song-lyrics h1 { font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; font-family: inherit; color: #111827; }
              .dark .song-lyrics h1 { color: #f9fafb; }
              .song-lyrics h2 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.3rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: inherit; }
              .dark .song-lyrics h2 { color: #9ca3af; }
              .song-lyrics h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.2rem; color: #9ca3af; font-style: italic; font-family: inherit; }
              .dark .song-lyrics h3 { color: #868e96; }
              .song-lyrics p { margin-bottom: 0.15rem; }
              
              /* Native ruby style */
              .song-lyrics ruby rt {
                font-size: 0.7rem;
                font-weight: 700;
                color: #dc2626;
                font-family: 'Inter', sans-serif;
              }
              .dark .song-lyrics ruby rt {
                color: #f87171;
              }
              .song-lyrics.hide-chords ruby rt {
                display: none;
              }
              }
              
              /* Chord annotation style (Above) */
              .song-lyrics.chords-above span.chord-annotation {
                position: relative;
                display: inline-block;
                background: rgba(220, 38, 38, 0.05);
                border-radius: 4px;
                padding: 0 1px;
                margin-top: 1.2rem;
              }
              .dark .song-lyrics.chords-above span.chord-annotation {
                background: rgba(248, 113, 113, 0.08);
              }
              .song-lyrics.chords-above span.chord-annotation::before {
                content: attr(data-chord);
                position: absolute;
                top: -1.3rem;
                left: -0.1rem;
                font-size: 0.85rem;
                font-weight: 800;
                color: #dc2626;
                font-family: 'Inter', sans-serif;
                line-height: 1;
                pointer-events: none;
                background: rgba(255, 255, 255, 0.8);
                padding: 0px 4px;
                border-radius: 4px;
              }
              .dark .song-lyrics.chords-above span.chord-annotation::before {
                color: #f87171;
                background: rgba(15, 23, 42, 0.8);
              }

              /* Chord node wrapper (Above) */
              .song-lyrics.chords-above span.chord-node-wrapper {
                display: inline-block;
                position: relative;
                width: 0;
                height: 0;
                overflow: visible;
                user-select: none;
              }
              .song-lyrics.chords-above span.chord-node-wrapper::before {
                content: attr(data-chord);
                position: absolute;
                bottom: 1.3rem;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.85rem;
                font-weight: 800;
                color: #dc2626;
                font-family: 'Inter', sans-serif;
                line-height: 1;
                pointer-events: none;
                white-space: nowrap;
                background: rgba(255, 255, 255, 0.8);
                padding: 0px 4px;
                border-radius: 4px;
              }
              .dark .song-lyrics.chords-above span.chord-node-wrapper::before {
                color: #f87171;
                background: rgba(15, 23, 42, 0.8);
              }

              /* Inline Chords */
              .song-lyrics.chords-inline span.chord-annotation,
              .song-lyrics.chords-inline span.chord-node-wrapper {
                position: static;
                display: inline;
                margin: 0;
                padding: 0;
                width: auto;
                height: auto;
              }
              .song-lyrics.chords-inline span.chord-annotation::before,
              .song-lyrics.chords-inline span.chord-node-wrapper::before {
                content: '[' attr(data-chord) ']';
                position: static;
                transform: none;
                font-size: 0.9em;
                font-weight: 800;
                color: #dc2626;
                font-family: 'Inter', sans-serif;
                background: rgba(220, 38, 38, 0.1);
                padding: 0px 4px;
                border-radius: 4px;
                margin: 0 4px;
              }
              .dark .song-lyrics.chords-inline span.chord-annotation::before,
              .dark .song-lyrics.chords-inline span.chord-node-wrapper::before {
                color: #fca5a5;
                background: rgba(248, 113, 113, 0.15);
              }

              /* Hide chords */
              .song-lyrics.hide-chords span.chord-annotation::before,
              .song-lyrics.hide-chords span.chord-node-wrapper::before {
                display: none;
              }
              .song-lyrics.hide-chords span.chord-annotation {
                margin-top: 0;
                background: none;
                padding: 0;
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                .song-lyrics-wrapper, .song-lyrics-wrapper * {
                  visibility: visible;
                }
                .song-lyrics-wrapper {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  color: black !important;
                }
                .song-lyrics {
                  color: black !important;
                  font-size: 14pt !important;
                  line-height: 1.5 !important;
                }
                .song-lyrics span.chord-node-wrapper::before,
                .song-lyrics span.chord-annotation::before {
                  color: #333 !important;
                  font-size: 11pt !important;
                  font-weight: bold !important;
                }
                .dark .song-lyrics span.chord-node-wrapper::before,
                .dark .song-lyrics span.chord-annotation::before {
                   color: #333 !important;
                }
              }
            `}</style>

            {activeTab === 'lyrics' ? (
              /* LYRICS TAB */
              <div className="space-y-6">
                {/* Print Title (Visible only in print) */}
                <div className="hidden print:block mb-8 text-center border-b pb-4">
                  <h1 className="text-3xl font-bold font-serif m-0">{selectedSong.title}</h1>
                  {selectedSong.artist && <h2 className="text-lg text-gray-600 m-0 mt-1">{selectedSong.artist}</h2>}
                  <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500">
                    {originalKey && <span>Tono: {transposeAmount !== 0 ? transposeNote(originalKey, transposeAmount) : originalKey}</span>}
                    {selectedSong.bpm && <span>♩ {selectedSong.bpm}</span>}
                  </div>
                </div>

                {/* Copy Buttons Panel */}
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => copyChords(selectedSong)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-gold border border-amber-250/20 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-2xs"
                  >
                    <Copy size={11} />
                    <span>Copiar con acordes</span>
                  </button>
                  <button
                    onClick={() => copyOnlyLyrics(selectedSong)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-2xs"
                  >
                    <Copy size={11} />
                    <span>Copiar solo letra</span>
                  </button>
                </div>

                <div className={`song-lyrics-wrapper font-${fontFamily}`}>
                  {selectedSong.structure_blocks && selectedSong.structure_blocks.length > 0 ? (
                    /* STRUCTURED RENDERING */
                    <div className="space-y-6">
                      {selectedSong.structure_blocks.map((block) => (
                        <div 
                          key={block.id} 
                          className="border border-slate-100 dark:border-white/5 rounded-3xl p-5 bg-slate-50/30 dark:bg-slate-950/10 space-y-3"
                        >
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
                              block.type === 'coro'
                                ? 'bg-amber-55 dark:bg-amber-950/40 text-amber-800 dark:text-gold border-amber-300/30'
                                : block.type === 'intro'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200/30'
                            }`}>
                              {block.label}
                            </span>
                            {block.melody && (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-0.5 rounded-lg border border-indigo-200/20 flex items-center gap-1" title="Guía de notas">
                                <Info size={10} /> {block.melody}
                              </span>
                            )}
                          </div>
                          <div 
                            className={`song-lyrics ${!showChords ? 'hide-chords' : ''}`}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bracketTextToHtml(block.lyrics, transposeAmount, nashvilleMode, originalKey)) }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* LEGACY HTML RENDERING */
                    <div
                      className={`song-lyrics ${!showChords ? 'hide-chords' : ''}`}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bracketTextToHtml(htmlToBracketText(selectedSong.lyrics || ''), transposeAmount, nashvilleMode, originalKey) || '<p class="text-gray-400 italic">Sin letra disponible</p>') }}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* RESOURCES AND TUTORIALS TAB */
              <div className="space-y-4">
                {!selectedSong.resource_links || selectedSong.resource_links.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 p-12 rounded-3xl text-center space-y-2">
                    <PlayCircle className="mx-auto text-gray-300 dark:text-slate-850" size={36} />
                    <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Sin recursos</h5>
                    <p className="text-xxs text-gray-450 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                      No hay tutoriales o grabaciones de ensayo subidas para esta alabanza.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedSong.resource_links.map((link) => (
                      <div 
                        key={link.id} 
                        className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-2xl shadow-2xs hover:shadow-xs hover:border-gold/30 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                              link.instrument === 'Batería'
                                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/30'
                                : link.instrument === 'Piano'
                                ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200/30'
                                : link.instrument === 'Guitarra' || link.instrument === 'Bajo'
                                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/30'
                                : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-gray-300 border-slate-200/30'
                            }`}>
                              {link.instrument}
                            </span>
                            <PlayCircle size={14} className="text-gray-350 group-hover:text-amber-600 transition-colors" />
                          </div>
                          {link.comment && (
                            <p className="text-xxs text-gray-650 dark:text-gray-300 leading-normal font-semibold">
                              {link.comment}
                            </p>
                          )}
                        </div>

                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-amber-700 hover:text-amber-800 dark:text-gold dark:hover:text-yellow-300 font-extrabold uppercase tracking-wide flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                        >
                          <span>Ver referencia</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimeZoomIn>
    </div>
  );
};
