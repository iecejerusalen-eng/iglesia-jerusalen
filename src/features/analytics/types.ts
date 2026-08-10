export type AnalyticsSource =
  | 'members'
  | 'donations'
  | 'inventory'
  | 'form_responses'
  | 'petitions'
  | 'orders'
  | 'songs'
  | 'events';

export type DateFilter = 'all' | '30days' | '90days' | 'thisyear';
export type AnalyticsTab = 'dashboard' | 'builder' | 'forms';

export interface Widget {
  id: string;
  title: string;
  source: AnalyticsSource;
  dimension: string;
  metric: string;
  aggregation: 'count' | 'sum' | 'avg';
  targetField: string;
  chartType: 'bar' | 'line' | 'pie' | 'kpi' | 'table' | 'area';
}

export interface AnalyticsRow {
  id: string;
  created_at?: string | null;
  date?: string | null;
  start_date?: string | null;
  [key: string]: unknown;
}

export interface FormResponseData extends AnalyticsRow {
  member_name: string | null;
  member_email: string | null;
  block_id: string;
  page_id: string;
  answers: Record<string, unknown>;
  score: number | null;
  max_score: number | null;
  created_at: string;
}

export interface AnalyticsDatasets {
  members: AnalyticsRow[];
  donations: AnalyticsRow[];
  inventory: AnalyticsRow[];
  formResponses: FormResponseData[];
  petitions: AnalyticsRow[];
  orders: AnalyticsRow[];
  songs: AnalyticsRow[];
  events: AnalyticsRow[];
}

export interface ChartDataPoint {
  name: string;
  valor: number;
  count: number;
  total: number;
  sortTimestamp?: number;
}
