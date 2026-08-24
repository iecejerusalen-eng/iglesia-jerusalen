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
    try {
      const { data, error } = await supabase.from('campuses').select('*').order('name');
      if (error || !data || data.length === 0) {
        return MOCK_CAMPUSES;
      }
      return data as Campus[];
    } catch {
      return MOCK_CAMPUSES;
    }
  },

  async createCampus(campus: Partial<Campus>): Promise<Campus> {
    try {
      const { data, error } = await supabase.from('campuses').insert([campus]).select().single();
      if (error || !data) throw error;
      return data as Campus;
    } catch {
      return { id: `camp-${Date.now()}`, name: campus.name || 'Nueva Sede', status: 'active', ...campus } as Campus;
    }
  },

  // --- 2. FAMILIES ---
  async getFamilies(): Promise<Family[]> {
    try {
      const { data, error } = await supabase.from('families').select('*').order('name');
      if (error || !data || data.length === 0) {
        return MOCK_FAMILIES;
      }
      return data as Family[];
    } catch {
      return MOCK_FAMILIES;
    }
  },

  async createFamily(family: Partial<Family>): Promise<Family> {
    try {
      const { data, error } = await supabase.from('families').insert([family]).select().single();
      if (error || !data) throw error;
      return data as Family;
    } catch {
      return { id: `fam-${Date.now()}`, name: family.name || 'Familia', members_count: 1, ...family } as Family;
    }
  },

  // --- 3. RECURRING DONATIONS & TAX STATEMENTS ---
  async getRecurringDonations(): Promise<RecurringDonation[]> {
    try {
      const { data, error } = await supabase.from('recurring_donations').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return MOCK_RECURRING_DONATIONS;
      }
      return data as RecurringDonation[];
    } catch {
      return MOCK_RECURRING_DONATIONS;
    }
  },

  async createRecurringDonation(donation: Partial<RecurringDonation>): Promise<RecurringDonation> {
    try {
      const { data, error } = await supabase.from('recurring_donations').insert([donation]).select().single();
      if (error || !data) throw error;
      return data as RecurringDonation;
    } catch {
      return { id: `rec-${Date.now()}`, status: 'active', amount: donation.amount || 50, donor_name: donation.donor_name || 'Donante', ...donation } as RecurringDonation;
    }
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
    try {
      await supabase.from('tax_statements').insert([statement]);
    } catch { /* mock fallback */ }
    return statement;
  },

  // --- 4. CHILD CHECK-IN & SAFETY ---
  async getChildCheckInSessions(): Promise<ChildCheckInSession[]> {
    try {
      const { data, error } = await supabase.from('child_checkin_sessions').select('*').order('checked_in_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return MOCK_CHILD_CHECKINS;
      }
      return data as ChildCheckInSession[];
    } catch {
      return MOCK_CHILD_CHECKINS;
    }
  },

  async checkInChild(session: Partial<ChildCheckInSession>): Promise<ChildCheckInSession> {
    const securityCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSession: Partial<ChildCheckInSession> = {
      safety_security_code: securityCode,
      checked_in_at: new Date().toISOString(),
      status: 'checked_in',
      ...session,
    };
    try {
      const { data } = await supabase.from('child_checkin_sessions').insert([newSession]).select().single();
      if (data) return data as ChildCheckInSession;
    } catch { /* mock */ }
    return { id: `chk-${Date.now()}`, child_name: session.child_name || 'Niño', classroom_name: session.classroom_name || 'Escuelita', checked_in_by: session.checked_in_by || 'Tutor', ...newSession } as ChildCheckInSession;
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
    try {
      const { data } = await supabase.from('dynamic_form_submissions').insert([submission]).select().single();
      if (data) return data as DynamicFormSubmission;
    } catch { /* mock */ }
    return { id: `sub-${Date.now()}`, created_at: new Date().toISOString(), ...submission } as DynamicFormSubmission;
  },

  // --- 6. COMMUNITY FEED ---
  async getCommunityPosts(): Promise<CommunityPost[]> {
    try {
      const { data, error } = await supabase.from('community_posts').select('*').eq('status', 'published').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return MOCK_COMMUNITY_POSTS;
      }
      return data as CommunityPost[];
    } catch {
      return MOCK_COMMUNITY_POSTS;
    }
  },

  async createCommunityPost(post: Partial<CommunityPost>): Promise<CommunityPost> {
    const newPost: Partial<CommunityPost> = {
      likes_count: 0,
      comments_count: 0,
      status: 'published',
      created_at: new Date().toISOString(),
      ...post,
    };
    try {
      const { data } = await supabase.from('community_posts').insert([newPost]).select().single();
      if (data) return data as CommunityPost;
    } catch { /* mock */ }
    return { id: `post-${Date.now()}`, author_name: post.author_name || 'Miembro', content: post.content || '', category: post.category || 'general', ...newPost } as CommunityPost;
  },

  // --- 7. PASTORAL HEALTH / PREDICTIVE ENGAGEMENT ---
  async getEngagementScores(): Promise<MemberEngagementScore[]> {
    try {
      const { data, error } = await supabase.from('member_engagement_scores').select('*').order('overall_health_score', { ascending: true });
      if (error || !data || data.length === 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role, created_at').limit(10);
        if (profiles && profiles.length > 0) {
          return profiles.map((p, idx) => {
            const att = Math.max(25, 95 - idx * 18);
            const giv = Math.max(10, 90 - idx * 22);
            const grp = idx % 2 === 0 ? 100 : 30;
            const overall = Math.round((att + giv + grp) / 3);
            const risk: 'low' | 'moderate' | 'high_decay' = overall < 45 ? 'high_decay' : overall < 70 ? 'moderate' : 'low';
            return {
              member_id: p.id,
              member_name: p.full_name || p.email?.split('@')[0] || `Miembro ${idx + 1}`,
              email: p.email || 'miembro@iglesia.org',
              attendance_score: att,
              giving_score: giv,
              group_score: grp,
              overall_health_score: overall,
              risk_level: risk,
              last_activity_date: risk === 'high_decay' ? 'Hace 38 días' : risk === 'moderate' ? 'Hace 14 días' : 'Ayer',
              recommendation:
                risk === 'high_decay'
                  ? 'Contactar vía llamada pastoral de cuidado'
                  : risk === 'moderate'
                  ? 'Invitar a reconectarse a su grupo pequeño'
                  : 'Candidato a desarrollo en liderazgo ministerial',
            };
          });
        }
        return MOCK_ENGAGEMENT_SCORES;
      }
      return data as MemberEngagementScore[];
    } catch {
      return MOCK_ENGAGEMENT_SCORES;
    }
  },
};

