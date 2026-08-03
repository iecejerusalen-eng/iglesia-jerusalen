import type { BirthdayInfo } from '../hooks/useBirthdays';
import type { BirthdayViewMode } from './BirthdaysFilters';
import { BirthdaysCards } from './BirthdaysCards';
import { BirthdaysTable } from './BirthdaysTable';
import { BirthdaysCalendar } from './BirthdaysCalendar';
import { BirthdaysYearView } from './BirthdaysYearView';

interface BirthdaysListProps {
  birthdays: BirthdayInfo[];
  allBirthdays: BirthdayInfo[];
  viewMode: BirthdayViewMode;
  onCelebrate: (name: string) => void;
  currentCalendarDate: Date;
  setCurrentCalendarDate: (date: Date) => void;
}

export function BirthdaysList({
  birthdays,
  allBirthdays,
  viewMode,
  onCelebrate,
  currentCalendarDate,
  setCurrentCalendarDate
}: BirthdaysListProps) {
  if (viewMode === 'calendar') {
    return (
      <div className="max-w-7xl mx-auto mt-6">
        <BirthdaysCalendar
          birthdays={allBirthdays}
          currentCalendarDate={currentCalendarDate}
          setCurrentCalendarDate={setCurrentCalendarDate}
          onCelebrate={onCelebrate}
        />
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="max-w-7xl mx-auto mt-6">
        <BirthdaysTable birthdays={birthdays} onCelebrate={onCelebrate} />
      </div>
    );
  }

  if (viewMode === 'year') {
    return (
      <div className="max-w-7xl mx-auto mt-6">
        <BirthdaysYearView birthdays={allBirthdays} onCelebrate={onCelebrate} />
      </div>
    );
  }

  // Cards view
  return (
    <div className="max-w-7xl mx-auto mt-6">
      <BirthdaysCards birthdays={birthdays} onCelebrate={onCelebrate} />
    </div>
  );
}
