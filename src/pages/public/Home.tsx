import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { getDb } from '../../config/localDb';
import type { Schedule, Sermon, Event as DbEvent, Song, Member } from '../../types';
import fachadaImage from '../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import { Link } from 'react-router-dom';
import {
  Heart, Calendar, ArrowRight, Sparkles,
  Clock, Eye, EyeOff, Music, Tv, Gift
} from 'lucide-react';
import BlockRenderer from '../../components/public/BlockRenderer';
import { ImageGallerySection } from '../../components/public/ImageGallerySection';
import FloatingElements from '../../components/public/FloatingElements';
import MarqueeText from '../../components/public/MarqueeText';
import TestimonialsSection from '../../components/public/TestimonialsSection';
import ChurchJourneySection from '../../components/public/ChurchJourneySection';
import SermonVideoGallery from '../../components/public/SermonVideoGallery';
import { useLiveModeStore } from '../../store/useLiveModeStore';
import MagneticButton from '../../components/animations/MagneticButton';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard, AnimeParallax, AnimeFloat, AnimeZoomIn } from '../../components/animations/AnimeWrappers';

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
      {
        id: 'slide_1',
        url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=1200',
        caption: 'Alabanza y adoración congregacional',
        category: 'Adoración'
      },
      {
        id: 'slide_2',
        url: 'https://images.unsplash.com/photo-1504052434569-7c9302e09150?auto=format&fit=crop&q=80&w=1200',
        caption: 'Tiempo de enseñanza y estudio de la Palabra',
        category: 'Enseñanza'
      },
      {
        id: 'slide_3',
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200',
        caption: 'Comunión fraternal de los miembros',
        category: 'Comunidad'
      },
      {
        id: 'slide_4',
        url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
        caption: 'Grupos de crecimiento en hogares (Células)',
        category: 'Comunidad'
      },
      {
        id: 'slide_5',
        url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1200',
        caption: 'Escuela Dominical y formación en la fe',
        category: 'Niños'
      },
      {
        id: 'slide_6',
        url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=1200',
        caption: 'Proyectos de ayuda y servicio a la comunidad',
        category: 'Servicio'
      }
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

// ==========================================
// 60FPS COUNT-UP COMPONENT (FASE 3 - PTO 2)
// ==========================================
const AnimatedCounter = ({ value, suffix = "", text }: { value: number, suffix?: string, text: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      const end = value;
      const duration = 2.0; // seconds
      const totalFrames = Math.round(duration * 60);
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Ease out quadratic interpolation
        const current = Math.round(end * (1 - (1 - progress) * (1 - progress)));
        setCount(current);

        if (frame >= totalFrames) {
          setCount(end);
          clearInterval(timer);
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center p-6 text-center space-y-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs rounded-2xl border border-slate-150 dark:border-white/5 shadow-xs">
      <span className="text-4xl md:text-5xl font-extrabold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 drop-shadow-sm">
        +{count}{suffix}
      </span>
      <span className="text-slate-600 dark:text-slate-350 text-xs font-bold tracking-wider uppercase">
        {text}
      </span>
    </div>
  );
};

interface BirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  photo_url?: string | null;
  ageTurning: number;
}

interface PageSection {
  id: string;
  page?: string;
  section?: string;
  section_type: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  content_blocks?: any;
  order_index?: number;
  cover_image_url?: string | null;
  updated_at?: string;
}

