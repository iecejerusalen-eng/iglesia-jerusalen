import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { getDb } from '../../config/localDb';
import { useSyncStore } from '../../store/useSyncStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar, User, ArrowLeft, RefreshCw, FileText,
  AlertTriangle, Edit2, Sparkles, X, Share2
} from 'lucide-react';
import type { Sermon } from '../../types';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';
import { AnimeFadeUp, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import VideoPlayer from '../../components/ui/video-player';
import WaveformPlayer from '../../components/audio/WaveformPlayer';
import SermonNotesPad from '../../components/sermons/SermonNotesPad';
import ChristianPomodoro from '../../components/sermons/ChristianPomodoro';

const SermonDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'notes' | 'pomodoro'>('notes');
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);

  // TipTap Note Editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] text-gray-800 dark:text-gray-200 dark:prose-invert leading-relaxed text-sm',
      },
    },
  });


  const userId = user?.id;

  const fetchSermonAndNotes = useCallback(async () => {
    if (!id) return;
    setSermon(prev => {
      if (!prev) setLoading(true);
      return prev;
    });

    try {
      // Fetch sermon
      let activeSermon = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUuid) {
        const { data, error } = await supabase
          .from('sermons')
          .select('*, sermon_categories(*), speakers(*)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        activeSermon = data;
      }

      setSermon(activeSermon);

      // Fetch user note if authenticated
      if (userId && activeSermon) {
        // Try local IDB first
        let cachedNotes: { id: string; user_id: string; sermon_id: string; content?: string }[] = [];
        try {
          const db = await getDb();
          const allNotes = await db.getAll('local_sermon_notes');
          cachedNotes = allNotes.filter((n: { user_id: string; sermon_id: string; [key: string]: unknown }) => n.user_id === userId && n.sermon_id === activeSermon.id) as typeof cachedNotes;
        } catch (idbErr) {
          console.warn('IDB sermon notes fetch failed, falling back to Supabase:', idbErr);
        }

        if (cachedNotes && cachedNotes.length > 0) {
          setNoteId(cachedNotes[0].id);
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(cachedNotes[0].content || '');
          }
        } else {
          // Fallback to Supabase
          const { data: noteData, error: noteError } = await supabase
            .from('sermon_notes')
            .select('id, content')
            .eq('user_id', userId)
            .eq('sermon_id', activeSermon.id)
            .maybeSingle();

          if (!noteError && noteData) {
            setNoteId(noteData.id);
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(noteData.content || '');
            }
          } else {
            setNoteId(null);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sermon detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id, userId, editor]);

  useEffect(() => {
    const load = async () => {
      await fetchSermonAndNotes();
    };
    load();
  }, [fetchSermonAndNotes]);

  const handleSaveNotes = async () => {
    if (!user) {
      toast.warning('Inicia sesión para guardar tus notas.');
      return;
    }
    if (!sermon || !editor) return;

    setSavingNote(true);
    const rawContent = editor.getHTML();
    const cleanContent = DOMPurify.sanitize(rawContent);

    try {
      const currentNoteId = noteId || crypto.randomUUID();
      const syncStore = useSyncStore.getState();

      // Enqueue local/remote mutation
      await syncStore.enqueueMutation(
        'sermon_notes',
        currentNoteId,
        noteId ? 'UPDATE' : 'INSERT',
        {
          user_id: user.id,
          sermon_id: sermon.id,
          content: cleanContent
        }
      );

      if (!noteId) {
        setNoteId(currentNoteId);
      }

      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }

      toast.success('Notas guardadas correctamente (local).');
    } catch (err) {
      console.error('Error saving sermon notes:', err);
      toast.error('No se pudieron guardar las notas.');
    } finally {
      setSavingNote(false);
    }
  };

  const getYoutubeId = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <RefreshCw className="animate-spin text-primary dark:text-white" size={32} />
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={48} />
        <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100">Prédica no encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400">La enseñanza que estás buscando no existe o fue removida.</p>
        <Link to="/predicas" className="inline-flex items-center gap-2 text-primary dark:text-white font-bold hover:underline">
          <ArrowLeft size={16} />
          Volver a prédicas
        </Link>
      </div>
    );
  }

  const ytId = getYoutubeId(sermon.youtube_url);

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-6">
      {/* Ambient Focus Mode Dimmer Overlay */}
      <AnimatePresence>
        {isFocusModeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40 transition-opacity duration-500 flex flex-col justify-between p-6 pointer-events-auto"
          >
            <div className="flex justify-between items-center text-white/80">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                Modo Enfoque Activo — Prédica & Meditación
              </span>
              <button
                type="button"
                onClick={() => setIsFocusModeActive(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <X size={16} /> Salir del Enfoque
              </button>
            </div>
            <p className="text-center text-xs text-white/50 italic">
              "Mantén fijos tus ojos en las cosas de arriba..."
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimeFadeUp delay={100} duration={800} className={`space-y-6 relative ${isFocusModeActive ? 'z-50' : ''}`}>
        {/* Back button */}
        <div>
          <Link to="/predicas" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} />
            Volver a Prédicas
          </Link>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Sermon details & video */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6">
            {(sermon.video_url || ytId) && (
              <AnimeZoomIn delay={300} duration={800}>
                <VideoPlayer
                  src={sermon.video_url}
                  youtubeUrl={sermon.video_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : undefined)}
                  title={sermon.title}
                />
              </AnimeZoomIn>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 leading-tight">{sermon.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                {sermon.sermon_categories && (
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${sermon.sermon_categories.color}15`, color: sermon.sermon_categories.color, border: `1px solid ${sermon.sermon_categories.color}30` }}
                  >
                    {sermon.sermon_categories.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-semibold text-gray-750 dark:text-gray-300">
                  <User size={16} className="text-gray-400" />
                  {sermon.speakers ? `${sermon.speakers.first_name} ${sermon.speakers.last_name}` : sermon.pastor_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(sermon.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                {sermon.editors && sermon.editors.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs italic opacity-80" title="Editores / Creadores">
                    <Edit2 size={14} className="text-gray-400" />
                    Editado por: {sermon.editors.join(', ')}
                  </span>
                )}
              </div>

              {/* Share Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: sermon.title,
                          text: `Te invito a escuchar esta prédica de la Iglesia Jerusalén: ${sermon.title}`,
                          url: window.location.href,
                        });
                      } catch {
                        // User cancelled
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        toast.success('Enlace de la prédica copiado al portapapeles.');
                      } catch {
                        toast.error('No se pudo copiar el enlace.');
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-xs border border-gray-200 dark:border-white/10"
                >
                  <Share2 size={15} className="text-amber-500" />
                  <span>Compartir Prédica</span>
                </button>
              </div>
            </div>

            {/* Waveform Audio Player for Sermon */}
            {sermon.audio_url && (
              <div className="my-4">
                <WaveformPlayer
                  audioUrl={sermon.audio_url}
                  title={sermon.title}
                  subtitle={sermon.speakers ? `${sermon.speakers.first_name} ${sermon.speakers.last_name}` : sermon.pastor_name || undefined}
                  chapters={sermon.chapters || []}
                />
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-white/10 pt-6">
              <BlockLessonRenderer content={sermon.content} lessonId={sermon.id} />
            </div>

            {/* Acerca del Expositor */}
            {sermon.speakers && (
              <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white mb-4">Acerca del Expositor</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {sermon.speakers.photo_url ? (
                    <img 
                      src={sermon.speakers.photo_url} 
                      alt={sermon.speakers.first_name} 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <User size={48} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {sermon.speakers.first_name} {sermon.speakers.last_name}
                      </h4>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {sermon.speakers.role}
                      </span>
                    </div>
                    {sermon.speakers.bio ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {sermon.speakers.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No hay biografía disponible para este expositor.
                      </p>
                    )}
                    <Link 
                      to={`/predicas?speaker=${sermon.speakers.id}`} 
                      className="inline-block mt-2 text-sm font-bold text-primary dark:text-gold hover:underline"
                    >
                      Ver más prédicas de {sermon.speakers.first_name}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area: Tabbed Apuntes Privados / Enfócate Pomodoro */}
          <div className="lg:sticky lg:top-24 self-start space-y-3">
            {/* Sidebar Tab Selector */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSidebarTab('notes')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'notes'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <FileText size={14} />
                <span>Apuntes Privados</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('pomodoro')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'pomodoro'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Sparkles size={14} />
                <span>Enfócate 🕊️</span>
              </button>
            </div>

            {/* Tab Contents */}
            {sidebarTab === 'notes' ? (
              <SermonNotesPad
                editor={editor}
                savingNote={savingNote}
                onSave={handleSaveNotes}
                isAuthenticated={!!user}
                sermonTitle={sermon.title}
              />
            ) : (
              <ChristianPomodoro
                isFocusModeActive={isFocusModeActive}
                onToggleFocusMode={() => setIsFocusModeActive((prev) => !prev)}
              />
            )}
          </div>

        </div>
      </AnimeFadeUp>
    </div>
  );
};

export default SermonDetail;
