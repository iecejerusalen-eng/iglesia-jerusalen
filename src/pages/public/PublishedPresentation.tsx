import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Pause, Play } from 'lucide-react';
import { presentationService } from '../../features/presentations/services/presentationService';
import type { PresentationBlock, PresentationDocument } from '../../features/presentations/types';
import PresentationLayout from '../../components/presentation/PresentationLayout';

const youtubeId = (url: string) => url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/)?.[1] ?? null;
const vimeoId = (url: string) => url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null;

function Block({ block }: { block: PresentationBlock }) {
  const align = block.align === 'right' ? 'text-right' : block.align === 'center' ? 'text-center' : 'text-left';
  if (block.type === 'text') return <div className={`${align} ${block.size === 'xl' ? 'text-4xl font-black md:text-7xl' : block.size === 'lg' ? 'text-3xl font-bold md:text-5xl' : block.size === 'sm' ? 'text-base' : 'text-xl md:text-2xl'} leading-tight`} style={{ color: block.color || '#ffffff' }}>{block.content}</div>;
  if (block.type === 'image') return block.url ? <img src={block.url} alt={block.alt || ''} className="max-h-[48vh] w-full rounded-2xl object-cover shadow-2xl" /> : null;
  if (block.type === 'video') { const id = youtubeId(block.url || ''); const vimeo = vimeoId(block.url || ''); return id || vimeo ? <iframe src={id ? `https://www.youtube.com/embed/${id}` : `https://player.vimeo.com/video/${vimeo}`} title="Vídeo de la presentación" className="aspect-video w-full rounded-2xl" allow="autoplay; fullscreen; picture-in-picture" /> : <video src={block.url} controls className="aspect-video w-full rounded-2xl" />; }
  if (block.type === 'columns') return <div className="grid gap-5 md:grid-cols-2">{(block.columns || []).map((column, index) => <div key={`${column}-${index}`} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-lg leading-7 text-white/85 backdrop-blur-xl">{column}</div>)}</div>;
  if (block.type === 'shape') return <div className="mx-auto size-24 rounded-3xl" style={{ background: block.background || '#C79D3F' }} />;
  return <div className="h-px w-full bg-white/35" />;
}

export default function PublishedPresentation() {
  const [presentation, setPresentation] = useState<PresentationDocument | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { let active = true; const load = async () => { try { const data = await presentationService.getPublished(); if (active) setPresentation(data); } catch { if (active) setPresentation(null); } finally { if (active) setLoading(false); } }; void load(); return () => { active = false; }; }, []);
  useEffect(() => { if (!autoplay || !presentation) return undefined; const timer = window.setInterval(() => setSlideIndex((index) => index === presentation.slides.length - 1 ? 0 : index + 1), 8000); return () => window.clearInterval(timer); }, [autoplay, presentation]);
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white/60">Cargando presentación…</div>;
  if (!presentation || !presentation.slides.length) return <PresentationLayout />;
  const slide = presentation.slides[slideIndex];
  const fullscreen = () => { if (!window.document.fullscreenElement) void window.document.documentElement.requestFullscreen(); else void window.document.exitFullscreen(); };
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-5 text-white md:p-10" style={{ background: slide.background || '#0b1538' }}><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,157,63,.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,.22),transparent_35%)]" /><section className="relative z-10 w-full max-w-6xl"><header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300">{presentation.title}</p><p className="mt-1 text-sm text-white/60">{presentation.description}</p></div><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70">{slideIndex + 1} / {presentation.slides.length}</span></header><div className="mx-auto flex min-h-[58vh] max-w-5xl flex-col justify-center gap-5 rounded-[2rem] border border-white/10 bg-black/10 p-7 shadow-2xl backdrop-blur-sm md:p-14">{slide.blocks.map((block) => <Block key={block.id} block={block} />)}</div><footer className="mt-7 flex items-center justify-center gap-2"><button type="button" onClick={() => setSlideIndex((index) => Math.max(0, index - 1))} disabled={slideIndex === 0} className="rounded-xl border border-white/15 bg-white/10 p-3 disabled:opacity-30" aria-label="Diapositiva anterior"><ChevronLeft size={18} /></button><button type="button" onClick={() => setAutoplay((value) => !value)} className={`rounded-xl p-3 ${autoplay ? 'bg-amber-400 text-slate-950' : 'border border-white/15 bg-white/10'}`} aria-label="Reproducir automáticamente">{autoplay ? <Pause size={18} /> : <Play size={18} />}</button><button type="button" onClick={fullscreen} className="rounded-xl border border-white/15 bg-white/10 p-3" aria-label="Pantalla completa"><Maximize size={18} /></button><button type="button" onClick={() => setSlideIndex((index) => Math.min(presentation.slides.length - 1, index + 1))} disabled={slideIndex === presentation.slides.length - 1} className="rounded-xl bg-amber-400 p-3 text-slate-950 disabled:opacity-30" aria-label="Siguiente diapositiva"><ChevronRight size={18} /></button></footer></section></main>;
}
