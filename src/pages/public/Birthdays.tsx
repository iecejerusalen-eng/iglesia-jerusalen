import { useState } from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';

import { useBirthdays, type BirthdayInfo, MONTH_NAMES } from '../../features/birthdays/hooks/useBirthdays';
import { BirthdaysHero } from '../../features/birthdays/components/BirthdaysHero';
import { BirthdaysFilters, type BirthdayTab, type BirthdayViewMode } from '../../features/birthdays/components/BirthdaysFilters';
import { BirthdaysList } from '../../features/birthdays/components/BirthdaysList';
import CalendarPdfDialog from '../../components/common/CalendarPdfDialog';
import { exportBirthdaysPdf } from '../../utils/calendarPdfExport';

export default function Birthdays() {
  const { birthdayList, loading } = useBirthdays();
  const { width, height } = useWindowSize();
  
  // States
  const [activeTab, setActiveTab] = useState<BirthdayTab>('semana');
  const [viewMode, setViewMode] = useState<BirthdayViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Confetti controls
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRecipients, setConfettiRecipients] = useState<string>('');
  
  // PDF controls
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  // Filter logic
  const getFilteredList = (): BirthdayInfo[] => {
    let list = [...birthdayList];

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

    if (activeTab === 'semana') {
      list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    } else {
      list.sort((a, b) => a.day - b.day);
    }

    return list;
  };

  const getCalendarList = (): BirthdayInfo[] => {
    let list = [...birthdayList];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.member.first_name.toLowerCase().includes(q) ||
        item.member.last_name.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredBirthdays = getFilteredList();
  const calendarBirthdays = getCalendarList();

  const handleCelebrate = (name: string) => {
    setConfettiRecipients(name);
    setShowConfetti(true);
    toast.success(`🎉 ¡Enviando felicitaciones y confeti para ${name}!`);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    const filterLabel = viewMode === 'calendar'
      ? `${MONTH_NAMES[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`
      : viewMode === 'year'
        ? `Año ${new Date().getFullYear()}`
        : activeTab === 'hoy' ? 'Hoy' : activeTab === 'semana' ? 'Próximos 7 días' : 'Este Mes';

    const pdfList = (viewMode === 'calendar' || viewMode === 'year') ? calendarBirthdays : filteredBirthdays;

    exportBirthdaysPdf(pdfList, {
      viewMode,
      orientation,
      filterLabel,
      calendarMonth: `${MONTH_NAMES[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950/70 transition-colors duration-200 py-10 px-4 md:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-church-gold/5 dark:from-church-gold/10 to-transparent -z-10"></div>
      
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
              <div className="bg-white/90 dark:bg-slate-900/90 border-2 border-church-gold-medium backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-1.5 max-w-sm text-center">
                <Gift className="text-church-gold-dark dark:text-church-gold-bright animate-wiggle" size={32} />
                <h4 className="font-serif font-bold text-primary dark:text-white text-base">
                  ¡Celebrando a un Hermano! 🎉
                </h4>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lanzando confeti para celebrar la vida de <span className="text-primary dark:text-church-gold-light font-bold">{confettiRecipients}</span>. ¡Bendiciones!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <BirthdaysHero />

      {/* Main Content Area */}
      <main className="mt-8 space-y-6">
        <BirthdaysFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExportPdf={() => setShowPdfDialog(true)}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-church-gold-light"></div>
          </div>
        ) : (
          <BirthdaysList
            birthdays={filteredBirthdays}
            allBirthdays={calendarBirthdays}
            viewMode={viewMode}
            onCelebrate={handleCelebrate}
            currentCalendarDate={currentCalendarDate}
            setCurrentCalendarDate={setCurrentCalendarDate}
          />
        )}
      </main>

      {/* PDF Export Dialog */}
      {showPdfDialog && (
        <CalendarPdfDialog
          onClose={() => setShowPdfDialog(false)}
          onExport={(orientation) => handleExportPdf(orientation)}
          title="Exportar Cumpleaños"
        />
      )}
    </div>
  );
}
