import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHURCH_LOCATION } from '../../../components/map/churchLocation';
import { ANNIVERSARY_PROMO_END, isAnniversaryPromoActive } from '../utils';

export default function AnniversaryHomeBanner() {
  const [isVisible, setIsVisible] = useState(() => isAnniversaryPromoActive());

  useEffect(() => {
    if (!isVisible) return undefined;
    const timeout = window.setTimeout(() => setIsVisible(false), Math.max(0, ANNIVERSARY_PROMO_END - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <section aria-labelledby="anniversary-home-title" className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-8 md:pt-8">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-amber-300/25 bg-[#0b1d3b] px-5 py-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.7)] sm:px-8 sm:py-7 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_10%,rgba(199,157,63,.22),transparent_32%),linear-gradient(115deg,transparent_30%,rgba(255,255,255,.035))]" />
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.17em] text-amber-200">
            <Sparkles size={13} aria-hidden="true" /> 65.º aniversario
          </p>
          <h2 id="anniversary-home-title" className="mt-3 font-serif text-2xl font-black leading-tight tracking-tight sm:text-3xl">Celebremos juntos nuestra historia de fe</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-6 text-blue-100/85">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" /> Domingo 25 de octubre · preludio 08:45 · culto 09:00</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" /> Milagro, Ecuador</span>
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:mt-0 lg:shrink-0">
          <Link to="/aniversario-65" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1d3b]">
            Conoce la celebración <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Cómo llegar <MapPin size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
