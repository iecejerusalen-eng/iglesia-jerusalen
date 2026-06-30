export interface MinistryOption {
  id: string;
  name: string;
}

export interface LogoData {
  id: string;
  ministry_id: string | null;
  variant: 'cuadrado' | 'circular' | 'vertical' | 'horizontal';
  color_mode: 'color' | 'blanco_y_negro' | 'blanco_solido' | 'negro_solido';
  format: string;
  storage_path: string;
  created_at: string;
  ministries: { name: string } | null;
}
