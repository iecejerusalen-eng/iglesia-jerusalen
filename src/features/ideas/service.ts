import { supabase } from '../../config/supabase';
import type { Idea, IdeaAttachment, IdeaComment, IdeaHistory, IdeaNotification, IdeaTag, IdeaStatus } from './types';

const normalizeIdea = (idea: Omit<Idea, 'adjuntos' | 'etiquetas'> & { idea_adjuntos?: IdeaAttachment[]; idea_etiquetas?: IdeaTag[] }): Idea => ({
  ...idea,
  adjuntos: idea.idea_adjuntos ?? [],
  etiquetas: idea.idea_etiquetas ?? [],
});

export async function fetchIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase.from('ideas').select('*, idea_adjuntos(*), idea_etiquetas(*)').order('es_fijada', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<Omit<Idea, 'adjuntos' | 'etiquetas'> & { idea_adjuntos?: IdeaAttachment[]; idea_etiquetas?: IdeaTag[] }>).map(normalizeIdea);
}

export async function fetchIdeaDetails(id: string) {
  const [ideaResult, commentsResult, historyResult] = await Promise.all([
    supabase.from('ideas').select('*, idea_adjuntos(*), idea_etiquetas(*)').eq('id', id).single(),
    supabase.from('idea_comentarios').select('*').eq('idea_id', id).order('created_at', { ascending: true }),
    supabase.from('idea_historial').select('*').eq('idea_id', id).order('created_at', { ascending: true }),
  ]);
  if (ideaResult.error) throw ideaResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (historyResult.error) throw historyResult.error;
  return {
    idea: normalizeIdea(ideaResult.data as unknown as Omit<Idea, 'adjuntos' | 'etiquetas'> & { idea_adjuntos?: IdeaAttachment[]; idea_etiquetas?: IdeaTag[] }),
    comments: (commentsResult.data ?? []) as IdeaComment[],
    history: (historyResult.data ?? []) as IdeaHistory[],
  };
}

export async function createIdea(input: Record<string, unknown>, tags: string[], attachments: Array<Record<string, unknown>>) {
  const { data, error } = await supabase.from('ideas').insert(input).select('id').single();
  if (error) throw error;
  if (tags.length) {
    const tagResult = await supabase.from('idea_etiquetas').insert(tags.map((etiqueta) => ({ idea_id: data.id, etiqueta })));
    if (tagResult.error) throw tagResult.error;
  }
  if (attachments.length) {
    const attachmentResult = await supabase.from('idea_adjuntos').insert(attachments.map((attachment) => ({ ...attachment, idea_id: data.id })));
    if (attachmentResult.error) throw attachmentResult.error;
  }
  return data.id as string;
}

export async function setIdeaStatus(id: string, estado: IdeaStatus, nota: string) {
  const { error } = await supabase.from('ideas').update({ estado }).eq('id', id);
  if (error) throw error;
  if (nota.trim()) {
    const { data: current } = await supabase.from('ideas').select('autor_id, titulo').eq('id', id).single();
    if (current?.autor_id) {
      const notification: Partial<IdeaNotification> = { usuario_id: current.autor_id, idea_id: id, tipo: estado, mensaje: nota.trim() };
      const notificationResult = await supabase.from('idea_notificaciones').insert(notification);
      if (notificationResult.error) throw notificationResult.error;
    }
  }
}

export async function toggleIdeaVote(ideaId: string, userId: string) {
  const { data: existing, error: findError } = await supabase.from('idea_votos').select('id').eq('idea_id', ideaId).eq('usuario_id', userId).maybeSingle();
  if (findError) throw findError;
  if (existing) {
    const { error } = await supabase.from('idea_votos').delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('idea_votos').insert({ idea_id: ideaId, usuario_id: userId, tipo: 'up' });
  if (error) throw error;
  return true;
}

export async function addIdeaComment(input: Pick<IdeaComment, 'idea_id' | 'padre_id' | 'autor_id' | 'autor_nombre' | 'autor_avatar' | 'contenido'>) {
  const { error } = await supabase.from('idea_comentarios').insert(input);
  if (error) throw error;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase.from('idea_notificaciones').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []) as IdeaNotification[];
}

export async function markNotificationsRead(userId: string) {
  const { error } = await supabase.from('idea_notificaciones').update({ leida: true }).eq('usuario_id', userId).eq('leida', false);
  if (error) throw error;
}

export async function uploadIdeaFile(file: File, userId: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('ideas-adjuntos').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data, error: signedError } = await supabase.storage.from('ideas-adjuntos').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signedError) throw signedError;
  return { url: data.signedUrl, path };
}
