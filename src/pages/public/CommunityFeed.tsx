import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Heart, Sparkles, Send, ShieldCheck, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { CommunityComment, CommunityPost } from '../../features/competitive/types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useTranslation } from '../../i18n/useTranslation';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

export const CommunityFeed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'general' | 'testimony' | 'prayer' | 'announcement'>('testimony');
  const [authorName, setAuthorName] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const data = await competitiveService.getCommunityPosts();
        if (isMounted) {
          setPosts(data);
          setLoadError(null);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la comunidad.');
          toast.error('No se pudo cargar la comunidad.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchPosts();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!user || posts.length === 0) {
      return;
    }
    let isMounted = true;
    void competitiveService.getLikedCommunityPostIds(posts.map((post) => post.id), user.id).then((ids) => {
      if (isMounted) setLikedPosts(Object.fromEntries(ids.map((id) => [id, true])));
    }).catch(() => {
      if (isMounted) toast.error('No se pudieron cargar tus reacciones.');
    });
    return () => { isMounted = false; };
  }, [posts, user]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowPostModal(false);
      toast.error('Inicia sesión para publicar en la comunidad.');
      navigate('/login');
      return;
    }
    if (!newPostContent.trim()) return;

    try {
      const created = await competitiveService.createCommunityPost({
        title: newPostTitle || undefined,
        content: newPostContent,
        category: newPostCategory,
        author_name: authorName.trim() || 'Miembro de la Iglesia',
        author_avatar: undefined,
      });

      setPosts(current => [created, ...current]);
      setNewPostContent('');
      setNewPostTitle('');
      setShowPostModal(false);
      toast.success('Publicación enviada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar el mensaje.');
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Inicia sesión para reaccionar a una publicación.');
      navigate('/login');
      return;
    }
    try {
      const isLiked = await competitiveService.toggleCommunityLike(postId);
      setLikedPosts(prev => ({ ...prev, [postId]: isLiked }));
      setPosts(current => current.map(post => post.id === postId
        ? { ...post, likes_count: Math.max(0, post.likes_count + (isLiked ? 1 : -1)) }
        : post));
    } catch {
      toast.error('No se pudo registrar tu reacción.');
    }
  };

  const handleToggleComments = async (postId: string) => {
    const nextExpanded = !expandedComments[postId];
    setExpandedComments((current) => ({ ...current, [postId]: nextExpanded }));
    if (!nextExpanded || commentsByPost[postId]) return;
    setCommentsLoading((current) => ({ ...current, [postId]: true }));
    try {
      const comments = await competitiveService.getCommunityComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
    } catch {
      toast.error('No se pudieron cargar los comentarios.');
    } finally {
      setCommentsLoading((current) => ({ ...current, [postId]: false }));
    }
  };

  const handleSubmitComment = async (event: React.FormEvent, postId: string) => {
    event.preventDefault();
    if (!user) {
      toast.error('Inicia sesión para comentar.');
      navigate('/login');
      return;
    }
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content) return;
    const authorName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Miembro de la Iglesia');
    setCommentSubmitting((current) => ({ ...current, [postId]: true }));
    try {
      const comment = await competitiveService.createCommunityComment(postId, authorName, content);
      setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment] }));
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post));
    } catch {
      toast.error('No se pudo publicar el comentario.');
    } finally {
      setCommentSubmitting((current) => ({ ...current, [postId]: false }));
    }
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'all') return true;
    return post.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HERO BANNER */}
        <AnimeFadeUp className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {t('community.title', 'Muro de la Comunidad')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('community.title', 'Muro de la Comunidad')}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            {t('community.subtitle', 'Testimonios, peticiones y noticias de nuestra familia en la fe.')}
          </p>
          <Link
            to="/comunidad/culto-en-vivo"
            className="mx-auto inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/20"
          >
            <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-70" /><span className="relative inline-flex size-2.5 rounded-full bg-rose-500" /></span>
            Entrar al Culto en Vivo
          </Link>
        </AnimeFadeUp>

        {/* CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          {/* CATEGORIES */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: t('community.all_categories', 'Todas') },
              { id: 'testimony', label: '✨ ' + t('community.testimonies', 'Testimonios') },
              { id: 'prayer', label: '🙏 ' + t('community.prayers', 'Peticiones') },
              { id: 'announcement', label: '📢 ' + t('community.announcements', 'Anuncios') },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { if (user) setShowPostModal(true); else navigate('/login'); }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            {user ? t('community.post_btn', 'Publicar en la Comunidad') : 'Inicia sesión para publicar'}
          </button>
        </div>

        {/* POSTS LIST */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center text-sm text-slate-400">Cargando publicaciones…</div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-10 text-center text-sm text-rose-200">{loadError}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
              {selectedCategory === 'all' ? 'Todavía no hay publicaciones en la comunidad.' : 'No hay publicaciones en esta categoría.'}
            </div>
          ) : filteredPosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md"
            >
              {/* AUTHOR HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full object-cover border border-amber-500/30" />
                  ) : (
                    <div aria-hidden="true" className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30">
                      {post.author_name.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {post.author_name}
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[11px] font-semibold uppercase tracking-wider border border-amber-500/20">
                  {post.category}
                </span>
              </div>

              {/* POST CONTENT */}
              <div className="space-y-2">
                {post.title && (
                  <h3 className="text-base font-bold text-amber-200">
                    {post.title}
                  </h3>
                )}
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
                {post.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-h-72">
                    <img src={post.image_url} alt="Post media" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* ACTIONS BAR */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  aria-pressed={Boolean(user && likedPosts[post.id])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    user && likedPosts[post.id]
                      ? 'bg-rose-500/20 text-rose-400 font-semibold'
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${user && likedPosts[post.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes_count} Me gusta</span>
                </button>

                <button type="button" onClick={() => void handleToggleComments(post.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-expanded={Boolean(expandedComments[post.id])}>
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>{post.comments_count} Comentarios</span>
                </button>
              </div>

              {expandedComments[post.id] && (
                <div className="space-y-3 border-t border-white/5 pt-4">
                  {commentsLoading[post.id] ? <p className="text-xs text-slate-400">Cargando comentarios…</p> : (commentsByPost[post.id] ?? []).length === 0 ? <p className="text-xs text-slate-400">Todavía no hay comentarios. Sé el primero en participar.</p> : (commentsByPost[post.id] ?? []).map((comment) => (
                    <article key={comment.id} className="rounded-xl bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-3"><strong className="text-xs text-slate-200">{comment.author_name}</strong><time className="text-[10px] text-slate-500" dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</time></div>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-300">{comment.content}</p>
                    </article>
                  ))}
                  {user ? <form onSubmit={(event) => void handleSubmitComment(event, post.id)} className="flex flex-col gap-2 sm:flex-row"><textarea required maxLength={2000} rows={2} value={commentDrafts[post.id] ?? ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Escribe un comentario…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-400" /><button type="submit" disabled={commentSubmitting[post.id]} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-xs font-black text-slate-950 disabled:opacity-50"><Send className="h-3.5 w-3.5" />{commentSubmitting[post.id] ? 'Publicando…' : 'Comentar'}</button></form> : <p className="rounded-xl bg-white/5 p-3 text-center text-xs text-slate-400">Inicia sesión para participar en los comentarios.</p>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Nueva Publicación Comunitaria
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tu Nombre</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Ej. Hermano Carlos Ramírez"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                    <select
                      value={newPostCategory}
                      onChange={e => setNewPostCategory(e.target.value as 'general' | 'testimony' | 'prayer' | 'announcement')}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="testimony">✨ Testimonio</option>
                      <option value="prayer">🙏 Petición Oración</option>
                      <option value="announcement">📢 Anuncio</option>
                      <option value="general">💬 General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Título (Opcional)</label>
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={e => setNewPostTitle(e.target.value)}
                      placeholder="Ej. Gratitud por sanidad"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje</label>
                  <textarea
                    rows={4}
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder="Escribe tu mensaje para edificación de la congregación..."
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-105 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publicar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default CommunityFeed;
