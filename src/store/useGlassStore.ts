import { create } from "zustand";

export interface GlassSettings {
  blur: number; // in px, e.g. 11
  refraction: number; // opacity background, e.g. 0.12
  depth: number; // inner glow / spread, e.g. 4
  borderOpacity: number; // border specular, e.g. 0.3
  borderRadius: number; // in px, e.g. 16
  shadowOpacity: number; // shadow intensity, e.g. 0.1
  lightAngle: number; // in deg, e.g. 90
  specularHighlight: boolean; // top/left light lines
}

export type GlassVariantKey =
  | "default"
  | "glass"
  | "glass-primary"
  | "glass-gold"
  | "glass-emerald"
  | "glass-rose";

export interface GlassStoreState {
  globalSettings: GlassSettings;
  variantOverrides: Record<string, Partial<GlassSettings>>;
  updateGlobalSettings: (settings: Partial<GlassSettings>) => void;
  updateVariantOverride: (variant: string, settings: Partial<GlassSettings>) => void;
  resetVariantOverride: (variant: string) => void;
  resetToDefaults: () => void;
  syncCSSTokens: () => void;
}

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: 11,
  refraction: 0.12,
  depth: 4,
  borderOpacity: 0.3,
  borderRadius: 16,
  shadowOpacity: 0.1,
  lightAngle: 90,
  specularHighlight: true,
};

const STORAGE_KEY_GLOBAL = "jerusalen_glass_global";
const STORAGE_KEY_VARIANTS = "jerusalen_glass_variants";

const loadSavedGlobal = (): GlassSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GLOBAL);
    if (saved) return { ...DEFAULT_GLASS_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.warn("Failed to load glass global settings", e);
  }
  return DEFAULT_GLASS_SETTINGS;
};

const loadSavedVariants = (): Record<string, Partial<GlassSettings>> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VARIANTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load glass variant overrides", e);
  }
  return {};
};

const applyCSSVariables = (settings: GlassSettings) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--glass-blur", `${settings.blur}px`);
  root.style.setProperty("--glass-refraction", `${settings.refraction}`);
  root.style.setProperty("--glass-depth", `${settings.depth}px`);
  root.style.setProperty("--glass-border-opacity", `${settings.borderOpacity}`);
  root.style.setProperty("--glass-radius", `${settings.borderRadius}px`);
  root.style.setProperty("--glass-shadow-opacity", `${settings.shadowOpacity}`);
  root.style.setProperty("--glass-light-angle", `${settings.lightAngle}deg`);
};

export const useGlassStore = create<GlassStoreState>((set, get) => {
  const initialGlobal = loadSavedGlobal();
  const initialVariants = loadSavedVariants();
  applyCSSVariables(initialGlobal);

  return {
    globalSettings: initialGlobal,
    variantOverrides: initialVariants,

    updateGlobalSettings: (newSettings) => {
      set((state) => {
        const updated = { ...state.globalSettings, ...newSettings };
        try {
          localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to persist glass global settings", e);
        }
        applyCSSVariables(updated);
        return { globalSettings: updated };
      });
    },

    updateVariantOverride: (variant, newSettings) => {
      set((state) => {
        const updatedVariants = {
          ...state.variantOverrides,
          [variant]: { ...state.variantOverrides[variant], ...newSettings },
        };
        try {
          localStorage.setItem(STORAGE_KEY_VARIANTS, JSON.stringify(updatedVariants));
        } catch (e) {
          console.warn("Failed to persist glass variant overrides", e);
        }
        return { variantOverrides: updatedVariants };
      });
    },

    resetVariantOverride: (variant) => {
      set((state) => {
        const updatedVariants = { ...state.variantOverrides };
        delete updatedVariants[variant];
        try {
          localStorage.setItem(STORAGE_KEY_VARIANTS, JSON.stringify(updatedVariants));
        } catch (e) {
          console.warn("Failed to reset glass variant override", e);
        }
        return { variantOverrides: updatedVariants };
      });
    },

    resetToDefaults: () => {
      try {
        localStorage.removeItem(STORAGE_KEY_GLOBAL);
        localStorage.removeItem(STORAGE_KEY_VARIANTS);
      } catch (e) {
        console.warn("Failed to clear glass settings storage", e);
      }
      applyCSSVariables(DEFAULT_GLASS_SETTINGS);
      set({
        globalSettings: DEFAULT_GLASS_SETTINGS,
        variantOverrides: {},
      });
    },

    syncCSSTokens: () => {
      applyCSSVariables(get().globalSettings);
    },
  };
});
