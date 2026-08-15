import { UniversityCalendar } from '../../lms/components/UniversityCalendar';

interface StudentCalendarProps {
  schoolId: string;
  periodId?: string | null;
  userId?: string;
}

export function StudentCalendar({ schoolId, periodId, userId }: StudentCalendarProps) {
  return <UniversityCalendar role="student" schoolId={schoolId} periodId={periodId} userId={userId} />;
}