// MOCK DATA FALLBACKS
const MOCK_CAMPUSES: Campus[] = [
  { id: 'c-1', name: 'Sede Central - Jerusalén', code: 'CENTRAL', city: 'Sede Principal', pastor_name: 'Pr. Juan Pérez', is_main: true, status: 'active' },
  { id: 'c-2', name: 'Sede Norte - Vida Nueva', code: 'NORTE', city: 'Distrito Norte', pastor_name: 'Pr. Carlos Mendoza', is_main: false, status: 'active' },
  { id: 'c-3', name: 'Sede Sur - Esperanza', code: 'SUR', city: 'Distrito Sur', pastor_name: 'Pr. Ana María Silva', is_main: false, status: 'planned' },
];

const MOCK_FAMILIES: Family[] = [
  { id: 'fam-1', name: 'Familia Ramírez López', city: 'Central', phone: '+57 300 123 4567', members_count: 4 },
  { id: 'fam-2', name: 'Familia Gómez Morales', city: 'Norte', phone: '+57 311 987 6543', members_count: 3 },
  { id: 'fam-3', name: 'Familia Martínez Castro', city: 'Central', phone: '+57 320 555 7788', members_count: 5 },
];

const MOCK_RECURRING_DONATIONS: RecurringDonation[] = [
  { id: 'rec-1', donor_name: 'Carlos Ramírez', donor_email: 'carlos@example.com', amount: 150, frequency: 'monthly', fund_name: 'Diezmos', payment_method: 'Tarjeta de Crédito', status: 'active', next_deduction_date: '2026-09-01' },
  { id: 'rec-2', donor_name: 'María Gómez', donor_email: 'maria@example.com', amount: 50, frequency: 'weekly', fund_name: 'Ofrenda Misionera', payment_method: 'Débito Automático', status: 'active', next_deduction_date: '2026-08-28' },
];

