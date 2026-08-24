export interface Campus {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  pastor_name?: string;
  is_main?: boolean;
  status: 'active' | 'inactive' | 'planned';
  created_at?: string;
}

export interface Family {
  id: string;
  name: string;
  campus_id?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at?: string;
  members_count?: number;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  member_id: string;
  role_in_family: 'head' | 'spouse' | 'child' | 'guardian' | 'member';
  is_primary_contact: boolean;
  created_at?: string;
  member_name?: string;
  member_email?: string;
  member_photo?: string;
}

export interface RecurringDonation {
  id: string;
  member_id?: string | null;
  donor_name: string;
  donor_email: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  fund_name: string;
  payment_method: string;
  stripe_subscription_id?: string | null;
  status: 'active' | 'paused' | 'cancelled' | 'failing';
  next_deduction_date?: string | null;
  created_at?: string;
}

export interface TaxStatement {
  id: string;
  member_id?: string | null;
  donor_tax_id?: string;
  donor_name: string;
  year: number;
  total_amount: number;
  pdf_url?: string;
  issued_at: string;
  status: 'draft' | 'issued' | 'sent';
}

export interface AuthorizedGuardian {
  id: string;
  child_member_id: string;
  guardian_name: string;
  guardian_phone: string;
  relationship: string;
  identification_id?: string;
  photo_url?: string;
}

export interface ChildCheckInSession {
  id: string;
  child_member_id?: string | null;
  child_name: string;
  safety_security_code: string;
  classroom_name: string;
  allergies_medical_notes?: string | null;
  checked_in_by: string;
  checked_out_by?: string | null;
  checked_in_at: string;
  checked_out_at?: string | null;
  status: 'checked_in' | 'checked_out' | 'alert_called';
}

export type DynamicFormFieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'url' | 'select' | 'checkbox' | 'radio' | 'date' | 'heading' | 'paragraph';

export interface DynamicFormField {
  id: string;
  label: string;
  type: DynamicFormFieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[]; // for select/radio
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  accept?: string;
  multiple?: boolean;
}

export interface DynamicFormSettings {
  collectSubmitterInfo?: boolean;
  submitterEmailRequired?: boolean;
  successTitle?: string;
  successMessage?: string;
  submitLabel?: string;
  showProgress?: boolean;
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  slug: string;
  fields: DynamicFormField[];
  is_published: boolean;
  requires_auth?: boolean;
  cover_image_url?: string;
  settings?: DynamicFormSettings;
  created_at?: string;
}

export interface DynamicFormSubmission {
  id: string;
  form_id: string;
  submitter_email?: string;
  submitter_name?: string;
  responses: Record<string, unknown>;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at?: string;
}

export interface CommunityPost {
  id: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  title?: string;
  content: string;
  category: 'general' | 'testimony' | 'prayer' | 'announcement' | 'event';
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
  status: 'published' | 'hidden' | 'flagged';
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface MemberEngagementScore {
  member_id: string;
  member_name: string;
  email: string;
  attendance_score: number; // 0-100
  giving_score: number; // 0-100
  group_score: number; // 0-100
  overall_health_score: number; // 0-100
  risk_level: 'low' | 'moderate' | 'high_decay';
  last_activity_date: string;
  recommendation: string;
}
