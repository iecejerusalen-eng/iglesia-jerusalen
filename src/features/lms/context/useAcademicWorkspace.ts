import { useContext } from 'react';
import { AcademicWorkspaceContext } from './AcademicWorkspaceContext';

export function useAcademicWorkspace() {
  const value = useContext(AcademicWorkspaceContext);
  if (!value) throw new Error('useAcademicWorkspace debe utilizarse dentro de AcademicWorkspaceProvider.');
  return value;
}
