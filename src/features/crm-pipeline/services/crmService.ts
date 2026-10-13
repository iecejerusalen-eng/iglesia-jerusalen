import { supabase } from '../../../config/supabase';
import type { CrmPipeline, CrmContact, CrmActivity } from '../types';

export const crmService = {
  async getPipelines(): Promise<CrmPipeline[]> {
    const { data, error } = await supabase
      .from('crm_pipelines')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getContacts(pipelineId?: string): Promise<CrmContact[]> {
    let query = supabase.from('crm_contacts').select('*');
    if (pipelineId) {
      query = query.eq('pipeline_id', pipelineId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateContactStage(contactId: string, newStageId: string): Promise<void> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
      .eq('id', contactId).select('id').maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('No se pudo confirmar el cambio de etapa.');

    // Log activity
    const session = await supabase.auth.getSession();
    if (session.error) throw session.error;
    const activity = await supabase.from('crm_activities').insert({
      contact_id: contactId,
      type: 'stage_change',
      title: 'Cambio de etapa',
      details: `Etapa actualizada a: ${newStageId}`,
      created_by: session.data.session?.user.id
    });
    if (activity.error) throw new Error(`La etapa cambió, pero no se pudo registrar su actividad: ${activity.error.message}`);
  },

  async createContact(contact: Partial<CrmContact>): Promise<CrmContact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getActivities(contactId: string): Promise<CrmActivity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
