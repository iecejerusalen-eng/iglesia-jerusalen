import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import type { LMSAcademicPeriod, LMSSchool } from '../../../types';
import { AcademicWorkspaceContext, type AcademicWorkspaceValue } from './AcademicWorkspaceContext';

interface ProviderProps {
  school: LMSSchool;
  children: ReactNode;
}

export function AcademicWorkspaceProvider({ school, children }: ProviderProps) {
  const { user } = useAuthStore();
  const storageKey = `lms-period:${user?.id ?? 'anonymous'}:${school.id}`;
  const [periods, setPeriods] = useState<LMSAcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodIdState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('lms_academic_periods')
      .select('id, school_id, name, start_date, end_date, is_active, created_at, updated_at')
      .eq('school_id', school.id)
      .order('start_date', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          setError(queryError);
          setPeriods([]);
          setIsLoading(false);
          return;
        }
        const nextPeriods = (data ?? []) as LMSAcademicPeriod[];
        setPeriods(nextPeriods);
        const stored = window.localStorage.getItem(storageKey);
        const fallback = nextPeriods.find((period) => period.is_active)?.id ?? nextPeriods[0]?.id ?? '';
        setSelectedPeriodIdState(stored && nextPeriods.some((period) => period.id === stored) ? stored : fallback);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [school.id, storageKey]);

  const setSelectedPeriodId = useCallback((periodId: string) => {
    setSelectedPeriodIdState(periodId);
    window.localStorage.setItem(storageKey, periodId);
  }, [storageKey]);

  const value = useMemo<AcademicWorkspaceValue>(() => ({
    school,
    periods,
    activePeriod: periods.find((period) => period.id === selectedPeriodId) ?? null,
    selectedPeriodId,
    setSelectedPeriodId,
    isLoading,
    error,
  }), [school, periods, selectedPeriodId, setSelectedPeriodId, isLoading, error]);

  return <AcademicWorkspaceContext.Provider value={value}>{children}</AcademicWorkspaceContext.Provider>;
}
