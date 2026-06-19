import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import SongLyricsEditor from '../../components/admin/SongLyricsEditor';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  Plus, Edit3, Trash2, X, Search, Music, ListMusic,
  Tag, Palette as StyleIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Song, SongType, SongStyle } from '../../types';

const songSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  artist: z.string().optional(),
  bpm: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) ? undefined : Number(val),
    z.number().int().min(0).max(300).optional()
  ),
  type_id: z.string().optional(),
  style_id: z.string().optional(),
  has_chords: z.boolean(),
});

type SongFormData = z.infer<typeof songSchema>;

const SongsManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('songs');
  const confirm = useConfirmStore((state) => state.confirm);

  const [songs, setSongs] = useState<Song[]>([]);
  const [songTypes, setSongTypes] = useState<SongType[]>([]);
  const [songStyles, setSongStyles] = useState<SongStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState('');

  // Catalog management
  const [showCatalogs, setShowCatalogs] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newStyleName, setNewStyleName] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(songSchema),
    defaultValues: { title: '', artist: '', bpm: undefined, type_id: '', style_id: '', has_chords: false },
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [songsRes, typesRes, stylesRes] = await Promise.all([
      supabase.from('songs').select('*, song_types(*), song_styles(*)').order('title'),
      supabase.from('song_types').select('*').order('name'),
      supabase.from('song_styles').select('*').order('name'),
    ]);
    if (songsRes.data) setSongs(songsRes.data);
    if (typesRes.data) setSongTypes(typesRes.data);
    if (stylesRes.data) setSongStyles(stylesRes.data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingSong(null);
    reset({ title: '', artist: '', bpm: '', type_id: '', style_id: '', has_chords: false });
    setLyrics('');
    setShowForm(true);
  };

  const openEdit = (song: Song) => {
    setEditingSong(song);
    reset({
      title: song.title,
      artist: song.artist || '',
      bpm: song.bpm ?? '',
      type_id: song.type_id || '',
      style_id: song.style_id || '',
      has_chords: song.has_chords,
    });
    setLyrics(song.lyrics || '');
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    const typedData = data as SongFormData;
    const payload = {
      title: typedData.title,
      artist: typedData.artist || null,
      bpm: typedData.bpm ? Number(typedData.bpm) : null,
      type_id: typedData.type_id || null,
      style_id: typedData.style_id || null,
      has_chords: typedData.has_chords,
      lyrics,
    };

    if (editingSong) {
      const { error } = await supabase.from('songs').update(payload).eq('id', editingSong.id);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Canción actualizada');
    } else {
      const { error } = await supabase.from('songs').insert(payload);
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Canción creada');
    }
    setShowForm(false);
    fetchAll();
  };

  const deleteSong = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar canción',
      message: '¿Estás seguro de que deseas eliminar esta canción de la biblioteca?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Canción eliminada');
    fetchAll();
  };

  // Catalog CRUD
  const addType = async () => {
    if (!newTypeName.trim()) return;
    const { error } = await supabase.from('song_types').insert({ name: newTypeName.trim() });
    if (error) { toast.error(error.message); return; }
    setNewTypeName('');
    toast.success('Tipo añadido');
    fetchAll();
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase.from('song_types').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Tipo eliminado');
    fetchAll();
  };

  const addStyle = async () => {
    if (!newStyleName.trim()) return;
    const { error } = await supabase.from('song_styles').insert({ name: newStyleName.trim() });
    if (error) { toast.error(error.message); return; }
    setNewStyleName('');
    toast.success('Estilo añadido');
    fetchAll();
  };

  const deleteStyle = async (id: string) => {
    const { error } = await supabase.from('song_styles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Estilo eliminado');
    fetchAll();
  };

  // Filtered songs
  const filtered = songs.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.artist || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || s.type_id === filterType;
    const matchStyle = !filterStyle || s.style_id === filterStyle;
    return matchSearch && matchType && matchStyle;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800 flex items-center gap-2">
            <Music className="text-amber-600" size={28} />
            Alabanzas e Himnos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el catálogo de canciones de la iglesia</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={() => setShowCatalogs(!showCatalogs)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium">
              <Tag size={16} /> Catálogos {showCatalogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer text-sm font-semibold shadow-md">
              <Plus size={18} /> Nueva Canción
            </button>
          </div>
        )}
      </div>

      {/* Catalogs Panel */}
      {showCatalogs && !readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          {/* Types */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1"><ListMusic size={14} /> Tipos de Canción</h3>
            <div className="flex gap-2 mb-2">
              <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addType()}
                placeholder="Nuevo tipo..." className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" />
              <button onClick={addType} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer">Añadir</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {songTypes.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                  {t.name}
                  <button onClick={() => deleteType(t.id)} className="text-red-400 hover:text-red-600 cursor-pointer"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
          {/* Styles */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1"><StyleIcon size={14} /> Estilos de Canción</h3>
            <div className="flex gap-2 mb-2">
              <input value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStyle()}
                placeholder="Nuevo estilo..." className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" />
              <button onClick={addStyle} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer">Añadir</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {songStyles.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                  {s.name}
                  <button onClick={() => deleteStyle(s.id)} className="text-red-400 hover:text-red-600 cursor-pointer"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o artista..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 outline-none">
          <option value="">Todos los tipos</option>
          {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 outline-none">
          <option value="">Todos los estilos</option>
          {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Songs Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Music size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No hay canciones</p>
          <p className="text-sm">Agrega tu primera alabanza al catálogo</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Artista</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">BPM</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden xl:table-cell">Estilo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acordes</th>
                  {!readOnly && <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((song) => (
                  <tr key={song.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{song.title}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{song.artist || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden lg:table-cell">{song.bpm || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {song.song_types ? (
                        <span className="inline-block bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{song.song_types.name}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {song.song_styles ? (
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{song.song_styles.name}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {song.has_chords ? (
                        <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">🎸 Sí</span>
                      ) : (
                        <span className="text-gray-300 text-xs">No</span>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(song)} className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-700 cursor-pointer transition-colors" title="Editar">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteSong(song.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Song Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowForm(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200 my-4">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold text-gray-800">
                {editingSong ? 'Editar Canción' : 'Nueva Canción'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Row 1: Title + Artist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="song-title" className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
                  <input id="song-title" {...register('title')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Ej: Grande es tu fidelidad" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{(errors.title as any).message}</p>}
                </div>
                <div>
                  <label htmlFor="song-artist" className="block text-sm font-semibold text-gray-700 mb-1">Artista</label>
                  <input id="song-artist" {...register('artist')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Ej: Thomas Chisholm" />
                </div>
              </div>

              {/* Row 2: BPM + Type + Style + Has Chords */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="song-bpm" className="block text-sm font-semibold text-gray-700 mb-1">BPM</label>
                  <input id="song-bpm" type="number" {...register('bpm')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="120" />
                </div>
                <div>
                  <label htmlFor="song-type" className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select id="song-type" {...register('type_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 outline-none">
                    <option value="">Seleccionar...</option>
                    {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="song-style" className="block text-sm font-semibold text-gray-700 mb-1">Estilo</label>
                  <select id="song-style" {...register('style_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 outline-none">
                    <option value="">Seleccionar...</option>
                    {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label htmlFor="song-chords" className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 w-full">
                    <input id="song-chords" type="checkbox" {...register('has_chords')} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                    <span className="text-sm font-medium text-gray-700">Tiene acordes</span>
                  </label>
                </div>
              </div>

              {/* Lyrics Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Letra de la Canción
                  <span className="ml-2 text-xs text-gray-400 font-normal">Usa H2 para secciones (Verso, Coro, Puente)</span>
                </label>
                <SongLyricsEditor content={lyrics} onChange={setLyrics} disabled={readOnly} />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 cursor-pointer transition-colors shadow-md">
                  {editingSong ? 'Actualizar Canción' : 'Guardar Canción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongsManager;
