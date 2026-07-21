import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import {
  Globe2,
  Target,
  Users,
  Church,
  ArrowRight,
  Heart,
  Compass,
  ChevronRight,
  HandHeart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
import { Globe } from '@/components/ui/globe';
import { type COBEOptions } from 'cobe';

export interface MissionPoint {
  id: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  title: string;
  leader: string;
  description: string;
  activeProjects: number;
  members: string;
  color?: string;
}

const MISSION_LOCATIONS: MissionPoint[] = [
  {
    id: 'ecuador',
    country: 'Ecuador',
    flag: '🇪🇨',
    lat: -0.1807,
    lng: -78.4678,
    title: 'Células de Crecimiento & Misión Urbana',
    leader: 'Pr. Esteban Corina & Marlene de Corina',
    description: 'Nuestra sede central en Milagro coordinando obras de discipulado, comedores comunitarios y escuelas dominicales en Guayas, Pichincha y Manabí.',
    activeProjects: 4,
    members: '450+',
  },
  {
    id: 'colombia',
    country: 'Colombia',
    flag: '🇨🇴',
    lat: 4.7110,
    lng: -74.0721,
    title: 'Plantación Misionera Bogotá & Cali',
    leader: 'Misionero Carlos Rodríguez',
    description: 'Red de apoyo social y formación bíblica para niños y familias vulnerables en sectores periféricos de Bogotá y Cali.',
    activeProjects: 2,
    members: '180+',
  },
  {
    id: 'peru',
    country: 'Perú',
    flag: '🇵🇪',
    lat: -12.0464,
    lng: -77.0428,
    title: 'Evangelismo Transecuatorial en Lima',
    leader: 'Hna. Marlene de Corina',
    description: 'Distribución de alimentos, soporte comunitario y apertura de células de hogar en Lima y Trujillo.',
    activeProjects: 2,
    members: '120+',
  },
  {
    id: 'usa',
    country: 'Estados Unidos',
    flag: '🇺🇸',
    lat: 25.7617,
    lng: -80.1918,
    title: 'Ministerio Internacional Florida',
    leader: 'Pr. David Nicola',
    description: 'Red de apoyo pastoral para familias hispanas inmigrantes, discipulado y enlace de misiones internacionales.',
    activeProjects: 1,
    members: '210+',
  },
  {
    id: 'espana',
    country: 'España',
    flag: '🇪🇸',
    lat: 40.4168,
    lng: -3.7038,
    title: 'Misión Europa Madrid & Barcelona',
    leader: 'Misionera Ana de Castro',
    description: 'Evangelismo universitario, discipulado continuo y siembra de grupos de oración en la región central de España.',
    activeProjects: 1,
    members: '95+',
  },
  {
    id: 'chile',
    country: 'Chile',
    flag: '🇨🇱',
    lat: -33.4489,
    lng: -70.6693,
    title: 'Proyecto Esperanza Santiago',
    leader: 'Misionero Roberto Paz',
    description: 'Obra comunitaria en sectores vulnerables del sur de Santiago con provisión médica básica y talleres comunitarios.',
    activeProjects: 1,
    members: '70+',
  },
  {
    id: 'mexico',
    country: 'México',
    flag: '🇲🇽',
    lat: 19.4326,
    lng: -99.1332,
    title: 'Misión Juvenil CDMX',
    leader: 'Hno. Samuel Torres',
    description: 'Capacitación en artes, música y literatura bíblica para jóvenes y adolescentes de la Ciudad de México.',
    activeProjects: 1,
    members: '110+',
  },
  {
    id: 'argentina',
    country: 'Argentina',
    flag: '🇦🇷',
    lat: -34.6037,
    lng: -58.3816,
    title: 'Comedor y Apoyo Escolar Buenos Aires',
    leader: 'Hna. Lucía Benítez',
    description: 'Asistencia alimentaria diaria a más de 120 niños y talleres educativos para familias.',
    activeProjects: 1,
    members: '85+',
  },
];

const GLOBE_CONFIG: COBEOptions = {
  width: 900,
  height: 900,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 1.2,
  theta: 0.18,
  dark: 0,
  diffuse: 0.5,
  mapSamples: 16000,
  mapBrightness: 1.35,
  baseColor: [0.96, 0.96, 0.98],
  markerColor: [225 / 255, 29 / 255, 72 / 255], // Red marker
  glowColor: [0.98, 0.94, 0.9],
  markers: MISSION_LOCATIONS.map((p) => ({
    location: [p.lat, p.lng] as [number, number],
    size: p.id === 'ecuador' ? 0.08 : 0.05,
  })),
};

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);

  // Selected Country for 3D Globe focus
  const [selectedPoint, setSelectedPoint] = useState<MissionPoint>(MISSION_LOCATIONS[0]);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      console.error('Error loading missions:', err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.resolve().then(() => {
      loadMissions();
    });
  }, []);

  const handleSelectCountry = (point: MissionPoint) => {
    setSelectedPoint(point);
    setFocusCoords([point.lat, point.lng]);
  };

  const activeMissions = missions.filter((m) => m.status === 'active');

  return (
    <>
      <Helmet>
        <title>Misiones Globales | Iglesia Jerusalén</title>
        <meta
          name="description"
          content="Conoce nuestras misiones internacionales, explora el globo 3D interactivo y apoya los proyectos que transforman vidas alrededor del mundo."
        />
      </Helmet>

      <div className="bg-surface dark:bg-slate-950 min-h-screen pb-20 space-y-16">
        
        {/* ── SECTION 1: HERO HEADER (Limpio y Centrado) ──────────────────────── */}
        <section className="relative pt-14 pb-10 px-4 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden rounded-b-3xl shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <AnimeFadeUp>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold text-xs uppercase tracking-widest border border-rose-500/30 backdrop-blur-md">
                <Globe2 className="w-4 h-4 text-rose-400 animate-spin-slow" />
                Misiones Internacionales
              </div>

              <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tight mt-3">
                Llevando Luz a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
                  Todas las Naciones
                </span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
                La iglesia no es solo un edificio, es un movimiento vivo. Explora nuestra obra misionera global, descubre los proyectos activos y únete a la visión del reino.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href="#globo-3d"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-rose-600/30 transition flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explorar Globo 3D</span>
                </a>
                <Link
                  to="/donations"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm backdrop-blur transition flex items-center gap-2"
                >
                  <HandHeart className="w-4 h-4 text-amber-400" />
                  <span>Apoyar Misiones</span>
                </Link>
              </div>
            </AnimeFadeUp>
          </div>
        </section>

        {/* ── SECTION 2: STATS SUMMARY GRID ───────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4">
          <AnimeStaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm text-center space-y-1 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                {activeMissions.length || '8'}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Proyectos Activos
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm text-center space-y-1 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Globe2 className="w-5 h-5" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">8</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Países Alcanzados
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm text-center space-y-1 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Church className="w-5 h-5" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">11</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Iglesias Plantadas
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm text-center space-y-1 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">1,180+</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Miembros Impactados
              </p>
            </div>
          </AnimeStaggerGrid>
        </section>

        {/* ── SECTION 3: DEDICATED INTERACTIVE 3D GLOBE SPOTLIGHT ─────────────── */}
        <section id="globo-3d" className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Explorador Interactivo 3D
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
              Nuestra Presencia en el Mundo
            </h2>
            <p className="text-sm text-muted-foreground">
              Haz clic en cualquier país o mantén presionado y arrastra para rotar libremente el planeta 360°.
            </p>
          </div>

          {/* Country Selection Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 py-2">
            <button
              onClick={() => setFocusCoords(null)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                focusCoords === null
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-rose-400'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Rotación 360°</span>
            </button>

            {MISSION_LOCATIONS.map((point) => {
              const isSelected = selectedPoint.id === point.id && focusCoords !== null;
              return (
                <button
                  key={point.id}
                  onClick={() => handleSelectCountry(point)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md scale-105 border-rose-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-rose-400'
                  }`}
                >
                  <span className="text-sm">{point.flag}</span>
                  <span>{point.country}</span>
                </button>
              );
            })}
          </div>

          {/* Globe Container with Floating Pop-up Card */}
          <div className="relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-4 md:p-8 shadow-2xl overflow-hidden min-h-[550px] flex flex-col items-center justify-center">
            
            {/* Interactive 3D Globe Canvas */}
            <div className="w-full max-w-[500px] md:max-w-[550px] aspect-square my-auto">
              <Globe
                config={GLOBE_CONFIG}
                interactive={true}
                focusCoords={focusCoords}
              />
            </div>

            {/* Instruction Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-gray-300 pointer-events-none">
              <Compass className="w-4 h-4 text-rose-400 animate-spin-slow" />
              <span>Arrastra con el ratón o dedo para rotar 360°</span>
            </div>

            {/* Floating Interactive Country Card (Bottom / Right Overlay) */}
            {selectedPoint && (
              <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-96 z-20 bg-slate-900/90 border border-white/15 backdrop-blur-xl p-5 rounded-2xl shadow-2xl text-white space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedPoint.flag}</span>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-white leading-tight">
                        {selectedPoint.country}
                      </h3>
                      <p className="text-[11px] text-rose-300 font-medium">
                        {selectedPoint.activeProjects} Proyecto(s) Activo(s)
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Activo
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-amber-300">
                    {selectedPoint.title}
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {selectedPoint.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-2">
                  <span className="flex items-center gap-1 text-gray-300 font-medium">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedPoint.members} Alcance</span>
                  </span>
                  <span className="truncate max-w-[170px] text-right font-light">
                    {selectedPoint.leader}
                  </span>
                </div>

                <div className="pt-1">
                  <Link
                    to="/donations"
                    className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Apoyar Misión en {selectedPoint.country}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 4: MISSIONS LISTING FROM DB ─────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 space-y-8 pt-6">
          <div className="flex items-end justify-between border-b pb-4 border-slate-200 dark:border-white/10">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
                Catálogo de Obras
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">
                Proyectos Misioneros Destacados
              </h2>
            </div>
            <Link
              to="/donations"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              <span>Donar a Misiones</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MISSION_LOCATIONS.slice(0, 6).map((item) => (
              <AnimeHoverCard
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-rose-500/50 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.flag}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/30">
                      {item.country}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white group-hover:text-rose-600 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Encargado: {item.leader.split('&')[0]}
                  </span>
                  <button
                    onClick={() => handleSelectCountry(item)}
                    className="text-rose-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver en Globo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </AnimeHoverCard>
            ))}
          </AnimeStaggerGrid>
        </section>

      </div>
    </>
  );
}
