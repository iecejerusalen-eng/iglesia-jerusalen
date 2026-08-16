import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';

export type Theme = 'light' | 'dark' | 'system';
export type SidebarViewMode = 'full' | 'compact' | 'floating' | 'drawer';
export type SidebarMenuMode = 'list' | 'cards_grouped' | 'cards_ungrouped' | 'grid';
export type SidebarGridSort = 'name' | 'category' | 'custom';
export type SidebarAccordionMode = 'single' | 'multiple' | 'all_open';

export interface GlobalUIEffects {
  glassmorphism: boolean;
  blurIntensity: 'low' | 'medium' | 'high';
  animations: boolean;
  defaultTableView: 'table' | 'grid' | 'list';
}

export interface AdminPreferences {
  theme?: Theme;
  sidebarMode?: SidebarViewMode;
  accentColor?: string;
  sidebarMenuMode?: SidebarMenuMode;
  sidebarAccordionMode?: SidebarAccordionMode;
  sidebarDefaultClosed?: boolean;
  sidebarGridColumns?: number;
  sidebarGridSort?: SidebarGridSort;
  sidebarCustomOrder?: string[];
  globalEffects?: Partial<GlobalUIEffects>;
}

interface ThemeState {
  theme: Theme;
  sidebarViewMode: SidebarViewMode;
  accentColor: string;
  sidebarMenuMode: SidebarMenuMode;
  sidebarAccordionMode: SidebarAccordionMode;
  sidebarDefaultClosed: boolean;
  sidebarGridColumns: number;
  sidebarGridSort: SidebarGridSort;
  sidebarCustomOrder: string[];
  globalEffects: GlobalUIEffects;
  setTheme: (theme: Theme) => void;
  setSidebarViewMode: (mode: SidebarViewMode) => void;
  setSidebarMenuMode: (mode: SidebarMenuMode) => void;
  setSidebarAccordionMode: (mode: SidebarAccordionMode) => void;
  setSidebarDefaultClosed: (closed: boolean) => void;
  setSidebarGridColumns: (cols: number) => void;
  setSidebarGridSort: (sort: SidebarGridSort) => void;
  setSidebarCustomOrder: (order: string[]) => void;
  setGlobalEffects: (effects: Partial<GlobalUIEffects>) => void;
  setAccentColor: (color: string) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  setAdminPreferences: (prefs: AdminPreferences) => void;
  syncToDatabase: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarViewMode: 'full',
      accentColor: '#0f172a', // slate-900 por defecto
      sidebarMenuMode: 'list',
      sidebarAccordionMode: 'multiple',
      sidebarDefaultClosed: true,
      sidebarGridColumns: 3,
      sidebarGridSort: 'category',
      sidebarCustomOrder: [],
      globalEffects: {
        glassmorphism: true,
        blurIntensity: 'medium',
        animations: true,
        defaultTableView: 'table'
      },
      setSidebarViewMode: (mode) => {
        set({ sidebarViewMode: mode });
        get().syncToDatabase();
      },
      setSidebarMenuMode: (mode) => {
        set({ sidebarMenuMode: mode });
        get().syncToDatabase();
      },
      setSidebarAccordionMode: (mode) => {
        set({ sidebarAccordionMode: mode });
        get().syncToDatabase();
      },
      setSidebarDefaultClosed: (closed) => {
        set({ sidebarDefaultClosed: closed });
        get().syncToDatabase();
      },
      setSidebarGridColumns: (cols) => {
        set({ sidebarGridColumns: cols });
        get().syncToDatabase();
      },
      setSidebarGridSort: (sort) => {
        set({ sidebarGridSort: sort });
        get().syncToDatabase();
      },
      setSidebarCustomOrder: (order) => {
        set({ sidebarCustomOrder: order });
        get().syncToDatabase();
      },
      setGlobalEffects: (effects) => {
        set((state) => ({ globalEffects: { ...state.globalEffects, ...effects } }));
        get().syncToDatabase();
      },
      setAccentColor: (color) => {
        set({ accentColor: color });
        get().syncToDatabase();
      },
      setTheme: (theme) => {
        set({ theme });
        get().syncToDatabase();
        
        // Apply to DOM immediately
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        
        const effectiveTheme = theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
          
        root.classList.add(effectiveTheme);
      },
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
      },
      setAdminPreferences: (prefs: AdminPreferences) => {
        const updates: Partial<ThemeState> = {};
        if (prefs.theme) updates.theme = prefs.theme;
        if (prefs.sidebarMode) updates.sidebarViewMode = prefs.sidebarMode;
        if (prefs.accentColor) updates.accentColor = prefs.accentColor;
        if (prefs.sidebarMenuMode) updates.sidebarMenuMode = prefs.sidebarMenuMode;
        if (prefs.sidebarAccordionMode) updates.sidebarAccordionMode = prefs.sidebarAccordionMode;
        if (prefs.sidebarDefaultClosed !== undefined) updates.sidebarDefaultClosed = prefs.sidebarDefaultClosed;
        if (prefs.sidebarGridColumns) updates.sidebarGridColumns = prefs.sidebarGridColumns;
        if (prefs.sidebarGridSort) updates.sidebarGridSort = prefs.sidebarGridSort;
        if (prefs.sidebarCustomOrder) updates.sidebarCustomOrder = prefs.sidebarCustomOrder;
        
        // Convert old boolean string formats if needed (legacy edge case, but safe)
        if (prefs.globalEffects) {
           updates.globalEffects = { ...get().globalEffects, ...prefs.globalEffects };
        }

        if (Object.keys(updates).length > 0) {
          set(updates);
          
          if (updates.theme) {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            const effectiveTheme = updates.theme === 'system' 
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
              : updates.theme;
            root.classList.add(effectiveTheme);
          }
        }
      },
      syncToDatabase: async () => {
        const state = get();
        const prefs: AdminPreferences = {
          theme: state.theme,
          sidebarMode: state.sidebarViewMode,
          accentColor: state.accentColor,
          sidebarMenuMode: state.sidebarMenuMode,
          sidebarAccordionMode: state.sidebarAccordionMode,
          sidebarDefaultClosed: state.sidebarDefaultClosed,
          sidebarGridColumns: state.sidebarGridColumns,
          sidebarGridSort: state.sidebarGridSort,
          sidebarCustomOrder: state.sidebarCustomOrder,
          globalEffects: state.globalEffects,
        };
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          await supabase.from('profiles').update({
            admin_preferences: prefs
          }).eq('id', sessionData.session.user.id);
        }
      }
    }),
    {
      name: 'jerusalen-theme',
    }
  )
);
