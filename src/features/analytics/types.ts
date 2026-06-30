export interface Widget {
  id: string;
  title: string;
  source: 'members' | 'donations' | 'inventory' | 'form_responses' | 'petitions' | 'orders' | 'songs' | 'events';
  dimension: string;
  metric: string;
  aggregation: 'count' | 'sum' | 'avg';
  targetField: string;
  chartType: 'bar' | 'line' | 'pie' | 'kpi' | 'table' | 'area';
}

export interface AnalyticsDatasets {
  members: any[];
  donations: any[];
  inventory: any[];
  formResponses: any[];
  petitions: any[];
  orders: any[];
  songs: any[];
  events: any[];
}

export interface FormResponseData {
  id: string;
  member_name: string;
  member_email: string;
  block_id: string;
  page_id: string;
  answers: Record<string, any>;
  score: number | null;
  max_score: number | null;
  created_at: string;
}