const Home = () => {
  const { isLiveModeActive, liveYoutubeUrl, liveAnnouncement, activeSongId } = useLiveModeStore();
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [liveSongFont, setLiveSongFont] = useState<'mono' | 'serif' | 'sans'>('mono');
  const [showLiveChords, setShowLiveChords] = useState(true);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DbEvent[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingSermons, setLoadingSermons] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [birthdayMembers, setBirthdayMembers] = useState<BirthdayMember[]>([]);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [stats, setStats] = useState({
    members: 350,
    baptized: 180,
    cells: 18,
    kids: 120,
    youth: 80
  });

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

  // Carga inicial de datos (movido al final del componente para evitar TDZ en variables const)

  const fetchStats = async () => {
    try {
      const db = await getDb();
      let allMembers = await db.getAll('local_members');
      allMembers = allMembers.filter(m => !m.deleted_at);

      if (allMembers.length === 0) {
        const { data, error } = await supabase.from('members').select('id, birth_date, baptism_date').is('deleted_at', null);
        if (!error && data) allMembers = data;
      }

      const { count: cellsCount } = await supabase.from('cells').select('id', { count: 'exact', head: true });

      let baptizedCount = 0;
      let kidsCount = 0;
      let youthCount = 0;

      const currentYear = new Date().getFullYear();

      allMembers.forEach(m => {
        if (m.baptism_date) baptizedCount++;
        if (m.birth_date) {
          const bYear = Number(m.birth_date.split('-')[0]);
          if (!isNaN(bYear)) {
            const age = currentYear - bYear;
            if (age <= 12) kidsCount++;
            else if (age > 12 && age <= 25) youthCount++;
          }
        }
      });

      setStats({
        members: allMembers.length || 350,
        baptized: baptizedCount || 180,
        cells: cellsCount || 18,
        kids: kidsCount || 120,
        youth: youthCount || 80
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

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
      bday.setHours(12, 0, 0, 0);
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
      let data: Partial<Member>[] = [];
      try {
        const db = await getDb();
        const allMembers = await db.getAll('local_members');
        const localData = allMembers.filter(m => !m.deleted_at && m.birth_date);
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
        .filter((m) => isBirthdayInNext7Days(m.birth_date!))
        .map((m) => ({
          id: m.id!,
          first_name: m.first_name || '',
          last_name: m.last_name || '',
          birth_date: m.birth_date!,
          photo_url: m.photo_url,
          ageTurning: calculateAgeTurning(m.birth_date!)
        }));

      const sorted = filtered.sort((a, b) => {
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
      let localData: Schedule[] = [];
      try {
        const db = await getDb();
        const allSchedules = await db.getAll('local_schedules');
        allSchedules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        localData = allSchedules;
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
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const formatted = date.toLocaleDateString('es-ES', options).toUpperCase();
    // Split date to show Day and Month separately
    const parts = formatted.split(' ');
    return {
      day: parts[0] || date.getDate().toString(),
      month: parts[parts.length - 1] || 'ENE'
    };
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
    const [, month, day] = dateStr.split('-').map(Number);
    return `${day} de ${MONTHS[month - 1]}`;
  };

  useEffect(() => {
    fetchSchedules();
    fetchSermons();
    fetchUpcomingEvents();
    fetchBirthdayMembers();
    fetchDynamicPageContent();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-24 pb-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {sections.map((sectionData) => {
        const { id, section_type, title, subtitle, content_blocks } = sectionData;

        switch (section_type) {
          case 'custom':
            // 1. HERO SECTION (FASE 3 - PTO 1)
            if (id === 'home_hero') {
              if (isLiveModeActive) {
                const liveYtId = getYoutubeId(liveYoutubeUrl);
                return (
                  <section id="hero" key={id} className="bg-slate-950 text-white py-12 px-4 md:px-8 border-b border-slate-900">
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
                                    dangerouslySetInnerHTML={{ __html: activeSong.lyrics || '<p class="text-slate-500 italic">Cargando letra...</p>' }}
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
                <div key={id} className="relative">
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

                    {/* Cascading Typography Content (FASE 3 - PTO 1) */}
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

                  {/* 2. STATS FRAP (FASE 3 - PTO 2) */}
                  <div className="bg-slate-50 dark:bg-slate-950 py-10 transition-colors duration-300 relative z-10">
                    <AnimeZoomIn className="max-w-7xl mx-auto px-4 md:px-8">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
                        <AnimatedCounter value={stats.members} text="Miembros en la Familia" />
                        <AnimatedCounter value={stats.baptized} text="Creyentes Bautizados" />
                        <AnimatedCounter value={stats.cells} text="Grupos Familiares (Células)" />
                        <AnimatedCounter value={stats.kids} text="Niños Formados en Fe" />
                        <AnimatedCounter value={stats.youth} text="Jóvenes Comprometidos" />
                      </div>
                    </AnimeZoomIn>
                  </div>
                </div>
              );
            }

            // 3. DOCTRINA / PILARES SECTION (FASE 3 - PTO 3)
            if (id === 'home_welcome') {
              return (
                <div key={id} id="about" className="pb-0">
                  {content_blocks && content_blocks.length > 0 ? (
                    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                      <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">{title || 'Nuestra Doctrina'}</h2>
                        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
                      </AnimeFadeUp>
                      <AnimeFadeUp delay={0.1} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                        <BlockRenderer blocks={content_blocks} />
                      </AnimeFadeUp>
                    </section>
                  ) : (
                    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                      <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
                          Verdades Centrales
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Nuestra Doctrina</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                          Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.
                        </p>
                      </AnimeFadeUp>

                      <AnimeStaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Pilar 1: Salvador */}
                        <div>
                          <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-red-500/30 dark:hover:shadow-red-500/5 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                                ✝
                              </div>
                              <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Salvador</h3>
                              <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                                El único camino al Padre, quien dio su vida en la cruz para perdonar nuestros pecados y otorgar salvación a todo el que cree.
                              </p>
                            </div>
                            <span className="text-[10px] font-extrabold text-red-500 dark:text-red-400 uppercase tracking-wider mt-6 block text-left font-mono">Juan 3:16</span>
                          </AnimeHoverCard>
                        </div>

                        {/* Pilar 2: Bautizador */}
                        <div>
                          <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-amber-500/30 dark:hover:shadow-amber-500/5 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                                🕊
                              </div>
                              <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Bautizador</h3>
                              <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                                El dador del Espíritu Santo, capacitándonos con poder y dones para testificar y vivir una vida de santidad activa y con propósito.
                              </p>
                            </div>
                            <span className="text-[10px] font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider mt-6 block text-left font-mono">Hechos 1:8</span>
                          </AnimeHoverCard>
                        </div>

                        {/* Pilar 3: Sanador */}
                        <div>
                          <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-blue-500/30 dark:hover:shadow-blue-500/5 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                                🍷
                              </div>
                              <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Sanador</h3>
                              <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                                El gran médico de almas y cuerpos, quien llevó todas nuestras dolencias y continúa sanando por medio de la fe el día de hoy.
                              </p>
                            </div>
                            <span className="text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-6 block text-left font-mono">Santiago 5:14-15</span>
                          </AnimeHoverCard>
                        </div>

                        {/* Pilar 4: Rey */}
                        <div>
                          <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-purple-500/30 dark:hover:shadow-purple-500/5 flex flex-col justify-between h-full group">
                            <div className="space-y-4">
                              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                                👑
                              </div>
                              <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">El Rey que Viene</h3>
                              <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                                El novio celestial que regresará con poder y gran gloria por su iglesia para reinar eternamente en victoria definitiva.
                              </p>
                            </div>
                            <span className="text-[10px] font-extrabold text-purple-500 dark:text-purple-400 uppercase tracking-wider mt-6 block text-left font-mono">1 Ts. 4:16</span>
                          </AnimeHoverCard>
                        </div>
                      </AnimeStaggerGrid>
                    </section>
                  )}
                  {/* Timeline section inside home_welcome case */}
                  <ChurchJourneySection />
                  
                  <div className="mt-16">
                    <MarqueeText />
                  </div>
                </div>
              );
            }

            // 9. DONACIONES CTA SECTION (FASE 3 - PTO 9)
            if (id === 'home_donations') {
              return (
                <div key={id}>
                  {content_blocks && content_blocks.length > 0 ? (
                    <section className="max-w-5xl mx-auto px-4">
                      <AnimeFadeUp className="bg-gradient-to-br from-[#0c1c42] to-amber-950 text-white rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 flex items-center justify-center animate-pulse pointer-events-none">
                          <Heart size={150} fill="currentColor" />
                        </div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                          <h3 className="font-serif text-3xl font-bold">{title || 'Apoya la Obra de Dios'}</h3>
                          {subtitle && (
                            <p className="text-slate-200 text-sm leading-relaxed">{subtitle}</p>
                          )}
                          <BlockRenderer blocks={content_blocks} />
                        </div>
                      </AnimeFadeUp>
                    </section>
                  ) : (
                    <section className="max-w-5xl mx-auto px-4">
                      <AnimeFadeUp className="bg-gradient-to-br from-[#0a1c40] via-[#071330] to-amber-900/60 text-white rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden border border-white/10">
                        <div className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-[0.05] flex items-center justify-center animate-pulse pointer-events-none">
                          <Heart size={180} fill="currentColor" />
                        </div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                          <h3 className="font-serif text-3xl md:text-4xl font-bold">Apoya la Obra de Dios</h3>
                          <p className="text-slate-200 text-sm md:text-base leading-relaxed font-light">
                            Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio de Cristo y ayudando a los necesitados en nuestra comunidad local y misiones globales.
                          </p>
                          <div className="pt-4">
                            <MagneticButton>
                              <Link
                                to="/donations"
                                className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all text-sm inline-flex items-center gap-2.5 cursor-pointer"
                              >
                                Diezmos y Ofrendas en Línea
                                <Heart size={16} fill="currentColor" className="animate-pulse" />
                              </Link>
                            </MagneticButton>
                          </div>
                        </div>
                      </AnimeFadeUp>
                    </section>
                  )}
                </div>
              );
            }

            // USER-ADDED GENERIC BLOCK SECTIONS
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                {(title || subtitle) && (
                  <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
                    {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">{title}</h2>}
                    {subtitle && <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
                  </AnimeFadeUp>
                )}
                <AnimeFadeUp className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
                  <BlockRenderer blocks={content_blocks} />
                </AnimeFadeUp>
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
              <section key={id} id="schedules" className="bg-slate-50 dark:bg-slate-950 py-16 border-y border-slate-200 dark:border-white/10 scroll-mt-24 relative overflow-hidden transition-colors duration-300 !mt-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-church-gold-light/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 relative z-10">
                  <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-4">
                    <span className="text-xs font-bold text-church-gold-dark dark:text-church-gold-bright uppercase tracking-widest bg-amber-100/50 dark:bg-amber-950/20 px-4 py-1.5 rounded-full">
                      Reuniones y Servicios
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">
                      {title || 'Horarios de Reunión'}
                    </h2>
                    {subtitle && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                        {subtitle}
                      </p>
                    )}
                  </AnimeFadeUp>

                  {loadingSchedules ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-church-gold-medium"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                      <AnimeStaggerGrid className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortedDays
                          .filter((day) => day !== 'Domingo')
                          .map((day) => {
                            const daySchedules = schedulesByDay[day];
                            return (
                              <div key={day}>
                                <AnimeHoverCard
                                  className="h-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-church-gold-light/5 hover:border-church-gold-light/30 transition-all flex flex-col justify-between relative overflow-hidden pl-8 animate-all"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gold-gradient" />
                                  
                                  <div>
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
                                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                                        {day}
                                      </span>
                                      <span className="text-xs font-bold text-church-gold-dark dark:text-church-gold-bright flex items-center gap-1.5">
                                        <Clock size={13} className="text-church-gold-medium" />
                                        {daySchedules[0]?.time_range}
                                      </span>
                                    </div>

                                    <div className="space-y-2 text-left">
                                      <h4 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                                        {daySchedules[0]?.title}
                                      </h4>
                                      <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                                        {daySchedules[0]?.description}
                                      </p>
                                    </div>
                                  </div>
                                </AnimeHoverCard>
                              </div>
                            );
                          })}
                      </AnimeStaggerGrid>

                      {schedulesByDay['Domingo'] && (
                        <div className="lg:col-span-1">
                          <AnimeFadeUp className="h-full">
                            <AnimeHoverCard
                              className="h-full bg-gold-gradient text-slate-950 p-8 rounded-3xl border border-church-gold-bright/35 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_25px_50px_rgba(157,102,14,0.4)] transition-all duration-500"
                            >
                              {/* Modern background design with glowing blobs and micro-patterns */}
                              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl select-none">
                                {/* Glowing abstract blobs */}
                                <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/25 blur-3xl rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
                                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/10 blur-3xl rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                                
                                {/* Premium fine dot grid pattern */}
                                <div 
                                  className="absolute inset-0 opacity-10 mix-blend-overlay"
                                  style={{
                                    backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)',
                                    backgroundSize: '16px 16px'
                                  }}
                                />
                              </div>

                              <div className="space-y-6 relative z-10">
                                <div className="border-b border-black/15 pb-4 flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm">
                                    Domingo
                                  </span>
                                  <span className="text-xs font-bold text-slate-900/80 font-serif italic">
                                    Día del Señor
                                  </span>
                                </div>

                                <div className="space-y-4">
                                  {schedulesByDay['Domingo'].map((sch) => (
                                    <div 
                                      key={sch.id} 
                                      className="bg-white/25 hover:bg-white/40 border border-white/20 p-4 rounded-2xl shadow-xxs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 text-left group/item"
                                    >
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center gap-2 flex-wrap">
                                          <h5 className="font-serif font-black text-sm md:text-base text-slate-950">
                                            {sch.title}
                                          </h5>
                                          <span className="text-[9px] font-extrabold text-slate-950 bg-white/40 px-2 py-0.5 rounded-md border border-slate-950/10">
                                            {sch.time_range}
                                          </span>
                                        </div>
                                        <p className="text-slate-900/90 text-xs font-semibold leading-relaxed">
                                          {sch.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t border-black/15 pt-6 mt-8 space-y-4 relative z-10">
                                <div className="flex items-start gap-3 bg-white/20 border border-white/35 p-4 rounded-2xl shadow-xxs hover:bg-white/30 transition-all duration-300">
                                  <div className="text-slate-950 mt-0.5 shrink-0 bg-white/30 p-2 rounded-xl border border-white/40 shadow-xxs flex items-center justify-center">
                                    {/* Cup and bread SVG (Santa Cena) */}
                                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                      <path d="M17 2H7c0 4 3 6 5 6s5-2 5-6Z" />
                                      <path d="M12 8v10M9 22h6" />
                                      <circle cx="17" cy="12" r="2" className="fill-current/10" />
                                    </svg>
                                  </div>
                                  <div className="space-y-0.5 text-left">
                                    <span className="text-xs font-extrabold text-slate-950 uppercase tracking-wider block">
                                      Santa Cena
                                    </span>
                                    <p className="text-slate-900/90 text-[11px] leading-relaxed font-semibold">
                                      El <span className="font-bold text-slate-950">primer domingo</span> de cada mes celebramos en todas las plenarias.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 bg-white/20 border border-white/35 p-4 rounded-2xl shadow-xxs hover:bg-white/30 transition-all duration-300">
                                  <div className="text-slate-950 mt-0.5 shrink-0 bg-white/30 p-2 rounded-xl border border-white/40 shadow-xxs flex items-center justify-center">
                                    {/* Globe SVG (Misiones) */}
                                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                                    </svg>
                                  </div>
                                  <div className="space-y-0.5 text-left">
                                    <span className="text-xs font-extrabold text-slate-950 uppercase tracking-wider block">
                                      Culto Misionero
                                    </span>
                                    <p className="text-slate-900/90 text-[11px] leading-relaxed font-semibold">
                                      El <span className="font-bold text-slate-950">tercer domingo</span> de cada mes está dedicado a misiones globales.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </AnimeHoverCard>
                          </AnimeFadeUp>
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
              <section id="events" key={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 scroll-mt-24">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-3 text-left">
                    <AnimeFadeUp>
                      <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white text-left">
                        {title || 'Próximos Eventos'}
                      </h2>
                    </AnimeFadeUp>
                    {subtitle && (
                      <AnimeFadeUp delay={0.1}>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl text-left">
                          {subtitle}
                        </p>
                      </AnimeFadeUp>
                    )}
                  </div>
                  <AnimeFadeUp delay={0.2}>
                    <Link
                      to="/eventos"
                      className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
                    >
                      Ver Calendario Completo
                      <ArrowRight size={16} />
                    </Link>
                  </AnimeFadeUp>
                </div>

                {loadingEvents ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  /* Stagger events list in Ticket/Card style (FASE 3 - PTO 6) */
                  <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event) => {
                      const dateObj = formatEventDate(event.start_date);
                      return (
                        <div key={event.id}>
                          <Link to="/eventos" className="block h-full cursor-pointer">
                            <AnimeHoverCard
                              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-500/5 hover:border-amber-500/30 flex flex-col h-full group relative"
                            >
                              {/* Accent line border on top */}
                              <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />

                            {event.cover_image_url ? (
                              <div className="w-full h-44 overflow-hidden relative">
                                <img
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
                                
                                {/* Date Ticket Badge overlay */}
                                <div className="absolute top-4 left-4 bg-amber-500 text-white rounded-2xl px-3 py-1.5 flex flex-col items-center justify-center font-bold shadow-md">
                                  <span className="text-lg leading-none font-serif">{dateObj.day}</span>
                                  <span className="text-[9px] tracking-wider font-mono">{dateObj.month}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-44 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-[#0a1c40] dark:to-slate-950 flex items-center justify-center text-slate-800 dark:text-white relative">
                                <Calendar size={48} className="opacity-10 absolute" />
                                <span className="text-3xl font-bold font-serif opacity-15 select-none tracking-widest">JERUSALÉN</span>
                                
                                {/* Date Ticket Badge overlay */}
                                <div className="absolute top-4 left-4 bg-amber-500 text-white rounded-2xl px-3 py-1.5 flex flex-col items-center justify-center font-bold shadow-md">
                                  <span className="text-lg leading-none font-serif">{dateObj.day}</span>
                                  <span className="text-[9px] tracking-wider font-mono">{dateObj.month}</span>
                                </div>
                              </div>
                            )}

                            <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {event.ministries?.name || 'General'}
                                  </span>
                                  <span className="text-slate-400">
                                    Nuevo
                                  </span>
                                </div>

                                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1 flex items-center gap-1.5 text-left group-hover:text-amber-500 dark:group-hover:text-amber-500 transition-colors">
                                  {event.emoji && <span>{event.emoji}</span>}
                                  {event.title}
                                </h3>

                                <p className="text-slate-500 dark:text-slate-405 text-xs leading-relaxed line-clamp-2 text-left">
                                  {event.description || 'Te invitamos a participar en esta actividad con nosotros. ¡Esperamos ser de bendición para tu vida!'}
                                </p>
                              </div>

                              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350">
                                  <Clock size={14} className="text-amber-500" />
                                  <span>{formatTime(event.start_time)}</span>
                                </div>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-500 group-hover:underline flex items-center gap-1">
                                  Ver Detalles
                                  <ArrowRight size={12} />
                                </span>
                              </div>
                            </div>
                            </AnimeHoverCard>
                          </Link>
                        </div>
                      );
                    })}
                  </AnimeStaggerGrid>
                ) : (
                  <AnimeFadeUp className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 shadow-xs">
                    <Calendar className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" size={40} />
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">No hay eventos especiales programados próximamente.</p>
                  </AnimeFadeUp>
                )}
              </section>
            );

          case 'system_sermons':
            return (
              <div key={id} id="sermons">
                {loadingSermons ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  </div>
                ) : (
                  <SermonVideoGallery
                    sermons={sermons}
                    title={title || undefined}
                    subtitle={subtitle || undefined}
                  />
                )}
              </div>
            );

          case 'system_birthdays':
            return (
              birthdayMembers.length > 0 && (
                <section key={id} className="bg-slate-50 dark:bg-slate-950 py-20 border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
                  <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

                  <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
                    <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-4">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
                        Celebración Congregacional
                      </span>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">
                        {title || 'Próximos Cumpleaños'}
                      </h2>
                      {subtitle && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                          {subtitle}
                        </p>
                      )}
                    </AnimeFadeUp>

                    <AnimeFadeUp className="max-w-3xl mx-auto bg-gradient-to-r from-amber-500/5 via-amber-600/10 to-yellow-500/5 border border-amber-500/20 rounded-3xl p-6 text-center backdrop-blur-xs shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] flex items-center justify-center pointer-events-none">
                        <Gift size={100} className="text-amber-500" />
                      </div>
                      <p className="text-slate-800 dark:text-gray-200 font-serif font-bold text-base md:text-lg leading-relaxed italic">
                        "¡Querida familia Jerusalén, felicitamos con mucho amor a cada uno de nuestros hermanos en su cumpleaños! Oramos para que el favor de Dios, su gracia inagotable y su perfecta paz colmen sus vidas en este nuevo año. ¡Que el Señor les bendiga grandemente!"
                      </p>
                    </AnimeFadeUp>

                    <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {birthdayMembers.map((member, mIdx) => (
                        <div key={mIdx}>
                          <AnimeHoverCard
                            className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none hover:shadow-xl hover:border-amber-500/25 transition-all duration-300 relative flex flex-col justify-between h-full"
                          >
                            <div>
                              <div className="flex items-start gap-4">
                                {member.photo_url ? (
                                  <img
                                    src={member.photo_url}
                                    alt={`${member.first_name} ${member.last_name}`}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md shrink-0 animate-pulse-slow"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center font-serif font-extrabold text-2xl border-2 border-amber-500 shadow-md shrink-0 select-none">
                                    {member.first_name[0]}
                                  </div>
                                )}

                                <div className="flex-grow text-left space-y-1">
                                  <h4 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 leading-snug">
                                    {member.first_name} {member.last_name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 dark:text-amber-400">
                                    <Calendar size={13} />
                                    <span>{formatBirthdayDate(member.birth_date)}</span>
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                    <Gift size={11} className="text-amber-500 animate-bounce" />
                                    Cumple {member.ageTurning} años
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 dark:border-white/5 my-4" />

                              {(() => {
                                const verse = getMemberVerse(member.id);
                                return (
                                  <div className="flex-grow flex flex-col justify-between text-left">
                                    <p className="text-slate-600 dark:text-slate-400 text-xs italic leading-relaxed font-sans font-light">
                                      "{verse.text}"
                                    </p>
                                    <span className="text-[9px] font-bold text-amber-500 dark:text-amber-450 uppercase tracking-widest mt-2 block text-right font-mono">
                                      — {verse.ref}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </AnimeHoverCard>
                        </div>
                      ))}
                    </AnimeStaggerGrid>
                  </div>
                </section>
              )
            );

          case 'system_gallery':
            return (
              <ImageGallerySection
                key={id}
                title={title || ''}
                subtitle={subtitle || ''}
                slides={(content_blocks && content_blocks.length > 0) ? content_blocks : (DEFAULT_SECTIONS.find(s => s.id === 'home_gallery')?.content_blocks || [])}
              />
            );

          default:
            return null;
        }
      })}

      <TestimonialsSection />

      {/* 10. FINAL CTA BANNER (FASE 3 - PTO 10) */}
      <AnimeZoomIn className="max-w-5xl mx-auto px-4">
        <div className="relative bg-gradient-to-tr from-slate-100 via-slate-50 to-white dark:from-[#0a1c40] dark:via-[#071330] dark:to-[#0a1c40] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 md:p-14 text-center overflow-hidden shadow-2xl transition-all duration-300">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
          <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25 px-4 py-1.5 rounded-full font-extrabold uppercase tracking-widest transition-colors duration-300">
              Te Esperamos
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white leading-tight transition-colors duration-300">
              ¿Nos visitas este domingo?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base font-light leading-relaxed max-w-lg transition-colors duration-300">
              Nos encantaría conocerte y adorar juntos al Señor. Hay un lugar especial reservado para ti y toda tu familia.
            </p>
            <div className="pt-4">
              <MagneticButton>
                <Link
                  to="/nosotros#visit"
                  className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Planifica tu visita
                  <ArrowRight size={16} className="text-white" />
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </AnimeZoomIn>
    </div>
  );
};

export default Home;
