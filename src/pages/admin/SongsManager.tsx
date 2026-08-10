import { useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import SongLyricsEditor from '../../components/admin/SongLyricsEditor';
import { SongBlockEditor } from '../../features/songs/components/editor/SongBlockEditor';
import { SongViewer } from '../../features/songs/components/SongViewer';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  Plus, Edit3, Trash2, X, Search, Music, ListMusic,
  Tag, Palette as StyleIcon, ChevronDown, ChevronUp,
  Link as LinkIcon, PlusCircle, Sparkles,
  BookOpenText, Guitar, RotateCcw, Eye
} from 'lucide-react';
import type { AccidentalPreference, Song, SongStatus, SongType, SongStyle, SongResourceLink, SongStructureBlock } from '../../types';
import { isValidChord } from '../../features/songs/utils/songUtils';
import { detectKeyCandidate, slugifySongTitle } from '../../features/songs/utils/musicEngine';

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
  original_key: z.string().optional(),
  preferred_accidentals: z.enum(['auto', 'sharp', 'flat']),
  capo: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) ? 0 : Number(val),
    z.number().int().min(0).max(12)
  ),
  time_signature: z.string().regex(/^\d{1,2}\/\d{1,2}$/, 'Usa un compás como 4/4 o 6/8'),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  composers: z.string().optional(),
  copyright_notice: z.string().optional(),
});

type SongFormInput = z.input<typeof songSchema>;
type SongFormValues = z.output<typeof songSchema>;

interface SongEditorDraft {
  updatedAt: string;
  form: SongFormInput;
  lyrics: string;
  drumStyle: string;
  resourceLinks: SongResourceLink[];
  structureBlocks: SongStructureBlock[];
  editorMode: 'free' | 'structured';
}

function readEditorDraft(key: string): SongEditorDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('updatedAt' in parsed) || !('form' in parsed)) return null;
    return parsed as SongEditorDraft;
  } catch (error) {
    console.warn('No fue posible recuperar el borrador local de la canción.', error);
    return null;
  }
}

function clearEditorDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn('No fue posible eliminar el borrador local de la canción.', error);
  }
}



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
  
  return escaped.replace(/\[([^\]]+)\]/g, (match, chord: string) => {
    if (!isValidChord(chord)) return match;
    return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${chord}"></span>`;
  });
}

function getBracketTokens(text: string): string[] {
  return [...text.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim());
}

