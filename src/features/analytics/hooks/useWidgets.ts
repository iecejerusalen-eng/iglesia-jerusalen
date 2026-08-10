import { useEffect, useState } from 'react';
import type { Widget } from '../types';
import { PRESETS } from '../constants';

function loadWidgets(): Widget[] {
  const saved = localStorage.getItem('ij_analytics_widgets');
  if (!saved) return PRESETS;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('La configuración guardada no es una lista.');
    return parsed as Widget[];
  } catch (error) {
    console.error('No se pudo restaurar la configuración de analíticas.', error);
    return PRESETS;
  }
}

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);

  useEffect(() => {
    localStorage.setItem('ij_analytics_widgets', JSON.stringify(widgets));
  }, [widgets]);

  return { widgets, setWidgets, isLoaded: true };
}
