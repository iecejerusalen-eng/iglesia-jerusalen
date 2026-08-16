import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

export interface PublicBirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  birth_month: number;
  birth_day: number;
  ministry_name: string | null;
  dedicated_verse: string | null;
}

export type BirthdayStatus = 'today' | 'tomorrow' | 'upcoming' | 'passed-this-month';

export interface BirthdayInfo {
  member: PublicBirthdayMember;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  hasPassedThisMonth: boolean;
  day: number;
  month: number;
  daysRemaining: number;
  status: BirthdayStatus;
  formattedDate: string;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export function isPublicBirthdayMember(value: unknown): value is PublicBirthdayMember {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string'
    && typeof row.first_name === 'string'
    && typeof row.last_name === 'string'
    && typeof row.birth_month === 'number'
    && row.birth_month >= 1
    && row.birth_month <= 12
    && typeof row.birth_day === 'number'
    && row.birth_day >= 1
    && row.birth_day <= 31;
}

function getBirthdayDate(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, daysInMonth));
}

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDateOnlyTimestamp(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getBirthdayDayForYear(member: PublicBirthdayMember, year: number): number {
  const daysInMonth = new Date(year, member.birth_month, 0).getDate();
  return Math.min(member.birth_day, daysInMonth);
}

export function toBirthdayInfo(member: PublicBirthdayMember, now: Date): BirthdayInfo {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYearBirthday = getBirthdayDate(today.getFullYear(), member.birth_month, member.birth_day);
  let nextBirthday = currentYearBirthday;
  const isThisMonth = member.birth_month === today.getMonth() + 1;
  const hasPassedThisMonth = isThisMonth && getDateOnlyTimestamp(currentYearBirthday) < getDateOnlyTimestamp(today);

  if (getDateOnlyTimestamp(nextBirthday) < getDateOnlyTimestamp(today)) {
    nextBirthday = getBirthdayDate(today.getFullYear() + 1, member.birth_month, member.birth_day);
  }

  const daysRemaining = Math.round((getDateOnlyTimestamp(nextBirthday) - getDateOnlyTimestamp(today)) / 86_400_000);
  const isToday = getDateOnlyTimestamp(currentYearBirthday) === getDateOnlyTimestamp(today);
  const status: BirthdayStatus = isToday
    ? 'today'
    : daysRemaining === 1
      ? 'tomorrow'
      : hasPassedThisMonth
        ? 'passed-this-month'
        : 'upcoming';

  return {
    member,
    isToday,
    isThisWeek: daysRemaining >= 0 && daysRemaining < 7,
    isThisMonth,
    hasPassedThisMonth,
    day: member.birth_day,
    month: member.birth_month,
    daysRemaining,
    status,
    formattedDate: `${member.birth_day} de ${MONTH_NAMES[member.birth_month - 1]}`,
  };
}

export function getBirthdayStatusLabel(item: BirthdayInfo): string {
  if (item.status === 'today') return '¡Es hoy!';
  if (item.status === 'tomorrow') return 'Mañana';
  if (item.status === 'passed-this-month') return 'Ya pasó este mes';
  return `En ${item.daysRemaining} días`;
}

export async function fetchPublicBirthdays(): Promise<PublicBirthdayMember[]> {
  const { data, error: requestError } = await supabase.rpc('get_public_birthdays');
  if (requestError) throw requestError;

  if (!Array.isArray(data)) {
    throw new Error('La fuente de cumpleaños devolvió un formato inesperado.');
  }

  const invalidRows = data.filter((row) => !isPublicBirthdayMember(row));
  if (invalidRows.length > 0) {
    throw new Error(`La fuente de cumpleaños devolvió ${invalidRows.length} registro(s) inválido(s).`);
  }

  return data;
}

export function useBirthdays() {
  const [calendarDay, setCalendarDay] = useState(() => getLocalDateKey(new Date()));
  const birthdaysQuery = useQuery({
    queryKey: ['publicBirthdaysRaw'],
    queryFn: fetchPublicBirthdays,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCalendarDay((current) => {
        const next = getLocalDateKey(new Date());
        return current === next ? current : next;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (birthdaysQuery.error) {
      console.error('Error loading public birthdays:', birthdaysQuery.error);
      toast.error('No pudimos cargar los cumpleaños del CRM.');
    }
  }, [birthdaysQuery.error]);

  const currentDate = useMemo(() => {
    const [year, monthIndex, day] = calendarDay.split('-').map(Number);
    return new Date(year, monthIndex, day, 12);
  }, [calendarDay]);
  const birthdayList = useMemo(
    () => {
      return (birthdaysQuery.data || [])
        .map((member) => toBirthdayInfo(member, currentDate))
        .sort((a, b) => a.daysRemaining - b.daysRemaining || a.day - b.day || a.member.last_name.localeCompare(b.member.last_name, 'es'));
    },
    [birthdaysQuery.data, currentDate]
  );

  return {
    birthdayList,
    loading: birthdaysQuery.isLoading,
    refreshing: birthdaysQuery.isFetching && !birthdaysQuery.isLoading,
    error: birthdaysQuery.error instanceof Error ? birthdaysQuery.error.message : birthdaysQuery.error ? 'No fue posible consultar el CRM.' : null,
    lastUpdated: birthdaysQuery.dataUpdatedAt ? new Date(birthdaysQuery.dataUpdatedAt) : null,
    refetch: birthdaysQuery.refetch,
  };
}
