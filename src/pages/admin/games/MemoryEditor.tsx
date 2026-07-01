import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

import EmojiPicker from 'emoji-picker-react';

interface MemoryCard {
  id: string;
  pair_name: string;
  image_url: string | null;
}

export const MemoryEditor = () => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MemoryCard | null>(null);
  
  // Form State
  const [pairName, setPairName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_memory_cards')
        .select('*')
        .order('pair_name');
      
      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar cartas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        pair_name: pairName,
        image_url: imageUrl || null
      };

      if (editingCard) {
        const { error } = await supabase
          .from('game_memory_cards')
          .update(payload)
          .eq('id', editingCard.id);
        if (error) throw error;
        toast.success('Carta actualizada');
      } else {
        const { error } = await supabase
          .from('game_memory_cards')
          .insert([payload]);
        if (error) throw error;
        toast.success('Carta añadida');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchCards();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar carta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta carta?')) return;
    try {
      const { error } = await supabase
        .from('game_memory_cards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Carta eliminada');
      fetchCards();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const resetForm = () => {
    setEditingCard(null);
    setPairName('');
    setImageUrl('');
  };

  const openEdit = (c: MemoryCard) => {
    setEditingCard(c);
    setPairName(c.pair_name);
    setImageUrl(c.image_url || '');
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor: Memorama Bíblico</h1>
          <p className="text-gray-500">Gestiona las parejas de cartas del juego. (Se necesitan mínimo 8)</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Añadir Pareja
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando cartas...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium w-16">Imagen</th>
                <th className="p-4 font-medium">Nombre de Pareja</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cards.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                      {c.image_url ? (
                        c.image_url.startsWith('<svg') ? (
                          <div className="w-full h-full text-gray-600 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.image_url, { USE_PROFILES: { svg: true } }) }} />
                        ) : c.image_url.startsWith('http') || c.image_url.startsWith('/') || c.image_url.startsWith('data:') ? (
                          <img src={c.image_url} alt={c.pair_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{c.image_url}</span>
                        )
                      ) : (
                        <ImageIcon size={20} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium dark:text-white">{c.pair_name}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No hay cartas configuradas. Añade al menos 8 para poder jugar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editingCard ? 'Editar Carta' : 'Nueva Carta'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre de la Pareja</label>
                <input 
                  required
                  type="text" 
                  value={pairName}
                  onChange={e => setPairName(e.target.value)}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Ej. Arca de Noé"
                />
                <p className="text-xs text-gray-500 mt-1">Este texto se mostrará si no hay imagen.</p>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300 flex justify-between">
                  <span>URL, Emoji o SVG (Opcional)</span>
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    {showEmojiPicker ? 'Ocultar Emojis' : '😁 Añadir Emoji'}
                  </button>
                </label>
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="https://... o pega un emoji/svg"
                />
                
                {showEmojiPicker && (
                  <div className="absolute z-10 right-0 mt-2">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setImageUrl(emojiData.emoji);
                        setShowEmojiPicker(false);
                      }} 
                    />
                  </div>
                )}
              </div>
              
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2 dark:text-gray-300">Vista previa:</p>
                  <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mx-auto flex items-center justify-center">
                    {imageUrl.startsWith('<svg') ? (
                      <div className="w-full h-full text-gray-600 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(imageUrl, { USE_PROFILES: { svg: true } }) }} />
                    ) : imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:') ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }} />
                    ) : (
                      <span className="text-4xl">{imageUrl}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
