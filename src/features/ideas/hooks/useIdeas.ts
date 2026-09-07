import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import { fetchIdeas } from '../service';
import type { Idea } from '../types';

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setIdeas(await fetchIdeas()); }
    catch (loadError) { console.error('No se pudieron cargar las ideas:', loadError); setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las ideas.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const channel = supabase.channel('ideas-wall-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ideas' }, (payload) => {
        const incoming = payload.new as unknown as Idea;
        setIdeas((current) => current.some((idea) => idea.id === incoming.id) ? current : [{ ...incoming, adjuntos: [], etiquetas: [] }, ...current]);
        toast.success('Nueva idea publicada en el muro.');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ideas' }, (payload) => {
        const incoming = payload.new as unknown as Idea;
        setIdeas((current) => current.map((idea) => idea.id === incoming.id ? { ...idea, ...incoming } : idea));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ideas' }, (payload) => {
        setIdeas((current) => current.filter((idea) => idea.id !== (payload.old as { id: string }).id));
      })
      .subscribe((status) => { if (status === 'CHANNEL_ERROR') console.error('El canal Realtime de ideas no pudo conectarse.'); });
    return () => { void supabase.removeChannel(channel); };
  }, []);

  return { ideas, loading, error, reload: load };
}
