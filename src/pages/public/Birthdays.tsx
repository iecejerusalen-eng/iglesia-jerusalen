import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { 
  Gift, Calendar as CalendarIcon, Table, LayoutGrid, 
  Search, ChevronLeft, ChevronRight, Sparkles, BookOpen
} from 'lucide-react';
import type { Member } from '../../types';
import { toast } from 'sonner';
import { BIBLE_BOOKS } from '../../config/bibleBooks';

function getBibleLinkForVerse(verseStr: string | null | undefined): string | null {
  if (!verseStr || typeof verseStr !== 'string') return null;
  const match = verseStr.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  
  const rawBook = match[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
  const chapter = match[2];
  const verse = match[3];
  
  const matchedBook = BIBLE_BOOKS.find(b => 
    b.id === rawBook || 
    b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') === rawBook ||
    b.abbrev.toLowerCase() === rawBook
  );
  
  const bookId = matchedBook ? matchedBook.id : rawBook;
  return `/recursos/biblia?libro=${bookId}&capitulo=${chapter}&versiculo=${verse}`;
}

interface BirthdayInfo {
  member: Member;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  day: number;
  month: number;
  age: number;
  daysRemaining: number;
  formattedDate: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Birthdays() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hoy' | 'semana' | 'mes'>('semana');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'calendar'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confetti controls
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRecipients, setConfettiRecipients] = useState<string>('');
  const { width, height } = useWindowSize();

  // Calendar navigation state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .is('deleted_at', null);

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      toast.error('Error al cargar cumpleañeros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBirthdayInfo = (member: Member): BirthdayInfo | null => {
    if (!member.birth_date) return null;
    
    // Parse birth date safely avoiding timezone shifts
    const [year, month, day] = member.birth_date.split('-').map(Number);
    const today = new Date();
    
    const bDay = day;
    const bMonth = month; // 1-indexed
    
    const tDay = today.getDate();
    const tMonth = today.getMonth() + 1;
    
    const isToday = bDay === tDay && bMonth === tMonth;
    const isThisMonth = bMonth === tMonth;
    
    const currentYear = today.getFullYear();
    const bDateThisYear = new Date(currentYear, bMonth - 1, bDay);
    
    // Normalize time to midnight for calculations
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let daysRemaining = Math.ceil((bDateThisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    
    // If birthday already occurred this year, calculate for next year
    if (daysRemaining < 0) {
      const bDateNextYear = new Date(currentYear + 1, bMonth - 1, bDay);
      daysRemaining = Math.ceil((bDateNextYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    const isThisWeek = daysRemaining >= 0 && daysRemaining <= 7;
    const age = currentYear - year;
    const formattedDate = `${bDay} de ${MONTH_NAMES[bMonth - 1]}`;

    return {
      member,
      isToday,
      isThisWeek,
      isThisMonth,
      day: bDay,
      month: bMonth,
      age,
      daysRemaining,
      formattedDate
    };
  };

  const birthdayList: BirthdayInfo[] = members
    .map(getBirthdayInfo)
    .filter(Boolean) as BirthdayInfo[];

  // Filter list based on search and selected tab
  const getFilteredList = (): BirthdayInfo[] => {
    let list = birthdayList;

    if (activeTab === 'hoy') {
      list = list.filter(item => item.isToday);
    } else if (activeTab === 'semana') {
      list = list.filter(item => item.isThisWeek || item.isToday);
    } else if (activeTab === 'mes') {
      list = list.filter(item => item.isThisMonth);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.member.first_name.toLowerCase().includes(q) ||
        item.member.last_name.toLowerCase().includes(q)
      );
    }

    // Sorting:
    // Today: alphabetical
    // This week: days remaining ascending
    // This month: birth day ascending
    if (activeTab === 'semana') {
      list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    } else {
      list.sort((a, b) => a.day - b.day);
    }

    return list;
  };

  const filteredBirthdays = getFilteredList();

  const handleCelebrate = (name: string) => {
    setConfettiRecipients(name);
    setShowConfetti(true);
    toast.success(`🎉 ¡Enviando felicitaciones y confeti para ${name}!`);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  // Calendar calculations
  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week for 1st of month (0 = Sun)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in month
    
    // Collect calendar cells
    const cells = [];
    
    // Blank cells before 1st day of month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, date: null });
    }

    // Real calendar days
    for (let d = 1; d <= totalDays; d++) {
      cells.push({
        day: d,
        date: new Date(year, month, d)
      });
    }

    // Map birthdays matching this month
    const monthBirthdays = birthdayList.filter(item => item.month === (month + 1));

    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
        {/* Calendar Header Navigator */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
          <button
            onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
            className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-serif font-bold text-base text-primary dark:text-gold uppercase tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
            className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
          {WEEK_DAYS.map(day => <div key={day} className="py-1">{day}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            if (!cell.day) {
              return <div key={`empty-${index}`} className="aspect-square bg-slate-50/20 dark:bg-slate-950/10 rounded-xl border border-transparent"></div>;
            }

            // Find birthdays on this specific day
            const dayBirthdays = monthBirthdays.filter(item => item.day === cell.day);
            const isTodayDate = cell.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={`day-${cell.day}`}
                className={`aspect-square rounded-xl p-1.5 border flex flex-col justify-between group transition-all duration-350 min-h-[70px] ${
                  isTodayDate
                    ? 'bg-primary/5 dark:bg-primary/20 border-primary dark:border-gold shadow-inner'
                    : 'bg-white dark:bg-slate-950 border-gray-100 dark:border-white/5 hover:border-gold hover:shadow-2xs'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-extrabold ${isTodayDate ? 'text-primary dark:text-gold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {cell.day}
                  </span>
                  {dayBirthdays.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-accent-red rounded-full animate-ping"></span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 max-h-[40px] overflow-y-auto overflow-x-hidden pt-1">
                  {dayBirthdays.map(item => {
                    const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                    return (
                      <button
                        key={item.member.id}
                        onClick={() => handleCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                        className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-[8px] border border-gold/45 overflow-hidden shrink-0 cursor-pointer relative group/avatar shadow-2xs hover:scale-110 transition-transform"
                        title={`${item.member.first_name} ${item.member.last_name} (Cumple ${item.age} años)`}
                      >
                        {item.member.photo_url ? (
                          <img loading="lazy"
                            src={item.member.photo_url}
                            alt={item.member.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 md:px-8 space-y-8 animate-fadeIn relative">
      {/* Confetti Explosion Layer */}
      {showConfetti && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.12}
          />
          {confettiRecipients && (
            <div className="absolute inset-x-0 top-1/3 flex justify-center items-center pointer-events-none z-[201] animate-bounce">
              <div className="bg-white/90 dark:bg-slate-900/90 border-2 border-gold backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-1.5 max-w-sm text-center">
                <Gift className="text-gold animate-wiggle" size={32} />
                <h4 className="font-serif font-bold text-primary dark:text-gold text-base">
                  ¡Celebrando a un Hermano! 🎉
                </h4>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Lanzando confeti para celebrar la vida de <span className="text-primary dark:text-gold font-bold">{confettiRecipients}</span>. ¡Bendiciones!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Banner Header */}
      <div className="max-w-7xl mx-auto text-center space-y-3">
        <div className="inline-flex p-3 bg-gold/10 text-gold rounded-3xl border border-gold/20 shadow-inner">
          <Gift size={28} className="animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-gold tracking-tight">
          Cumpleaños de la Congregación
        </h1>
        <p className="text-gray-450 dark:text-gray-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          Celebremos juntos la vida de nuestros hermanos en la Iglesia Jerusalén. Descubre quiénes están de cumpleaños y comparte una bendición con ellos.
        </p>
      </div>

      {/* Controls: Tabs, Views & Search */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:flex md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-3xl shadow-2xs">
        {/* Tab filters */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit border border-slate-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('hoy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hoy'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            🎂 Hoy
          </button>
          <button
            onClick={() => setActiveTab('semana')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'semana'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            📅 Próximos 7 días
          </button>
          <button
            onClick={() => setActiveTab('mes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mes'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            🗓️ Este Mes
          </button>
        </div>

        {/* Query search input */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none bg-slate-50/50 dark:bg-slate-950 dark:text-white font-medium"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={14} />
        </div>

        {/* View mode buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit border border-slate-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-xl transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-850 dark:text-gray-400 dark:hover:text-white'
            }`}
            title="Vista Tarjetas"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-850 dark:text-gray-400 dark:hover:text-white'
            }`}
            title="Vista Tabla"
          >
            <Table size={15} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-xl transition cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                : 'text-slate-500 hover:text-slate-850 dark:text-gray-400 dark:hover:text-white'
            }`}
            title="Vista Calendario"
          >
            <CalendarIcon size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-16 flex flex-col justify-center items-center gap-2 animate-pulse">
            <Gift className="animate-bounce text-primary" size={28} />
            <span className="text-xs text-gray-400 font-semibold">Cargando fechas de cumpleaños...</span>
          </div>
        ) : viewMode === 'calendar' ? (
          /* CALENDAR VIEW */
          renderCalendar()
        ) : filteredBirthdays.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-16 text-center space-y-3">
            <Gift className="mx-auto text-gray-300 dark:text-slate-800" size={48} />
            <h4 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">
              Sin Cumpleañeros
            </h4>
            <p className="text-xxs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              No se encontraron miembros para el filtro seleccionado o búsqueda actual. ¡Intenta con otro rango!
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fadeIn">
            {filteredBirthdays.map((item) => {
              const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
              return (
                <div
                  key={item.member.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-350 hover:-translate-y-1.5 flex flex-col justify-between gap-4 relative overflow-hidden group ${
                    item.isToday 
                      ? 'border-gold dark:border-gold/60 bg-gradient-to-br from-gold/5 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80 shadow-md ring-1 ring-gold/20' 
                      : 'border-gray-150 dark:border-white/10'
                  }`}
                >
                  {/* Decorative birthday background pattern */}
                  {item.isToday && (
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center rotate-12">
                      <Sparkles className="text-gold opacity-50" size={16} />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* User photo */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base overflow-hidden border shrink-0 relative ${
                      item.isToday 
                        ? 'bg-gold/20 text-gold border-gold/40' 
                        : 'bg-primary/10 text-primary dark:text-gold border-gray-100 dark:border-white/5'
                    }`}>
                      {item.member.photo_url ? (
                        <img loading="lazy"
                          src={item.member.photo_url}
                          alt={item.member.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {/* User Name & Role */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-gray-850 dark:text-white truncate">
                        {item.member.first_name} {item.member.last_name}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-gray-450 block truncate font-medium">
                        {item.member.leadership_role || 'Miembro'}
                      </span>
                    </div>
                  </div>

                  {/* Birthday info box */}
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-baseline text-xxs font-bold text-gray-400">
                      <span>Cumpleaños</span>
                      <span className="text-slate-800 dark:text-slate-200">{item.formattedDate}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xxs font-bold text-gray-400">
                      <span>Edad a Cumplir</span>
                      <span className="text-slate-800 dark:text-slate-200">{item.age} años</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[9px] font-bold text-gray-400">
                      <span>Próximo</span>
                      {item.isToday ? (
                        <span className="text-accent-red animate-pulse flex items-center gap-0.5">
                          <Sparkles size={8} /> ¡HOY!
                        </span>
                      ) : (
                        <span className="text-primary dark:text-gold">En {item.daysRemaining} días</span>
                      )}
                    </div>
                  </div>

                  {/* Dedicated Verse quote box */}
                  {item.member.dedicated_verse && (
                    <div className="px-3 py-2 bg-amber-50/25 dark:bg-amber-950/10 border border-amber-200/10 dark:border-gold/10 rounded-2xl text-center space-y-0.5">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Versículo Dedicado</span>
                      {(() => {
                        const link = getBibleLinkForVerse(item.member.dedicated_verse);
                        return link ? (
                          <Link
                            to={link}
                            className="inline-flex items-center justify-center gap-1 text-xs text-amber-700 dark:text-gold hover:text-amber-800 dark:hover:text-yellow-400 font-serif font-semibold italic hover:underline"
                          >
                            <BookOpen size={11} className="text-amber-600 dark:text-gold shrink-0" />
                            {item.member.dedicated_verse}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-650 dark:text-gray-300 font-serif italic">{item.member.dedicated_verse}</span>
                        );
                      })()}
                    </div>
                  )}

                  {/* Celebrate action button */}
                  <button
                    onClick={() => handleCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                    className={`w-full py-2 rounded-2xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer ${
                      item.isToday
                        ? 'bg-gold hover:bg-gold-dark text-slate-900 border border-gold/10'
                        : 'bg-primary hover:bg-blue-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles size={11} className={item.isToday ? 'animate-spin' : ''} />
                    <span>Celebrar 🎉</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-950/20 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Hermano</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Edad</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-300">
                  {filteredBirthdays.map((item) => {
                    const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                    return (
                      <tr 
                        key={item.member.id} 
                        className={`hover:bg-gray-50/30 dark:hover:bg-slate-850/10 transition-colors ${
                          item.isToday ? 'bg-gold/5 dark:bg-gold/10' : ''
                        }`}
                      >
                        {/* Member block */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary dark:text-gold flex items-center justify-center font-bold text-xs border border-gray-100 dark:border-white/5 shrink-0 overflow-hidden relative shadow-inner">
                              {item.member.photo_url ? (
                                <img loading="lazy"
                                  src={item.member.photo_url}
                                  alt={item.member.first_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-gray-850 dark:text-white truncate">
                                {item.member.first_name} {item.member.last_name}
                              </h5>
                              <span className="text-[9px] text-gray-450 dark:text-gray-400 block truncate">
                                {item.member.leadership_role || 'Miembro'}
                              </span>
                              {item.member.dedicated_verse && (
                                <div className="mt-0.5 flex items-center gap-1">
                                  {(() => {
                                    const link = getBibleLinkForVerse(item.member.dedicated_verse);
                                    return link ? (
                                      <Link
                                        to={link}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-amber-750 hover:text-amber-800 dark:text-gold dark:hover:text-yellow-400 font-serif italic hover:underline"
                                      >
                                        <BookOpen size={9} className="text-amber-600 dark:text-gold shrink-0" />
                                        {item.member.dedicated_verse}
                                      </Link>
                                    ) : (
                                      <span className="text-[10px] text-gray-605 dark:text-gray-300 font-serif italic">{item.member.dedicated_verse}</span>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Birth Date */}
                        <td className="px-6 py-4 font-medium text-xs">
                          {item.formattedDate}
                        </td>

                        {/* Age */}
                        <td className="px-6 py-4 text-xs font-semibold">
                          {item.age} años
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {item.isToday ? (
                            <span className="bg-red-50 text-accent-red border border-red-150 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse inline-flex items-center gap-0.5">
                              <Sparkles size={8} /> ¡Cumpleaños Hoy!
                            </span>
                          ) : (
                            <span className="text-gray-455 dark:text-gray-400 text-xxs font-semibold">
                              En {item.daysRemaining} días
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                            className="bg-gold/10 hover:bg-gold text-gold hover:text-slate-900 border border-gold/30 hover:border-gold px-3.5 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wide transition cursor-pointer"
                          >
                            🎉 Celebrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
