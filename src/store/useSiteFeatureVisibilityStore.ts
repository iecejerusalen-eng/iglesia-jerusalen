import { create } from 'zustand';
import { supabase } from '../config/supabase';

export type SiteFeatureKey = 'store' | 'classroom' | 'adminOnboarding' | 'toolbox';
export type SiteFeatureVisibility = Record<SiteFeatureKey, boolean>;

const DEFAULT_VISIBILITY: SiteFeatureVisibility = {
  store: false,
  classroom: false,
  adminOnboarding: false,
  toolbox: false,
};

const DATABASE_KEYS: Record<SiteFeatureKey, string> = {
  store: 'store',
  classroom: 'classroom',
  adminOnboarding: 'admin_onboarding',
  toolbox: 'toolbox',
};

interface SiteFeatureVisibilityState {
  visibility: SiteFeatureVisibility;
  isLoaded: boolean;
  load: () => Promise<void>;
  setFeature: (feature: SiteFeatureKey, enabled: boolean) => Promise<void>;
}

export const useSiteFeatureVisibilityStore = create<SiteFeatureVisibilityState>((set) => ({
  visibility: DEFAULT_VISIBILITY,
  isLoaded: false,
  load: async () => {
    const { data, error } = await supabase
      .from('site_feature_visibility')
      .select('feature_key, is_enabled');
    if (error) {
      console.warn('No se pudo cargar la visibilidad; se mantienen todas las herramientas ocultas.', error);
      set({ visibility: DEFAULT_VISIBILITY, isLoaded: true });
      return;
    }
    const visibility = { ...DEFAULT_VISIBILITY };
    for (const row of data ?? []) {
      const feature = (Object.keys(DATABASE_KEYS) as SiteFeatureKey[])
        .find((key) => DATABASE_KEYS[key] === row.feature_key);
      if (feature) visibility[feature] = row.is_enabled === true;
    }
    set({ visibility, isLoaded: true });
  },
  setFeature: async (feature, enabled) => {
    const key = DATABASE_KEYS[feature];
    const { error } = await supabase
      .from('site_feature_visibility')
      .upsert({ feature_key: key, is_enabled: enabled }, { onConflict: 'feature_key' });
    if (error) throw error;
    set((state) => ({ visibility: { ...state.visibility, [feature]: enabled } }));
  },
}));

export function useSiteFeature(feature: SiteFeatureKey): boolean {
  return useSiteFeatureVisibilityStore((state) => state.visibility[feature]);
}

export function getSiteFeatureVisibility(): SiteFeatureVisibility {
  return useSiteFeatureVisibilityStore.getState().visibility;
}
