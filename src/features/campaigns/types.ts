export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  category: string;
  created_at?: string;
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  template_id?: string;
  target_segment?: Record<string, unknown>;
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed';
  total_recipients: number;
  successful_count: number;
  created_at: string;
}
