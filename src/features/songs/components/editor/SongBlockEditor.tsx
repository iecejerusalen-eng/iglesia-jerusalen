import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Music, FileImage, Video, Trash2, ArrowUp, ArrowDown, Settings, PlusCircle, Info, ListChecks, CircleHelp, Link2, FileText, Drum
} from 'lucide-react';
import type { SongStructureBlock, SongBlockType } from '@/types';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface Props {
  content?: string; // JSON string of blocks or legacy html
  blocks?: SongStructureBlock[];
  onChange?: (html: string) => void;
  onChangeBlocks?: (blocks: SongStructureBlock[]) => void;
  disabled?: boolean;
}

export function SongBlockEditor({ 
  content, 
  blocks: externalBlocks, 
  onChange, 
  onChangeBlocks, 
  disabled = false 
}: Props) {
  const [internalBlocks, setInternalBlocks] = useState<SongStructureBlock[]>([]);
  const idSequence = useRef(0);

  const activeBlocks = externalBlocks !== undefined ? externalBlocks : internalBlocks;

  const createBlockId = () => {
    idSequence.current += 1;
    return `song-block-${Date.now()}-${idSequence.current}`;
  };

  useEffect(() => {
    if (externalBlocks !== undefined) return;
    if (content === undefined) return;

    try {
      if (content && content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setInternalBlocks(parsed as SongStructureBlock[]));
          return;
        }
      }
    } catch (error) {
      console.warn('No fue posible interpretar el contenido como bloques JSON.', error);
    }
    
    if (content) {
      queueMicrotask(() => setInternalBlocks([{
        id: createBlockId(),
        type: 'lyrics',
        section_type: 'estrofa',
        label: 'Letra Original',
        lyrics: content
      }]));
    } else {
      queueMicrotask(() => setInternalBlocks([]));
    }
  }, [content, externalBlocks]);

  const updateParent = useCallback((updatedBlocks: SongStructureBlock[]) => {
    if (onChangeBlocks) {
      onChangeBlocks(updatedBlocks);
    }
    if (onChange) {
      onChange(JSON.stringify(updatedBlocks));
    }
    if (externalBlocks === undefined) {
      setInternalBlocks(updatedBlocks);
    }
  }, [onChange, onChangeBlocks, externalBlocks]);

  const addBlock = (type: SongBlockType) => {
    let newBlock: Record<string, unknown> = { id: createBlockId(), type };

    if (type === 'lyrics') {
      const count = activeBlocks.filter(b => b.type === 'lyrics' && b.section_type === 'estrofa').length + 1;
      newBlock = { 
        ...newBlock, 
        section_type: 'estrofa', 
        label: `Estrofa ${count}`, 
        lyrics: '', 
        melody_guide: '' 
      };
    } else if (type === 'chord_diagram') {
      newBlock = { ...newBlock, instrument: 'guitar', chords: ['G', 'C', 'D'] };
    } else if (type === 'sheet_music') {
      newBlock = { ...newBlock, title: 'Partitura / Acordes', notation_type: 'abc', abc_code: 'X:1\nT:Melodía\nM:4/4\nK:G\nG2 B2 d2 g2 |' };
    } else if (type === 'media_embed') {
      newBlock = { ...newBlock, title: 'Video o Audio de Ensayo', provider: 'youtube', url: '' };
    } else if (type === 'musician_note') {
      newBlock = { ...newBlock, target_instrument: 'General', content: '' };
    } else if (type === 'tablature') {
      newBlock = { ...newBlock, title: 'Tablatura', instrument: 'guitar', tuning: 'E A D G B E', content: 'e|-----------------|\nB|-----------------|\nG|---0---2---0-----|\nD|-----------------|\nA|-----------------|\nE|-----------------|' };
    } else if (type === 'rich_text') {
      newBlock = { ...newBlock, title: 'Recurso', content: '<p>Escribe aquí el contenido del recurso.</p>', audience: 'public' };
    } else if (type === 'poll') {
      newBlock = { ...newBlock, question: '¿Qué versión prepararemos?', options: ['Versión original', 'Versión acústica'], allow_multiple: false };
    } else if (type === 'question') {
      newBlock = { ...newBlock, question: 'Pregunta para el equipo', helper_text: '', answer_type: 'long' };
    } else if (type === 'link_collection') {
      newBlock = { ...newBlock, title: 'Enlaces de ensayo', links: [{ id: createBlockId(), label: 'Referencia', url: '', description: '' }] };
    }

    updateParent([...activeBlocks, newBlock as unknown as SongStructureBlock]);
  };

  const updateBlock = (id: string, updates: Partial<SongStructureBlock>) => {
    const newBlocks = activeBlocks.map(b => b.id === id ? { ...b, ...updates } as SongStructureBlock : b);
    updateParent(newBlocks);
  };

  const deleteBlock = (id: string) => {
    updateParent(activeBlocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...activeBlocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    updateParent(newBlocks);
  };

  const insertChordToTextarea = (blockId: string, currentText: string, chord: string) => {
    const textarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + `[${chord}]` + currentText.substring(end);
      updateBlock(blockId, { lyrics: newText });
      setTimeout(() => {
        textarea.focus();
        const newPos = start + chord.length + 2;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      updateBlock(blockId, { lyrics: currentText + `[${chord}]` });
    }
  };

  const renderBlockEditor = (block: SongStructureBlock, index: number) => {
    const blockObj = block as unknown as Record<string, unknown>;

    return (
      <motion.div 
        key={block.id || index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-glass mb-4 hover:border-gold/30 transition-all"
      >
        {/* Header Controls */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/5">
          <div className="flex items-center gap-2 font-medium text-xs">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              block.type === 'lyrics' 
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-gold border-amber-200/30' 
                : block.type === 'chord_diagram'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/30'
                : block.type === 'musician_note'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200/30'
            }`}>
              {block.type === 'lyrics' ? 'Letra / Acordes' : block.type === 'chord_diagram' ? 'Diagrama Acordes' : block.type === 'musician_note' ? 'Nota Músicos' : block.type === 'sheet_music' ? 'Partitura' : block.type === 'media_embed' ? 'Media / Audio' : block.type === 'tablature' ? 'Tablatura' : block.type === 'rich_text' ? 'Texto enriquecido' : block.type === 'poll' ? 'Encuesta' : block.type === 'question' ? 'Pregunta' : 'Colección de enlaces'}
            </span>
            {block.type === 'lyrics' && <span className="font-bold text-gray-700 dark:text-gray-200 text-xs">— {(blockObj.label as string) || 'Sección'}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0 || disabled} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-30 cursor-pointer" title="Subir">
              <ArrowUp size={15} />
            </button>
            <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === activeBlocks.length - 1 || disabled} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-30 cursor-pointer" title="Bajar">
              <ArrowDown size={15} />
            </button>
            <button type="button" onClick={() => deleteBlock(block.id)} disabled={disabled} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded ml-1 cursor-pointer" title="Eliminar bloque">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* 1. LYRICS BLOCK */}
          {block.type === 'lyrics' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Tipo de Sección</label>
                  <select 
                    value={(blockObj.section_type as string) || 'estrofa'}
                    onChange={e => {
                      const section_type = e.target.value as Extract<SongStructureBlock, { type: 'lyrics' }>['section_type'];
                      const count = activeBlocks.filter(b => b.type === 'lyrics' && b.section_type === section_type && b.id !== block.id).length + 1;
                      const labels: Record<string, string> = {
                        intro: 'Introducción',
                        estrofa: `Estrofa ${count}`,
                        coro: 'Coro',
                        puente: 'Puente',
                        solo: 'Melodía / Solo',
                        outro: 'Final',
                        otro: 'Sección'
                      };
                      updateBlock(block.id, { section_type, label: labels[section_type] || 'Sección' });
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-100 outline-none focus:border-amber-400"
                  >
                    <option value="intro">Introducción 🎵</option>
                    <option value="estrofa">Estrofa 📝</option>
                    <option value="coro">Coro 🎤</option>
                    <option value="puente">Puente 🌉</option>
                    <option value="solo">Melodía / Solo 🎹</option>
                    <option value="outro">Final 🏁</option>
                    <option value="otro">Otro 🔹</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Título de Sección</label>
                  <input 
                    type="text"
                    value={(blockObj.label as string) || ''} 
                    onChange={e => updateBlock(block.id, { label: e.target.value })}
                    placeholder="Ej. Coro 1, Estrofa 2"
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-850 dark:text-gray-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Notas / Melodía Guía (Opcional)</label>
                  <input 
                    type="text"
                    value={((blockObj.melody as string) || (blockObj.melody_guide as string) || '')} 
                    onChange={e => updateBlock(block.id, { melody: e.target.value, melody_guide: e.target.value })}
                    placeholder="Ej. G - C - D - G"
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Info size={11} className="text-amber-600" />
                    Letra (Inserta corchetes <code className="text-red-500 font-bold">[G]</code> antes de cada palabra)
                  </p>
                  
                  {/* Quick Chord Insertion Bar */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
                    <span className="text-[9px] font-extrabold uppercase text-amber-600 dark:text-gold mr-1">Insertar:</span>
                    {['C', 'G', 'D', 'Am', 'Em', 'F', 'Bb', 'A', 'E', 'B7'].map(chord => (
                      <button 
                        key={chord}
                        type="button"
                        onClick={() => insertChordToTextarea(block.id, (blockObj.lyrics as string) || '', chord)}
                        className="px-2 py-0.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-gold hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950 rounded-lg border border-amber-200/40 transition-colors shadow-2xs cursor-pointer"
                        title={`Insertar acorde [${chord}]`}
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  id={`textarea-${block.id}`}
                  value={(blockObj.lyrics as string) || ''}
                  onChange={e => updateBlock(block.id, { lyrics: e.target.value })}
                  rows={5}
                  placeholder="Escribe la letra de la sección..."
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-mono text-gray-900 dark:text-gray-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-loose"
                />
              </div>
            </div>
          )}

          {/* 2. CHORD DIAGRAM BLOCK */}
          {block.type === 'chord_diagram' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Instrumento</label>
                  <select 
                    value={(blockObj.instrument as string) || 'guitar'}
                    onChange={e => updateBlock(block.id, { instrument: e.target.value as Extract<SongStructureBlock, { type: 'chord_diagram' }>['instrument'] })}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 outline-none"
                  >
                    <option value="guitar">Guitarra 🎸</option>
                    <option value="ukulele">Ukelele 🪕</option>
                    <option value="piano">Piano 🎹</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Acordes a mostrar (Separados por coma)</label>
                  <input 
                    type="text"
                    value={Array.isArray(blockObj.chords) ? blockObj.chords.join(', ') : ''} 
                    onChange={e => updateBlock(block.id, { chords: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                    placeholder="Ej. G, C, D, Em"
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-gray-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. SHEET MUSIC BLOCK */}
          {block.type === 'sheet_music' && (
            <div className="space-y-3">
              <input 
                type="text"
                value={(blockObj.title as string) || ''} 
                onChange={e => updateBlock(block.id, { title: e.target.value })}
                placeholder="Título de la partitura"
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-850 dark:text-gray-100 outline-none focus:border-amber-400"
              />
              <textarea 
                value={(blockObj.abc_code as string) || ''}
                onChange={e => updateBlock(block.id, { abc_code: e.target.value })}
                rows={4}
                placeholder="Código de Notación ABC (ej: X:1\nT:Intro\nM:4/4\nK:G\nG2 B2 d2 g2 |)"
                className="w-full font-mono bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-gray-100 outline-none"
              />
            </div>
          )}

          {/* 4. MEDIA EMBED BLOCK */}
          {block.type === 'media_embed' && (
            <div className="space-y-3">
              <input 
                type="text"
                value={(blockObj.url as string) || ''} 
                onChange={e => updateBlock(block.id, { url: e.target.value })}
                placeholder="URL de YouTube, Spotify o MP3 de referencia..."
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-gray-100 outline-none focus:border-amber-400"
              />
            </div>
          )}
          
          {/* 5. MUSICIAN NOTE BLOCK */}
          {block.type === 'musician_note' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Para quién es esta nota</label>
                  <select 
                    value={(blockObj.target_instrument as string) || 'General'}
                    onChange={e => updateBlock(block.id, { target_instrument: e.target.value as Extract<SongStructureBlock, { type: 'musician_note' }>['target_instrument'] })}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 outline-none"
                  >
                    <option value="General">General 📢</option>
                    <option value="Batería">Batería 🥁</option>
                    <option value="Piano">Piano 🎹</option>
                    <option value="Guitarra">Guitarra 🎸</option>
                    <option value="Guitarra eléctrica">Guitarra eléctrica ⚡</option>
                    <option value="Bajo">Bajo 🎸</option>
                    <option value="Ukelele">Ukelele</option>
                    <option value="Voz">Voz 🎤</option>
                    <option value="Vientos">Vientos 🎺</option>
                    <option value="Sonido">Sonido / Multimedia</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Nota Técnica / Instrucción de ensayo</label>
                  <textarea 
                    value={(blockObj.content as string) || ''}
                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                    rows={2}
                    placeholder="Ej: Batería entra fuerte con redoble en el segundo coro."
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-gray-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {block.type === 'tablature' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Título de la tablatura" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800" />
                <select value={block.instrument || 'guitar'} onChange={(event) => updateBlock(block.id, { instrument: event.target.value as Extract<SongStructureBlock, { type: 'tablature' }>['instrument'] })} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800"><option value="guitar">Guitarra</option><option value="bass">Bajo</option><option value="ukulele">Ukelele</option><option value="drums">Batería / Drum tab</option></select>
                <input value={block.tuning || ''} onChange={(event) => updateBlock(block.id, { tuning: event.target.value })} placeholder="Afinación: E A D G B E" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800" />
              </div>
              <textarea value={block.content} onChange={(event) => updateBlock(block.id, { content: event.target.value })} rows={8} spellCheck={false} className="w-full overflow-x-auto whitespace-pre rounded-xl border border-gray-300 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-emerald-300 outline-none dark:border-white/10" placeholder="Escribe la tablatura respetando espacios y líneas" />
            </div>
          )}

          {block.type === 'rich_text' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-[1fr_10rem]"><input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Título del recurso" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800" /><select value={block.audience || 'public'} onChange={(event) => updateBlock(block.id, { audience: event.target.value as 'public' | 'team' })} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800"><option value="public">Público</option><option value="team">Sólo equipo</option></select></div>
              <RichTextEditor content={block.content} onChange={(content) => updateBlock(block.id, { content })} disabled={disabled} />
            </div>
          )}

          {block.type === 'poll' && (
            <div className="space-y-3"><input value={block.question} onChange={(event) => updateBlock(block.id, { question: event.target.value })} placeholder="Pregunta de la encuesta" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-800" /><textarea value={block.options.join('\n')} onChange={(event) => updateBlock(block.id, { options: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} rows={4} placeholder="Una opción por línea" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800" /><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={Boolean(block.allow_multiple)} onChange={(event) => updateBlock(block.id, { allow_multiple: event.target.checked })} /> Permitir varias respuestas</label></div>
          )}

          {block.type === 'question' && (
            <div className="grid gap-3 md:grid-cols-2"><input value={block.question} onChange={(event) => updateBlock(block.id, { question: event.target.value })} placeholder="Pregunta" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-800" /><select value={block.answer_type} onChange={(event) => updateBlock(block.id, { answer_type: event.target.value as Extract<SongStructureBlock, { type: 'question' }>['answer_type'] })} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800"><option value="short">Respuesta corta</option><option value="long">Respuesta larga</option><option value="yes_no">Sí / No</option></select><input value={block.helper_text || ''} onChange={(event) => updateBlock(block.id, { helper_text: event.target.value })} placeholder="Texto de ayuda opcional" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs md:col-span-2 dark:border-white/10 dark:bg-slate-800" /></div>
          )}

          {block.type === 'link_collection' && (
            <div className="space-y-3"><input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Título de la colección" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-800" />{block.links.map((link, linkIndex) => <div key={link.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[.8fr_1.2fr_1fr_auto] dark:bg-white/5"><input value={link.label} onChange={(event) => updateBlock(block.id, { links: block.links.map((item, index) => index === linkIndex ? { ...item, label: event.target.value } : item) })} placeholder="Etiqueta" className="rounded-lg border px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-800" /><input value={link.url} onChange={(event) => updateBlock(block.id, { links: block.links.map((item, index) => index === linkIndex ? { ...item, url: event.target.value } : item) })} placeholder="https://..." className="rounded-lg border px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-800" /><input value={link.description || ''} onChange={(event) => updateBlock(block.id, { links: block.links.map((item, index) => index === linkIndex ? { ...item, description: event.target.value } : item) })} placeholder="Descripción" className="rounded-lg border px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-800" /><button type="button" onClick={() => updateBlock(block.id, { links: block.links.filter((_, index) => index !== linkIndex) })} className="text-rose-500"><Trash2 size={14} /></button></div>)}<button type="button" onClick={() => updateBlock(block.id, { links: [...block.links, { id: createBlockId(), label: '', url: '', description: '' }] })} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold dark:bg-white/10"><PlusCircle size={13} className="mr-1 inline" /> Agregar enlace</button></div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="song-block-editor space-y-4">
      <AnimatePresence>
        {activeBlocks.map((block, i) => renderBlockEditor(block, i))}
      </AnimatePresence>
      
      {!disabled && (
        <div className="p-4 border-2 border-dashed border-gray-250 dark:border-white/10 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 text-center space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
            <PlusCircle size={15} className="text-amber-600" />
            Agregar Nuevo Bloque a la Alabanza
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              type="button"
              onClick={() => addBlock('lyrics')} 
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-gold border border-amber-200/40 hover:bg-amber-100 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Type size={14}/> Letra / Acordes
            </button>
            <button 
              type="button"
              onClick={() => addBlock('chord_diagram')} 
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 hover:bg-emerald-100 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <FileImage size={14}/> Diagrama Acordes
            </button>
            <button 
              type="button"
              onClick={() => addBlock('musician_note')} 
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200/40 hover:bg-indigo-100 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Settings size={14}/> Nota Músicos
            </button>
            <button 
              type="button"
              onClick={() => addBlock('sheet_music')} 
              className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200/40 hover:bg-violet-100 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Music size={14}/> Partitura
            </button>
            <button 
              type="button"
              onClick={() => addBlock('media_embed')} 
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/40 hover:bg-red-100 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Video size={14}/> Audio / Media
            </button>
            <button type="button" onClick={() => addBlock('tablature')} className="flex items-center gap-1.5 rounded-xl border border-cyan-200/40 bg-cyan-50 px-3.5 py-2 text-xs font-bold text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"><Drum size={14}/> Tabs / Drum tabs</button>
            <button type="button" onClick={() => addBlock('rich_text')} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><FileText size={14}/> Texto enriquecido</button>
            <button type="button" onClick={() => addBlock('poll')} className="flex items-center gap-1.5 rounded-xl border border-fuchsia-200/40 bg-fuchsia-50 px-3.5 py-2 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"><ListChecks size={14}/> Encuesta</button>
            <button type="button" onClick={() => addBlock('question')} className="flex items-center gap-1.5 rounded-xl border border-blue-200/40 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"><CircleHelp size={14}/> Pregunta</button>
            <button type="button" onClick={() => addBlock('link_collection')} className="flex items-center gap-1.5 rounded-xl border border-emerald-200/40 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Link2 size={14}/> Enlaces</button>
          </div>
        </div>
      )}
    </div>
  );
}
