import { supabase } from '../../../config/supabase';
import type { EmailTemplate } from '../types';
import { PRESET_TEMPLATES } from '../templates/defaultTemplates';

export async function fetchTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching email_templates from Supabase, fallback to presets:', error.message);
      return PRESET_TEMPLATES as EmailTemplate[];
    }

    if (!data || data.length === 0) {
      // Seed default preset templates into database for immediate persistence
      try {
        const seedRows = PRESET_TEMPLATES.map((t) => ({
          name: t.name,
          subject: t.subject,
          body_html: t.body_html,
          category: t.category
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('email_templates')
          .insert(seedRows)
          .select();

        if (!insertError && insertedData && insertedData.length > 0) {
          return insertedData as EmailTemplate[];
        }
      } catch (seedErr) {
        console.warn('Could not auto-seed preset templates:', seedErr);
      }
      return PRESET_TEMPLATES as EmailTemplate[];
    }

    return data as EmailTemplate[];
  } catch (err) {
    console.error('Exception fetching templates:', err);
    return PRESET_TEMPLATES as EmailTemplate[];
  }
}

export async function createTemplate(
  payload: Omit<EmailTemplate, 'id' | 'created_at'>
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .insert([
      {
        name: payload.name,
        subject: payload.subject,
        body_html: payload.body_html,
        category: payload.category || 'general'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating email template:', error);
    throw new Error(error.message);
  }

  return data as EmailTemplate;
}

export async function updateTemplate(
  id: string,
  payload: Partial<Omit<EmailTemplate, 'id' | 'created_at'>>
): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email template:', error);
    throw new Error(error.message);
  }

  return data as EmailTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('email_templates').delete().eq('id', id);

  if (error) {
    console.error('Error deleting email template:', error);
    throw new Error(error.message);
  }
}
