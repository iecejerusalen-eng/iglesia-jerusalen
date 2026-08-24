export interface CrmStage {
  id: string;
  name: string;
  color: string;
}

export interface CrmPipeline {
  id: string;
  name: string;
  description?: string;
  stages: CrmStage[];
  is_default: boolean;
  created_at?: string;
}

export interface CrmContact {
  id: string;
  pipeline_id?: string;
  stage_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source: 'web_form' | 'qr_checkin' | 'event' | 'manual';
  assigned_to?: string;
  member_id?: string;
  custom_fields?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  contact_id: string;
  type: 'stage_change' | 'note' | 'email_sent' | 'sms_sent' | 'call' | 'meeting';
  title: string;
  details?: string;
  created_by?: string;
  created_at: string;
}
