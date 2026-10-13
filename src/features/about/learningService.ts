import { supabase } from '../../config/supabase';
import { validateLearningDocument, type LearningDraft, type PublishedLearningDocument } from './learningDocument';
import type { LearningSlug } from './learningContent';

const fields = 'slug,title,summary,author_label,content,sources,revision';
export async function fetchPublishedLearning(slug: LearningSlug): Promise<PublishedLearningDocument> {
  const { data, error } = await supabase.from('about_learning_published').select(`${fields},published_at,reviewed_at,reviewer_label`).eq('slug', slug).single();
  if (error) throw error;
  return { ...validateLearningDocument(data), revision: data.revision, published_at: data.published_at, reviewed_at: data.reviewed_at, reviewer_label: data.reviewer_label };
}
export async function fetchLearningDrafts(): Promise<LearningDraft[]> {
  const { data, error } = await supabase.from('about_learning_drafts').select(`${fields},status,review_notes,updated_at`).order('slug');
  if (error) throw error;
  return data.map(row => ({ ...validateLearningDocument(row), revision: row.revision, status: row.status, review_notes: row.review_notes, updated_at: row.updated_at }));
}
export async function saveLearningDraft(draft: LearningDraft): Promise<LearningDraft> {
  const document = validateLearningDocument(draft);
  if (document.content.audio && !document.content.audio.authorization?.trim()) throw new Error('Registra la procedencia y el derecho de uso de la grabación antes de guardarla.');
  const { data, error } = await supabase.from('about_learning_drafts').update({ ...document, status: 'draft', review_notes: draft.review_notes }).eq('slug', draft.slug).eq('revision', draft.revision).select(`${fields},status,review_notes,updated_at`).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Otro editor cambió esta lectura. Recarga para revisar la versión actual antes de guardar.');
  return { ...validateLearningDocument(data), revision: data.revision, status: data.status, review_notes: data.review_notes, updated_at: data.updated_at };
}
export async function requestLearningReview(draft: LearningDraft): Promise<void> {
  const { data, error } = await supabase.from('about_learning_drafts').update({ status: 'review' }).eq('slug', draft.slug).eq('revision', draft.revision).select('slug').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('El borrador cambió. Recarga antes de solicitar revisión.');
}
export async function publishLearning(draft: LearningDraft, signature: string): Promise<void> {
  const { error } = await supabase.rpc('publish_about_learning', { target_slug: draft.slug, expected_revision: draft.revision, signature: signature.trim() });
  if (error) throw error;
}
