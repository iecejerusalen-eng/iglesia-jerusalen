export type CargoMinisterial = 
  | 'Pastor'
  | 'Consejero'
  | 'Consejera'
  | 'Consejera Secretaria'
  | 'Consejera Tesorero'
  | 'Coordinador'
  | 'Coordinadora'
  | 'Sub-Coordinador'
  | 'Sub-Coordinadora'
  | 'Secretario'
  | 'Secretaria'
  | 'Tesorero'
  | 'Tesorera'
  | 'Vocal'
  | 'Superintendente';

export interface MiembroDirectiva {
  cargo: CargoMinisterial;
  nombre: string | null; // null represents a vacant position
}

export interface Departamento {
  id: string;
  nombre: string;
  directiva: MiembroDirectiva[];
}