function compileBlocksToHtml(blocks: SongStructureBlock[]): string {
  return blocks.map(block => {
    if (block.type === 'lyrics') {
      let sectionHtml = `<h2>${block.label}</h2>`;
      if (block.melody_guide && block.melody_guide.trim()) {
        sectionHtml += `<p><em>Melodía/Guía: ${block.melody_guide.trim()}</em></p>`;
      }
      const lines = block.lyrics.split('\n');
      const linesHtml = lines.map(line => {
        const compiledLine = bracketTextToHtml(line);
        return `<p>${compiledLine || '&nbsp;'}</p>`;
      }).join('');
      return `<div class="song-section" data-section-type="${block.section_type}">${sectionHtml}${linesHtml}</div>`;
    } else if (block.type === 'chord_diagram') {
      return `<p><em>[Diagrama de Acordes: ${block.chords.join(', ')} - ${block.instrument}]</em></p>`;
    } else if (block.type === 'sheet_music') {
      return `<p><em>[Partitura ABC: ${block.title || 'Sin Título'}]</em></p>`;
    } else if (block.type === 'media_embed') {
      return `<p><em>[Media: <a href="${block.url}">${block.url}</a>]</em></p>`;
    } else if (block.type === 'musician_note') {
      return `<p><strong>[Nota - ${block.target_instrument}]:</strong> ${block.content}</p>`;
    } else if (block.type === 'tablature') {
      return `<pre><code>${block.content}</code></pre>`;
    }
    return '';
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
        type: 'lyrics',
        section_type: type,
        label,
        melody_guide: melody,
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
          type: 'lyrics',
          section_type: getBlockType(headerText),
          label: headerText,
          melody_guide: null,
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
            type: 'lyrics',
            section_type: 'otro',
            label: 'General',
            melody_guide: null,
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
            type: 'lyrics',
            section_type: 'otro',
            label: 'General',
            melody_guide: null,
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
      type: 'lyrics',
      section_type: 'estrofa',
      label: 'Estrofa 1',
      lyrics: textContent,
      melody_guide: null
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Modal & Overhaul state
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [drumStyle, setDrumStyle] = useState('');
  const [resourceLinks, setResourceLinks] = useState<SongResourceLink[]>([]);
  const [structureBlocks, setStructureBlocks] = useState<SongStructureBlock[]>([]);
  const [editorMode, setEditorMode] = useState<'free' | 'structured'>('free');
  const [previewSong, setPreviewSong] = useState<Song | null>(null);
  const [previewShowChords, setPreviewShowChords] = useState(true);
  const [previewFont, setPreviewFont] = useState<'mono' | 'serif' | 'sans'>('sans');
  const [previewTab, setPreviewTab] = useState<'lyrics' | 'resources'>('lyrics');

  // Catalog management
  const [showCatalogs, setShowCatalogs] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newStyleName, setNewStyleName] = useState('');

  const { register, handleSubmit, reset, getValues, control, formState: { errors } } = useForm<SongFormInput, unknown, SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      title: '', artist: '', bpm: undefined, type_id: '', style_id: '', has_chords: false,
      original_key: '', preferred_accidentals: 'auto', capo: 0, time_signature: '4/4', status: 'draft',
      composers: '', copyright_notice: '',
    },
  });
  const watchedForm = useWatch({ control });

  useEffect(() => {
    if (!showForm) return;
    const draftKey = editingSong ? `song-editor-draft:${editingSong.id}` : 'song-editor-draft:new';
    const timer = window.setTimeout(() => {
      const draft: SongEditorDraft = {
        updatedAt: new Date().toISOString(),
        form: getValues(),
        lyrics,
        drumStyle,
        resourceLinks,
        structureBlocks,
        editorMode,
      };
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (error) {
        console.warn('No fue posible guardar el borrador local de la canción.', error);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [drumStyle, editingSong, editorMode, getValues, lyrics, resourceLinks, showForm, structureBlocks, watchedForm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStyle]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch catalogs only once ideally, but here is fine
      const [typesRes, stylesRes] = await Promise.all([
        supabase.from('song_types').select('*').order('name'),
        supabase.from('song_styles').select('*').order('name'),
      ]);

      if (typesRes.error) throw typesRes.error;
      if (stylesRes.error) throw stylesRes.error;
      if (typesRes.data) setSongTypes(typesRes.data);
      if (stylesRes.data) setSongStyles(stylesRes.data);

      let query = supabase
        .from('songs')
        .select('*, song_types(*), song_styles(*)', { count: 'exact' });

      if (debouncedSearch) {
        const safeSearch = debouncedSearch.replace(/[,%()]/g, ' ').trim();
        if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,artist.ilike.%${safeSearch}%`);
      }
      if (filterType) {
        query = query.eq('type_id', filterType);
      }
      if (filterStyle) {
        query = query.eq('style_id', filterStyle);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: songsData, error, count } = await query
        .order('title')
        .range(from, to);

      if (error) throw error;
      
      if (songsData) setSongs(songsData);
      if (count !== null) {
        setTotalItems(count);
        setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
      } else {
        setTotalItems(songsData?.length ?? 0);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      console.error('Error fetching songs:', err);
      toast.error('Error al cargar canciones');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStyle, filterType, page]);

  useEffect(() => {
    void Promise.resolve().then(fetchAll);
  }, [fetchAll]);

  const restoreEditorDraft = (key: string, baseline?: string | null) => {
    const draft = readEditorDraft(key);
    if (!draft) return;
    if (baseline && new Date(draft.updatedAt).getTime() <= new Date(baseline).getTime()) return;
    reset(draft.form);
    setLyrics(draft.lyrics);
    setDrumStyle(draft.drumStyle);
    setResourceLinks(draft.resourceLinks);
    setStructureBlocks(draft.structureBlocks);
    setEditorMode(draft.editorMode);
    toast.info('Se recuperó un borrador local más reciente.');
  };

  const openCreate = () => {
    setEditingSong(null);
    reset({
      title: '', artist: '', bpm: undefined, type_id: '', style_id: '', has_chords: false,
      original_key: '', preferred_accidentals: 'auto', capo: 0, time_signature: '4/4', status: 'draft',
      composers: '', copyright_notice: '',
    });
    setLyrics('');
    setDrumStyle('');
    setResourceLinks([]);
    setStructureBlocks([]);
    setEditorMode('free');
    setShowForm(true);
    window.setTimeout(() => restoreEditorDraft('song-editor-draft:new'), 0);
  };

  const openEdit = (song: Song) => {
    setEditingSong(song);
    reset({
      title: song.title,
      artist: song.artist || '',
      bpm: song.bpm ?? undefined,
      type_id: song.type_id || '',
      style_id: song.style_id || '',
      has_chords: song.has_chords,
      original_key: song.original_key || '',
      preferred_accidentals: song.preferred_accidentals || 'auto',
      capo: song.capo || 0,
      time_signature: song.time_signature || '4/4',
      status: song.status || 'published',
      composers: (song.composers || []).join(', '),
      copyright_notice: song.copyright_notice || '',
    });
    setLyrics(song.lyrics || '');
    setDrumStyle(song.drum_style || '');
    setResourceLinks(song.resource_links || []);
    setStructureBlocks(song.structure_blocks || []);
    setEditorMode(song.structure_blocks && song.structure_blocks.length > 0 ? 'structured' : 'free');
    setShowForm(true);
    window.setTimeout(() => restoreEditorDraft(`song-editor-draft:${song.id}`, song.updated_at || song.created_at), 0);
  };

  const onSubmit = async (data: SongFormValues) => {
    const editableText = editorMode === 'structured'
      ? structureBlocks.map((block) => block.lyrics).join('\n')
      : htmlToBracketText(lyrics);
    const bracketTokens = getBracketTokens(editableText);
    const invalidTokens = [...new Set(bracketTokens.filter((token) => !isValidChord(token)))];

    if (invalidTokens.length > 0) {
      toast.error(`Acorde no válido: [${invalidTokens[0]}]. Usa encabezados de sección fuera de los corchetes.`);
      return;
    }

    if (data.has_chords && bracketTokens.length === 0) {
      toast.error('La canción está marcada con acordes, pero no contiene ninguno en formato [C].');
      return;
    }

    if (data.has_chords && !data.original_key?.trim()) {
      const candidate = detectKeyCandidate(editableText);
      toast.error(candidate
        ? `Define la tonalidad original. La primera tonalidad detectada es ${candidate}.`
        : 'Define la tonalidad original antes de publicar una canción con acordes.');
      return;
    }

    // Compile lyrics if in structured mode
    let compiledLyrics = lyrics;
    if (editorMode === 'structured') {
      compiledLyrics = compileBlocksToHtml(structureBlocks);
    }

    const payload = {
      title: data.title,
      artist: data.artist || null,
      bpm: data.bpm ?? null,
      type_id: data.type_id || null,
      style_id: data.style_id || null,
      has_chords: data.has_chords,
      lyrics: compiledLyrics,
      drum_style: drumStyle || null,
      resource_links: resourceLinks,
      structure_blocks: structureBlocks,
      slug: editingSong?.slug || slugifySongTitle(data.title),
      original_key: data.original_key?.trim() || null,
      preferred_accidentals: data.preferred_accidentals,
      capo: data.capo,
      time_signature: data.time_signature,
      status: data.status,
      composers: data.composers?.split(',').map((composer) => composer.trim()).filter(Boolean) || [],
      copyright_notice: data.copyright_notice?.trim() || null,
      published_at: data.status === 'published' ? (editingSong?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
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
    clearEditorDraft(editingSong ? `song-editor-draft:${editingSong.id}` : 'song-editor-draft:new');
    setShowForm(false);
    void fetchAll();
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
      comment: '',
      title: '',
      kind: 'video',
      visibility: 'public',
    };
    setResourceLinks([...resourceLinks, newLink]);
  };

  const removeLink = (id: string) => {
    setResourceLinks(resourceLinks.filter(l => l.id !== id));
  };

  const updateLink = (id: string, updates: Partial<SongResourceLink>) => {
    setResourceLinks(resourceLinks.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const openPreview = () => {
    const data = getValues();
    const compiledLyrics = editorMode === 'structured' ? compileBlocksToHtml(structureBlocks) : lyrics;
    const now = new Date().toISOString();
    setPreviewSong({
      id: editingSong?.id || 'song-preview',
      title: data.title?.trim() || 'Canción sin título',
      artist: data.artist?.trim() || null,
      bpm: data.bpm === undefined ? null : Number(data.bpm),
      type_id: data.type_id || null,
      style_id: data.style_id || null,
      lyrics: compiledLyrics,
      has_chords: Boolean(data.has_chords),
      drum_style: drumStyle || null,
      resource_links: resourceLinks,
      structure_blocks: structureBlocks,
      slug: editingSong?.slug || slugifySongTitle(data.title || 'cancion'),
      original_key: data.original_key?.trim() || detectKeyCandidate(editorMode === 'structured' ? structureBlocks.map((block) => block.lyrics || '').join('\n') : htmlToBracketText(lyrics)),
      preferred_accidentals: data.preferred_accidentals as AccidentalPreference,
      capo: Number(data.capo || 0),
      time_signature: data.time_signature || '4/4',
      status: data.status as SongStatus,
      composers: data.composers?.split(',').map((composer) => composer.trim()).filter(Boolean) || [],
      copyright_notice: data.copyright_notice?.trim() || null,
      created_at: editingSong?.created_at || now,
      updated_at: now,
      song_types: songTypes.find((type) => type.id === data.type_id) || null,
      song_styles: songStyles.find((style) => style.id === data.style_id) || null,
    });
    setPreviewTab('lyrics');
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

  // Filtered songs computation is removed since we do it server-side
  const filtered = songs;
  const hasActiveFilters = Boolean(search || filterType || filterStyle);

  const clearCatalogFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFilterType('');
    setFilterStyle('');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(199,157,63,0.2),transparent_30%)]" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-church-gold-light">
              <Music size={13} aria-hidden="true" /> Biblioteca musical
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Alabanzas e Himnos</h1>
            <p className="mt-2 text-sm text-slate-300">Organiza letras, acordes y recursos del equipo de alabanza.</p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 p-4">
              <BookOpenText className="mb-2 text-church-gold-light" size={18} aria-hidden="true" />
              <strong className="block text-2xl tabular-nums">{totalItems}</strong>
              <span className="text-xs text-slate-400">resultados</span>
            </div>
            <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Guitar className="mb-2 text-emerald-400" size={18} aria-hidden="true" />
              <strong className="block text-2xl tabular-nums">{songs.filter((song) => song.has_chords).length}</strong>
              <span className="text-xs text-slate-400">con acordes aquí</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Catálogo de canciones</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Página {page} de {totalPages}</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={() => setShowCatalogs(!showCatalogs)}
              aria-expanded={showCatalogs}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
              <Tag size={16} /> Catálogos {showCatalogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-church-gold-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800">
              <Plus size={18} /> Nueva canción
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
      <section aria-label="Buscar y filtrar canciones" className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o artista…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-church-gold-medium focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filtrar por tipo"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-church-gold-medium dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          <option value="">Todos los tipos</option>
          {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}
          aria-label="Filtrar por estilo"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-church-gold-medium dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          <option value="">Todos los estilos</option>
          {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {hasActiveFilters && <button type="button" onClick={clearCatalogFilters} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-slate-50 dark:text-church-gold-light dark:hover:bg-white/5"><RotateCcw size={14} /> Limpiar</button>}
      </section>

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
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl overflow-hidden shadow-glass">
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
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/10">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Song Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-md" onClick={() => setShowForm(false)}></div>
          <div className="relative w-full max-w-6xl rounded-[2rem] border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 my-4 z-10 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-150 dark:border-white/5">
              <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Music className="text-amber-600 animate-pulse" size={22} />
                {editingSong ? 'Editar Canción' : 'Nueva Canción'}
              </h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={openPreview} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"><Eye size={15} /> Vista previa</button>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-450 cursor-pointer"><X size={20} /></button>
              </div>
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

              <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white/60 p-4 dark:border-amber-400/10 dark:from-amber-400/[.06] dark:to-white/[.02]">
                <div className="mb-4 flex items-center gap-2">
                  <Guitar size={16} className="text-amber-600" />
                  <div><h3 className="text-sm font-black text-slate-800 dark:text-white">Identidad musical</h3><p className="text-[10px] text-slate-500">La tonalidad guardada gobierna transposición, Nashville, diagramas y partituras.</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                  <div>
                    <label htmlFor="song-key" className="block text-[10px] font-bold uppercase text-slate-400">Tono original</label>
                    <select id="song-key" {...register('original_key')} className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                      <option value="">Sin definir</option>{['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B','C#','D#','F#','G#','A#'].map((key) => <option key={key} value={key}>{key}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="song-accidentals" className="block text-[10px] font-bold uppercase text-slate-400">Alteraciones</label>
                    <select id="song-accidentals" {...register('preferred_accidentals')} className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"><option value="auto">Automático</option><option value="sharp">Sostenidos ♯</option><option value="flat">Bemoles ♭</option></select>
                  </div>
                  <div>
                    <label htmlFor="song-time" className="block text-[10px] font-bold uppercase text-slate-400">Compás</label>
                    <input id="song-time" {...register('time_signature')} placeholder="4/4" className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-mono text-slate-700 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-white" />
                    {errors.time_signature && <p className="mt-1 text-[10px] text-red-500">{errors.time_signature.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="song-capo" className="block text-[10px] font-bold uppercase text-slate-400">Capo</label>
                    <input id="song-capo" type="number" min="0" max="12" {...register('capo')} className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-mono text-slate-700 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-white" />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="song-status" className="block text-[10px] font-bold uppercase text-slate-400">Estado editorial</label>
                    <select id="song-status" {...register('status')} className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"><option value="draft">Borrador</option><option value="review">En revisión</option><option value="published">Publicado</option><option value="archived">Archivado</option></select>
                  </div>
                </div>
              </section>

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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="song-composers" className="mb-1 block text-xs font-bold uppercase text-gray-400">Compositores</label>
                  <input id="song-composers" {...register('composers')} placeholder="Separados por comas" className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="song-copyright" className="mb-1 block text-xs font-bold uppercase text-gray-400">Copyright / Licencia</label>
                  <input id="song-copyright" {...register('copyright_notice')} placeholder="Autor, editorial o licencia de uso" className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-800 dark:text-white" />
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
                    <SongBlockEditor 
                      blocks={structureBlocks} 
                      onChangeBlocks={setStructureBlocks} 
                      disabled={readOnly} 
                    />
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

                        <select value={link.kind || 'video'} onChange={(e) => updateLink(link.id, { kind: e.target.value as SongResourceLink['kind'] })} className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-gray-300">
                          <option value="video">Video</option><option value="audio">Audio</option><option value="pdf">PDF</option><option value="link">Enlace</option>
                        </select>

                        <select value={link.visibility || 'public'} onChange={(e) => updateLink(link.id, { visibility: e.target.value as SongResourceLink['visibility'] })} className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-gray-300">
                          <option value="public">Público</option><option value="team">Solo equipo</option>
                        </select>

                        <input type="text" value={link.title || ''} onChange={(e) => updateLink(link.id, { title: e.target.value })} placeholder="Título del recurso" className="min-w-[150px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-800 dark:text-gray-100" />

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
      {previewSong && (
        <SongViewer
          selectedSong={previewSong}
          setSelectedSong={setPreviewSong}
          onClose={() => setPreviewSong(null)}
          showChords={previewShowChords}
          setShowChords={setPreviewShowChords}
          fontFamily={previewFont}
          setFontFamily={setPreviewFont}
          activeTab={previewTab}
          setActiveTab={setPreviewTab}
        />
      )}
    </div>
  );
};

export default SongsManager;
