import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Gamepad2, Edit2, Eye, EyeOff, AlertCircle, Plus, Music, X, Upload } from 'lucide-react';
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

export const GamesManager = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', image_url: '' });

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({ title: game.title, description: game.description, image_url: game.image_url || '' });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadFileToCloudinary(file, 'games');
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Imagen subida a Cloudinary exitosamente');
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      toast.error('Error al subir imagen a Cloudinary');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveGameChanges = async () => {
    if (!editingGame) return;
    try {
      const { error } = await supabase
        .from('games')
        .update({
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url
        })
        .eq('id', editingGame.id);

      if (error) throw error;
      toast.success('Cambios guardados correctamente');
      setIsEditModalOpen(false);
      fetchGames();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      toast.error('Error al guardar los cambios');
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (err: any) {
      console.error('Error fetching games:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleGameStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchGames();
    } catch (err: any) {
      console.error('Error toggling game status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-indigo-600" />
          Gestión de Juegos
        </h1>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            onClick={() => navigate('/admin/juegos/audio-library')}
          >
            <Music className="h-4 w-4" />
            Biblioteca de Sonidos
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => alert('Función de agregar juego próximamente.')}
          >
            <Plus className="h-4 w-4" />
            Nuevo Juego
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-48 overflow-hidden relative">
              <img
                src={game.image_url || 'https://via.placeholder.com/400x200?text=Juego'}
                alt={game.title}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => toggleGameStatus(game.id, game.is_active)}
                  className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                    game.is_active 
                      ? 'bg-green-500/80 text-white hover:bg-green-600' 
                      : 'bg-gray-500/80 text-white hover:bg-gray-600'
                  }`}
                  title={game.is_active ? 'Desactivar' : 'Activar'}
                >
                  {game.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {game.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {game.description}
              </p>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  <button
                    onClick={() => openEditModal(game)}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar Info
                  </button>
                  <button
                    onClick={() => navigate(`/admin/juegos/${game.slug}`)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Administrar
                  </button>
                </div>
                
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  game.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {game.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Información del Juego</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen de Portada (Cloudinary)</label>
                <div className="flex gap-4 items-start">
                  <div className="w-32 h-20 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Portada" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition-colors w-full justify-center border border-gray-300 dark:border-gray-600">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Subiendo...' : 'Subir nueva imagen'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <input 
                      type="text" 
                      value={formData.image_url}
                      onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="mt-2 w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="O pega una URL..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveGameChanges}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
