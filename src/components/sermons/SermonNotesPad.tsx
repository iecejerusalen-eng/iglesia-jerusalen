import { useMemo } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import {
  FileText, Save, RefreshCw, Bold, Italic, List,
  ListOrdered, Heading2, Heading3, Undo, Redo, Copy, Trash2, Download, BookOpen, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimeRubberBandHover } from '../animations/AnimeWrappers';
import { useConfirmStore } from '../../store/useConfirmStore';

interface Props {
  editor: Editor | null;
  savingNote: boolean;
  onSave: () => void;
  isAuthenticated: boolean;
  sermonTitle?: string;
}

const SermonNotesPad = ({ editor, savingNote, onSave, isAuthenticated, sermonTitle }: Props) => {
  const confirm = useConfirmStore((state) => state.confirm);
  const editorText = editor?.getText() || '';
  const textStats = useMemo(() => {
    const cleanText = editorText.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = editorText.length;
    return { words, chars };
  }, [editorText]);

  const handleCopy = () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
      toast.info('No hay texto para copiar.');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Apuntes copiados al portapapeles.');
  };

  const handleExportTxt = () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
      toast.info('Los apuntes están vacíos.');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apuntes - ${sermonTitle || 'Prédica'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Apuntes descargados en TXT.');
  };

  const handleInsertVerseTemplate = () => {
    if (!editor) return;
    editor.chain().focus().insertContent('<blockquote><p>📖 <strong>Pasaje Bíblico:</strong> cita aquí...</p></blockquote><p></p>').run();
  };

  const handleClear = async () => {
    if (!editor) return;
    const accepted = await confirm({ title: 'Borrar apuntes', message: 'Se eliminarán los apuntes de esta prédica en este dispositivo.', confirmText: 'Borrar apuntes', variant: 'danger' });
    if (accepted) {
      editor.commands.clearContent();
      toast.info('Apuntes borrados.');
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/40 dark:border-white/10 shadow-xl flex flex-col overflow-hidden">
      {/* Notes Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 px-5 py-3.5 border-b border-gray-200/60 dark:border-white/10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <FileText className="text-amber-600 dark:text-amber-400" size={18} />
          <span className="font-bold text-sm text-slate-800 dark:text-gray-100 font-serif">Mis Apuntes Privados</span>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <AnimeRubberBandHover>
              <button
                type="button"
                onClick={onSave}
                disabled={savingNote || !editor}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                {savingNote ? <RefreshCw className="animate-spin" size={13} /> : <Save size={13} />}
                {savingNote ? 'Guardando...' : 'Guardar'}
              </button>
            </AnimeRubberBandHover>
          </div>
        )}
      </div>

      {/* Note Pad Body */}
      <div className="p-4 flex-1 flex flex-col min-h-[380px]">
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
            <AlertTriangle size={32} className="text-amber-500/80" />
            <p className="text-xs font-semibold max-w-xs leading-normal text-slate-600 dark:text-slate-300">
              Inicia sesión para poder tomar apuntes de esta prédica y guardarlos de forma privada en tu perfil.
            </p>
          </div>
        ) : (
          editor && (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Rich Text Toolbar */}
              <div className="flex flex-wrap gap-1 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('bold') ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Negrita"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('italic') ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Cursiva"
                >
                  <Italic size={14} />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Título 2"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Título 3"
                >
                  <Heading3 size={14} />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('bulletList') ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Lista de viñetas"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${editor.isActive('orderedList') ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-700'}`}
                  title="Lista numerada"
                >
                  <ListOrdered size={14} />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={handleInsertVerseTemplate}
                  className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer"
                  title="Insertar Cita Bíblica"
                >
                  <BookOpen size={14} />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Deshacer"
                >
                  <Undo size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Rehacer"
                >
                  <Redo size={14} />
                </button>
              </div>

              {/* Note Area */}
              <div className="flex-1 border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 bg-white/80 dark:bg-slate-900/80 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-all overflow-y-auto min-h-[220px]">
                <EditorContent editor={editor} />
              </div>

              {/* Footer Stats & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>{textStats.words} palabras · {textStats.chars} caracteres</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-slate-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    title="Copiar texto"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-slate-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    title="Descargar .txt"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    title="Borrar notas"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SermonNotesPad;
