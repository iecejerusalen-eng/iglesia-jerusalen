import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { sql } from '../../config/localDb';
import type { Schedule, Sermon, Event as DbEvent } from '../../types';
import fachadaImage from '../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import { Link } from 'react-router-dom';
import {
  Heart, Calendar, ArrowRight, Sparkles,
  Clock, Eye, EyeOff, Music, Tv, Gift
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import DOMPurify from 'dompurify';
import BlockRenderer from '../../components/public/BlockRenderer';
import { ImageGallerySection } from '../../components/public/ImageGallerySection';
import FloatingElements from '../../components/public/FloatingElements';
import MarqueeText from '../../components/public/MarqueeText';
import TestimonialsSection from '../../components/public/TestimonialsSection';
import ChurchJourneySection from '../../components/public/ChurchJourneySection';
import SermonVideoGallery from '../../components/public/SermonVideoGallery';
import { useLiveModeStore } from '../../store/useLiveModeStore';
import MagneticButton from '../../components/animations/MagneticButton';

const FALLBACK_SCHEDULES: Schedule[] = [
  { id: '1', day: 'Martes', title: 'Culto de Damas y Caballeros', time_range: '7:30pm - 9:00pm', description: 'Culto especial dirigido por el departamento de Damas y Caballeros.', order_index: 1, created_at: '' },
  { id: '2', day: 'Miércoles', title: 'Culto de Enseñanza', time_range: '7:30pm - 9:00pm', description: 'Estudio bíblico doctrinal para toda la congregación.', order_index: 2, created_at: '' },
  { id: '3', day: 'Jueves', title: 'Culto de Cadetes', time_range: '7:30pm - 9:00pm', description: 'Culto dinámico de adolescentes y pre-jóvenes.', order_index: 3, created_at: '' },
  { id: '4', day: 'Viernes', title: 'Culto en Células', time_range: '7:30pm - 9:00pm', description: 'Grupos pequeños reunidos en los hogares.', order_index: 4, created_at: '' },
  { id: '5', day: 'Sábado', title: 'Culto de Jóvenes', time_range: '7:30pm - 9:00pm', description: 'Servicio vibrante dirigido por el departamento de Jóvenes.', order_index: 5, created_at: '' },
  { id: '6', day: 'Domingo', title: '1ra Plenaria', time_range: '8:00am - 9:30am', description: 'Primer culto general de adoración.', order_index: 6, created_at: '' },
  { id: '7', day: 'Domingo', title: '2da Plenaria', time_range: '10:00am - 11:30am', description: 'Segundo culto general de adoración.', order_index: 7, created_at: '' }
];

const MOCK_SERMONS: Sermon[] = [
  { id: '1', title: 'Caminando en Fe', pastor_name: 'Pastor David Nicola', youtube_url: 'https://youtube.com', content: '', created_at: '2026-06-07T00:00:00Z' },
  { id: '2', title: 'El Poder de la Oración', pastor_name: 'Pastora Corina Miranda', youtube_url: 'https://youtube.com', content: '', created_at: '2026-05-31T00:00:00Z' }
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const BIRTHDAY_VERSES = [
  { text: "Que te conceda lo que tu corazón desea; que haga que se cumplan todos tus planes.", ref: "Salmo 20:4" },
  { text: "El Señor te bendiga y te guarde; el Señor haga resplandecer su rostro sobre ti y tenga de ti misericordia.", ref: "Números 6:24-25" },
  { text: "Enséñanos a contar de tal modo nuestros días, que traigamos al corazón sabiduría.", ref: "Salmo 90:12" },
  { text: "Porque por mí se multiplicarán tus días, y años de vida se te añadirán.", ref: "Proverbios 9:11" },
  { text: "Deleítate asimismo en Jehová, y él te concederá las peticiones de tu corazón.", ref: "Salmo 37:4" },
  { text: "Jehová tu Dios está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría.", ref: "Sofonías 3:17" },
  { text: "Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano.", ref: "Efesios 2:10" },
  { text: "En tu mano están mis tiempos; líbrame de la mano de mis enemigos y de mis perseguidores.", ref: "Salmo 31:15" }
];

const getMemberVerse = (memberId: string) => {
  if (!memberId) return BIRTHDAY_VERSES[0];
  let sum = 0;
  for (let i = 0; i < memberId.length; i++) {
    sum += memberId.charCodeAt(i);
  }
  return BIRTHDAY_VERSES[sum % BIRTHDAY_VERSES.length];
};

const DEFAULT_SECTIONS = [
  { id: 'home_hero', section_type: 'custom', name: 'Sección Principal (Héroe)', title: 'Bienvenido a la Iglesia Jerusalén', subtitle: 'Una Casa de Restauración y Bendición', content_blocks: [] },
  { id: 'home_welcome', section_type: 'custom', name: 'Nuestra Doctrina (4 Pilares)', title: 'Nuestra Doctrina', subtitle: 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.', content_blocks: [] },
  { id: 'home_schedules', section_type: 'system_schedules', name: 'Horarios de Reunión', title: 'Horarios de Reunión', subtitle: 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!' },
  { id: 'home_events', section_type: 'system_events', name: 'Próximos Eventos', title: 'Próximos Eventos', subtitle: 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.' },
  { id: 'home_sermons', section_type: 'system_sermons', name: 'Últimas Prédicas', title: 'Últimas Prédicas', subtitle: 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.' },
  {
    id: 'home_gallery', section_type: 'system_gallery', name: 'Galería de Imágenes', title: 'Nuestra Comunidad en Imágenes', subtitle: 'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.', content_blocks: [
      { id: 'slide_1', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200', caption: 'Alabanza y adoración congregacional' },
      { id: 'slide_2', url: 'https://images.unsplash.com/photo-1489641499538-be02c255c552?auto=format&fit=crop&q=80&w=1200', caption: 'Tiempo de enseñanza de la palabra de Dios' },
      { id: 'slide_3', url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1200', caption: 'Comunión fraternal de los miembros' }
    ]
  },
  { id: 'home_birthdays', section_type: 'system_birthdays', name: 'Cumpleaños de la Semana', title: 'Cumpleaños de la Semana', subtitle: 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!' },
  { id: 'home_donations', section_type: 'custom', name: 'Llamado a Ofrendas / Donativos', title: 'Apoya la Obra de Dios', subtitle: 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.', content_blocks: [] }
];

const getYoutubeId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Home = () => {
  const { isLiveModeActive, liveYoutubeUrl, liveAnnouncement, activeSongId } = useLiveModeStore();
  const [activeSong, setActiveSong] = useState<any | null>(null);
  const [liveSongFont, setLiveSongFont] = useState<'mono' | 'serif' | 'sans'>('mono');
  const [showLiveChords, setShowLiveChords] = useState(true);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DbEvent[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingSermons, setLoadingSermons] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [birthdayMembers, setBirthdayMembers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

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

  useEffect(() => {
    fetchSchedules();
    fetchSermons();
    fetchUpcomingEvents();
    fetchBirthdayMembers();
    fetchDynamicPageContent();
  }, []);

  const fetchDynamicPageContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page', 'home')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setSections(data);
      } else {
        setSections(DEFAULT_SECTIONS);
      }
    } catch (err) {
      console.error('Error fetching home page contents:', err);
      setSections(DEFAULT_SECTIONS);
    }
  };

  // Helper for checking if a birthday is within the next 7 days (including today)
  const isBirthdayInNext7Days = (birthDateStr: string) => {
    if (!birthDateStr) return false;
    const [, bMonth, bDay] = birthDateStr.split('-').map(Number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const currentYear = today.getFullYear();
    const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

    for (const year of yearsToCheck) {
      const bday = new Date(year, bMonth - 1, bDay);
      bday.setHours(12, 0, 0, 0); // avoid timezone shifts
      if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
        return true;
      }
    }

    return false;
  };

  const calculateAgeTurning = (birthDateStr: string) => {
    if (!birthDateStr) return 0;
    const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const currentYear = today.getFullYear();
    const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

    for (const year of yearsToCheck) {
      const bday = new Date(year, bMonth - 1, bDay);
      bday.setHours(12, 0, 0, 0);
      if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
        return year - bYear;
      }
    }

    return currentYear - bYear;
  };

  const getBirthdayTimestampInWindow = (birthDateStr: string) => {
    if (!birthDateStr) return 0;
    const [, bMonth, bDay] = birthDateStr.split('-').map(Number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const currentYear = today.getFullYear();
    const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

    for (const year of yearsToCheck) {
      const bday = new Date(year, bMonth - 1, bDay);
      bday.setHours(12, 0, 0, 0);
      if (bday.getTime() >= today.getTime() && bday.getTime() <= next7Days.getTime()) {
        return bday.getTime();
      }
    }
    return 0;
  };

  const fetchBirthdayMembers = async () => {
    try {
      let data: any[] = [];
      try {
        // Try local SQLite first
        const localData: any[] = await sql`
          SELECT id, first_name, last_name, birth_date, photo_url FROM local_members 
          WHERE deleted_at IS NULL AND birth_date IS NOT NULL;
        `;
        data = localData || [];
      } catch (dbErr) {
        console.warn('Local database query failed, trying Supabase:', dbErr);
      }

      if (!data || data.length === 0) {
        const { data: dbData, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, birth_date, photo_url')
          .is('deleted_at', null)
          .not('birth_date', 'is', null);
        if (error) throw error;
        data = dbData || [];
      }

      const filtered = data
        .filter((m: any) => isBirthdayInNext7Days(m.birth_date))
        .map((m: any) => ({
          ...m,
          ageTurning: calculateAgeTurning(m.birth_date)
        }));

      // Sort chronologically within the 7-day window
      const sorted = filtered.sort((a: any, b: any) => {
        const aTime = getBirthdayTimestampInWindow(a.birth_date);
        const bTime = getBirthdayTimestampInWindow(b.birth_date);
        return aTime - bTime;
      });

      setBirthdayMembers(sorted);
    } catch (err) {
      console.error('Error fetching birthdays:', err);
    }
  };

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      let localData: any[] = [];
      try {
        // Try local SQLite first
        localData = await sql`
          SELECT * FROM local_schedules ORDER BY order_index ASC;
        `;
      } catch (dbErr) {
        console.warn('Local database query failed, trying Supabase:', dbErr);
      }

      if (localData && localData.length > 0) {
        setSchedules(localData);
      } else {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setSchedules(data);
        } else {
          setSchedules(FALLBACK_SCHEDULES);
        }
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setSchedules(FALLBACK_SCHEDULES);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchSermons = async () => {
    setLoadingSermons(true);
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      if (data && data.length > 0) {
        setSermons(data);
      } else {
        setSermons(MOCK_SERMONS);
      }
    } catch (err) {
      console.error('Error fetching sermons:', err);
      setSermons(MOCK_SERMONS);
    } finally {
      setLoadingSermons(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    setLoadingEvents(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*, ministries(name)')
        .eq('is_public', true)
        .gte('start_date', todayStr)
        .order('start_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'Todo el día';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const formatBirthdayDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const [_, month, day] = dateStr.split('-').map(Number);
    return `${day} de ${MONTHS[month - 1]}`;
  };

  return (
    <div className="space-y-20 pb-20">
      {sections.map((sectionData) => {
        const { id, section_type, title, subtitle, content_blocks } = sectionData;

        switch (section_type) {
          case 'custom':
            // 1. HERO SECTION
            if (id === 'home_hero') {
              if (isLiveModeActive) {
                const liveYtId = getYoutubeId(liveYoutubeUrl);
                return (
                  <section id="hero" key={id} className="bg-slate-950 text-white py-12 px-4 md:px-8 border-b border-slate-900">
                    {/* Estilos para letras de alabanza en vivo */}
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
                          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
                            Transmisión Especial de Hoy
                          </h1>
                        </div>

                        <div className="text-slate-450 text-xs">
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
                                  onChange={(e) => setLiveSongFont(e.target.value as any)}
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
                                  <h3 className="font-serif font-bold text-lg text-slate-100">{activeSong.title}</h3>
                                  {activeSong.artist && (
                                    <p className="text-xs text-slate-400 font-medium">{activeSong.artist}</p>
                                  )}
                                </div>

                                <div className={`live-song-lyrics-wrapper font-${liveSongFont} max-h-[300px] overflow-y-auto pr-1`}>
                                  <div
                                    className={`live-song-lyrics text-slate-300 ${!showLiveChords ? 'hide-chords' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: activeSong.lyrics || '<p class="text-slate-550 italic">Cargando letra...</p>' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500 dark:text-gray-450 space-y-3">
                                <Music size={32} className="text-slate-700 dark:text-gray-300 animate-pulse" />
                                <p className="text-xs font-semibold max-w-[200px] leading-normal">
                                  Alabanza congregacional activa. Esperando que el director de alabanza sincronice la letra...
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-800 pt-3 mt-4 text-[10px] text-slate-500 dark:text-gray-450 leading-normal">
                            * Las letras y acordes se actualizan automáticamente en tiempo real para que toda la congregación cante en unidad.
                          </div>
                        </div>

                      </div>

                    </div>
                  </section>
                );
              }

              return (
                <section id="hero" key={id} className="relative min-h-[95vh] flex items-center justify-center bg-[#071330] text-white overflow-hidden py-24">
                  <FloatingElements />
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.img
                      initial={{ scale: 1.05 }}
                      animate={{
                        scale: [1.05, 1.12, 1.05],
                        x: [0, 10, -10, 0],
                        y: [0, -8, 8, 0]
                      }}
                      transition={{
                        duration: 40,
                        ease: 'linear',
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      src={fachadaImage}
                      alt="Fachada de la Iglesia Jerusalén"
                      className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
                    />

                    <motion.div
                      animate={{
                        x: [-40, 80, -40],
                        y: [-20, 60, -20]
                      }}
                      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-1/4 left-1/5 w-[350px] h-[350px] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none"
                    />
                    <motion.div
                      animate={{
                        x: [40, -60, 40],
                        y: [30, -40, 30]
                      }}
                      transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none"
                    />

                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, rgba(7, 19, 48, 0.72) 60%, rgba(7, 19, 48, 0.98) 100%)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071330] via-[#071330]/65 to-transparent pointer-events-none" />
                  </div>

                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 flex flex-col items-center"
                  >
                    <motion.div
                      variants={fadeInUp}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-gold/15 to-amber-500/15 text-gold border border-gold/45 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-gold/5 backdrop-blur-xs select-none"
                    >
                      <Sparkles size={14} className="text-gold animate-spin-slow" />
                      <span>{subtitle || 'Una Casa de Restauración y Bendición'}</span>
                    </motion.div>

                    <motion.h1
                      variants={fadeInUp}
                      className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-[1.08] max-w-4xl mx-auto drop-shadow-md"
                    >
                      {title ? (
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title.replace('Iglesia Jerusalén', '<span class="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-extrabold drop-shadow-[0_4px_12px_rgba(217,119,6,0.25)]">Iglesia Jerusalén</span>')) }} />
                      ) : (
                        <>
                          Bienvenido a la <br />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-extrabold drop-shadow-[0_4px_12px_rgba(217,119,6,0.25)]">Iglesia Jerusalén</span>
                        </>
                      )}
                    </motion.h1>

                    {content_blocks && content_blocks.length > 0 ? (
                      <div className="max-w-3xl mx-auto text-left bg-black/25 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    ) : (
                      <>
                        <motion.p
                          variants={fadeInUp}
                          className="text-slate-200 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light font-sans tracking-wide"
                        >
                          Somos una congregación de la Iglesia del Evangelio Cuadrangular comprometida con esparcir la Palabra hasta los confines de la tierra, ministrar a las familias y servir a nuestra comunidad.
                        </motion.p>

                        <motion.div
                          variants={fadeInUp}
                          className="flex flex-col sm:flex-row gap-4 justify-center pt-6 w-full sm:w-auto"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <MagneticButton>
                              <Link
                                to="/nosotros"
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-gold to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-gold/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                              >
                                Conócenos
                              </Link>
                            </MagneticButton>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <MagneticButton>
                              <a
                                href="#schedules"
                                className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-2xl font-bold backdrop-blur-md transition-all text-sm flex items-center justify-center gap-2 shadow-md"
                              >
                                Horarios de Servicio
                                <ArrowRight size={16} className="text-gold" />
                              </a>
                            </MagneticButton>
                          </motion.div>
                        </motion.div>
                      </>
                    )}
                  </motion.div>

                  <div className="absolute bottom-0 left-0 right-0 h-16 w-full pointer-events-none z-0">
                    <svg className="w-full h-full text-[#F8FAFC] dark:text-slate-950 fill-current" viewBox="0 0 1440 74" preserveAspectRatio="none">
                      <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,74L1320,74C1200,74,960,74,720,74C480,74,240,74,120,74L0,74Z"></path>
                    </svg>
                  </div>
                </section>
              );
            }

            // 2. WELCOME / PILARES SECTION
            if (id === 'home_welcome') {
              return (
                <div key={id} id="about" className="pb-16 md:pb-24">
                  {content_blocks && content_blocks.length > 0 ? (
                    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn">
                      <div className="text-center max-w-2xl mx-auto space-y-3">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">{title || 'Nuestra Doctrina'}</h2>
                        {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    </section>
                  ) : (
                    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                      <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, amount: 0.3 }}
                        className="text-center max-w-2xl mx-auto space-y-3"
                      >
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">Nuestra Doctrina</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                          Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.
                        </p>
                      </motion.div>

                      <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, amount: 0.15 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                      >
                        <motion.div
                          variants={fadeInUp}
                          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-accent-red/10 dark:bg-accent-red/20 text-accent-red dark:text-red-400 rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                              ✝
                            </div>
                            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Jesucristo Salvador</h3>
                            <p className="text-gray-500 dark:text-gray-300 text-xs leading-relaxed">
                              El único camino al Padre, quien dio su vida en la cruz para perdonar nuestros pecados y otorgar salvación a todo el que cree.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-accent-red dark:text-red-400 uppercase tracking-wider mt-6 block">Juan 3:16</span>
                        </motion.div>

                        <motion.div
                          variants={fadeInUp}
                          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-gold/10 dark:bg-gold/20 text-gold dark:text-yellow-400 rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                              🕊
                            </div>
                            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Jesucristo Bautizador</h3>
                            <p className="text-gray-500 dark:text-gray-300 text-xs leading-relaxed">
                              El dador del Espíritu Santo, capacitándonos con poder y dones para testificar y vivir una vida de santidad activa.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-gold dark:text-yellow-400 uppercase tracking-wider mt-6 block">Hechos 1:8</span>
                        </motion.div>

                        <motion.div
                          variants={fadeInUp}
                          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                              🍷
                            </div>
                            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Jesucristo Sanador</h3>
                            <p className="text-gray-500 dark:text-gray-300 text-xs leading-relaxed">
                              El gran médico de almas y cuerpos, quien llevó nuestras dolencias y continúa sanando por medio de la fe hoy.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-accent-blue dark:text-blue-400 uppercase tracking-wider mt-6 block">Santiago 5:14-15</span>
                        </motion.div>

                        <motion.div
                          variants={fadeInUp}
                          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-accent-purple/10 text-accent-purple rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                              👑
                            </div>
                            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">El Rey que Viene</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                              El novio celestial que regresará con poder y gran gloria por su iglesia para reinar eternamente en victoria.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-accent-purple uppercase tracking-wider mt-6 block">1 Tesalonicenses 4:16</span>
                        </motion.div>
                      </motion.div>
                    </section>
                  )}
                  <ChurchJourneySection />
                  <div className="mt-20 mb-10">
                    <MarqueeText />
                  </div>
                </div>
              );
            }

            // 7. DONATIONS CTA SECTION
            if (id === 'home_donations') {
              return (
                <div key={id}>
                  {content_blocks && content_blocks.length > 0 ? (
                    <section className="max-w-5xl mx-auto px-4 animate-fadeIn">
                      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 flex items-center justify-center">
                          <Heart size={150} />
                        </div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                          <h3 className="font-serif text-3xl font-bold">{title || 'Apoya la Obra de Dios'}</h3>
                          {subtitle && (
                            <p className="text-gray-200 text-sm leading-relaxed">{subtitle}</p>
                          )}
                          <BlockRenderer blocks={content_blocks} />
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="max-w-5xl mx-auto px-4">
                      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 flex items-center justify-center">
                          <Heart size={150} />
                        </div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                          <h3 className="font-serif text-3xl font-bold">Apoya la Obra de Dios</h3>
                          <p className="text-gray-200 text-sm leading-relaxed">
                            Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio de Cristo y ayudando a los necesitados en nuestra comunidad local y misiones globales.
                          </p>
                          <div className="pt-2">
                            <Link
                              to="/donations"
                              className="px-8 py-3.5 bg-gold hover:bg-yellow-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm inline-flex items-center gap-2 cursor-pointer"
                            >
                              Diezmos y Ofrendas en Línea
                              <Heart size={16} fill="currentColor" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              );
            }

            // USER-ADDED GENERIC BLOCK SECTIONS
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn">
                {(title || subtitle) && (
                  <div className="text-center max-w-2xl mx-auto space-y-3">
                    {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">{title}</h2>}
                    {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
                  </div>
                )}
                <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-gray-150 dark:border-white/10 shadow-xs dark:shadow-none">
                  <BlockRenderer blocks={content_blocks} />
                </div>
              </section>
            );

          case 'system_schedules': {
            const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const schedulesByDay: Record<string, Schedule[]> = {};

            schedules.forEach((sch) => {
              const day = sch.day || 'Otros';
              if (!schedulesByDay[day]) {
                schedulesByDay[day] = [];
              }
              schedulesByDay[day].push(sch);
            });

            const sortedDays = DAYS_ORDER.filter(
              (day) => schedulesByDay[day] && schedulesByDay[day].length > 0
            );

            return (
              <section key={id} id="schedules" className="bg-slate-50 dark:bg-slate-950 py-20 border-y border-gray-200 dark:border-white/10 scroll-mt-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 relative z-10">
                  <div className="text-center max-w-2xl mx-auto space-y-4">
                    <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-4 py-1.5 rounded-full">
                      Reuniones y Servicios
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white">
                      {title || 'Horarios de Reunión'}
                    </h2>
                    {subtitle && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {loadingSchedules ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortedDays
                          .filter((day) => day !== 'Domingo')
                          .map((day) => {
                            const daySchedules = schedulesByDay[day];
                            return (
                              <motion.div
                                key={day}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-2xs dark:shadow-none hover:shadow-lg transition-all duration-300 hover:border-gold/30 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3 mb-4">
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-primary dark:text-white bg-primary/5 dark:bg-primary/20 px-3 py-1 rounded-md">
                                      {day}
                                    </span>
                                    <span className="text-xs font-bold text-gold flex items-center gap-1.5">
                                      <Clock size={13} />
                                      {daySchedules[0]?.time_range}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">
                                      {daySchedules[0]?.title}
                                    </h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                      {daySchedules[0]?.description}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>

                      {schedulesByDay['Domingo'] && (
                        <div className="lg:col-span-1">
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="h-full bg-gradient-to-b from-primary to-[#091b42] text-white p-8 rounded-3xl border border-blue-950 shadow-xl flex flex-col justify-between relative overflow-hidden"
                          >
                            <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay">
                              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                                <path d="M0 0 L50 50 L100 0 Z M0 100 L50 50 L100 100 Z" stroke="white" strokeWidth="2" fill="none" />
                              </svg>
                            </div>

                            <div className="space-y-6 relative z-10">
                              <div className="border-b border-white/10 pb-4 flex justify-between items-center">
                                <span className="text-sm font-extrabold uppercase tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-md border border-gold/20">
                                  Domingo
                                </span>
                                <span className="text-xs font-medium text-slate-300">
                                  Día del Señor
                                </span>
                              </div>

                              <div className="space-y-6">
                                {schedulesByDay['Domingo'].map((sch) => (
                                  <div key={sch.id} className="relative pl-6 border-l-2 border-gold/30 last:border-l-transparent pb-1">
                                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold shadow-xs shadow-gold/50" />

                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center gap-2 flex-wrap">
                                        <h5 className="font-serif font-bold text-base text-slate-100">
                                          {sch.title}
                                        </h5>
                                        <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-md border border-gold/10">
                                          {sch.time_range}
                                        </span>
                                      </div>
                                      <p className="text-slate-300 text-xs font-light leading-relaxed">
                                        {sch.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-white/10 pt-6 mt-8 space-y-4 relative z-10">
                              <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                                <div className="text-gold mt-0.5 shrink-0 bg-gold/10 p-1.5 rounded-lg border border-gold/15">
                                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 2v12a3 3 0 0 1-3 3H8a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-1a3 3 0 0 1-3-3V2Z" />
                                    <path d="M6 2h12M12 17v5M9 22h6M4 8c1.5 0 2.5-1 3.5-1s2 1 3.5 1 2-1 3.5-1 2-1 3.5-1 2 1 3.5 1 2.5-1 3.5-1" />
                                  </svg>
                                </div>
                                <div className="space-y-0.5 text-left">
                                  <span className="text-xs font-extrabold text-gold uppercase tracking-wider block">
                                    Santa Cena
                                  </span>
                                  <p className="text-slate-300 text-[11px] leading-relaxed font-light">
                                    El <span className="font-semibold text-white">primer domingo</span> de cada mes celebramos juntos en todas las plenarias.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                                <div className="text-gold mt-0.5 shrink-0 bg-gold/10 p-1.5 rounded-lg border border-gold/15">
                                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                                  </svg>
                                </div>
                                <div className="space-y-0.5 text-left">
                                  <span className="text-xs font-extrabold text-gold uppercase tracking-wider block">
                                    Culto Misionero
                                  </span>
                                  <p className="text-slate-300 text-[11px] leading-relaxed font-light">
                                    El <span className="font-semibold text-white">tercer domingo</span> de cada mes está dedicado a apoyar misiones.
                                  </p>
                                </div>
                              </div>
                            </div>

                          </motion.div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'system_events':
            return (
              <section id="events" key={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 animate-fadeIn scroll-mt-24">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">{title || 'Próximos Eventos'}</h2>
                    {subtitle && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xl">{subtitle}</p>
                    )}
                  </div>
                  <Link
                    to="/eventos"
                    className="text-primary dark:text-white hover:text-blue-900 dark:hover:text-blue-300 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
                  >
                    Ver Calendario Completo
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {loadingEvents ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-2xs dark:shadow-none hover:shadow-lg transition-all duration-300 flex flex-col group"
                      >
                        {event.cover_image_url ? (
                          <div className="w-full h-44 overflow-hidden relative">
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          </div>
                        ) : (
                          <div className="w-full h-44 bg-gradient-to-tr from-primary to-blue-900 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center text-white relative">
                            <Calendar size={48} className="opacity-20 absolute" />
                            <span className="text-5xl font-bold font-serif opacity-30 select-none">JERUSALÉN</span>
                          </div>
                        )}

                        <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-gold border border-gold/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {event.ministries?.name || 'General'}
                              </span>
                              <span className="text-gray-400 capitalize">
                                {formatEventDate(event.start_date)}
                              </span>
                            </div>

                            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-1 flex items-center gap-1.5 group-hover:text-primary dark:text-white dark:group-hover:text-white transition-colors">
                              {event.emoji && <span>{event.emoji}</span>}
                              {event.title}
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
                              {event.description || 'Te invitamos a participar en esta actividad con nosotros. ¡Esperamos ser de bendición para tu vida!'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center gap-2 text-xs font-bold text-primary dark:text-white">
                            <Clock size={14} className="text-gold" />
                            <span>
                              Hora: {formatTime(event.start_time)}
                              {event.end_time && ` a ${formatTime(event.end_time)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                    <Calendar className="mx-auto text-gray-300 dark:text-gray-600 dark:text-gray-300 mb-3" size={40} />
                    <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-semibold">No hay eventos especiales programados próximamente.</p>
                  </div>
                )}
              </section>
            );

          case 'system_sermons':
            return (
              <div key={id} id="sermons">
                {loadingSermons ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <SermonVideoGallery
                    sermons={sermons}
                    title={title}
                    subtitle={subtitle}
                  />
                )}
              </div>
            );

          case 'system_birthdays':
            return (
              birthdayMembers.length > 0 && (
                <section key={id} className="bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-20 border-y border-gray-150 dark:border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

                  <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                      <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-4 py-1.5 rounded-full">
                        Celebración Congregacional
                      </span>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white">
                        {title || 'Próximos Cumpleaños'}
                      </h2>
                      {subtitle && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-900/5 via-gold/5 to-blue-900/5 border border-gold/20 rounded-3xl p-6 text-center backdrop-blur-xs shadow-3xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] flex items-center justify-center pointer-events-none">
                        <Gift size={100} className="text-gold" />
                      </div>
                      <p className="text-primary dark:text-gray-200 font-serif font-bold text-base md:text-lg leading-relaxed italic">
                        "¡Querida familia Jerusalén, felicitamos con mucho amor a cada uno de nuestros hermanos en su cumpleaños! Oramos para que el favor de Dios, su gracia inagotable y su perfecta paz colmen sus vidas en este nuevo año. ¡Que el Señor les bendiga grandemente!"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {birthdayMembers.map((member, mIdx) => (
                        <motion.div
                          key={mIdx}
                          variants={fadeInUp}
                          initial="initial"
                          whileInView="animate"
                          viewport={{ once: true }}
                          whileHover={{ y: -4 }}
                          className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl border border-gray-150 dark:border-white/10 p-6 shadow-2xs dark:shadow-none hover:shadow-xl hover:border-gold/20 transition-all duration-300 relative flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start gap-4">
                              {member.photo_url ? (
                                <img
                                  src={member.photo_url}
                                  alt={`${member.first_name} ${member.last_name}`}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gold shadow-md shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold to-amber-500 text-white flex items-center justify-center font-serif font-extrabold text-2xl border-2 border-gold shadow-md shrink-0 select-none">
                                  {member.first_name[0]}
                                </div>
                              )}

                              <div className="flex-grow text-left space-y-1">
                                <h4 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100 leading-snug">
                                  {member.first_name} {member.last_name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gold">
                                  <Calendar size={13} />
                                  <span>{formatBirthdayDate(member.birth_date)}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary dark:text-white bg-primary/5 dark:bg-primary/20 rounded-md border border-primary/10 dark:border-primary/30">
                                  <Gift size={10} className="text-gold" />
                                  Cumple {member.ageTurning} años
                                </span>
                              </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-white/10 my-4" />

                            {(() => {
                              const verse = getMemberVerse(member.id);
                              return (
                                <div className="flex-grow flex flex-col justify-between">
                                  <p className="text-gray-600 dark:text-gray-400 text-xs italic leading-relaxed font-sans font-light">
                                    "{verse.text}"
                                  </p>
                                  <span className="text-[9px] font-bold text-primary dark:text-gray-400 uppercase tracking-widest mt-2 block text-right font-mono">
                                    — {verse.ref}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
              )
            );

          case 'system_gallery':
            // GALERIA DE IMAGENES DINAMICA CON SLIDER AUTO
            return (
              <ImageGallerySection
                key={id}
                title={title || ''}
                subtitle={subtitle || ''}
                slides={content_blocks || []}
              />
            );

          default:
            return null;
        }
      })}

      <TestimonialsSection />
    </div>
  );
};

export default Home;
