import { supabase } from '../../../config/supabase';
import type { PresentationDocument } from '../types';

export const presentationService = {
  async list(): Promise<PresentationDocument[]> {
    const { data, error } = await supabase.from('presentation_documents').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PresentationDocument[];
  },
  async getPublished(): Promise<PresentationDocument | null> {
    const { data, error } = await supabase.from('presentation_documents').select('*').eq('is_published', true).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as PresentationDocument | null;
  },
  async save(document: Partial<PresentationDocument>, id?: string): Promise<PresentationDocument> {
    const payload = { ...document, updated_at: new Date().toISOString() };
    const query = id ? supabase.from('presentation_documents').update(payload).eq('id', id) : supabase.from('presentation_documents').insert([payload]);
    const { data, error } = await query.select().single();
    if (error) throw error;
    if (!data) throw new Error('No se recibió la presentación guardada.');
    return data as PresentationDocument;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('presentation_documents').delete().eq('id', id);
    if (error) throw error;
  },
};
