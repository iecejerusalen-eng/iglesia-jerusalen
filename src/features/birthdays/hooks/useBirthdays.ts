import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { Member } from '../../../types';
import { toast } from 'sonner';

export interface BirthdayInfo {
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

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function useBirthdays() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .is('deleted_at', null);

      if (error) throw error;
      setMembers(data || []);
    } catch (err: unknown) {
      console.error('Error fetching members:', err);
      toast.error('Error al cargar cumpleañeros: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

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

  return {
    birthdayList,
    loading,
    refetch: fetchMembers
  };
}
