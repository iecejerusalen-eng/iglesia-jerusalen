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
    const { error } = await supabase
      .from('crm_contacts')
      .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
      .eq('id', contactId);
    
    if (error) throw error;

    // Log activity
    await supabase.from('crm_activities').insert({
      contact_id: contactId,
      type: 'stage_change',
      title: 'Cambio de etapa',
      details: `Etapa actualizada a: ${newStageId}`
    });
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
