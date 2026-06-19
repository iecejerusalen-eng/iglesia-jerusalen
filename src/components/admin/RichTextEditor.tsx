import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  MonitorPlay,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Palette,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  { name: 'Charcoal (Default)', value: '#374151' },
  { name: 'Negro', value: '#111827' },
  { name: 'Dorado Catedral', value: '#D97706' },
  { name: 'Rojo Carmesí', value: '#DC2626' },
  { name: 'Azul Real', value: '#1E3A8A' },
  { name: 'Verde Esmeralda', value: '#16A34A' },
  { name: 'Púrpura Imperial', value: '#7C3AED' },
];

const RichTextEditor = ({ content, onChange, disabled = false }: Props) => {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      Youtube.configure({
        inline: false,
        width: 480,
        height: 320,
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image rounded-lg max-w-full my-4 mx-auto block shadow-md',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const dirtyHtml = editor.getHTML();
      // Permitimos tags de imagen, alineación, estilos, videos de youtube y listas de tareas
      const cleanHtml = DOMPurify.sanitize(dirtyHtml, { 
        ADD_TAGS: ['iframe', 'img', 'input', 'label', 'span'], 
        ADD_ATTR: [
          'allowfullscreen', 'frameborder', 'src', 'width', 'height', 'style', 'class', 'alt', 'title',
          'type', 'checked', 'disabled', 'data-type', 'data-checked'
        ] 
      });
      onChange(cleanHtml);
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) return null;

  const addYoutubeVideo = () => {
    const url = prompt('Ingresa la URL del video de YouTube:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const addImageUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all duration-200">
      {/* Estilos embebidos para asegurar que el editor muestre correctamente H1-H4, listas y estilos */}
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 200px;
        }
        .ProseMirror h1 {
          font-size: 1.8rem;
          font-weight: 800;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-top: 1.2rem;
          margin-bottom: 0.4rem;
          line-height: 1.25;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1rem;
          margin-bottom: 0.3rem;
          line-height: 1.3;
        }
        .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4b5563;
          margin-top: 0.8rem;
          margin-bottom: 0.2rem;
          line-height: 1.35;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
          color: #374151;
        }
        .ProseMirror ul:not([data-type="taskList"]) {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #D97706;
          padding-left: 1rem;
          color: #4b5563;
          font-style: italic;
          margin: 1rem 0;
          background-color: #fef3c7;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem auto;
          display: block;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        /* Estilos para la lista de tareas / checklists */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          margin-right: 0.2rem;
          user-select: none;
          display: flex;
          align-items: center;
          padding-top: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label input {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid #cbd5e1;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #94a3b8;
        }
      `}</style>
      {!disabled && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 border-gray-200 items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Historial */}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              type="button"
              title="Deshacer"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              type="button"
              title="Rehacer"
            >
              <Redo2 size={16} />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Encabezados y Párrafo */}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 font-bold text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Título 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 font-bold text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Título 2"
            >
              <Heading2 size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 font-bold text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Título 3"
            >
              <Heading3 size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 4 }).run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('heading', { level: 4 }) ? 'bg-gray-200 font-bold text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Título 4"
            >
              <Heading4 size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`px-2 py-1 text-xs font-semibold rounded text-gray-600 cursor-pointer ${editor.isActive('paragraph') && !editor.isActive('heading') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Texto Normal"
            >
              P
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Estilo Básico */}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('bold') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Negrita"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('italic') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Cursiva"
            >
              <Italic size={16} />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Alineación */}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Alinear a la izquierda"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Centrar"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Alinear a la derecha"
            >
              <AlignRight size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Justificar"
            >
              <AlignJustify size={16} />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Listas */}
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('bulletList') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Lista con Viñetas"
            >
              <List size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('orderedList') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Lista Numerada"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className={`p-1.5 rounded text-gray-600 cursor-pointer ${editor.isActive('taskList') ? 'bg-gray-200 text-black ring-1 ring-gray-300' : 'hover:bg-gray-200'}`}
              type="button"
              title="Lista de Tareas (Checklist)"
            >
              <ListTodo size={16} />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Media */}
            <button
              onClick={(e) => { e.preventDefault(); addImageUrl(); }}
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 cursor-pointer"
              type="button"
              title="Insertar Imagen por URL"
            >
              <ImageIcon size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); addYoutubeVideo(); }}
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded text-red-600 hover:bg-gray-200 cursor-pointer"
              type="button"
              title="Insertar Video de YouTube"
            >
              <MonitorPlay size={16} />
            </button>
          </div>

          {/* Grupo de Colores a la derecha */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 mt-1 sm:mt-0">
            <Palette size={14} className="text-gray-400 mr-1" />
            <div className="flex gap-0.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={(e) => { e.preventDefault(); editor.chain().focus().setColor(color.value).run(); }}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`w-3.5 h-3.5 rounded-full border border-gray-200 transition-all hover:scale-125 cursor-pointer`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
            <input
              type="color"
              value={editor.getAttributes('textStyle').color || '#374151'}
              onChange={(e) => {
                editor.chain().focus().setColor(e.target.value).run();
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="w-4 h-4 border-0 cursor-pointer p-0 bg-transparent flex-shrink-0"
              title="Color personalizado"
            />
            <button
              onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
              onMouseDown={(e) => e.preventDefault()}
              className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 cursor-pointer"
              type="button"
              title="Limpiar color"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-4 bg-white text-gray-800">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
