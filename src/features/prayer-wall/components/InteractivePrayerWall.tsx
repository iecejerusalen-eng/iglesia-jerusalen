import React, { useState } from 'react';
import type { PrayerPost } from '../types';
import { Heart, Plus, Sparkles, Filter, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InteractivePrayerWallProps {
  posts: PrayerPost[];
  onPrayForPost: (postId: string) => Promise<void>;
  onCreatePost: (post: Partial<PrayerPost>) => Promise<void>;
}

export const InteractivePrayerWall: React.FC<InteractivePrayerWallProps> = ({
  posts,
  onPrayForPost,
  onCreatePost,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PrayerPost['category']>('salud');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const filteredPosts = posts.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  const handlePray = async (postId: string) => {
    try {
      await onPrayForPost(postId);
      toast.success('¡Gracias por unirte en oración por este hermano!');
    } catch {
      toast.error('Error al registrar tu oración');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Por favor completa el título y la petición');
      return;
    }
    try {
      await onCreatePost({
        title,
        content,
        category,
        is_anonymous: isAnonymous,
        author_name: isAnonymous ? 'Anónimo' : 'Hermano en Cristo',
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      toast.success('Petición de oración publicada en el muro');
    } catch {
      toast.error('Error al publicar la petición');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
            Muro Interactivo de Oración
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Unidos en clamor e intercesión. Haz clic en "Estoy Orando" para sostener a otros en oración.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Publicar Petición
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'salud', 'familia', 'finanzas', 'trabajo', 'misiones', 'gratitud'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap border transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Filter className="w-3 h-3 inline mr-1" />
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {post.category}
                </span>
                {post.is_answered && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Oración Contestada
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {post.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {post.content}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Por: {post.author_name}
              </span>
              <button
                onClick={() => handlePray(post.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  post.user_has_prayed
                    ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    post.user_has_prayed ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`}
                />
                <span>{post.prayer_count} Están orando</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Nueva Petición de Oración
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Título corto
              </label>
              <input
                type="text"
                placeholder="Ej. Por la salud de mi abuela"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerPost['category'])}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm capitalize"
              >
                <option value="salud">Salud</option>
                <option value="familia">Familia</option>
                <option value="finanzas">Finanzas</option>
                <option value="trabajo">Trabajo</option>
                <option value="misiones">Misiones</option>
                <option value="gratitud">Gratitud / Testimonio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Detalle de la Petición
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe brevemente tu motivo de oración..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm h-24"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Publicar de forma anónima
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Publicar Petición
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
