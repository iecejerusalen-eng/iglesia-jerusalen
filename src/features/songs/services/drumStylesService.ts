import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../config/supabase';

export const DEFAULT_DRUM_STYLES: readonly string[] = [
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
  'Acústico / Sin Batería',
];

export const DRUM_STYLES_LOCAL_STORAGE_KEY = 'worship_custom_drum_styles';

export function getLocalCustomDrumStyles(): string[] {
  try {
    const raw = window.localStorage.getItem(DRUM_STYLES_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch (error) {
    console.warn('No fue posible leer los toques de batería locales:', error);
  }
  return [];
}

export function saveLocalCustomDrumStyles(styles: string[]): void {
  try {
    window.localStorage.setItem(DRUM_STYLES_LOCAL_STORAGE_KEY, JSON.stringify(styles));
  } catch (error) {
    console.warn('No fue posible guardar los toques de batería locales:', error);
  }
}

/**
 * Combines default presets, custom drum styles, and any styles found on existing songs.
 * Preserves order (presets first, then custom, then any others), deduplicating case-insensitively.
 */
export function mergeDrumStyles(
  presets: readonly string[] = DEFAULT_DRUM_STYLES,
  customStyles: readonly string[] = [],
  songsStyles: readonly (string | null | undefined)[] = []
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (style: string | null | undefined) => {
    if (!style) return;
    const trimmed = style.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  };

  // 1. Add presets
  presets.forEach(add);
  // 2. Add custom styles
  customStyles.forEach(add);
  // 3. Add styles found in existing songs
  songsStyles.forEach(add);

  return result;
}

/**
 * Persists a new custom drum style into Supabase:
 * 1. Checks if song_drum_styles table exists and inserts.
 * 2. Also saves into church_settings.appearance_config.custom_drum_styles as fallback JSONB.
 * 3. Saves to localStorage.
 */
export async function persistNewDrumStyle(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('El nombre del toque de batería no puede estar vacío.');
  }

  // Check if it already exists in default presets
  const isDefault = DEFAULT_DRUM_STYLES.some(
    (style) => style.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDefault) {
    return trimmed;
  }

  // Update local storage first
  const currentLocal = getLocalCustomDrumStyles();
  const alreadyInLocal = currentLocal.some(
    (style) => style.toLowerCase() === trimmed.toLowerCase()
  );
  if (!alreadyInLocal) {
    const updatedLocal = [...currentLocal, trimmed];
    saveLocalCustomDrumStyles(updatedLocal);
  }

  // Try saving to Supabase song_drum_styles table if available
  try {
    const { error: tableError } = await supabase
      .from('song_drum_styles')
      .insert({ name: trimmed });
    if (!tableError) {
      // Successfully saved to table
      return trimmed;
    }
  } catch {
    // song_drum_styles table might not exist yet, continue to church_settings fallback
  }

  // Fallback / sync to church_settings (appearance_config JSONB)
  try {
    const { data: churchData } = await supabase
      .from('church_settings')
      .select('id, appearance_config')
      .eq('id', 1)
      .maybeSingle();

    if (churchData) {
      const currentConfig =
        churchData.appearance_config && typeof churchData.appearance_config === 'object'
          ? (churchData.appearance_config as Record<string, unknown>)
          : {};
      const currentRemoteStyles: string[] = Array.isArray(currentConfig.custom_drum_styles)
        ? (currentConfig.custom_drum_styles as string[])
        : [];

      if (!currentRemoteStyles.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        const nextRemoteStyles = [...currentRemoteStyles, trimmed];
        await supabase
          .from('church_settings')
          .update({
            appearance_config: {
              ...currentConfig,
              custom_drum_styles: nextRemoteStyles,
            },
          })
          .eq('id', 1);
      }
    }
  } catch (error) {
    console.warn('No fue posible sincronizar el toque de batería con church_settings:', error);
  }

  return trimmed;
}

/**
 * Removes a custom drum style from local storage and remote persistence.
 */
export async function deleteCustomDrumStyleRemote(styleToDelete: string): Promise<void> {
  const trimmed = styleToDelete.trim().toLowerCase();

  // Remove from localStorage
  const currentLocal = getLocalCustomDrumStyles();
  const nextLocal = currentLocal.filter((s) => s.trim().toLowerCase() !== trimmed);
  saveLocalCustomDrumStyles(nextLocal);

  // Try removing from song_drum_styles table
  try {
    await supabase.from('song_drum_styles').delete().ilike('name', styleToDelete.trim());
  } catch {
    // Ignore if table doesn't exist
  }

  // Remove from church_settings
  try {
    const { data: churchData } = await supabase
      .from('church_settings')
      .select('id, appearance_config')
      .eq('id', 1)
      .maybeSingle();

    if (churchData) {
      const currentConfig =
        churchData.appearance_config && typeof churchData.appearance_config === 'object'
          ? (churchData.appearance_config as Record<string, unknown>)
          : {};
      const currentRemoteStyles: string[] = Array.isArray(currentConfig.custom_drum_styles)
        ? (currentConfig.custom_drum_styles as string[])
        : [];

      const nextRemoteStyles = currentRemoteStyles.filter(
        (s) => s.trim().toLowerCase() !== trimmed
      );

      await supabase
        .from('church_settings')
        .update({
          appearance_config: {
            ...currentConfig,
            custom_drum_styles: nextRemoteStyles,
          },
        })
        .eq('id', 1);
    }
  } catch (error) {
    console.warn('No fue posible eliminar el toque de batería en church_settings:', error);
  }
}

/**
 * React hook to manage drum styles with instant local state and remote synchronization.
 */
export function useDrumStyles(existingSongs?: Array<{ drum_style?: string | null }>) {
  const [customDrumStyles, setCustomDrumStyles] = useState<string[]>(() =>
    getLocalCustomDrumStyles()
  );
  const [loading, setLoading] = useState(false);

  // Fetch remote custom styles on mount
  useEffect(() => {
    let mounted = true;
    async function fetchRemote() {
      try {
        setLoading(true);
        const remoteStyles: string[] = [];

        // 1. Try song_drum_styles table
        const { data: tableData } = await supabase
          .from('song_drum_styles')
          .select('name')
          .order('name');

        if (tableData && Array.isArray(tableData) && tableData.length > 0) {
          tableData.forEach((row: { name?: string }) => {
            if (row.name && typeof row.name === 'string') {
              remoteStyles.push(row.name);
            }
          });
        } else {
          // 2. Fallback to church_settings.appearance_config.custom_drum_styles
          const { data: churchData } = await supabase
            .from('church_settings')
            .select('appearance_config')
            .eq('id', 1)
            .maybeSingle();

          if (churchData?.appearance_config && typeof churchData.appearance_config === 'object') {
            const config = churchData.appearance_config as Record<string, unknown>;
            if (Array.isArray(config.custom_drum_styles)) {
              config.custom_drum_styles.forEach((item) => {
                if (typeof item === 'string') remoteStyles.push(item);
              });
            }
          }
        }

        if (mounted) {
          const localStyles = getLocalCustomDrumStyles();
          // Merge remote and local
          const mergedCustom = Array.from(
            new Set([...localStyles, ...remoteStyles].map((s) => s.trim()).filter(Boolean))
          );
          setCustomDrumStyles(mergedCustom);
          saveLocalCustomDrumStyles(mergedCustom);
        }
      } catch (err) {
        console.warn('Error al cargar toques de batería remotos:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchRemote();
    return () => {
      mounted = false;
    };
  }, []);

  const songsDrumStyles = useMemo(
    () => (existingSongs ? existingSongs.map((s) => s.drum_style) : []),
    [existingSongs]
  );

  const allDrumStyles = useMemo(
    () => mergeDrumStyles(DEFAULT_DRUM_STYLES, customDrumStyles, songsDrumStyles),
    [customDrumStyles, songsDrumStyles]
  );

  const isCustom = useCallback(
    (style: string) => {
      const lower = style.trim().toLowerCase();
      return !DEFAULT_DRUM_STYLES.some((preset) => preset.toLowerCase() === lower);
    },
    []
  );

  const addDrumStyle = useCallback(
    async (name: string): Promise<string> => {
      const saved = await persistNewDrumStyle(name);
      setCustomDrumStyles((prev) => {
        if (prev.some((s) => s.toLowerCase() === saved.toLowerCase())) return prev;
        const next = [...prev, saved];
        saveLocalCustomDrumStyles(next);
        return next;
      });
      return saved;
    },
    []
  );

  const deleteDrumStyle = useCallback(
    async (name: string): Promise<void> => {
      await deleteCustomDrumStyleRemote(name);
      setCustomDrumStyles((prev) => {
        const next = prev.filter((s) => s.toLowerCase() !== name.toLowerCase());
        saveLocalCustomDrumStyles(next);
        return next;
      });
    },
    []
  );

  return {
    allDrumStyles,
    customDrumStyles,
    defaultDrumStyles: DEFAULT_DRUM_STYLES,
    loading,
    isCustom,
    addDrumStyle,
    deleteDrumStyle,
  };
}
