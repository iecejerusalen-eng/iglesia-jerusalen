import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles?: { first_name: string | null; last_name: string | null; photo_url: string | null } | null;
}
interface RawCommentRow extends Omit<CommentRow, 'profiles'> {
  profiles?: CommentRow['profiles'] | Array<NonNullable<CommentRow['profiles']>>;
}

export default function EditorialComments({ documentId }: { documentId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('editorial_comments').select('id,body,created_at,user_id,profiles:user_id(first_name,last_name,photo_url)').eq('document_id', documentId).eq('status', 'published').order('created_at');
    setLoading(false);
    if (error) { console.error('No se cargaron los comentarios.', error); return; }
    const rows = (data ?? []) as unknown as RawCommentRow[];
    setComments(rows.map((row) => ({ ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles ?? null })));
  }, [documentId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!user || !body.trim()) return; setSending(true);
    const { error } = await supabase.from('editorial_comments').insert({ document_id: documentId, user_id: user.id, body: body.trim() });
    setSending(false);
    if (error) { console.error('No se publicó el comentario.', error); toast.error('No se pudo publicar. Verifica que perteneces al grupo.'); return; }
    setBody(''); await load();
  };
  return <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"><MessageCircle size={20} /></div><div><h2 className="font-serif text-xl font-bold">Conversación del grupo</h2><p className="text-xs text-slate-500">Visible únicamente para quienes tienen acceso a esta publicación.</p></div></div>{loading ? <p className="mt-6 text-sm text-slate-500">Cargando conversación…</p> : <div className="mt-6 space-y-3">{comments.map((comment) => { const name = `${comment.profiles?.first_name ?? ''} ${comment.profiles?.last_name ?? ''}`.trim() || 'Integrante'; return <article key={comment.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-200 text-xs font-bold text-blue-800">{comment.profiles?.photo_url ? <img src={comment.profiles.photo_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}</div><div><strong className="text-xs">{name}</strong><span className="block text-[10px] text-slate-500">{new Date(comment.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}</span></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{comment.body}</p></article>; })}{!comments.length && <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/15">Todavía no hay comentarios. Inicia la conversación.</p>}</div>}{user ? <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row"><textarea required maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder="Comparte una reflexión con el grupo…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950" /><button disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={15} /> Publicar</button></form> : <p className="mt-5 rounded-xl bg-slate-100 p-4 text-center text-xs text-slate-500 dark:bg-white/5">Inicia sesión para participar en la conversación.</p>}</section>;
}
