import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { Tv, Music, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { getYoutubeId } from '../utils';
import BlockRenderer from '../../../components/public/BlockRenderer';
import FloatingElements from '../../../components/public/FloatingElements';
import MagneticButton from '../../../components/animations/MagneticButton';
import { AnimeParallax, AnimeFloat, AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import fachadaImage from '../../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import type { Song } from '../../../types';
import { useLiveModeStore } from '../../../store/useLiveModeStore';
import type { PageSection } from '../types';

interface HeroSectionProps {
  sectionData: PageSection;
}

export const HeroSection = ({ sectionData }: HeroSectionProps) => {
  const { isLiveModeActive, liveYoutubeUrl, liveAnnouncement, activeSongId } = useLiveModeStore();
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [liveSongFont, setLiveSongFont] = useState<'mono' | 'serif' | 'sans'>('mono');
  const [showLiveChords, setShowLiveChords] = useState(true);

  const { subtitle, content_blocks } = sectionData;

  useEffect(() => {
    const fetchActiveSong = async () => {
      if (!activeSongId) {
        setActiveSong(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('id', activeSongId)
          .maybeSingle();
        if (!error && data) {
          setActiveSong(data);
        } else {
          setActiveSong(null);
        }
      } catch (err) {
        console.error('Error fetching active song:', err);
        setActiveSong(null);
      }
    };
    fetchActiveSong();
  }, [activeSongId]);

  if (isLiveModeActive) {
    const liveYtId = getYoutubeId(liveYoutubeUrl);
    return (
      <section id="hero" className="bg-slate-950 text-white py-12 px-4 md:px-8 border-b border-slate-900">
        <style>{`
          .live-song-lyrics-wrapper.font-mono {
            font-family: 'Courier New', Courier, monospace !important;
          }
          .live-song-lyrics-wrapper.font-serif {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
          }
          .live-song-lyrics-wrapper.font-sans {
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          }
          .live-song-lyrics {
            font-size: 0.95rem;
            line-height: 2;
            white-space: pre-wrap;
          }
          .live-song-lyrics h1 { font-size: 1.3rem; font-weight: 800; margin: 0.8rem 0 0.4rem; color: #fbbf24; }
          .live-song-lyrics h2 { font-size: 1.1rem; font-weight: 700; margin: 0.8rem 0 0.2rem; color: #94a3b8; text-transform: uppercase; }
          .live-song-lyrics h3 { font-size: 0.95rem; font-weight: 600; margin: 0.4rem 0 0.1rem; color: #64748b; font-style: italic; }
          .live-song-lyrics p { margin-bottom: 0.15rem; }
          
          .live-song-lyrics ruby rt {
            font-size: 0.65rem;
            font-weight: 700;
            color: #f87171;
            font-family: 'Inter', sans-serif;
          }
          .live-song-lyrics.hide-chords ruby rt { display: none; }
          .live-song-lyrics.hide-chords ruby { background: none; }
          
          .live-song-lyrics span.chord-annotation {
            position: relative;
            display: inline-block;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 2px;
            padding: 0 1px;
            margin-top: 1.1rem;
          }
          .live-song-lyrics span.chord-annotation::before {
            content: attr(data-chord);
            position: absolute;
            top: -1.1rem;
            left: 0;
            font-size: 0.7rem;
            font-weight: 700;
            color: #f87171;
            font-family: 'Inter', sans-serif;
            line-height: 1;
            pointer-events: none;
          }
          .live-song-lyrics.hide-chords span.chord-annotation::before { display: none; }
          .live-song-lyrics.hide-chords span.chord-annotation {
            margin-top: 0;
            background: none;
            padding: 0;
          }
          
          .live-song-lyrics span.chord-node {
            display: inline-block;
            position: relative;
            width: 0;
            height: 0;
            overflow: visible;
            user-select: none;
          }
          .live-song-lyrics span.chord-node::before {
            content: attr(data-chord);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.7rem;
            font-weight: 800;
            color: #f87171;
            font-family: 'Inter', sans-serif;
            line-height: 1;
            pointer-events: none;
            white-space: nowrap;
          }
          .live-song-lyrics.hide-chords span.chord-node::before { display: none; }
        `}</style>

        <div className="max-w-7xl mx-auto space-y-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/25 px-4 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <Tv size={12} />
                  Culto En Vivo
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white">
                Transmisión Especial de Hoy
              </h1>
            </div>

            <div className="text-slate-400 text-xs">
              ¿Quieres tomar notas personales? Dirígete a la sección de <Link to="/predicas" className="text-amber-400 font-bold hover:underline">Prédicas</Link>.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

            <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
              <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                {liveYtId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${liveYtId}?autoplay=1`}
                    title="YouTube Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 p-6 text-center">
                    <Tv size={48} className="text-slate-600 dark:text-gray-400" />
                    <span className="font-bold text-sm">Transmisión no iniciada</span>
                    <p className="text-xs text-slate-500 dark:text-gray-450 max-w-xs">La señal en vivo comenzará pronto. Por favor espera unos momentos.</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden relative flex items-center shadow-xs">
                <span className="bg-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 mr-4">
                  Avisos
                </span>
                <div className="relative flex-1 overflow-hidden h-5">
                  <div className="absolute animate-marquee whitespace-nowrap text-sm font-medium text-slate-300">
                    {liveAnnouncement || '¡Bienvenidos al servicio de hoy! Te invitamos a adorar a Dios con nosotros y tomar tus apuntes.'}
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes marquee {
                  0% { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                  animation: marquee 25s linear infinite;
                }
              `}</style>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Music size={16} className="text-amber-500" />
                    <span className="font-bold text-xs uppercase tracking-wider">Letra en Vivo</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={liveSongFont}
                      onChange={(e) => setLiveSongFont(e.target.value as 'mono' | 'serif' | 'sans')}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded px-1.5 py-1 outline-none cursor-pointer"
                    >
                      <option value="mono">Mono</option>
                      <option value="serif">Serif</option>
                      <option value="sans">Sans</option>
                    </select>

                    {activeSong?.has_chords && (
                      <button
                        onClick={() => setShowLiveChords(!showLiveChords)}
                        className={`p-1 rounded cursor-pointer transition-all ${showLiveChords ? 'bg-amber-600/20 text-amber-400 border border-amber-500/35' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        title={showLiveChords ? 'Ocultar acordes' : 'Mostrar acordes'}
                      >
                        {showLiveChords ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {activeSong ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-100 text-left">{activeSong.title}</h3>
                      {activeSong.artist && (
                        <p className="text-xs text-slate-450 font-medium text-left">{activeSong.artist}</p>
                      )}
                    </div>

                    <div className={`live-song-lyrics-wrapper font-${liveSongFont} max-h-[300px] overflow-y-auto pr-1 text-left`}>
                      <div
                        className={`live-song-lyrics text-slate-350 ${!showLiveChords ? 'hide-chords' : ''}`}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeSong.lyrics || '<p class="text-slate-500 italic">Cargando letra...</p>') }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-550 space-y-3">
                    <Music size={32} className="text-slate-700 animate-pulse" />
                    <p className="text-xs font-semibold max-w-[200px] leading-normal text-slate-400">
                      Alabanza congregacional activa. Esperando que el director de alabanza sincronice la letra...
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 mt-4 text-[10px] text-slate-500 leading-normal text-left">
                * Las letras y acordes se actualizan automáticamente en tiempo real para que toda la congregación cante en unidad.
              </div>
            </div>

          </div>

        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center bg-[#071330] text-white overflow-hidden py-24 transition-colors duration-300">
        <FloatingElements />
        
        {/* Immersive Background Particles & Glows */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimeParallax
            src={fachadaImage}
            alt="Fachada de la Iglesia Jerusalén"
            className="filter brightness-[0.7] contrast-[1.05]"
          />

          <AnimeFloat
            x={[-30, 60]}
            y={[-15, 45]}
            duration={25000}
            className="absolute top-1/4 left-1/4 w-[380px] h-[380px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none"
          >
          </AnimeFloat>
          <AnimeFloat
            x={[30, -50]}
            y={[20, -30]}
            duration={28000}
            className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full bg-amber-500/8 blur-[150px] pointer-events-none"
          >
          </AnimeFloat>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, rgba(7, 19, 48, 0.7) 60%, rgba(7, 19, 48, 0.98) 100%)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071330] via-[#071330]/50 to-transparent pointer-events-none" />
        </div>

        {/* Cascading Typography Content */}
        <AnimeStaggerGrid className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 flex flex-col items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-500 border border-amber-500/40 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/5 backdrop-blur-xs select-none">
              <Sparkles size={14} className="text-amber-500 animate-spin-slow" />
              <span>{subtitle || 'Una Casa de Restauración y Bendición'}</span>
            </div>
          </div>

          <div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto drop-shadow-md">
              Bienvenido a la <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 font-extrabold drop-shadow-[0_4px_12px_rgba(217,119,6,0.25)]">
                Iglesia Jerusalén
              </span>
            </h1>
          </div>

          {content_blocks && content_blocks.length > 0 ? (
            <div className="w-full max-w-3xl">
              <div className="text-left bg-slate-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                <BlockRenderer blocks={content_blocks} />
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-slate-250 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light font-sans tracking-wide">
                  Somos una congregación de la Iglesia del Evangelio Cuadrangular comprometida con esparcir la Palabra hasta los confines de la tierra, ministrar a las familias y servir a nuestra comunidad.
                </p>
              </div>

              <div className="w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full sm:w-auto">
                  <MagneticButton>
                    <Link
                      to="/nosotros"
                      className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Conócenos
                    </Link>
                  </MagneticButton>
                  
                  <MagneticButton>
                    <a
                      href="#schedules"
                      className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-2xl font-bold backdrop-blur-md transition-all text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      Horarios de Servicio
                      <ArrowRight size={16} className="text-amber-500 animate-pulse" />
                    </a>
                  </MagneticButton>
                </div>
              </div>
            </>
          )}
        </AnimeStaggerGrid>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 w-full pointer-events-none z-0">
          <svg className="w-full h-full text-slate-50 dark:text-slate-950 fill-current" viewBox="0 0 1440 74" preserveAspectRatio="none">
            <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,74L1320,74C1200,74,960,74,720,74C480,74,240,74,120,74L0,74Z"></path>
          </svg>
        </div>
      </section>
    </div>
  );
};
