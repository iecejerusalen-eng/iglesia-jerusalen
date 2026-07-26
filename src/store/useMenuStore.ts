import { create } from 'zustand';
import { menuService } from '../services/menuService';
import type { MenuItem } from '../services/menuService';

interface MenuState {
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  updateOrder: (newItems: MenuItem[]) => Promise<void>;
  addMenu: (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editMenu: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await menuService.getMenuItems();
      set({ items: data, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar';
      set({ error: msg, isLoading: false });
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
      await get().fetchMenu();
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
