import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpenText,
  Compass,
  Globe2,
  HeartHandshake,
  Landmark,
  Sparkles,
  Users,
} from 'lucide-react';
import pastorCouplePhoto from '../../../assets/Jerusalén/Pastores.jpg';
import missionArchivePhoto from '../../../assets/Imágenes Cuadrangular/Imagen Aime Semple Mcpherson.webp';

interface PremiumAboutHeroProps {
  title: string;
  subtitle: string;
  notice?: string | null;
  coverImage?: string | null;
}

interface Tilt {
  x: number;
  y: number;
}

const journey = [
  { label: 'Local', detail: 'Nuestra casa', icon: Landmark },
  { label: 'Ecuador', detail: 'Nuestra nación', icon: Compass },
  { label: 'Mundo', detail: 'Nuestra misión', icon: Globe2 },
] as const;

export default function PremiumAboutHero({ title, subtitle, notice, coverImage }: PremiumAboutHeroProps) {
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });
  const [failedCoverImage, setFailedCoverImage] = useState<string | null>(null);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const imageSrc = coverImage && failedCoverImage !== coverImage ? coverImage : pastorCouplePhoto;

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  };

  const handleImageError = () => {
    if (coverImage && imageSrc === coverImage) {
      console.error('No se pudo cargar la imagen personalizada del hero de Nosotros. Se usará la imagen local de respaldo.', { imageSrc });
      setFailedCoverImage(coverImage);
      return;
    }

    console.error('No se pudo cargar la imagen local de respaldo del hero de Nosotros.', { imageSrc });
    setImageUnavailable(true);
  };

  return (
    <section
      id="nosotros-hero"
      aria-labelledby="about-hero-title"
      className="relative isolate mb-16 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-50 px-5 py-8 shadow-[0_30px_90px_-48px_rgba(15,23,42,.65)] dark:border-white/10 dark:bg-[#050b1c] sm:px-8 sm:py-10 lg:mb-20 lg:px-12 lg:py-12"
    >
      <div className="pointer-events-none absolute -left-28 -top-32 size-80 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-400/10" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 size-[34rem] rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/10" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.7),transparent_42%,rgba(224,231,255,.38))] dark:bg-[linear-gradient(115deg,rgba(8,21,49,.86),transparent_48%,rgba(30,41,91,.34))]" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[.86fr_1.14fr] lg:gap-8 xl:gap-14">
        <div className="order-2 max-w-2xl lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-white/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 shadow-sm backdrop-blur-xl dark:border-amber-300/20 dark:bg-white/[0.06] dark:text-amber-200">
            <HeartHandshake size={14} aria-hidden="true" />
            Nuestra identidad
          </div>

          <h1 id="about-hero-title" className="mt-6 max-w-xl text-balance font-serif text-4xl font-bold leading-[1.02] tracking-tight text-slate-950 dark:text-white sm:text-6xl xl:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            {subtitle}
          </p>
          {notice && <p className="mt-4 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">{notice}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#historia"
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-amber-400 dark:text-slate-950 dark:shadow-amber-400/10 dark:hover:bg-amber-300 dark:focus-visible:ring-offset-[#050b1c]"
            >
              Explorar nuestra historia
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href="#liderazgo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-5 py-3 text-sm font-bold text-slate-800 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10 dark:focus-visible:ring-offset-[#050b1c]"
            >
              Conocer a quienes sirven
            </a>
          </div>

          <div className="mt-9 grid max-w-xl grid-cols-3 border-y border-slate-200/80 py-4 dark:border-white/10">
            {journey.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className={`relative px-2 first:pl-0 ${index > 0 ? 'border-l border-slate-200/80 dark:border-white/10' : ''}`}>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
              </div>
            ))}
          </div>

          <a href="#historia" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-indigo-700 dark:text-slate-400 dark:hover:text-amber-300">
            <ArrowDown size={14} aria-hidden="true" />
            Una historia que todavía se está escribiendo
          </a>
        </div>

        <div
          className="order-1 relative mx-auto min-h-[390px] w-full max-w-[560px] lg:order-2 lg:min-h-[500px]"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          style={{ perspective: '1200px' }}
          aria-label="Composición visual de la familia y la misión de la Iglesia Jerusalén"
        >
          <div className="absolute inset-[8%_5%_5%] rounded-[2.5rem] border border-indigo-300/30 bg-indigo-950/5 shadow-inner dark:border-indigo-300/10 dark:bg-indigo-400/[0.04]" />
          <div className="absolute inset-x-[14%] bottom-[8%] h-16 rounded-full bg-indigo-950/15 blur-2xl dark:bg-black/50" />

          <div
            className="absolute inset-[7%_8%_5%] transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `rotateX(${tilt.y * -3}deg) rotateY(${tilt.x * 4}deg)` }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-[2.4rem] border border-white/70 bg-slate-900 shadow-[0_35px_70px_-32px_rgba(15,23,42,.8)] dark:border-white/15">
              {!imageUnavailable ? (
                <img
                  src={imageSrc}
                  alt="Familia pastoral de la Iglesia Jerusalén"
                  className="h-full w-full object-cover object-center transition duration-700"
                  loading="eager"
                  fetchPriority="high"
                  onError={handleImageError}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 text-center text-white">
                  <div><HeartHandshake className="mx-auto text-amber-300" size={42} aria-hidden="true" /><p className="mt-3 text-sm font-semibold">Una familia que sirve con propósito</p></div>
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_36%,rgba(2,8,23,.08)_56%,rgba(2,8,23,.9)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300"><Sparkles size={13} aria-hidden="true" /> Comunidad con propósito</div>
                <p className="mt-2 max-w-xs font-serif text-2xl font-bold leading-tight sm:text-3xl">La fe se vuelve hogar cuando la vivimos juntos.</p>
              </div>
            </div>

            <div className="absolute -left-8 top-[12%] hidden w-40 -rotate-6 overflow-hidden rounded-2xl border border-white/70 bg-white p-1.5 shadow-2xl dark:border-white/15 dark:bg-slate-900 sm:block">
              <img src={missionArchivePhoto} alt="Archivo histórico de la misión cuadrangular" className="aspect-[4/3] w-full rounded-xl object-cover grayscale" loading="lazy" />
              <div className="px-1.5 pb-1 pt-2"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-600">Raíces</p><p className="mt-1 text-[11px] font-bold leading-4 text-slate-700 dark:text-slate-200">Una misión que cruza generaciones</p></div>
            </div>

            <div className="absolute -right-7 top-[8%] flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950"><Users size={16} aria-hidden="true" /></span>
              <span><strong className="block text-xs text-slate-900 dark:text-white">Todas las generaciones</strong><span className="text-[10px] text-slate-500 dark:text-slate-400">Un mismo hogar de fe</span></span>
            </div>

            <div className="absolute -bottom-5 -right-5 rounded-2xl border border-white/70 bg-slate-950 px-4 py-3 text-white shadow-2xl dark:border-white/15 sm:-right-8">
              <div className="flex items-center gap-2"><BookOpenText size={15} className="text-amber-300" aria-hidden="true" /><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Identidad viva</span></div>
              <p className="mt-1 text-xs font-bold">Jesús al centro</p>
            </div>
          </div>

          <div className="absolute bottom-[2%] left-[4%] hidden items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-2 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 sm:flex">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.12)]" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Una iglesia cercana y activa</span>
          </div>
        </div>
      </div>
    </section>
  );
}
