import type { Cell } from '../../types';

export type StrategicMapMode = 'pastoral' | 'cells' | 'expansion' | 'quality';

export interface StrategicMapMember {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_leader: boolean;
  leadership_role: string | null;
  ministry_id: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  phone_country_code: string | null;
  address: string | null;
  created_at: string;
}

export interface StrategicMapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon_type: 'emoji' | 'svg';
  icon_value: string;
  address_street: string | null;
  description: string | null;
}

export interface StrategicMapLeader {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export type StrategicMapSelection =
  | { type: 'member'; data: StrategicMapMember }
  | { type: 'cell'; data: Cell }
  | { type: 'church'; data: { name: string; latitude: number; longitude: number; address: string; description: string } }
  | { type: 'location'; data: StrategicMapLocation };

export interface StrategicMapMetrics {
  membersWithLocation: number;
  membersWithoutLocation: number;
  cellsWithLocation: number;
  coveredMembers: number;
  uncoveredMembers: number;
  dataCoverage: number;
}
