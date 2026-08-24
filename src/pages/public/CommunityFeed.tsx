import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Heart, Sparkles, Send, ShieldCheck, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { CommunityPost } from '../../features/competitive/types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useTranslation } from '../../i18n/useTranslation';

export const CommunityFeed = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'general' | 'testimony' | 'prayer' | 'announcement'>('testimony');
  const [authorName, setAuthorName] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      const data = await competitiveService.getCommunityPosts();
      if (isMounted) setPosts(data);
    };
    void fetchPosts();
    return () => { isMounted = false; };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const created = await competitiveService.createCommunityPost({
      title: newPostTitle || undefined,
      content: newPostContent,
      category: newPostCategory,
      author_name: authorName.trim() || 'Miembro de la Iglesia',
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    });

    setPosts([created, ...posts]);
    setNewPostContent('');
    setNewPostTitle('');
    setShowPostModal(false);
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const isLiked = !prev[postId];
      setPosts(current => current.map(p => {
        if (p.id === postId) {
          return { ...p, likes_count: p.likes_count + (isLiked ? 1 : -1) };
        }
        return p;
      }));
      return { ...prev, [postId]: isLiked };
    });
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
            onClick={() => setShowPostModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            {t('community.post_btn', 'Publicar en la Comunidad')}
          </button>
        </div>

        {/* POSTS LIST */}
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md"
            >
              {/* AUTHOR HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                  />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    likedPosts[post.id]
                      ? 'bg-rose-500/20 text-rose-400 font-semibold'
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes_count} Me gusta</span>
                </button>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>{post.comments_count} Comentarios</span>
                </div>
              </div>
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
