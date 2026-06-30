export interface WeeklyAlert {
  id: string;
  name: string;
  type: 'birthday' | 'faith';
  dateLabel: string;
  years?: string;
  verse: string;
}

export interface AgeDataPoint {
  range: string;
  cantidad: number;
}

export interface AreaDataPoint {
  name: string;
  miembros: number;
}

export interface TalentDataPoint {
  name: string;
  value: number;
}

export interface TalentCategoryDataPoint {
  name: string;
  value: number;
}

export interface BaptismDataPoint {
  year: string;
  cantidad: number;
}

export interface DashboardMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  conversion_date?: string | null;
  baptism_date?: string | null;
  is_leader?: boolean;
  member_service_areas?: Array<{
    catalog_roles?: {
      name: string;
    } | null;
  }> | null;
  member_talents?: Array<{
    catalog_roles?: {
      name: string;
    } | null;
  }> | null;
}

export interface DashboardStats {
  usersCount: number;
  sermonsCount: number;
  totalDonationsAmount: number;
  membersCount: number;
  leadersCount: number;
  inventoryCount: number;
  inventoryValue: number;
  petitionsCount: number;
  pendingPetitions: number;
  ministriesCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  alerts: WeeklyAlert[];
  ageData: AgeDataPoint[];
  areasData: AreaDataPoint[];
  talentsData: TalentDataPoint[];
  talentCategoriesData: TalentCategoryDataPoint[];
  baptismsData: BaptismDataPoint[];
}
