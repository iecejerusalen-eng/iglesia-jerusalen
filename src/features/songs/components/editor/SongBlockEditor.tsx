import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Music, FileImage, Video, Trash2, ArrowUp, ArrowDown, Settings 
} from 'lucide-react';
import type { SongStructureBlock, SongBlockType } from '@/types';

interface Props {
  content: string; // JSON string of blocks or legacy html
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function SongBlockEditor({ content, onChange, disabled = false }: Props) {
  const [blocks, setBlocks] = useState<SongStructureBlock[]>([]);
  const idSequence = useRef(0);

  const createBlockId = () => {
    idSequence.current += 1;
    return `song-block-${Date.now()}-${idSequence.current}`;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (content && content.trim().startsWith('[')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setBlocks(parsed as SongStructureBlock[]);
            return;
          }
        }
      } catch {
        console.warn('Failed to parse content as JSON blocks. Using legacy wrap.');
      }
      
      // Fallback: wrap legacy content in a lyrics block
      if (content) {
        setBlocks([{
          id: createBlockId(),
          type: 'lyrics',
          section_type: 'estrofa',
          label: 'Letra Original',
          lyrics: content
        }]);
      } else {
        setBlocks([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [content]);

  const updateParent = useCallback((updatedBlocks: SongStructureBlock[]) => {
    setBlocks(updatedBlocks);
    onChange(JSON.stringify(updatedBlocks));
  }, [onChange]);

  const addBlock = (type: SongBlockType) => {
    let newBlock: Record<string, unknown> = { id: createBlockId(), type };

    if (type === 'lyrics') {
      newBlock = { ...newBlock, section_type: 'estrofa', label: 'Estrofa', lyrics: '' };
    } else if (type === 'chord_diagram') {
      newBlock = { ...newBlock, instrument: 'guitar', chords: ['G', 'C', 'D'] };
    } else if (type === 'sheet_music') {
      newBlock = { ...newBlock, notation_type: 'abc', abc_code: 'X:1\nT:Title\nM:4/4\nK:C\nC D E F | G A B c |' };
    } else if (type === 'media_embed') {
      newBlock = { ...newBlock, provider: 'youtube', url: '' };
    } else if (type === 'musician_note') {
      newBlock = { ...newBlock, target_instrument: 'General', content: '' };
    } else if (type === 'tablature') {
      newBlock = { ...newBlock, content: 'e|---|\nB|---|' };
    }

    updateParent([...blocks, newBlock as SongStructureBlock]);
  };

  const updateBlock = (id: string, updates: Partial<SongStructureBlock>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } as SongStructureBlock : b);
    updateParent(newBlocks);
  };

