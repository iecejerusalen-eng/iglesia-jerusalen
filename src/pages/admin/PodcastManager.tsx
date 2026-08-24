import React, { useState, useEffect } from 'react';
import {
  Mic, Plus, Edit2, Trash2, Search, Clock,
  X, Settings, Upload, CheckCircle2, Music, Link as LinkIcon
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
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'url'>('file');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      audio_source_type: 'file',
      cover_image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
      season_number: 1,
      episode_number: episodes.length + 1,
      status: 'published',
      chapters: [],
      audio_duration_seconds: 1200,
    });
    setAudioInputMode('file');
    setShowModal(true);
  };

  const handleOpenEdit = (ep: PodcastEpisode) => {
    setEditingEpisode({ ...ep });
    setAudioInputMode(ep.audio_url?.includes('supabase') ? 'file' : 'url');
    setShowModal(true);
  };

  const handleAudioFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!file.type.startsWith('audio/') && !validExtensions.includes(fileExt)) {
      toast.error('Formato no soportado. Sube un archivo de audio (MP3, WAV, M4A, AAC, OGG).');
      return;
    }

    setUploadingAudio(true);
    setUploadProgress(15);

    try {
      // Calculate audio duration in background
      const tempAudioUrl = URL.createObjectURL(file);
      const audio = new Audio(tempAudioUrl);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setEditingEpisode(prev => prev ? { ...prev, audio_duration_seconds: Math.round(audio.duration) } : null);
        }
      };

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `episodes/${Date.now()}_${cleanFileName}`;

      setUploadProgress(45);
      const { data, error } = await supabase.storage
        .from('podcasts')
        .upload(filePath, file, { upsert: true });

      setUploadProgress(85);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('podcasts')
        .getPublicUrl(data.path);

      const publicAudioUrl = publicUrlData.publicUrl;

      setEditingEpisode(prev => prev ? { ...prev, audio_url: publicAudioUrl, audio_source_type: 'file' } : null);
      setUploadProgress(100);
      toast.success('Archivo de audio subido con éxito a Supabase Storage.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error al subir audio:', err);
      toast.error('Error al subir el archivo de audio: ' + errorMsg);
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSaveEpisode = async () => {
    if (!editingEpisode?.title || !editingEpisode?.audio_url) {
      toast.error('Completa el título y sube o ingresa la URL de audio.');
      return;
    }

    try {
      const payload = {
        title: editingEpisode.title,
        description: editingEpisode.description || '',
        audio_url: editingEpisode.audio_url,
        audio_source_type: (editingEpisode.audio_source_type as 'upload' | 'file' | 'url' | 'embed') || 'file',
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
        await supabase.from('podcast_episodes').update(payload).eq('id', editingEpisode.id);
        setEpisodes(prev => prev.map(e => e.id === editingEpisode.id ? ({ ...e, ...payload } as PodcastEpisode) : e));
        toast.success('Episodio actualizado correctamente.');
      } else {
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

  const formatSeconds = (totalSecs?: number) => {
    if (!totalSecs) return '0:00';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredEpisodes = episodes.filter(ep =>
    ep.title.toLowerCase().includes(search.toLowerCase()) ||
    (ep.description && ep.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <AdminHeader
        eyebrow="Podcasting & Medios Audiovisuales"
        title="Gestión de Podcast & Audio"
        description="Sube archivos de audio (MP3, WAV, M4A), administra episodios, marcadores de tiempo y configuración del show."
      />

      {/* TABS HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'episodes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
            }`}
          >
            <Mic className="w-4 h-4" /> Episodios ({episodes.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
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
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatSeconds(ep.audio_duration_seconds)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mt-1">{ep.title}</h4>
                      {ep.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{ep.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(ep)}
                      className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
                      title="Eliminar"
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

      {/* SHOW SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6 max-w-3xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
            <Settings className="w-5 h-5 text-amber-500" /> Configuración General del Podcast
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Show</label>
              <input
                type="text"
                value={showSettings.name || ''}
                onChange={(e) => setShowSettings({ ...showSettings, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción del Show</label>
              <textarea
                rows={3}
                value={showSettings.description || ''}
                onChange={(e) => setShowSettings({ ...showSettings, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none resize-none"
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
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              Guardar Cambios del Show
            </button>
          </div>
        </div>
      )}

      {/* EDIT / CREATE EPISODE MODAL WITH DIRECT FILE UPLOAD */}
      {showModal && editingEpisode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                {editingEpisode.id ? 'Editar Episodio' : 'Nuevo Episodio de Podcast'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título del Episodio *</label>
                <input
                  type="text"
                  value={editingEpisode.title || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                  placeholder="Ej: Ep. 04: Renovados en la Fe"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* AUDIO SOURCE SELECTOR & FILE UPLOADER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">Archivo o Fuente de Audio *</label>
                  <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('file')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                        audioInputMode === 'file' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Subir Archivo (MP3/WAV)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('url')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                        audioInputMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> Pegar URL
                    </button>
                  </div>
                </div>

                {audioInputMode === 'file' ? (
                  <div className="border-2 border-dashed border-white/20 hover:border-amber-400/50 bg-slate-800/50 rounded-2xl p-5 text-center transition space-y-3">
                    {uploadingAudio ? (
                      <div className="space-y-2 py-2">
                        <div className="flex justify-between text-xs font-bold text-amber-400">
                          <span>Subiendo archivo a Supabase Storage...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : editingEpisode.audio_url ? (
                      <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-3 text-left">
                          <Music className="w-6 h-6 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Audio Cargado con Éxito
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">{editingEpisode.audio_url}</p>
                            <p className="text-[10px] text-amber-400/80 font-bold mt-0.5">Duración estimada: {formatSeconds(editingEpisode.audio_duration_seconds)}</p>
                          </div>
                        </div>
                        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold rounded-lg cursor-pointer border border-amber-500/30">
                          Reemplazar
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleAudioFileUpload(f);
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer space-y-2 py-4">
                        <Upload className="w-8 h-8 text-amber-400 animate-bounce" />
                        <div>
                          <span className="text-xs font-bold text-amber-300 underline">Haz clic para seleccionar archivo MP3, WAV, M4A o OGG</span>
                          <p className="text-[10px] text-slate-400 mt-1">Soporta archivos de audio de hasta 100 MB.</p>
                        </div>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleAudioFileUpload(f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={editingEpisode.audio_url || ''}
                      onChange={(e) => setEditingEpisode({ ...editingEpisode, audio_url: e.target.value })}
                      placeholder="https://servidor.com/audio/episodio4.mp3"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}
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
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
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
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEpisode}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:scale-105 transition cursor-pointer"
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
