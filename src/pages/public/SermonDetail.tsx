import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { sql } from '../../config/localDb';
import { useSyncStore } from '../../store/useSyncStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import {
  Calendar, User, ArrowLeft, RefreshCw, FileText,
  Save, AlertTriangle, Bold, Italic, List, ListOrdered,
  Heading2, Heading3, Undo, Redo
} from 'lucide-react';
import type { Sermon } from '../../types';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';

const MOCK_SERMONS: Sermon[] = [
  {
    id: 's-1',
    title: 'El Ancla de Nuestra Alma',
    content: '<p>Una reflexión profunda en <strong>Hebreos 6</strong> sobre cómo la esperanza en Cristo nos mantiene firmes en medio de las tormentas de la vida diaria.</p><p>El autor de Hebreos nos recuerda que la esperanza es un ancla del alma, segura y firme, que penetra hasta detrás del velo. Cuando las circunstancias externas se agiten, recuerda fijar tus ojos en el Salvador, quien ya venció al mundo y nos garantiza una herencia incorruptible.</p>',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pastor_name: 'Pastor Roberto Gómez',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 's-2',
    title: 'Caminando en Amor y Unidad',
    content: '<p>Serie de enseñanzas sobre <strong>Efesios</strong> y cómo la unidad y el amor fraternal fortalecen a la iglesia local como cuerpo de Cristo.</p><p>Pablo nos exhorta a andar como es digno de la vocación con que fuimos llamados, con toda humildad y mansedumbre, soportándonos con paciencia los unos a los unos en amor, solícitos en guardar la unidad del Espíritu en el vínculo de la paz.</p>',
    youtube_url: null,
    pastor_name: 'Pastora Elizabeth de Gómez',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  }
];

const SermonDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);

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

  const fetchSermonAndNotes = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch sermon
      let activeSermon = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUuid) {
        const { data, error } = await supabase
          .from('sermons')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        activeSermon = data;
      }

      if (!activeSermon) {
        // Fallback to mock sermons
        activeSermon = MOCK_SERMONS.find(s => s.id === id) || null;
      }

      setSermon(activeSermon);

      // Fetch user note if authenticated
      if (user && activeSermon) {
        // Try local SQLite first
        let cachedNotes: any[] = [];
        try {
          cachedNotes = await sql`
            SELECT id, content FROM local_sermon_notes 
            WHERE user_id = ${user.id} AND sermon_id = ${activeSermon.id};
          `;
        } catch (sqliteErr) {
          console.warn('SQLite sermon notes fetch failed, falling back to Supabase:', sqliteErr);
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
            .eq('user_id', user.id)
            .eq('sermon_id', activeSermon.id)
            .maybeSingle();

          if (!noteError && noteData) {
            setNoteId(noteData.id);
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(noteData.content || '');
            }
          } else {
            setNoteId(null);
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent('');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sermon detail:', err);
      toast.error('Error al cargar la prédica');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSermonAndNotes();
  }, [id, user, !!editor]);

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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-6">
      
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
          {ytId && (
            <div className="relative pt-[56.25%] rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                title={sermon.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                // @ts-expect-error credentialless is not yet in React's TS definitions but is supported by the browser
                credentialless="true"
              ></iframe>
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 leading-tight">{sermon.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5 font-semibold text-gray-750 dark:text-gray-300">
                <User size={16} className="text-gray-400" />
                {sermon.pastor_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-gray-400" />
                {new Date(sermon.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 pt-6">
            <BlockLessonRenderer content={sermon.content} lessonId={sermon.id} />
          </div>
        </div>

        {/* Private Sermon Note pad */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm flex flex-col overflow-hidden lg:sticky lg:top-24 self-start">
          
          {/* Notes Header */}
          <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="text-amber-600" size={18} />
              <span className="font-bold text-sm text-gray-755 dark:text-gray-200 font-serif">Mis Apuntes Privados</span>
            </div>
            
            <button
              onClick={handleSaveNotes}
              disabled={savingNote || !editor}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
            >
              {savingNote ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
              Guardar
            </button>
          </div>

          {/* Note Pad Body */}
          <div className="p-4 flex-1 flex flex-col min-h-[400px]">
            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
                <AlertTriangle size={32} className="text-amber-500/80" />
                <p className="text-xs font-semibold max-w-xs leading-normal">
                  Inicia sesión para poder tomar apuntes de esta prédica y guardarlos de forma privada en tu perfil.
                </p>
                <Link to="/login" className="text-xs font-bold text-primary dark:text-white hover:underline">
                  Iniciar Sesión
                </Link>
              </div>
            ) : (
              editor && (
                <div className="flex-1 flex flex-col space-y-3">
                  {/* Rich Text Toolbar */}
                  <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('bold') ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Negrita"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('italic') ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Cursiva"
                    >
                      <Italic size={14} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center"></div>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Título 2"
                    >
                      <Heading2 size={14} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('heading', { level: 3 }) ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Título 3"
                    >
                      <Heading3 size={14} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center"></div>
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('bulletList') ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Lista de viñetas"
                    >
                      <List size={14} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded cursor-pointer ${editor.isActive('orderedList') ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                      title="Lista numerada"
                    >
                      <ListOrdered size={14} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center"></div>
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Deshacer"
                    >
                      <Undo size={14} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Rehacer"
                    >
                      <Redo size={14} />
                    </button>
                  </div>

                  {/* Note Area */}
                  <div className="flex-1 border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-slate-900 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 overflow-y-auto">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SermonDetail;