  const deleteBlock = (id: string) => {
    updateParent(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    updateParent(newBlocks);
  };

  const renderBlockEditor = (block: SongStructureBlock, index: number) => {
    return (
      <motion.div 
        key={block.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border rounded-lg overflow-hidden shadow-sm mb-4"
      >
        <div className="bg-muted/50 px-3 py-2 flex items-center justify-between border-b">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs uppercase tracking-wider">
              {block.type.replace('_', ' ')}
            </span>
            {block.type === 'lyrics' && <span>- {block.label}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => moveBlock(index, 'up')} disabled={index === 0 || disabled} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><ArrowUp size={16} /></button>
            <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1 || disabled} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><ArrowDown size={16} /></button>
            <button onClick={() => deleteBlock(block.id)} disabled={disabled} className="p-1.5 hover:bg-destructive/10 text-destructive rounded ml-2"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {block.type === 'lyrics' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  value={block.label} 
                  onChange={e => updateBlock(block.id, { label: e.target.value })}
                  placeholder="Ej. Coro, Estrofa 1"
                  className="flex h-9 w-full md:w-1/3 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
                <select 
                  value={block.section_type}
                  onChange={e => updateBlock(block.id, { section_type: e.target.value as SongStructureBlock['section_type'] })}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="intro">Intro</option>
                  <option value="estrofa">Estrofa</option>
                  <option value="coro">Coro</option>
                  <option value="puente">Puente</option>
                  <option value="solo">Solo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Letra (Usa corchetes [G] para acordes)</p>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-[60%] hide-scrollbar">
                    {['C', 'G', 'D', 'Am', 'Em', 'F'].map(chord => (
                      <button 
                        key={chord}
                        onClick={() => {
                          const textarea = document.getElementById(`textarea-${block.id}`) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newText = block.lyrics.substring(0, start) + `[${chord}]` + block.lyrics.substring(end);
                            updateBlock(block.id, { lyrics: newText });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + chord.length + 2, start + chord.length + 2);
                            }, 0);
                          } else {
                            updateBlock(block.id, { lyrics: block.lyrics + `[${chord}]` });
                          }
                        }}
                        className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                        title={`Insertar acorde ${chord}`}
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea 
                  id={`textarea-${block.id}`}
                  value={block.lyrics}
                  onChange={e => updateBlock(block.id, { lyrics: e.target.value })}
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono"
                />
              </div>
            </div>
          )}

          {block.type === 'chord_diagram' && (
            <div className="space-y-3">
              <select 
                value={block.instrument}
                onChange={e => updateBlock(block.id, { instrument: e.target.value as 'guitar' | 'piano' | 'ukulele' })}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm w-[200px]"
              >
                <option value="guitar">Guitarra</option>
                <option value="ukulele">Ukelele</option>
                <option value="piano">Piano</option>
              </select>
              <input 
                value={block.chords.join(', ')} 
                onChange={e => updateBlock(block.id, { chords: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                placeholder="Ej. G, C, D"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
          )}

          {block.type === 'sheet_music' && (
            <div className="space-y-3">
              <input 
                value={block.title || ''} 
                onChange={e => updateBlock(block.id, { title: e.target.value })}
                placeholder="Título de partitura"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
              <textarea 
                value={block.abc_code || ''}
                onChange={e => updateBlock(block.id, { abc_code: e.target.value })}
                rows={5}
                placeholder="Notación ABC..."
                className="flex min-h-[100px] font-mono w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </div>
          )}

          {block.type === 'media_embed' && (
            <div className="space-y-3">
              <input 
                value={block.url} 
                onChange={e => updateBlock(block.id, { url: e.target.value })}
                placeholder="URL de YouTube, Spotify o MP3"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
          )}
          
          {block.type === 'musician_note' && (
            <div className="space-y-3">
              <select 
                value={block.target_instrument}
                onChange={e => updateBlock(block.id, { target_instrument: e.target.value as 'General' | 'Batería' | 'Piano' | 'Guitarra' | 'Bajo' | 'Voz' })}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm w-[200px]"
              >
                <option value="General">General</option>
                <option value="Batería">Batería</option>
                <option value="Piano">Piano</option>
                <option value="Guitarra">Guitarra</option>
                <option value="Bajo">Bajo</option>
                <option value="Voz">Voz</option>
              </select>
              <textarea 
                value={block.content}
                onChange={e => updateBlock(block.id, { content: e.target.value })}
                rows={2}
                placeholder="Ej. Batería entra fuerte en el segundo coro."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="song-block-editor space-y-6">
      <AnimatePresence>
        {blocks.map((block, i) => renderBlockEditor(block, i))}
      </AnimatePresence>
      
      {!disabled && (
        <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/20 border-dashed justify-center">
          <p className="w-full text-center text-sm text-muted-foreground mb-2">Agregar nuevo bloque</p>
          <button onClick={() => addBlock('lyrics')} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-sm font-medium"><Type size={16}/> Letra/Acordes</button>
          <button onClick={() => addBlock('chord_diagram')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded-md transition-colors text-sm font-medium"><FileImage size={16}/> Diagrama</button>
          <button onClick={() => addBlock('sheet_music')} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500 hover:text-white rounded-md transition-colors text-sm font-medium"><Music size={16}/> Partitura (ABC)</button>
          <button onClick={() => addBlock('media_embed')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors text-sm font-medium"><Video size={16}/> Video/Audio</button>
          <button onClick={() => addBlock('musician_note')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-md transition-colors text-sm font-medium"><Settings size={16}/> Nota Técnica</button>
        </div>
      )}
    </div>
  );
}
