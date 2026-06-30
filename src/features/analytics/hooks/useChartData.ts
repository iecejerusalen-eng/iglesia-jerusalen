import { useMemo } from 'react';
import type { Widget, AnalyticsDatasets } from '../types';

export function useChartData(widget: Omit<Widget, 'id'>, datasets: AnalyticsDatasets | undefined, dateFilter: string) {
  return useMemo(() => {
    if (!datasets || !widget) return [];

    const sourceKey = widget.source === 'form_responses' ? 'formResponses' : widget.source;
    let dataset = (datasets as any)[sourceKey] || [];

    if (dateFilter !== 'all') {
      const now = new Date();
      dataset = dataset.filter((item: any) => {
        const d = new Date(item.created_at || item.date || item.start_date || now);
        if (dateFilter === '30days') return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        if (dateFilter === '90days') return (now.getTime() - d.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        if (dateFilter === 'thisyear') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    const groups: Record<string, any[]> = {};
    dataset.forEach((item: any) => {
      let key = 'N/A';

      if (widget.dimension === 'month') {
        const d = new Date(item.created_at || item.date || item.start_date || new Date());
        key = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase();
      } else if (widget.dimension === 'age_group') {
        const birth = new Date(item.birth_date);
        if (isNaN(birth.getTime())) key = 'Desconocido';
        else {
          const age = new Date().getFullYear() - birth.getFullYear();
          if (age < 12) key = 'Niños (0-11)';
          else if (age < 18) key = 'Adolescentes (12-17)';
          else if (age < 30) key = 'Jóvenes (18-29)';
          else if (age < 50) key = 'Adultos (30-49)';
          else key = 'Mayores (50+)';
        }
      } else if (widget.dimension === 'score_range') {
        const score = item.score;
        if (score === null || score === undefined) key = 'Form. Libre';
        else {
          const pct = (score / (item.max_score || 100)) * 100;
          if (pct >= 90) key = 'Excelente (90-100)';
          else if (pct >= 70) key = 'Bueno (70-89)';
          else if (pct >= 50) key = 'Regular (50-69)';
          else key = 'Deficiente (<50)';
        }
      } else if (widget.dimension === 'bpm_range') {
        const bpm = item.bpm;
        if (!bpm) key = 'Sin BPM';
        else if (bpm < 70) key = 'Lento (<70)';
        else if (bpm < 100) key = 'Medio (70-100)';
        else if (bpm < 130) key = 'Movido (100-130)';
        else key = 'Rápido (>130)';
      } else {
        key = String(item[widget.dimension] || 'Desconocido');
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const result = Object.keys(groups).map(key => {
      const groupItems = groups[key];
      let val = 0;
      if (widget.aggregation === 'count') {
        val = groupItems.length;
      } else if (widget.aggregation === 'sum') {
        val = groupItems.reduce((acc, curr) => {
          let fieldVal = 0;
          if (widget.targetField.includes('*')) {
            const [f1, f2] = widget.targetField.split('*').map(s => s.trim());
            fieldVal = (Number(curr[f1]) || 0) * (Number(curr[f2]) || 0);
          } else {
            fieldVal = Number(curr[widget.targetField]) || 0;
          }
          return acc + fieldVal;
        }, 0);
      } else if (widget.aggregation === 'avg') {
        const sum = groupItems.reduce((acc, curr) => acc + (Number(curr[widget.targetField]) || 0), 0);
        val = groupItems.length > 0 ? sum / groupItems.length : 0;
      }
      return { name: key, valor: Math.round(val * 100) / 100 };
    });

    if (widget.dimension === 'month') {
      const monthOrder: Record<string, number> = { 'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12 };
      result.sort((a, b) => {
        const [mA, yA] = a.name.split(' ');
        const [mB, yB] = b.name.split(' ');
        if (yA !== yB) return Number(yA) - Number(yB);
        return (monthOrder[mA] || 0) - (monthOrder[mB] || 0);
      });
    } else {
      result.sort((a, b) => b.valor - a.valor);
    }

    return result;
  }, [widget, datasets, dateFilter]);
}
