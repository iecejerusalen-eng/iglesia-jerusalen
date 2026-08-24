export interface SmallGroup {
  id: string;
  name: string;
  description?: string;
  category: 'hombres' | 'mujeres' | 'jovenes' | 'matrimonios' | 'mixtos' | 'general';
  meeting_day: string;
  meeting_time: string;
  location_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  leader_id?: string;
  max_members: number;
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
