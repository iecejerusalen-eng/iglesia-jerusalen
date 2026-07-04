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
  Tag, Palette as StyleIcon, ChevronDown, ChevronUp,
  Link as LinkIcon, PlusCircle, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';
import type { Song, SongType, SongStyle, SongResourceLink, SongStructureBlock } from '../../types';

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



const DRUM_STYLES = [
  'Balada Worship',
  'Pop Worship 4/4',
  'Rock 1/4 (Marcado en Negras)',
  'Rock 1/2 (Marcado en Corcheas)',
  'Worship 6/8',
  'Worship 4/4 (Balada Rítmica)',
  'Pop/Rock 4/4',
  'Funk / Gospel',
  'Disco / Folk (Corito Rápido)',
  'Cumbia Cristiana',
  'Vals 3/4',
  'Marcha',
  'Acústico / Sin Batería'
];

const INSTRUMENTS = [
  { value: 'General', label: 'General / Todos' },
  { value: 'Batería', label: 'Batería 🥁' },
  { value: 'Piano', label: 'Piano / Teclados 🎹' },
  { value: 'Guitarra', label: 'Guitarra 🎸' },
  { value: 'Bajo', label: 'Bajo 🎸' },
  { value: 'Voz', label: 'Voz 🎤' },
  { value: 'Viento', label: 'Vientos 🎺' },
  { value: 'Otro', label: 'Otro' }
];

// Helper functions for parsing/converting
function htmlToBracketText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace chord spans with [Chord]
  temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(el => {
    const chord = el.getAttribute('data-chord');
    if (chord) {
      el.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), el);
    } else {
      el.remove();
    }
  });
  
  // Replace paragraphs with text + newline
  let text = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as HTMLElement;
      if (el.tagName === 'P') {
        text += el.textContent + '\n';
      } else if (el.tagName === 'BR') {
        text += '\n';
      } else {
        text += el.textContent;
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      text += node.textContent;
    }
  });
  
  return text.trim();
}

function bracketTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  return escaped.replace(/\[([a-zA-Z0-9#/+\-.]+?)\]/g, (_, chord) => {
    return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${chord}"></span>`;
  });
}

function compileBlocksToHtml(blocks: SongStructureBlock[]): string {
  return blocks.map(block => {
    let sectionHtml = `<h2>${block.label}</h2>`;
    
    if (block.melody && block.melody.trim()) {
      sectionHtml += `<p><em>Melodía/Guía: ${block.melody.trim()}</em></p>`;
    }
    
    const lines = block.lyrics.split('\n');
    const linesHtml = lines.map(line => {
      const compiledLine = bracketTextToHtml(line);
      return `<p>${compiledLine || '&nbsp;'}</p>`;
    }).join('');
    
    return `<div class="song-section" data-section-type="${block.type}">${sectionHtml}${linesHtml}</div>`;
  }).join('<br/>');
}

function convertHtmlToBlocks(html: string): SongStructureBlock[] {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const blocks: SongStructureBlock[] = [];
  let currentBlock: Partial<SongStructureBlock> | null = null;
  let currentLines: string[] = [];
  
  const getBlockType = (headerText: string): 'intro' | 'estrofa' | 'coro' | 'puente' | 'outro' | 'melodia' | 'otro' => {
    const text = headerText.toLowerCase();
    if (text.includes('intro') || text.includes('introducción')) return 'intro';
    if (text.includes('coro')) return 'coro';
    if (text.includes('puente')) return 'puente';
    if (text.includes('final') || text.includes('outro')) return 'outro';
    if (text.includes('melodía') || text.includes('solo')) return 'melodia';
    if (text.includes('estrofa') || text.includes('verso')) return 'estrofa';
    return 'otro';
  };

  const saveCurrentBlock = () => {
    if (currentBlock) {
      currentBlock.lyrics = currentLines.join('\n').trim();
      blocks.push(currentBlock as SongStructureBlock);
    }
  };

  // If there are divs with class "song-section", parse them directly
  const sectionDivs = temp.querySelectorAll('div.song-section');
  if (sectionDivs.length > 0) {
    sectionDivs.forEach(div => {
      const type = (div.getAttribute('data-section-type') || 'otro') as 'intro' | 'estrofa' | 'coro' | 'puente' | 'outro' | 'melodia' | 'otro';
      const h2 = div.querySelector('h2');
      const label = h2 ? h2.textContent || 'Sección' : 'Sección';
      
      // Look for melody guide
      let melody: string | null = null;
      const em = div.querySelector('p em');
      if (em && em.textContent?.startsWith('Melodía/Guía:')) {
        melody = em.textContent.replace('Melodía/Guía:', '').trim();
      }
      
      // Get lyrics
      const pElements = div.querySelectorAll('p');
      const blockLines: string[] = [];
      pElements.forEach(p => {
        // Skip melody guide paragraph
        if (p.querySelector('em') && p.textContent?.startsWith('Melodía/Guía:')) return;
        
        const innerTemp = document.createElement('div');
        innerTemp.innerHTML = p.innerHTML;
        innerTemp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(span => {
          const chord = span.getAttribute('data-chord');
          if (chord) {
            span.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), span);
          } else {
            span.remove();
          }
        });
        blockLines.push(innerTemp.textContent || '');
      });
      
      blocks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        type,
        label,
        melody,
        lyrics: blockLines.join('\n')
      });
    });
    return blocks;
  }

  // Fallback to splitting by tags if no direct song-section structures exist
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as HTMLElement;
      
      if (['H1', 'H2', 'H3'].includes(el.tagName)) {
        saveCurrentBlock();
        const headerText = el.textContent || 'Sección';
        currentBlock = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          type: getBlockType(headerText),
          label: headerText,
          melody: null,
          lyrics: ''
        };
        currentLines = [];
      } else {
        let lineText: string;
        if (el.tagName === 'P') {
          const innerTemp = document.createElement('div');
          innerTemp.innerHTML = el.innerHTML;
          innerTemp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(span => {
            const chord = span.getAttribute('data-chord');
            if (chord) {
              span.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), span);
            } else {
              span.remove();
            }
          });
          lineText = innerTemp.textContent || '';
        } else if (el.tagName === 'BR') {
          lineText = '';
        } else {
          lineText = el.textContent || '';
        }
        
        if (!currentBlock) {
          currentBlock = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            type: 'otro',
            label: 'General',
            melody: null,
            lyrics: ''
          };
          currentLines = [];
        }
        
        currentLines.push(lineText);
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      const val = node.textContent?.trim();
      if (val) {
        if (!currentBlock) {
          currentBlock = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            type: 'otro',
            label: 'General',
            melody: null,
            lyrics: ''
          };
          currentLines = [];
        }
        currentLines.push(node.textContent || '');
      }
    }
  });
  
  saveCurrentBlock();
  
  if (blocks.length === 0) {
    const textContent = htmlToBracketText(html);
    blocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      type: 'estrofa',
      label: 'Estrofa 1',
      lyrics: textContent,
      melody: null
    });
  }
  
  return blocks;
}

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

  // Modal & Overhaul state
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [drumStyle, setDrumStyle] = useState('');
  const [resourceLinks, setResourceLinks] = useState<SongResourceLink[]>([]);
  const [structureBlocks, setStructureBlocks] = useState<SongStructureBlock[]>([]);
  const [editorMode, setEditorMode] = useState<'free' | 'structured'>('free');

  // Catalog management
  const [showCatalogs, setShowCatalogs] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newStyleName, setNewStyleName] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(songSchema) as any,
    defaultValues: { title: '', artist: '', bpm: undefined, type_id: '', style_id: '', has_chords: false },
  });

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

  useEffect(() => {
    const timer = setTimeout(() => { fetchAll(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openCreate = () => {
    setEditingSong(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reset({ title: '', artist: '', bpm: undefined as any, type_id: '', style_id: '', has_chords: false });
    setLyrics('');
    setDrumStyle('');
    setResourceLinks([]);
    setStructureBlocks([]);
    setEditorMode('free');
    setShowForm(true);
  };

  const openEdit = (song: Song) => {
    setEditingSong(song);
    reset({
      title: song.title,
      artist: song.artist || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bpm: song.bpm ?? (undefined as any),
      type_id: song.type_id || '',
      style_id: song.style_id || '',
      has_chords: song.has_chords,
    });
    setLyrics(song.lyrics || '');
    setDrumStyle(song.drum_style || '');
    setResourceLinks(song.resource_links || []);
    setStructureBlocks(song.structure_blocks || []);
    setEditorMode(song.structure_blocks && song.structure_blocks.length > 0 ? 'structured' : 'free');
    setShowForm(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedData = data as any;
    
    // Compile lyrics if in structured mode
    let compiledLyrics = lyrics;
    if (editorMode === 'structured') {
      compiledLyrics = compileBlocksToHtml(structureBlocks);
    }

    const payload = {
      title: typedData.title,
      artist: typedData.artist || null,
      bpm: typedData.bpm ? Number(typedData.bpm) : null,
      type_id: typedData.type_id || null,
      style_id: typedData.style_id || null,
      has_chords: typedData.has_chords,
      lyrics: compiledLyrics,
      drum_style: drumStyle || null,
      resource_links: resourceLinks,
      structure_blocks: editorMode === 'structured' ? structureBlocks : [],
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

  // Structured Blocks CRUD
  const addBlock = () => {
    const defaultLabels: Record<string, string> = {
      intro: 'Introducción',
      estrofa: `Estrofa ${structureBlocks.filter(b => b.type === 'estrofa').length + 1}`,
      coro: 'Coro',
      puente: 'Puente',
      melodia: 'Melodía / Solo',
      outro: 'Final',
      otro: 'Sección'
    };
    const newBlock: SongStructureBlock = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      type: 'estrofa',
      label: defaultLabels.estrofa,
      lyrics: '',
      melody: null
    };
    setStructureBlocks([...structureBlocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setStructureBlocks(structureBlocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<SongStructureBlock>) => {
    setStructureBlocks(structureBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...structureBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[targetIndex];
      newBlocks[targetIndex] = temp;
      setStructureBlocks(newBlocks);
    }
  };

  const handleSwitchToStructured = () => {
    const currentHtml = lyrics || '';
    if (structureBlocks.length === 0 && currentHtml.trim() !== '') {
      const parsedBlocks = convertHtmlToBlocks(currentHtml);
      setStructureBlocks(parsedBlocks);
    }
    setEditorMode('structured');
  };

  const handleSwitchToFree = () => {
    if (structureBlocks.length > 0) {
      const compiled = compileBlocksToHtml(structureBlocks);
      setLyrics(compiled);
    }
    setEditorMode('free');
  };

  // Resource Links CRUD
  const addLink = () => {
    const newLink: SongResourceLink = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      instrument: 'General',
      url: '',
      comment: ''
    };
    setResourceLinks([...resourceLinks, newLink]);
  };

  const removeLink = (id: string) => {
    setResourceLinks(resourceLinks.filter(l => l.id !== id));
  };

  const updateLink = (id: string, updates: Partial<SongResourceLink>) => {
    setResourceLinks(resourceLinks.map(l => l.id === id ? { ...l, ...updates } : l));
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
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Music className="text-amber-600" size={28} />
            Alabanzas e Himnos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-455 mt-1">Gestiona el catálogo de canciones de la iglesia</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={() => setShowCatalogs(!showCatalogs)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-105 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium border border-gray-200 dark:border-white/5">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-55 dark:bg-slate-955 rounded-xl border border-gray-200 dark:border-white/10">
          {/* Types */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1"><ListMusic size={14} /> Tipos de Canción</h3>
            <div className="flex gap-2 mb-2">
              <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addType()}
                placeholder="Nuevo tipo..." className="flex-1 text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 focus:border-amber-400 outline-none" />
              <button onClick={addType} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer">Añadir</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {songTypes.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t.name}
                  <button onClick={() => deleteType(t.id)} className="text-red-400 hover:text-red-650 cursor-pointer"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
          {/* Styles */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1"><StyleIcon size={14} /> Estilos de Canción</h3>
            <div className="flex gap-2 mb-2">
              <input value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStyle()}
                placeholder="Nuevo estilo..." className="flex-1 text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 focus:border-amber-400 outline-none" />
              <button onClick={addStyle} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer">Añadir</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {songStyles.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                  {s.name}
                  <button onClick={() => deleteStyle(s.id)} className="text-red-400 hover:text-red-650 cursor-pointer"><X size={12} /></button>
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
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:border-amber-400 outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-amber-400 outline-none">
          <option value="">Todos los tipos</option>
          {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-amber-400 outline-none">
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
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 whitespace-nowrap">Título</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">Artista</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 hidden lg:table-cell whitespace-nowrap">BPM</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 hidden lg:table-cell whitespace-nowrap">Tipo / Estilo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 whitespace-nowrap">Batería / Estructura</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 whitespace-nowrap">Acordes</th>
                  {!readOnly && <th className="text-right px-4 py-3 font-semibold text-gray-650 dark:text-gray-400 whitespace-nowrap">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((song) => (
                  <tr key={song.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-850 dark:text-gray-100 whitespace-nowrap max-w-xs truncate" title={song.title}>{song.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-450 hidden md:table-cell whitespace-nowrap max-w-[150px] truncate" title={song.artist || ''}>{song.artist || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-455 hidden lg:table-cell font-mono whitespace-nowrap">{song.bpm || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell space-x-1 whitespace-nowrap">
                      {song.song_types && (
                        <span className="inline-block bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-250/20">{song.song_types.name}</span>
                      )}
                      {song.song_styles && (
                        <span className="inline-block bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-250/20">{song.song_styles.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center space-x-1 whitespace-nowrap">
                      {song.drum_style ? (
                        <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200/30">🥁 {song.drum_style}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                      )}
                      {song.structure_blocks && song.structure_blocks.length > 0 && (
                        <span className="inline-flex items-center bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-200/30" title={`${song.structure_blocks.length} secciones estructuradas`}>📋 Secciones</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {song.has_chords ? (
                        <span className="inline-block bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-green-250/20">🎸 Acordes</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">No</span>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(song)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-gray-500 dark:text-gray-450 hover:text-amber-700 cursor-pointer transition-colors" title="Editar">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => deleteSong(song.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 dark:text-gray-450 hover:text-red-600 cursor-pointer transition-colors" title="Eliminar">
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-white/10 my-4 z-10">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-150 dark:border-white/5">
              <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Music className="text-amber-600 animate-pulse" size={22} />
                {editingSong ? 'Editar Canción' : 'Nueva Canción'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-450 cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Row 1: Title + Artist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="song-title" className="block text-xs font-bold text-gray-400 uppercase mb-1">Título *</label>
                  <input id="song-title" {...register('title')} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-850 dark:text-gray-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Ej: Grande es tu fidelidad" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
                </div>
                <div>
                  <label htmlFor="song-artist" className="block text-xs font-bold text-gray-400 uppercase mb-1">Artista / Autor</label>
                  <input id="song-artist" {...register('artist')} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-850 dark:text-gray-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Ej: Thomas Chisholm" />
                </div>
              </div>

              {/* Row 2: BPM + Type + Style + Has Chords + Drum Style */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="song-bpm" className="block text-xs font-bold text-gray-400 uppercase mb-1">BPM (Tempo)</label>
                  <input id="song-bpm" type="number" {...register('bpm')} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-850 dark:text-gray-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none font-mono" placeholder="120" />
                </div>
                <div>
                  <label htmlFor="song-type" className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                  <select id="song-type" {...register('type_id')} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-750 dark:text-gray-100 focus:border-amber-400 outline-none">
                    <option value="">Seleccionar...</option>
                    {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="song-style" className="block text-xs font-bold text-gray-400 uppercase mb-1">Estilo</label>
                  <select id="song-style" {...register('style_id')} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-750 dark:text-gray-100 focus:border-amber-400 outline-none">
                    <option value="">Seleccionar...</option>
                    {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="song-drum-style" className="block text-xs font-bold text-gray-400 uppercase mb-1">Toque Batería 🥁</label>
                  <select
                    id="song-drum-style"
                    value={drumStyle}
                    onChange={(e) => setDrumStyle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-750 dark:text-gray-100 focus:border-amber-400 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {DRUM_STYLES.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end col-span-2 md:col-span-1">
                  <label htmlFor="song-chords" className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 w-full">
                    <input id="song-chords" type="checkbox" {...register('has_chords')} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                    <span className="text-sm font-medium text-gray-750 dark:text-gray-300">Tiene acordes</span>
                  </label>
                </div>
              </div>

              {/* Toggle Editor Mode */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Editor de Letra y Partitura</label>
                  <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-white/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={handleSwitchToFree}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        editorMode === 'free'
                          ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-gold shadow-xs border border-gray-200/50 dark:border-transparent'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Editor Libre (Rich Text)
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToStructured}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        editorMode === 'structured'
                          ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-gold shadow-xs border border-gray-200/50 dark:border-transparent'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Estructurado por Secciones 📋
                    </button>
                  </div>
                </div>

                {editorMode === 'free' ? (
                  /* FREE TEXT LYRICS EDITOR (TIPTAP) */
                  <div className="space-y-3">
                    {lyrics && !structureBlocks.length && (
                      <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-3 rounded-2xl">
                        <span className="text-xxs text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <Sparkles size={12} /> Esta canción no está estructurada en secciones. ¿Deseas convertirla?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = convertHtmlToBlocks(lyrics);
                            setStructureBlocks(parsed);
                            setEditorMode('structured');
                            toast.success('Convertido a bloques estructurados');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wide transition-all cursor-pointer shadow-xs"
                        >
                          Convertir ahora
                        </button>
                      </div>
                    )}
                    <SongLyricsEditor content={lyrics} onChange={setLyrics} disabled={readOnly} />
                  </div>
                ) : (
                  /* STRUCTURED BLOCK EDITOR */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xxs text-gray-400">Organiza las partes del himno para ensayar e imprimir</span>
                      <button
                        type="button"
                        onClick={addBlock}
                        className="flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-gold border border-amber-200/40 dark:border-amber-850 px-3.5 py-2 rounded-2xl font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        <PlusCircle size={14} /> Agregar Sección
                      </button>
                    </div>

                    {structureBlocks.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl text-gray-400 text-xs">
                        No hay secciones creadas. Haz clic en "Agregar Sección" para comenzar.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {structureBlocks.map((block, idx) => (
                          <div key={block.id} className="border border-gray-250 dark:border-white/10 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-950/20 space-y-4 hover:border-gold/30 transition-all relative">
                            {/* Block Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={block.type}
                                  onChange={(e) => {
                                    const type = e.target.value as SongStructureBlock['type'];
                                    const count = structureBlocks.filter((b, i) => b.type === type && i !== idx).length + 1;
                                    const typeLabels: Record<string, string> = {
                                      intro: 'Introducción',
                                      estrofa: `Estrofa ${count}`,
                                      coro: 'Coro',
                                      puente: 'Puente',
                                      melodia: 'Melodía / Solo',
                                      outro: 'Final',
                                      outro_outro: 'Final',
                                      otro: 'Sección'
                                    };
                                    updateBlock(block.id, { type, label: typeLabels[type] || 'Sección' });
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                                >
                                  <option value="intro">Introducción 🎵</option>
                                  <option value="estrofa">Estrofa 📝</option>
                                  <option value="coro">Coro 🎤</option>
                                  <option value="puente">Puente 🌉</option>
                                  <option value="melodia">Melodía / Solo 🎹</option>
                                  <option value="outro">Final 🏁</option>
                                  <option value="otro">Otro 🔹</option>
                                </select>
                                
                                <input
                                  type="text"
                                  value={block.label}
                                  onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                                  placeholder="Etiqueta..."
                                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-extrabold text-gray-800 dark:text-gray-100 outline-none w-36 focus:border-amber-400"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveBlock(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Subir"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveBlock(idx, 'down')}
                                  disabled={idx === structureBlocks.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Bajar"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeBlock(block.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer ml-1"
                                  title="Eliminar sección"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Block Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1 space-y-3">
                                <div>
                                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Notas / Acordes de Guía (Opcional)</label>
                                  <input
                                    type="text"
                                    value={block.melody || ''}
                                    onChange={(e) => updateBlock(block.id, { melody: e.target.value })}
                                    placeholder="Ej: G - C - D - G"
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-100 focus:border-amber-400 outline-none"
                                  />
                                </div>
                                <div className="p-3 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/10 rounded-xl text-[10px] text-amber-800/80 dark:text-amber-400 leading-relaxed font-medium">
                                  <strong>💡 Sintaxis de Acordes:</strong> Escribe corchetes con el acorde antes de la palabra, ejemplo:<br/>
                                  <code className="text-red-600 dark:text-red-400 font-semibold">[G] Grande es tu [D] amor</code>
                                </div>
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Letra y Acordes</label>
                                <textarea
                                  value={block.lyrics}
                                  onChange={(e) => updateBlock(block.id, { lyrics: e.target.value })}
                                  rows={5}
                                  placeholder="Escribe la letra y acordes de esta sección..."
                                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none leading-loose"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resource Links Manager */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <LinkIcon size={16} className="text-amber-600" />
                      Links de Recursos y Tutoriales
                    </h3>
                    <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5">Videos guía para piano, batería, bajo, etc. con comentarios</p>
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <PlusCircle size={14} /> Agregar Enlace
                  </button>
                </div>

                {resourceLinks.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl text-gray-400 text-xs">
                    No hay enlaces de referencia configurados.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {resourceLinks.map((link) => (
                      <div key={link.id} className="flex flex-col md:flex-row gap-3 bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-2xl border border-gray-150 dark:border-white/5 items-start md:items-center">
                        <select
                          value={link.instrument}
                          onChange={(e) => updateLink(link.id, { instrument: e.target.value as 'General' | 'Batería' | 'Piano' | 'Guitarra' | 'Bajo' | 'Voz' | 'Viento' | 'Otro' })}
                          className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-750 dark:text-gray-300 outline-none shrink-0"
                        >
                          {INSTRUMENTS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, { url: e.target.value })}
                          placeholder="URL del video o archivo (ej. https://youtube.com/watch?...)"
                          className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 focus:border-amber-400 outline-none w-full"
                          required
                        />

                        <input
                          type="text"
                          value={link.comment || ''}
                          onChange={(e) => updateLink(link.id, { comment: e.target.value })}
                          placeholder="Comentario (ej. Tutorial de redobles)"
                          className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 focus:border-amber-400 outline-none w-full"
                        />

                        <button
                          type="button"
                          onClick={() => removeLink(link.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                          title="Eliminar link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-medium text-gray-650 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-colors">
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
