export interface EventCheckin {
  id: string;
  event_type: 'sunday_service' | 'kids_ministry' | 'event' | 'group_meeting';
  event_id?: string;
  user_id?: string;
  guest_name: string;
  phone?: string;
  security_code?: string;
  allergy_notes?: string;
  checked_in_at: string;
  checked_out_at?: string;
}
