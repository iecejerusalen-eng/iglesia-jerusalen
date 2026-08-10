import { useMemo } from 'react';
import type {
  AnalyticsDatasets,
  AnalyticsRow,
  ChartDataPoint,
  DateFilter,
  Widget,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRowDate(row: AnalyticsRow): Date | null {
  const raw = row.created_at ?? row.date ?? row.start_date;
  if (typeof raw !== 'string' || !raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function filterRowsByDate(
  rows: AnalyticsRow[],
  dateFilter: DateFilter,
  now = new Date(),
): AnalyticsRow[] {
  if (dateFilter === 'all') return rows;
  return rows.filter((row) => {
    const date = getRowDate(row);
    if (!date) return false;
    if (dateFilter === 'thisyear') return date.getFullYear() === now.getFullYear();
    const ageMs = now.getTime() - date.getTime();
    const limit = dateFilter === '30days' ? 30 * DAY_MS : 90 * DAY_MS;
    return ageMs >= 0 && ageMs <= limit;
  });
}

function getDataset(source: Widget['source'], datasets: AnalyticsDatasets): AnalyticsRow[] {
  return source === 'form_responses' ? datasets.formResponses : datasets[source];
}

function numberValue(row: AnalyticsRow, targetField: string): number {
  if (!targetField) return 0;
  if (targetField.includes('*')) {
    const [left, right] = targetField.split('*').map((field) => field.trim());
    return (Number(row[left]) || 0) * (Number(row[right]) || 0);
  }
  return Number(row[targetField]) || 0;
}

function ageInYears(birthDate: Date, today: Date): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function dimensionKey(row: AnalyticsRow, dimension: string, now: Date) {
  if (dimension === 'month') {
    const date = getRowDate(row);
    if (!date) return { label: 'Sin fecha', sortTimestamp: Number.MAX_SAFE_INTEGER };
    return {
      label: new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' })
        .format(date)
        .replace('.', '')
        .toUpperCase(),
      sortTimestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
    };
  }

  if (dimension === 'age_group') {
    const birth = typeof row.birth_date === 'string' ? new Date(row.birth_date) : null;
    if (!birth || Number.isNaN(birth.getTime())) return { label: 'Desconocido' };
    const age = ageInYears(birth, now);
    if (age < 12) return { label: 'Niños (0–11)' };
    if (age < 18) return { label: 'Adolescentes (12–17)' };
    if (age < 30) return { label: 'Jóvenes (18–29)' };
    if (age < 50) return { label: 'Adultos (30–49)' };
    return { label: 'Mayores (50+)' };
  }

  if (dimension === 'score_range') {
    const score = Number(row.score);
    const maxScore = Number(row.max_score);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
      return { label: 'Formulario libre' };
    }
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { label: 'Excelente (90–100)' };
    if (percentage >= 70) return { label: 'Bueno (70–89)' };
    if (percentage >= 50) return { label: 'Regular (50–69)' };
    return { label: 'Por reforzar (<50)' };
  }

  if (dimension === 'bpm_range') {
    const bpm = Number(row.bpm);
    if (!Number.isFinite(bpm) || bpm <= 0) return { label: 'Sin BPM' };
    if (bpm < 70) return { label: 'Lento (<70)' };
    if (bpm < 100) return { label: 'Medio (70–99)' };
    if (bpm < 130) return { label: 'Movido (100–129)' };
    return { label: 'Rápido (130+)' };
  }

  const raw = row[dimension];
  return { label: raw === null || raw === undefined || raw === '' ? 'Desconocido' : String(raw) };
}

export function buildChartData(
  widget: Omit<Widget, 'id'>,
  datasets: AnalyticsDatasets,
  dateFilter: DateFilter,
  now = new Date(),
): ChartDataPoint[] {
  const dataset = filterRowsByDate(getDataset(widget.source, datasets), dateFilter, now);
  const groups = new Map<string, { rows: AnalyticsRow[]; sortTimestamp?: number }>();

  dataset.forEach((row) => {
    const { label, sortTimestamp } = dimensionKey(row, widget.dimension, now);
    const group = groups.get(label) ?? { rows: [], sortTimestamp };
    group.rows.push(row);
    groups.set(label, group);
  });

  const result = Array.from(groups, ([name, group]) => {
    const total = group.rows.reduce((sum, row) => sum + numberValue(row, widget.targetField), 0);
    const value =
      widget.aggregation === 'count'
        ? group.rows.length
        : widget.aggregation === 'sum'
          ? total
          : group.rows.length > 0
            ? total / group.rows.length
            : 0;
    return {
      name,
      valor: Math.round(value * 100) / 100,
      count: group.rows.length,
      total,
      sortTimestamp: group.sortTimestamp,
    };
  });

  return result.sort((left, right) =>
    widget.dimension === 'month'
      ? (left.sortTimestamp ?? 0) - (right.sortTimestamp ?? 0)
      : right.valor - left.valor,
  );
}

export function useChartData(
  widget: Omit<Widget, 'id'>,
  datasets: AnalyticsDatasets | undefined,
  dateFilter: DateFilter,
) {
  return useMemo(
    () => (datasets ? buildChartData(widget, datasets, dateFilter) : []),
    [widget, datasets, dateFilter],
  );
}
