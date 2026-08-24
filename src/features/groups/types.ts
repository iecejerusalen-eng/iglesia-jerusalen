export interface SmallGroup {
  id: string;
  name: string;
  description?: string;
  category: 'hombres' | 'mujeres' | 'jovenes' | 'matrimonios' | 'mixtos' | 'general' | string;
  meeting_day: string;
  meeting_time: string;
  location_name?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  leader_id?: string;
  leader_name?: string;
  max_members?: number;
  max_capacity?: number;
  is_active: boolean;
  member_count?: number;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'leader' | 'co_leader' | 'member';
  status: 'pending' | 'active' | 'inactive';
  joined_at: string;
}
