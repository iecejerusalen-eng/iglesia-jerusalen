import { create } from 'zustand';
import { menuService, DEFAULT_MENU_ITEMS } from '../services/menuService';
import type { MenuItem } from '../services/menuService';

interface MenuState {
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchMenu: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
  updateOrder: (newItems: MenuItem[]) => Promise<void>;
  addMenu: (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editMenu: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: DEFAULT_MENU_ITEMS,
  isLoading: false,
  error: null,
  lastFetched: null,

  invalidateCache: () => {
    menuService.invalidateCache();
    set({ lastFetched: null });
  },

  fetchMenu: async (force = false) => {
    const { items, lastFetched, isLoading } = get();
    const now = Date.now();
    const isFresh = !!lastFetched && (now - lastFetched < 10 * 60 * 1000);

    // Evitar sobre-consultas si los datos ya fueron cargados y están frescos
    if (!force && isFresh && items.length > 0 && !isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await menuService.getMenuItems(force);
      set({
        items: data.length > 0 ? data : DEFAULT_MENU_ITEMS,
        isLoading: false,
        lastFetched: now,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar';
      // Keep default menu items on error so navigation never breaks
      set({
        items: get().items.length > 0 ? get().items : DEFAULT_MENU_ITEMS,
        error: msg,
        isLoading: false,
        lastFetched: now,
      });
    }
  },

  updateOrder: async (newItems: MenuItem[]) => {
    // Optimistic update
    const previousItems = get().items;
    set({ items: newItems });
    try {
      const updates = newItems.map((i, index) => ({
        id: i.id,
        order_index: index * 10, // Keep space between orders
        parent_id: i.parent_id || null
      }));
      await menuService.updateMenuOrder(updates);
      // Re-fetch to ensure sync with DB
      await get().fetchMenu(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      // Revert on error
      set({ items: previousItems, error: msg });
    }
  },

  addMenu: async (item) => {
    try {
      const newItem = await menuService.addMenuItem(item);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al añadir';
      set({ error: msg });
      throw err;
    }
  },

  editMenu: async (id, updates) => {
    // Optimistic update
    const previousItems = get().items;
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    }));
    try {
      await menuService.updateMenuItem(id, updates);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al editar';
      // Revert on error
      set({ items: previousItems, error: msg });
      throw err;
    }
  },

  deleteMenu: async (id) => {
    // Optimistic update
    const previousItems = get().items;
    set((state) => ({
      items: state.items.filter((item) => item.id !== id && item.parent_id !== id)
    }));
    try {
      await menuService.deleteMenuItem(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      set({ items: previousItems, error: msg });
      throw err;
    }
  }
}));
