import { describe, expect, it } from 'vitest';
import type { AnalyticsDatasets, AnalyticsRow, Widget } from '../types';
import { buildChartData, filterRowsByDate } from './useChartData';

const emptyDatasets = (): AnalyticsDatasets => ({
  members: [],
  donations: [],
  inventory: [],
  formResponses: [],
  petitions: [],
  orders: [],
  songs: [],
  events: [],
});

const widget = (overrides: Partial<Omit<Widget, 'id'>> = {}): Omit<Widget, 'id'> => ({
  title: 'Informe',
  source: 'donations',
  dimension: 'status',
  metric: 'Monto',
  aggregation: 'sum',
  targetField: 'amount',
  chartType: 'bar',
  ...overrides,
});

describe('analytics chart preparation', () => {
  it('excludes undated and future rows from a recent period', () => {
    const rows: AnalyticsRow[] = [
      { id: 'recent', created_at: '2026-08-05T12:00:00Z' },
      { id: 'old', created_at: '2026-05-01T12:00:00Z' },
      { id: 'future', created_at: '2026-09-01T12:00:00Z' },
      { id: 'undated' },
    ];

    expect(filterRowsByDate(rows, '30days', new Date('2026-08-10T12:00:00Z')).map((row) => row.id))
      .toEqual(['recent']);
  });

  it('keeps missing dates visible as Sin fecha for the complete history', () => {
    const datasets = emptyDatasets();
    datasets.donations = [{ id: 'one', amount: 10 }];

    expect(buildChartData(widget({ dimension: 'month' }), datasets, 'all')).toEqual([
      { name: 'Sin fecha', valor: 10, count: 1, total: 10, sortTimestamp: Number.MAX_SAFE_INTEGER },
    ]);
  });

  it('preserves counts and totals so a global average can be weighted correctly', () => {
    const datasets = emptyDatasets();
    datasets.donations = [
      { id: 'one', status: 'A', amount: 10 },
      { id: 'two', status: 'A', amount: 20 },
      { id: 'three', status: 'B', amount: 100 },
    ];

    expect(buildChartData(widget({ aggregation: 'avg' }), datasets, 'all')).toEqual([
      { name: 'B', valor: 100, count: 1, total: 100, sortTimestamp: undefined },
      { name: 'A', valor: 15, count: 2, total: 30, sortTimestamp: undefined },
    ]);
  });
});
