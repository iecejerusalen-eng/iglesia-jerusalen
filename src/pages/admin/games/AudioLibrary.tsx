import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Music, Plus, Edit2, Trash2, Search, Play, Square, AlertCircle, Link } from 'lucide-react';

interface AudioAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  file_url: string;
  created_at: string;
}

export const AudioLibrary = () => {
  const [assets, setAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AudioAsset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'music',
    tags: '',
    file_url: ''
  });

  useEffect(() => {
    fetchAssets();
    return () => stopAudio();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('game_audio_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error('Error fetching audio assets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setPlayingId(null);
  };

  const playAudio = (id: string, url: string) => {
    if (playingId === id) {
      stopAudio();
      return;
    }
    
    stopAudio();
    
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(e => console.error("Error playing audio", e));
    
    setAudioElement(audio);
    setPlayingId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: tagsArray,
        file_url: formData.file_url
      };

      if (editingAsset) {
        const { error } = await supabase
          .from('game_audio_assets')
          .update(payload)
          .eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_audio_assets')
          .insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingAsset(null);
      setFormData({ name: '', description: '', category: 'music', tags: '', file_url: '' });
      fetchAssets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este audio?')) return;
    try {
      const { error } = await supabase.from('game_audio_assets').delete().eq('id', id);
      if (error) throw error;
      fetchAssets();
    } catch (err: any) {
      console.error(err);
    }
  };

  const openEditModal = (asset: AudioAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      category: asset.category,
      tags: asset.tags.join(', '),
      file_url: asset.file_url
    });
    setIsModalOpen(true);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Music className="h-6 w-6 text-indigo-600" />
          Biblioteca de Sonidos
        </h1>
        <button
          onClick={() => {
            setEditingAsset(null);
            setFormData({ name: '', description: '', category: 'music', tags: '', file_url: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Sonido
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Todas las Categorías</option>
          <option value="music">Música</option>
          <option value="sfx">Efectos (SFX)</option>
          <option value="voice">Voces</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400 mb-6">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Tags</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => playAudio(asset.id, asset.file_url)}
                          className={`p-2 rounded-full ${playingId === asset.id ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'} hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors`}
                        >
                          {playingId === asset.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{asset.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron sonidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingAsset ? 'Editar Sonido' : 'Añadir Sonido'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="music">Música</option>
                    <option value="sfx">Efectos (SFX)</option>
                    <option value="voice">Voz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (separados por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="win, suspense, biblionario..."
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL del Archivo (Cloudinary u otro)
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    required
                    type="url"
                    placeholder="https://res.cloudinary.com/..."
                    value={formData.file_url}
                    onChange={e => setFormData({...formData, file_url: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
