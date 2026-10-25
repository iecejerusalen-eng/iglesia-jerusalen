import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHURCH_LOCATION } from '../../components/map/churchLocation';

const GALLERY = [
  {
    src: '/images/cuadrangular/jerusalen.webp',
    alt: 'Fachada actual de la Iglesia Evangélica Cuadrangular Jerusalén en Milagro',
    label: 'Nuestra casa en Milagro',
  },
  {
    src: '/images/church-welcome-fallback.webp',
    alt: 'Representación digital de la fachada de Iglesia Jerusalén',
    label: 'Una representación de nuestra fachada',
  },
] as const;

const ANNIVERSARY_SHARE_TEXT = 'Hoy celebramos 65 años de Iglesia Jerusalén. Damos gracias a Dios por cada persona que forma parte de esta comunidad. ¡Te esperamos el domingo 25 de octubre! Preludio 08:45, culto 09:00. Baquerizo Moreno entre Av. Colón y Tulcán, Milagro.';

export default function Anniversary65() {
  const [activeImage, setActiveImage] = useState(0);
  const image = GALLERY[activeImage];
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${ANNIVERSARY_SHARE_TEXT} ${window.location.origin}/aniversario-65`)}`;

  const moveImage = (direction: -1 | 1) => {
    setActiveImage((current) => (current + direction + GALLERY.length) % GALLERY.length);
  };

  return (
    <>
      <Helmet>
        <title>65.º aniversario | Iglesia Jerusalén</title>
        <meta name="description" content="Celebremos 65 años de Iglesia Jerusalén. Domingo 25 de octubre de 2026: preludio a las 08:45 y culto a las 09:00 en Milagro." />
        <meta property="og:title" content="65.º aniversario | Iglesia Jerusalén" />
        <meta property="og:description" content="Testigos fieles en nuestra comunidad y hasta los confines de la tierra." />
        <meta property="og:image" content={`${window.location.origin}/images/cuadrangular/jerusalen.webp`} />
      </Helmet>

      <main className="overflow-hidden bg-[#f8fafc] text-slate-950 dark:bg-slate-950 dark:text-white">
        <section aria-labelledby="anniversary-title" className="relative isolate">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(199,157,63,.14),transparent_28%),radial-gradient(circle_at_90%_35%,rgba(30,58,138,.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(199,157,63,.1),transparent_28%),radial-gradient(circle_at_90%_35%,rgba(30,58,138,.22),transparent_34%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-12 lg:pb-24">
            <div>
              <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-blue-900 transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:text-blue-200 dark:hover:text-amber-200">
                <ArrowLeft size={16} aria-hidden="true" /> Volver al inicio
              </Link>
              <p className="mt-9 inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-100/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-900 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-200">
                <Sparkles size={14} aria-hidden="true" /> 65.º aniversario · Milagro, Ecuador
              </p>
              <h1 id="anniversary-title" className="mt-6 max-w-3xl font-serif text-4xl font-black leading-[1.02] tracking-tight text-[#10274a] dark:text-white sm:text-6xl lg:text-7xl">
                Testigos fieles <span className="text-blue-800 dark:text-blue-300">en nuestra comunidad</span> y hasta los confines de la tierra.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                Damos gracias a Dios por este aniversario y por cada persona que comparte la vida de Iglesia Jerusalén.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 dark:bg-blue-400 dark:text-slate-950 dark:hover:bg-blue-300">
                  Compartir un agradecimiento <Share2 size={16} aria-hidden="true" />
                </a>
                <a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 text-sm font-bold text-slate-800 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  Cómo llegar <MapPin size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="relative">
              <figure className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_30px_80px_-35px_rgba(15,23,42,.55)] dark:border-white/10 dark:bg-slate-900">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img key={image.src} src={image.src} alt={image.alt} width={1200} height={800} sizes="(max-width: 1024px) 100vw, 45vw" fetchPriority="high" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-5 pb-5 pt-16 text-white sm:px-7 sm:pb-7">
                    <figcaption className="font-serif text-xl font-bold sm:text-2xl">{image.label}</figcaption>
                    <p className="mt-1 text-xs text-white/75">Un lugar para crecer, servir y encontrarnos.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4">
                  <button type="button" onClick={() => moveImage(-1)} aria-label="Imagen anterior" className="grid size-11 place-items-center rounded-full border border-slate-200 text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                  <p aria-live="polite" className="text-xs font-bold text-slate-500 dark:text-slate-300">{activeImage + 1} de {GALLERY.length} · {image.label}</p>
                  <button type="button" onClick={() => moveImage(1)} aria-label="Imagen siguiente" className="grid size-11 place-items-center rounded-full border border-slate-200 text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </figure>
            </div>
          </div>
        </section>

        <section aria-labelledby="anniversary-event-title" className="border-y border-slate-200 bg-white/75 dark:border-white/10 dark:bg-white/[.03]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.75fr_1.25fr] lg:items-center lg:px-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-800 dark:text-amber-300">Nos reunimos</p>
              <h2 id="anniversary-event-title" className="mt-2 font-serif text-3xl font-black text-[#10274a] dark:text-white sm:text-4xl">Domingo, 25 de octubre</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <CalendarDays size={20} className="mt-0.5 shrink-0 text-blue-800 dark:text-blue-300" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="block text-slate-950 dark:text-white">Preludio · 08:45</strong>Inicio del encuentro.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <CalendarDays size={20} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="block text-slate-950 dark:text-white">Culto · 09:00</strong>Celebración del aniversario.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2 dark:bg-slate-900">
                <MapPin size={20} className="mt-0.5 shrink-0 text-blue-800 dark:text-blue-300" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200"><strong className="block text-slate-950 dark:text-white">Iglesia Jerusalén</strong>{CHURCH_LOCATION.address}</p>
                <a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-black text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:text-blue-200 dark:hover:bg-white/5">Mapa <ArrowRight size={14} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="anniversary-share-title" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="flex flex-col gap-5 rounded-[1.75rem] bg-[#10274a] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-9">
            <div>
              <h2 id="anniversary-share-title" className="font-serif text-2xl font-black sm:text-3xl">Una celebración que se comparte</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">Envía una nota de gratitud a alguien que forma parte de esta comunidad.</p>
            </div>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10274a]">
              Compartir por WhatsApp <Share2 size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-400">“Testigos fieles en nuestra comunidad y hasta los confines de la tierra.”</p>
        </section>
      </main>
    </>
  );
}
