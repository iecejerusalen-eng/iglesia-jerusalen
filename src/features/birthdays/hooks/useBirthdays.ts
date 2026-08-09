import { useCallback, useEffect, useMemo, useState } from 'react';
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

export interface BirthdayInfo {
  member: PublicBirthdayMember;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  day: number;
  month: number;
  daysRemaining: number;
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

export function toBirthdayInfo(member: PublicBirthdayMember, now: Date): BirthdayInfo {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBirthday = getBirthdayDate(today.getFullYear(), member.birth_month, member.birth_day);
  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = getBirthdayDate(today.getFullYear() + 1, member.birth_month, member.birth_day);
  }

  const daysRemaining = Math.round((nextBirthday.getTime() - today.getTime()) / 86_400_000);
  const isToday = member.birth_day === today.getDate() && member.birth_month === today.getMonth() + 1;

  return {
    member,
    isToday,
    isThisWeek: daysRemaining >= 0 && daysRemaining <= 7,
    isThisMonth: member.birth_month === today.getMonth() + 1,
    day: member.birth_day,
    month: member.birth_month,
    daysRemaining,
    formattedDate: `${member.birth_day} de ${MONTH_NAMES[member.birth_month - 1]}`,
  };
}

export function useBirthdays() {
  const [members, setMembers] = useState<PublicBirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: requestError } = await supabase.rpc('get_public_birthdays');
      if (requestError) throw requestError;

      if (!Array.isArray(data)) {
        throw new Error('La fuente de cumpleaños devolvió un formato inesperado.');
      }

      const invalidRows = data.filter((row) => !isPublicBirthdayMember(row));
      if (invalidRows.length > 0) {
        throw new Error(`La fuente de cumpleaños devolvió ${invalidRows.length} registro(s) inválido(s).`);
      }

      setMembers(data);
      setLastUpdated(new Date());
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'No fue posible consultar el CRM.';
      console.error('Error loading public birthdays:', caughtError);
      setMembers([]);
      setError(message);
      toast.error('No pudimos cargar los cumpleaños del CRM.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const birthdayList = useMemo(
    () => members.map((member) => toBirthdayInfo(member, new Date())).sort((a, b) => a.daysRemaining - b.daysRemaining),
    [members]
  );

  return { birthdayList, loading, error, lastUpdated, refetch: fetchMembers };
}
