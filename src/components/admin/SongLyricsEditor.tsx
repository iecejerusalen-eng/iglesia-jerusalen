import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import DOMPurify from 'dompurify';
import ChordExtension from '../../extensions/ChordExtension';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Music,
  X,
  Palette,
  Trash2,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

const CHORD_PRESETS = ['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm'];

const PRESET_COLORS = [
  { name: 'Charcoal', value: '#374151' },
  { name: 'Negro', value: '#111827' },
  { name: 'Dorado', value: '#D97706' },
  { name: 'Rojo', value: '#DC2626' },
  { name: 'Azul', value: '#1E3A8A' },
];

const SongLyricsEditor = ({ content, onChange, disabled = false }: Props) => {
  const [showChordPicker, setShowChordPicker] = useState(false);
  const [customChord, setCustomChord] = useState('');
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('mono');

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      ChordExtension,
    ],
    content,
  });

  // Sync editability state
  useEffect(() => {
    if (editor && editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Handle updates and selection updates in useEffect to prevent React 19 render-phase state updates
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const dirtyHtml = editor.getHTML();
      const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
        ADD_TAGS: ['ruby', 'rt', 'span'],
        ADD_ATTR: ['style', 'class', 'data-chord'],
      });
      onChange(cleanHtml);
    };

    const handleSelection = () => {
      const { from, to } = editor.state.selection;
      setSavedSelection({ from, to });
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelection);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelection);
    };
  }, [editor, onChange]);

  if (!editor) return null;

  const getWordAtPosition = ($pos: any) => {
    const text = $pos.parent.textContent;
    const offset = $pos.parentOffset;
    
    let start = offset;
    let end = offset;
    
    const isWordChar = (char: string) => char && /[^\s,.:;!?()\[\]{}]/.test(char);
    
    while (start > 0 && isWordChar(text[start - 1])) {
      start--;
    }
    while (end < text.length && isWordChar(text[end])) {
      end++;
    }
    
    if (start === end) return null;
    
    const basePos = $pos.start();
    return {
      from: basePos + start,
      to: basePos + end,
    };
  };

  const applyChord = (chord: string) => {
    if (!chord.trim()) return;
    
    let chain = editor.chain();
    
    let targetSelection = savedSelection;
    if (targetSelection) {
      if (targetSelection.from === targetSelection.to) {
        const $pos = editor.state.doc.resolve(targetSelection.from);
        const word = getWordAtPosition($pos);
        if (word) {
          targetSelection = word;
        }
      }
    }
    
    if (targetSelection && targetSelection.from !== targetSelection.to) {
      chain = chain.setTextSelection(targetSelection).setChord({ chord: chord.trim() });
    } else {
      // Empty selection - insert a space character with the chord mark
      chain = chain.insertContent({
        type: 'text',
        text: ' ',
        marks: [{ type: 'chord', attrs: { chord: chord.trim() } }]
      });
    }
    
    chain.focus().run();
    setShowChordPicker(false);
    setCustomChord('');
  };

  const removeChord = () => {
    let chain = editor.chain();
    if (savedSelection) {
      chain = chain.setTextSelection(savedSelection);
    }
    chain.focus().unsetChord().run();
    setShowChordPicker(false);
  };

  return (
    <div className="border border-gray-300 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all">
      {/* Estilos para anotaciones de acordes y tipografías */}
      <style>{`
        .ProseMirror-wrapper.font-mono .ProseMirror {
          font-family: 'Courier New', Courier, monospace !important;
        }
        .ProseMirror-wrapper.font-serif .ProseMirror {
          font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
        }
        .ProseMirror-wrapper.font-sans .ProseMirror {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }
        .ProseMirror {
          outline: none;
          min-height: 300px;
          font-size: 1rem;
          line-height: 2.2;
          white-space: pre-wrap;
        }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; font-family: inherit; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.8rem 0 0.4rem; color: #6b7280; font-family: inherit; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; color: #9ca3af; font-style: italic; font-family: inherit; }
        .ProseMirror p { margin-bottom: 0.25rem; color: #1f2937; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        
        /* Chords styling */
        .ProseMirror span.chord-annotation,
        .ProseMirror ruby.chord-annotation {
          position: relative;
          display: inline-block;
          background: rgba(220, 38, 38, 0.08);
          border-radius: 2px;
          padding: 0 1px;
          margin-top: 1.2rem;
        }
        .ProseMirror span.chord-annotation::before {
          content: attr(data-chord);
          position: absolute;
          top: -1.2rem;
          left: 0;
          font-size: 0.75rem;
          font-weight: 700;
          color: #dc2626;
          font-family: 'Inter', sans-serif;
          line-height: 1;
          pointer-events: none;
        }
        .ProseMirror ruby.chord-annotation rt.chord-name {
          font-size: 0.7rem;
          font-weight: 700;
          color: #dc2626;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.02em;
        }

        /* Dark mode overrides */
        .dark .ProseMirror h2 { color: #9ca3af; }
        .dark .ProseMirror h3 { color: #d1d5db; }
        .dark .ProseMirror p { color: #f3f4f6; }
        .dark .ProseMirror span.chord-annotation,
        .dark .ProseMirror ruby.chord-annotation {
          background: rgba(239, 68, 68, 0.15);
        }
        .dark .ProseMirror span.chord-annotation::before {
          color: #f87171;
        }
        .dark .ProseMirror ruby.chord-annotation rt.chord-name {
          color: #f87171;
        }
      `}</style>

      {!disabled && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-white/10 items-center">
          {/* Undo/Redo */}
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded text-gray-650 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer" type="button" title="Deshacer">
            <Undo2 size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer" type="button" title="Rehacer">
            <Redo2 size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Headings (para secciones: Verso, Coro, Puente) */}
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-650 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Título (Nombre canción)">
            <Heading1 size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Sección (Verso, Coro)">
            <Heading2 size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Indicación (Intro, Puente)">
            <Heading3 size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Basic formatting */}
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Negrita">
            <Bold size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Cursiva">
            <Italic size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Alignment */}
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Izquierda">
            <AlignLeft size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Centrar">
            <AlignCenter size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Derecha">
            <AlignRight size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Lists */}
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Lista">
            <List size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded cursor-pointer transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-slate-850 text-black dark:text-white ring-1 ring-gray-300 dark:ring-white/10' : 'text-gray-655 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
            type="button" title="Lista numerada">
            <ListOrdered size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Typography selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 mr-2">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold px-1 uppercase tracking-wider">Tipografía</span>
            <button
              onClick={(e) => { e.preventDefault(); setFontFamily('sans'); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                fontFamily === 'sans' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              type="button"
              title="Sans-serif (Letra limpia)"
            >
              Sans
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setFontFamily('serif'); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`px-1.5 py-0.5 rounded text-[10px] font-serif font-bold transition-all cursor-pointer ${
                fontFamily === 'serif' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              type="button"
              title="Serif (Estilo Himnario)"
            >
              Serif
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setFontFamily('mono'); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                fontFamily === 'mono' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              type="button"
              title="Monospace (Para acordes)"
            >
              Mono
            </button>
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* 🎵 CHORD BUTTON */}
          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); setShowChordPicker(!showChordPicker); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold cursor-pointer transition-all ${
                editor.isActive('chord')
                  ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-500/30'
                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20'
              }`}
              type="button"
              title="Agregar acorde sobre el texto seleccionado"
            >
              <Music size={14} />
              Acorde
            </button>

            {showChordPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 z-50 w-72">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-405 uppercase tracking-wider">Seleccionar Acorde</span>
                  <button onClick={() => setShowChordPicker(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer" type="button">
                    <X size={14} />
                  </button>
                </div>

                {/* Presets grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {CHORD_PRESETS.map((chord) => (
                    <button
                      key={chord}
                      onClick={(e) => { e.preventDefault(); applyChord(chord); }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="px-1 py-1.5 text-xs font-mono font-bold rounded bg-gray-55 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 border border-gray-200 dark:border-white/5 hover:border-red-300 transition-all cursor-pointer"
                      type="button"
                    >
                      {chord}
                    </button>
                  ))}
                </div>

                {/* Custom chord input */}
                <div className="flex gap-1 mt-2">
                  <input
                    type="text"
                    value={customChord}
                    onChange={(e) => setCustomChord(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyChord(customChord); } }}
                    placeholder="Ej: C#m7, Dsus4..."
                    className="flex-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded px-2 py-1.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); applyChord(customChord); }}
                    disabled={!customChord.trim()}
                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded hover:bg-amber-600 disabled:opacity-40 cursor-pointer transition-colors"
                    type="button"
                  >
                    Aplicar
                  </button>
                </div>

                {/* Remove chord */}
                {editor.isActive('chord') && (
                  <button
                    onClick={(e) => { e.preventDefault(); removeChord(); }}
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-full mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-450 text-xs font-semibold rounded hover:bg-red-100 dark:hover:bg-red-900/45 border border-red-200 dark:border-red-500/20 cursor-pointer transition-colors"
                    type="button"
                  >
                    Quitar Acorde del Texto Seleccionado
                  </button>
                )}

                <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                  Selecciona texto en la letra y luego elige un acorde. Se mostrará encima de la sílaba seleccionada.
                </p>
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="flex items-center gap-0.5 ml-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">
            <Palette size={12} className="text-gray-400 mr-0.5" />
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().setColor(color.value).run(); }}
                onMouseDown={(e) => e.preventDefault()}
                className="w-3 h-3 rounded-full border border-gray-200 hover:scale-125 transition-all cursor-pointer"
                style={{ backgroundColor: color.value }}
                title={color.name}
                type="button"
              />
            ))}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 cursor-pointer" type="button" title="Limpiar color">
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={`p-4 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 ProseMirror-wrapper font-${fontFamily}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default SongLyricsEditor;
