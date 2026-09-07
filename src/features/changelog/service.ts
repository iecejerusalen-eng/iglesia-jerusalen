import { supabase } from '../../config/supabase';
import type { ChangelogChange, ChangelogVersion } from './types';

const select = 'id,version,titulo,resumen,fecha_lanzamiento,estado,es_mayor,imagen_portada,color_acento,autor_nombre,vistas,changelog_cambios(*)';

export async function fetchPublishedChangelog(): Promise<ChangelogVersion[]> {
  const { data, error } = await supabase.from('changelog_versiones').select(select).eq('estado', 'publicado').order('fecha_lanzamiento', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<ChangelogVersion & { changelog_cambios?: ChangelogChange[] }>).map((item) => ({ ...item, cambios: [...(item.changelog_cambios ?? [])].sort((a, b) => a.orden - b.orden) }));
}

export async function fetchChangelogVersion(version: string): Promise<ChangelogVersion | null> {
  const { data, error } = await supabase.from('changelog_versiones').select(select).eq('version', version).eq('estado', 'publicado').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const item = data as unknown as ChangelogVersion & { changelog_cambios?: ChangelogChange[] };
  return { ...item, cambios: [...(item.changelog_cambios ?? [])].sort((a, b) => a.orden - b.orden) };
}

export async function fetchAllChangelog(): Promise<ChangelogVersion[]> {
  const { data, error } = await supabase.from('changelog_versiones').select(select).order('fecha_lanzamiento', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<ChangelogVersion & { changelog_cambios?: ChangelogChange[] }>).map((item) => ({ ...item, cambios: [...(item.changelog_cambios ?? [])].sort((a, b) => a.orden - b.orden) }));
}
