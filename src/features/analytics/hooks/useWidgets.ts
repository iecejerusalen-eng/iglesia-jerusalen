import { useState, useEffect } from 'react';
import type { Widget } from '../types';
import { PRESETS } from '../constants';

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ij_analytics_widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        setWidgets(PRESETS);
      }
    } else {
      setWidgets(PRESETS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ij_analytics_widgets', JSON.stringify(widgets));
    }
  }, [widgets, isLoaded]);

  return {
    widgets,
    setWidgets,
    isLoaded
  };
}