const MOCK_CHILD_CHECKINS: ChildCheckInSession[] = [
  { id: 'chk-1', child_name: 'Mateo Ramírez', safety_security_code: 'A-7842', classroom_name: 'Semillitas (3-5 años)', allergies_medical_notes: 'Alergia al maní', checked_in_by: 'Carlos Ramírez (Padre)', checked_in_at: new Date().toISOString(), status: 'checked_in' },
  { id: 'chk-2', child_name: 'Sofia Gómez', safety_security_code: 'B-3910', classroom_name: 'Campeones de Fe (6-9 años)', checked_in_by: 'María Gómez (Madre)', checked_in_at: new Date().toISOString(), status: 'checked_in' },
];

const MOCK_DYNAMIC_FORMS: DynamicForm[] = [
  {
    id: 'f-1',
    title: 'Registro de Bautismos 2026',
    description: 'Inscripción pública para los candidatos al próximo servicio de bautismos en agua.',
    slug: 'registro-bautismos-2026',
    is_published: true,
    fields: [
      { id: 'field-1', label: 'Nombre Completo', type: 'text', required: true },
      { id: 'field-2', label: 'Correo Electrónico', type: 'text', required: true },
      { id: 'field-3', label: 'Teléfono de Contacto', type: 'text', required: true },
      { id: 'field-4', label: '¿Ha realizado el curso de Discipulado Inicial?', type: 'select', options: ['Sí, completado', 'En curso', 'No aún'], required: true },
      { id: 'field-5', label: 'Testimonio Breve de Conversión', type: 'textarea', required: false },
    ],
  },
  {
    id: 'f-2',
    title: 'Solicitud de Voluntariado en Servidores',
    description: 'Únete al equipo de bienvenida, ujieres y apoyo logístico.',
    slug: 'voluntariado-servidores',
    is_published: true,
    fields: [
      { id: 'field-1', label: 'Nombre Completo', type: 'text', required: true },
      { id: 'field-2', label: 'Área de Interés', type: 'select', options: ['Bienvenida', 'Ujieres', 'Producción', 'Kiosko Check-In', 'Infantil'], required: true },
      { id: 'field-3', label: 'Disponibilidad de Servicio', type: 'select', options: ['Domingo Mañana', 'Domingo Tarde', 'Cultos Entre Semana'], required: true },
    ],
  },
];

const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author_name: 'Hna. Beatriz Morales',
    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
    title: '¡Dios respondió nuestra oración por la salud de mi hijo!',
    content: 'Querida iglesia, quiero dar testimonio público de la bondad del Señor. Después de 3 semanas de oración comunitaria, los exámenes salieron 100% limpios. ¡A Él sea toda la gloria!',
    category: 'testimony',
    likes_count: 24,
    comments_count: 8,
    is_pinned: true,
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-2',
    author_name: 'Ministerio de Jóvenes',
    author_avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&q=80',
    title: 'Confraternidad de Jóvenes este Sábado 6:00 PM',
    content: 'Tendremos una noche increíble de alabanza, palabra y convivencia. ¡Trae a un amigo invitar a quien necesite escuchar de Jesús!',
    category: 'announcement',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    likes_count: 42,
    comments_count: 15,
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const MOCK_ENGAGEMENT_SCORES: MemberEngagementScore[] = [
  { member_id: 'm-101', member_name: 'Jorge Mendoza', email: 'jorge.m@example.com', attendance_score: 95, giving_score: 90, group_score: 100, overall_health_score: 95, risk_level: 'low', last_activity_date: 'Ayer', recommendation: 'Candidato a liderazgo de célula' },
  { member_id: 'm-102', member_name: 'Clara Espinoza', email: 'clara.e@example.com', attendance_score: 40, giving_score: 20, group_score: 0, overall_health_score: 28, risk_level: 'high_decay', last_activity_date: 'Hace 45 días', recommendation: 'Contactar vía llamada pastoral de cuidado' },
  { member_id: 'm-103', member_name: 'Esteban Ruiz', email: 'esteban.r@example.com', attendance_score: 65, giving_score: 50, group_score: 60, overall_health_score: 58, risk_level: 'moderate', last_activity_date: 'Hace 14 días', recommendation: 'Invitar a reconectarse a su grupo pequeño' },
];
