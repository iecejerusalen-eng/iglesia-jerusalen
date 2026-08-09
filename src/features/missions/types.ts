export type JoshuaResource = 'daily' | 'totals' | 'countries' | 'people-groups' | 'languages';

export interface JoshuaRecord {
  id: string;
  name: string;
  country?: string;
  continent?: string;
  region?: string;
  language?: string;
  religion?: string;
  population?: number;
  unreachedPopulation?: number;
  peopleGroups?: number;
  unreachedGroups?: number;
  evangelicalPercent?: number;
  christianPercent?: number;
  progressScale?: number;
  photoUrl?: string;
  sourceUrl?: string;
  attributes: Record<string, string | number | boolean | null>;
}

export interface JoshuaResponse {
  resource: JoshuaResource;
  records: JoshuaRecord[];
  page: number;
  limit: number;
  total?: number;
  fetchedAt: string;
  cached: boolean;
  source: 'Joshua Project';
}

export type MissionScope = 'local' | 'national' | 'international';
