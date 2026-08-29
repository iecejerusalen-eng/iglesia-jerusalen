import { supabase } from '../../../config/supabase';
import type {
  Campus,
  Family,
  RecurringDonation,
  TaxStatement,
  ChildCheckInSession,
  DynamicForm,
  DynamicFormSubmission,
  CommunityPost,
  MemberEngagementScore,
} from '../types';

export const competitiveService = {
  // --- 1. CAMPUSES ---
  async getCampuses(): Promise<Campus[]> {
    const { data, error } = await supabase.from('campuses').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as Campus[];
  },

  async createCampus(campus: Partial<Campus>): Promise<Campus> {
    const { data, error } = await supabase.from('campuses').insert([campus]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió la sede creada.');
    return data as Campus;
  },

  // --- 2. FAMILIES ---
  async getFamilies(): Promise<Family[]> {
    const { data, error } = await supabase.from('families').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as Family[];
  },

  async createFamily(family: Partial<Family>): Promise<Family> {
    const { data, error } = await supabase.from('families').insert([family]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió la familia creada.');
    return data as Family;
  },

  // --- 3. RECURRING DONATIONS & TAX STATEMENTS ---
  async getRecurringDonations(): Promise<RecurringDonation[]> {
    const { data, error } = await supabase.from('recurring_donations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as RecurringDonation[];
  },

  async createRecurringDonation(donation: Partial<RecurringDonation>): Promise<RecurringDonation> {
    const { data, error } = await supabase.from('recurring_donations').insert([donation]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió la donación recurrente creada.');
    return data as RecurringDonation;
  },

  async generateTaxStatement(donorName: string, year: number, totalAmount: number): Promise<TaxStatement> {
    const statement: TaxStatement = {
      id: `tax-${Date.now()}`,
      donor_name: donorName,
      year,
      total_amount: totalAmount,
      issued_at: new Date().toISOString(),
      status: 'issued',
      pdf_url: `#statement-${year}-${Date.now()}`,
    };
    const { data, error } = await supabase.from('tax_statements').insert([statement]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió el certificado fiscal creado.');
    return data as TaxStatement;
  },

  // --- 4. CHILD CHECK-IN & SAFETY ---
  async getChildCheckInSessions(): Promise<ChildCheckInSession[]> {
    const { data, error } = await supabase.from('child_checkin_sessions').select('*').order('checked_in_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ChildCheckInSession[];
  },

  async checkInChild(session: Partial<ChildCheckInSession>): Promise<ChildCheckInSession> {
    const securityCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSession: Partial<ChildCheckInSession> = {
      safety_security_code: securityCode,
      checked_in_at: new Date().toISOString(),
      status: 'checked_in',
      ...session,
    };
    const { data, error } = await supabase.from('child_checkin_sessions').insert([newSession]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió el check-in creado.');
    return data as ChildCheckInSession;
  },

  // --- 5. DYNAMIC FORMS ---
  async getDynamicForms(): Promise<DynamicForm[]> {
    const { data, error } = await supabase.from('dynamic_forms').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DynamicForm[];
  },

  async createDynamicForm(form: Partial<DynamicForm>): Promise<DynamicForm> {
    const { data, error } = await supabase.from('dynamic_forms').insert([form]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió el formulario creado.');
    return data as DynamicForm;
  },

  async updateDynamicForm(id: string, form: Partial<DynamicForm>): Promise<DynamicForm> {
    const { data, error } = await supabase.from('dynamic_forms').update({ ...form, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió el formulario actualizado.');
    return data as DynamicForm;
  },

  async deleteDynamicForm(id: string): Promise<void> {
    const { error } = await supabase.from('dynamic_forms').delete().eq('id', id);
    if (error) throw error;
  },

  async submitForm(formId: string, submitterName: string, submitterEmail: string, responses: Record<string, unknown>): Promise<DynamicFormSubmission> {
    const submission: Partial<DynamicFormSubmission> = {
      form_id: formId,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      responses,
      status: 'pending',
    };
    const { data, error } = await supabase.from('dynamic_form_submissions').insert([submission]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió el envío del formulario.');
    return data as DynamicFormSubmission;
  },

  // --- 6. COMMUNITY FEED ---
  async getCommunityPosts(): Promise<CommunityPost[]> {
    const { data, error } = await supabase.from('community_posts').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CommunityPost[];
  },

  async createCommunityPost(post: Partial<CommunityPost>): Promise<CommunityPost> {
    const newPost: Partial<CommunityPost> = {
      likes_count: 0,
      comments_count: 0,
      status: 'published',
      created_at: new Date().toISOString(),
      ...post,
    };
    const { data, error } = await supabase.from('community_posts').insert([newPost]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió la publicación creada.');
    return data as CommunityPost;
  },

  // --- 7. PASTORAL HEALTH / PREDICTIVE ENGAGEMENT ---
  async getEngagementScores(): Promise<MemberEngagementScore[]> {
    const { data, error } = await supabase.from('member_engagement_scores').select('*').order('overall_health_score', { ascending: true });
    if (error) throw error;
    return (data ?? []) as MemberEngagementScore[];
  },
};
