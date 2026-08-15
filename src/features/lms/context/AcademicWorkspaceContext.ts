import { createContext } from 'react';
import type { LMSAcademicPeriod, LMSSchool } from '../../../types';

export interface AcademicWorkspaceValue {
  school: LMSSchool;
  periods: LMSAcademicPeriod[];
  activePeriod: LMSAcademicPeriod | null;
  selectedPeriodId: string;
  setSelectedPeriodId: (periodId: string) => void;
  isLoading: boolean;
  error: Error | null;
}

export const AcademicWorkspaceContext = createContext<AcademicWorkspaceValue | null>(null);
