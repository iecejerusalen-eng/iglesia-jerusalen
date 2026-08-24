export interface PrayerPost {
  id: string;
  author_id?: string;
  author_name: string;
  is_anonymous: boolean;
  title: string;
  content: string;
  category: 'salud' | 'familia' | 'finanzas' | 'trabajo' | 'misiones' | 'gratitud';
  prayer_count: number;
  is_answered: boolean;
  answer_testimony?: string;
  user_has_prayed?: boolean;
  created_at: string;
}
