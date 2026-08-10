import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, PenTool, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { deleteQuickNote, loadQuickNote, saveQuickNote } from './content/notesStorage';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function formatSavedAt(value: string | null): string {
  if (!value) return 'Sin guardar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return `Guardado ${new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(date)}`;
}

export function QuickNotesTool() {
  const [initialNote] = useState(loadQuickNote);
  const [notes, setNotes] = useState(initialNote.note.text);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialNote.note.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>(initialNote.error ? 'error' : initialNote.note.updatedAt ? 'saved' : 'idle');
  const [isCopied, setIsCopied] = useState(false);
  const lastPersistedText = useRef(initialNote.note.text);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    if (initialNote.error) {
      console.error('No se pudieron cargar las notas rápidas.', initialNote.error);
      toast.error('No se pudieron recuperar las notas guardadas.');
    }
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, [initialNote.error]);

  useEffect(() => {
    if (notes === lastPersistedText.current) return;
    setSaveState('saving');
    const timeoutId = window.setTimeout(() => {
      const nextUpdatedAt = new Date().toISOString();
      try {
        saveQuickNote({ text: notes, updatedAt: nextUpdatedAt });
        lastPersistedText.current = notes;
        setUpdatedAt(nextUpdatedAt);
        setSaveState('saved');
      } catch (error: unknown) {
        console.error('No se pudieron guardar las notas rápidas.', error);
        setSaveState('error');
        toast.error('No se pudo guardar la nota en este dispositivo.');
      }
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [notes]);

  const copyToClipboard = async () => {
    if (!notes.trim()) return;
    try {
      await navigator.clipboard.writeText(notes);
      setIsCopied(true);
      toast.success('Notas copiadas al portapapeles');
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setIsCopied(false), 2000);
    } catch (error: unknown) {
      console.error('No se pudieron copiar las notas.', error);
      toast.error('No se pudo copiar. Revisa el permiso del portapapeles.');
    }
  };

  const downloadNotes = () => {
    if (!notes.trim()) return;
    let url: string | null = null;
    try {
      const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `notas-rapidas-${new Date().toISOString().slice(0, 10)}.txt`;
      anchor.click();
      toast.success('Nota descargada');
    } catch (error: unknown) {
      console.error('No se pudo descargar la nota.', error);
      toast.error('No se pudo preparar la descarga.');
    } finally {
      if (url !== null) URL.revokeObjectURL(url);
    }
  };

  const clearNotes = () => {
    try {
      deleteQuickNote();
      setNotes('');
      setUpdatedAt(null);
      lastPersistedText.current = '';
      setSaveState('idle');
      toast.success('Notas borradas');
    } catch (error: unknown) {
      console.error('No se pudieron borrar las notas rápidas.', error);
      setSaveState('error');
      toast.error('No se pudo borrar la nota guardada.');
    }
  };

  const saveLabel = saveState === 'saving'
    ? 'Guardando…'
    : saveState === 'error'
      ? 'No se pudo guardar'
      : formatSavedAt(updatedAt);

  return (
    <div className="flex h-[360px] flex-col px-4 pb-5 pt-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-white/60">
          <PenTool size={17} aria-hidden="true" />
          <span className="truncate text-xs font-bold uppercase tracking-[0.18em]">Notas rápidas</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => void copyToClipboard()} disabled={!notes.trim()} aria-label="Copiar notas" title="Copiar notas" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:pointer-events-none disabled:opacity-35">
            {isCopied ? <Check size={16} className="text-emerald-300" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={downloadNotes} disabled={!notes.trim()} aria-label="Descargar notas como archivo de texto" title="Descargar .txt" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:pointer-events-none disabled:opacity-35">
            <Download size={16} aria-hidden="true" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" disabled={!notes.trim()} aria-label="Borrar notas" title="Borrar notas" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:pointer-events-none disabled:opacity-35">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent position="center">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar esta nota?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción eliminará el texto guardado en este dispositivo y no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearNotes} className="bg-red-600 hover:bg-red-700">Borrar nota</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] transition focus-within:border-purple-400/50 focus-within:ring-2 focus-within:ring-purple-400/20">
        <label htmlFor="toolbox-quick-notes" className="sr-only">Contenido de la nota rápida</label>
        <textarea
          id="toolbox-quick-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Escribe tus notas aquí…"
          className="h-full w-full resize-none bg-transparent p-4 pb-9 text-sm leading-relaxed text-white/90 outline-none placeholder:text-white/35 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          spellCheck="true"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between border-t border-white/[0.06] bg-[#333439]/90 px-3 py-2 text-[11px] text-white/55 backdrop-blur-sm">
          <span className={saveState === 'error' ? 'text-rose-300' : saveState === 'saving' ? 'text-amber-200' : ''} role="status" aria-live="polite">{saveLabel}</span>
          <span>{notes.length.toLocaleString('es-CO')} caracteres</span>
        </div>
      </div>
    </div>
  );
}
