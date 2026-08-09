import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Gamepad2, Edit2, Eye, EyeOff, AlertCircle, Plus, Music, X, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFileToCloudinary } from '../../lib/cloudinaryService';
import { toast } from 'sonner';

interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  slug: string;
  is_active: boolean;
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export const GamesManager = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', image_url: '', slug: '' });

  const fetchGames = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, title, description, image_url, slug, is_active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGames(data || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching games:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGame(null);
    setFormData({ title: '', description: '', image_url: '', slug: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({ title: game.title, description: game.description || '', image_url: game.image_url || '', slug: game.slug || '' });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadFileToCloudinary(file, 'games');
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Imagen subida a Cloudinary exitosamente');
    } catch (err: unknown) {
      console.error('Error al subir imagen:', err);
      toast.error('Error al subir imagen a Cloudinary');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Ingresa un título para el juego');
      return;
    }

    const generatedSlug = formData.slug.trim() 
      ? formData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
      : formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      if (editingGame) {
        const { error: updateErr } = await supabase
          .from('games')
          .update({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url,
            slug: generatedSlug,
          })
          .eq('id', editingGame.id);

        if (updateErr) throw updateErr;
        toast.success('Juego actualizado correctamente');
      } else {
        const { error: insertErr } = await supabase
          .from('games')
          .insert({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url,
            slug: generatedSlug,
            is_active: true,
          });

        if (insertErr) throw insertErr;
        toast.success('Juego creado correctamente');
      }

      setIsModalOpen(false);
      fetchGames();
    } catch (err: unknown) {
      console.error('Error al guardar juego:', err);
      toast.error('Error al guardar el juego: ' + getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el juego "${title}"?`)) return;

    try {
      const { error: deleteErr } = await supabase
        .from('games')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;
      toast.success('Juego eliminado correctamente');
      fetchGames();
    } catch (err: unknown) {
      console.error('Error al eliminar juego:', err);
      toast.error('No se pudo eliminar el juego');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchGames(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleGameStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Juego ${!currentStatus ? 'activado' : 'desactivado'}`);
      fetchGames();
    } catch (err: unknown) {
      console.error('Error toggling game status:', err);
      toast.error('Error al cambiar estado del juego');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Gestión de Juegos Bíblicos
        </h1>
        <div className="flex gap-3 flex-wrap">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors text-sm font-semibold"
            onClick={() => navigate('/admin/juegos/audio-library')}
          >
            <Music className="h-4 w-4" />
            Biblioteca de Sonidos
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors text-sm font-semibold"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Nuevo Juego
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/70 dark:border-white/10 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                <img
                  src={game.image_url || '/images/games/default.png'}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Juego+Biblico';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => toggleGameStatus(game.id, game.is_active)}
                    className={`p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
                      game.is_active 
                        ? 'bg-emerald-600/90 text-white hover:bg-emerald-700' 
                        : 'bg-slate-700/90 text-white hover:bg-slate-800'
                    }`}
                    title={game.is_active ? 'Desactivar juego' : 'Activar juego'}
                  >
                    {game.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(game.id, game.title)}
                    className="p-2 rounded-xl backdrop-blur-md bg-rose-600/90 hover:bg-rose-700 text-white transition-all shadow-md"
                    title="Eliminar juego"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {game.title}
                  </h3>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full shrink-0 ${
                    game.is_active 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {game.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                  {game.description || 'Sin descripción asignada.'}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => openEditModal(game)}
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/admin/juegos/${game.slug}`)}
                  className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold text-xs"
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Configurar Preguntas
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-white/10">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingGame ? 'Editar Información del Juego' : 'Nuevo Juego Bíblico'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Título del Juego</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej. Quien Quiere Ser Biblionario"
                  className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Identificador URL (Slug)</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="Ej. quien-quiere-ser-biblionario"
                  className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Descripción</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explica de qué trata el juego..."
                  className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Imagen de Portada (Cloudinary)</label>
                <div className="flex gap-4 items-start">
                  <div className="w-32 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Portada" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">Sin portada</span>
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors w-full justify-center border border-slate-200 dark:border-white/10">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <input 
                      type="text" 
                      value={formData.image_url}
                      onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full p-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      placeholder="O pega una URL..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md"
              >
                {editingGame ? 'Guardar Cambios' : 'Crear Juego'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
