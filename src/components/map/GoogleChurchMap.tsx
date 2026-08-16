import { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Copy, Check, Compass, Share2, Church, Car } from 'lucide-react';
import { toast } from 'sonner';
import { CHURCH_LOCATION as SHARED_CHURCH_LOCATION } from './churchLocation';

const CHURCH_LOCATION = SHARED_CHURCH_LOCATION;

interface GoogleChurchMapProps {
  height?: string;
  className?: string;
}

export const GoogleChurchMap = ({ height = '500px', className = '' }: GoogleChurchMapProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(CHURCH_LOCATION.address);
    setCopied(true);
    toast.success('¡Dirección copiada al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: CHURCH_LOCATION.name,
        text: `Ubicación de ${CHURCH_LOCATION.name}: ${CHURCH_LOCATION.address}`,
        url: CHURCH_LOCATION.googleMapsUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(CHURCH_LOCATION.googleMapsUrl);
      toast.success('¡Enlace de ubicación copiado!');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl transition-all font-sans ${className}`}>
      
      {/* Header Info Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 md:p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Church className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {CHURCH_LOCATION.name}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Milagro, Ecuador
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{CHURCH_LOCATION.address}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            onClick={handleCopyAddress}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200/60 dark:border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar Dirección'}</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200/60 dark:border-white/10"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>

          <a
            href={CHURCH_LOCATION.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
          >
            <Navigation className="w-4 h-4" />
            <span>Abrir en Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={CHURCH_LOCATION.wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md transition"
            title="Navegar con Waze"
          >
            <Car className="w-4 h-4" />
            <span>Waze</span>
          </a>
        </div>
      </div>

      {/* Embedded Google Maps Container */}
      <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-950" style={{ height }}>
        <iframe
          title="Google Map Iglesia Cuadrangular Jerusalen Milagro"
          src={CHURCH_LOCATION.embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full filter contrast-[1.02]"
        />

        {/* Glassmorphic floating hint overlay */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 border border-white/20 text-white backdrop-blur-md px-4 py-2 rounded-2xl text-xs shadow-xl pointer-events-none">
          <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span>Iglesia Jerusalén · Baquerizo Moreno entre Av. Colón y Tulcán</span>
        </div>
      </div>
    </div>
  );
};
