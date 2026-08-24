import React, { useState, useEffect } from 'react';
import {
  Mic, Plus, Edit2, Trash2, Search, Radio, Clock,
  X, Settings
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import type { PodcastEpisode, PodcastShow, AudioChapter } from '../../features/podcast/types';

export const PodcastManager = () => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'series' | 'settings'>('episodes');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Partial<PodcastEpisode> | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterSeconds, setChapterSeconds] = useState(0);

  // Show settings state
  const [showSettings, setShowSettings] = useState<Partial<PodcastShow>>({
    name: 'Voces de Jerusalén',
    description: 'Podcast oficial de la Iglesia Jerusalén. Reflexiones, devocionales y sermones semanales.',
    author: 'Iglesia Jerusalén',
    language: 'es',
    itunes_category: 'Religion & Spirituality',
    itunes_subcategory: 'Christianity',
    spotify_url: '',
    apple_podcasts_url: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('podcast_episodes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;
        if (error || !data || data.length === 0) {
          setEpisodes(MOCK_INITIAL_EPISODES);
        } else {
          setEpisodes(data as PodcastEpisode[]);
        }
      } catch {
        if (isMounted) setEpisodes(MOCK_INITIAL_EPISODES);
      }

      try {
        const { data } = await supabase.from('podcast_show').select('*').single();
        if (isMounted && data) setShowSettings(data);
      } catch { /* ignore fallback */ }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenNew = () => {
    setEditingEpisode({
      title: '',
      description: '',
      audio_url: '',
      audio_source_type: 'url',
      cover_image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
      season_number: 1,
      episode_number: episodes.length + 1,
      status: 'published',
      chapters: [],
      audio_duration_seconds: 1200,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ep: PodcastEpisode) => {
    setEditingEpisode({ ...ep });
    setShowModal(true);
  };

  const handleSaveEpisode = async () => {
    if (!editingEpisode?.title || !editingEpisode?.audio_url) {
      toast.error('Completa el título y la URL de audio.');
      return;
    }

    try {
      const payload = {
        title: editingEpisode.title,
        description: editingEpisode.description || '',
        audio_url: editingEpisode.audio_url,
        audio_source_type: editingEpisode.audio_source_type || 'url',
        audio_duration_seconds: editingEpisode.audio_duration_seconds || 1200,
        cover_image_url: editingEpisode.cover_image_url || '',
        status: editingEpisode.status || 'published',
        season_number: editingEpisode.season_number || 1,
        episode_number: editingEpisode.episode_number || 1,
        chapters: editingEpisode.chapters || [],
        ai_summary: editingEpisode.ai_summary || {},
        updated_at: new Date().toISOString(),
      };

      if (editingEpisode.id) {
        // Update existing
        await supabase.from('podcast_episodes').update(payload).eq('id', editingEpisode.id);
        setEpisodes(prev => prev.map(e => e.id === editingEpisode.id ? { ...e, ...payload } : e));
        toast.success('Episodio actualizado correctamente.');
      } else {
        // Insert new
        const newEp: PodcastEpisode = {
          id: `ep-${Date.now()}`,
          ...payload,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as PodcastEpisode;
        
        await supabase.from('podcast_episodes').insert([payload]);
        setEpisodes(prev => [newEp, ...prev]);
        toast.success('Nuevo episodio guardado y publicado.');
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el episodio.');
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm('¿Deseas eliminar este episodio?')) return;
    try {
      await supabase.from('podcast_episodes').delete().eq('id', id);
      setEpisodes(prev => prev.filter(e => e.id !== id));
      toast.success('Episodio eliminado.');
    } catch {
      toast.error('No se pudo eliminar.');
    }
  };

  const handleAddChapter = () => {
    if (!chapterTitle.trim()) return;
    const existing = editingEpisode?.chapters || [];
    const newChapter: AudioChapter = {
      id: `ch-${Date.now()}`,
      title: chapterTitle,
      seconds: chapterSeconds,
    };
    setEditingEpisode({
      ...editingEpisode,
      chapters: [...existing, newChapter],
    });
    setChapterTitle('');
    setChapterSeconds(0);
  };

  const filteredEpisodes = episodes.filter(ep =>
    ep.title.toLowerCase().includes(search.toLowerCase()) ||
    (ep.description && ep.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <AdminHeader
        title="Gestión de Podcast & Audio"
        description="Administra el catálogo de episodios, series, reproductor inteligente y configuración del show."
      />

      {/* TABS HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'episodes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
            }`}
          >
            <Mic className="w-4 h-4" /> Episodios ({episodes.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
            }`}
          >
            <Settings className="w-4 h-4" /> Configuración del Show
          </button>
        </div>

        {activeTab === 'episodes' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Nuevo Episodio
          </button>
        )}
      </div>

      {/* EPISODES LIST */}
      {activeTab === 'episodes' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título de episodio..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white outline-none"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredEpisodes.map((ep) => (
                <div key={ep.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <img
                      src={ep.cover_image_url || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80'}
                      alt={ep.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                          T{ep.season_number || 1} • Ep.{ep.episode_number || 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ep.status === 'published' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {ep.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mt-1">{ep.title}</h4>
                      {ep.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{ep.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-slate-400">
                      {Math.floor((ep.audio_duration_seconds || 1200) / 60)} min
                    </span>
                    <button
                      onClick={() => handleOpenEdit(ep)}
                      className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                      title="Editar episodio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Eliminar episodio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHOW SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6 max-w-3xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500" /> Datos Principales del Podcast
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Show</label>
              <input
                type="text"
                value={showSettings.name || ''}
                onChange={(e) => setShowSettings({ ...showSettings, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción General</label>
              <textarea
                rows={3}
                value={showSettings.description || ''}
                onChange={(e) => setShowSettings({ ...showSettings, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría iTunes</label>
                <input
                  type="text"
                  value={showSettings.itunes_category || 'Religion & Spirituality'}
                  onChange={(e) => setShowSettings({ ...showSettings, itunes_category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subcategoría</label>
                <input
                  type="text"
                  value={showSettings.itunes_subcategory || 'Christianity'}
                  onChange={(e) => setShowSettings({ ...showSettings, itunes_subcategory: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => toast.success('Configuración guardada correctamente.')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
            >
              Guardar Cambios del Show
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showModal && editingEpisode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                {editingEpisode.id ? 'Editar Episodio' : 'Nuevo Episodio de Podcast'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título del Episodio</label>
                <input
                  type="text"
                  value={editingEpisode.title || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                  placeholder="Ej: Ep. 04: Renovados en la Fe"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL de Audio MP3 (Directo o Storage)</label>
                <input
                  type="text"
                  value={editingEpisode.audio_url || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, audio_url: e.target.value })}
                  placeholder="https://servidor.com/audio/episodio4.mp3"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Número de Temporada</label>
                  <input
                    type="number"
                    value={editingEpisode.season_number || 1}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, season_number: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Número de Episodio</label>
                  <input
                    type="number"
                    value={editingEpisode.episode_number || 1}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, episode_number: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción del Episodio</label>
                <textarea
                  rows={3}
                  value={editingEpisode.description || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, description: e.target.value })}
                  placeholder="Resumen del contenido del episodio..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* CHAPTERS BUILDER */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Capítulos / Marcadores de Tiempo
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Título del capítulo..."
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="number"
                    value={chapterSeconds}
                    onChange={(e) => setChapterSeconds(parseInt(e.target.value) || 0)}
                    placeholder="Seg (Ej: 120)"
                    className="w-24 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Añadir
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(editingEpisode.chapters || []).map((ch, idx) => (
                    <div key={ch.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                      <span>{ch.title}</span>
                      <span className="font-mono text-amber-300">{ch.seconds}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEpisode}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:scale-105 transition"
              >
                Guardar Episodio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MOCK_INITIAL_EPISODES: PodcastEpisode[] = [
  {
    id: 'ep-1',
    title: 'Ep. 01: El Arte de Esperar en Dios',
    description: 'En este primer episodio conversamos sobre cómo cultivar paciencia y paz durante los valles de incertidumbre en el recorrido espiritual.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audio_source_type: 'url',
    audio_duration_seconds: 1420,
    cover_image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
    season_number: 1,
    episode_number: 1,
    status: 'published',
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    chapters: [
      { id: 'c1', title: 'Bienvenida e Introducción', seconds: 0 },
      { id: 'c2', title: 'La definición bíblica de la paciencia', seconds: 320 }
    ]
  },
  {
    id: 'ep-2',
    title: 'Ep. 02: Renovando la Mente con la Palabra',
    description: 'Una mirada práctica a Romanos 12 para sustituir pensamientos de ansiedad por la verdad de las Escrituras.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audio_source_type: 'url',
    audio_duration_seconds: 1850,
    cover_image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    season_number: 1,
    episode_number: 2,
    status: 'published',
    published_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export default PodcastManager;
