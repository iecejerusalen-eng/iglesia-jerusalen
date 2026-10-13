import { z } from 'zod';

export const learningSlugSchema = z.enum(['origen-cuadrangular', 'doctrina', 'simbolos', 'historia', 'himno']);
const safeUrl = z.string().refine(value => /^\/(?!\/)/.test(value) || /^https:\/\/[^\s]+$/.test(value), 'Usa una ruta del sitio o una dirección HTTPS.');
export const learningBlockSchema = z.object({
  id: z.string().min(1), type: z.enum(['text', 'html', 'image', 'section']),
  text: z.string().optional(), html: z.string().optional(), title: z.string().optional(), image_url: safeUrl.optional(),
}).passthrough();
const chapter = z.object({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), title: z.string().min(1).max(180), reference: z.string().optional(), blocks: z.array(learningBlockSchema).max(60) });
const question = z.object({ id: z.string().min(1), prompt: z.string().min(1), options: z.array(z.string().min(1)).min(2).max(5), correct: z.number().int().min(0), explanation: z.string().min(1) }).refine(q => q.correct < q.options.length, 'La respuesta debe existir en las opciones.');
export const learningContentSchema = z.object({
  chapters: z.array(chapter).min(1).max(20), reflections: z.array(z.string().min(1)).max(15), quiz: z.array(question).max(10),
  audio: z.object({ kind: z.enum(['youtube', 'audio']), url: safeUrl, title: z.string().min(1), credit: z.string().min(1), source: safeUrl, authorization: z.string().optional() }).optional(),
}).refine(value => new Set(value.chapters.map(c => c.id)).size === value.chapters.length, 'Los destinos del índice deben ser únicos.');
export const learningDocumentSchema = z.object({
  slug: learningSlugSchema, title: z.string().min(1).max(180), summary: z.string().min(1).max(500), author_label: z.string().min(1).max(120),
  sources: z.array(z.object({ title: z.string().min(1), href: safeUrl })).min(1).max(20), content: learningContentSchema,
});
export type LearningContent = z.infer<typeof learningContentSchema>;
export type LearningDocument = z.infer<typeof learningDocumentSchema>;
export type PublishedLearningDocument = LearningDocument & { revision: number; published_at: string; reviewed_at: string | null; reviewer_label: string | null };
export type LearningDraft = LearningDocument & { revision: number; status: 'draft' | 'review'; review_notes: string; updated_at: string };

export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? parsed.pathname.slice(1) : host === 'youtube.com' || host === 'm.youtube.com' ? parsed.searchParams.get('v') : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch (error) {
    console.error('Dirección de YouTube inválida:', error);
    return null;
  }
}

export function validateLearningDocument(value: unknown): LearningDocument {
  const document = learningDocumentSchema.parse(value);
  if (document.content.audio?.kind === 'youtube' && !youtubeId(document.content.audio.url)) throw new Error('La grabación necesita un enlace válido de YouTube.');
  return document;
}
