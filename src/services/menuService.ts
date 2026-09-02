import { supabase } from '../config/supabase';

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  order_index: number;
  parent_id?: string | null;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'default-1', label: 'Inicio', url: '/', order_index: 10, is_visible: true, icon: 'Home' },
  { id: 'default-2', label: 'Nosotros', url: '/nosotros', order_index: 20, is_visible: true, icon: 'Info' },
  { id: 'default-3', label: 'Comunidad', url: '#', order_index: 30, is_visible: true, icon: 'Users' },
  { id: 'default-3-1', label: 'Ministerios', url: '/ministerios', order_index: 10, parent_id: 'default-3', is_visible: true, icon: 'Heart' },
  { id: 'default-3-1-b', label: 'Publicaciones 📰', url: '/publicaciones', order_index: 15, parent_id: 'default-3', is_visible: true, icon: 'FileText' },
  { id: 'default-3-2', label: 'Eventos (Calendario)', url: '/eventos', order_index: 20, parent_id: 'default-3', is_visible: true, icon: 'Calendar' },
  { id: 'default-3-2-announcements', label: 'Anuncios importantes', url: '/anuncios', order_index: 25, parent_id: 'default-3', is_visible: true, icon: 'Megaphone' },
  { id: 'default-3-3', label: 'Peticiones', url: '/peticiones', order_index: 30, parent_id: 'default-3', is_visible: true, icon: 'MessageSquare' },
  { id: 'default-3-4', label: 'Cumpleaños 🎂', url: '/cumpleanos', order_index: 40, parent_id: 'default-3', is_visible: true, icon: 'Cake' },
  { id: 'default-3-5', label: 'Misiones 🌍', url: '/misiones', order_index: 50, parent_id: 'default-3', is_visible: true, icon: 'Globe' },
  { id: 'default-3-6', label: 'Quiero servir', url: '/mi-horario', order_index: 60, parent_id: 'default-3', is_visible: true, icon: 'HandHeart' },
  { id: 'default-4', label: 'Recursos', url: '#', order_index: 40, is_visible: true, icon: 'BookOpen' },
  { id: 'default-4-1', label: 'La Santa Biblia', url: '/recursos/biblia', order_index: 10, parent_id: 'default-4', is_visible: true, icon: 'Book' },
  { id: 'default-4-2', label: 'Prédicas', url: '/predicas', order_index: 20, parent_id: 'default-4', is_visible: true, icon: 'Video' },
  { id: 'default-4-3', label: 'Alabanzas e Himnos', url: '/recursos/alabanzas', order_index: 30, parent_id: 'default-4', is_visible: true, icon: 'Music' },
  { id: 'default-4-4', label: 'Programas / Estudios', url: '/programas', order_index: 40, parent_id: 'default-4', is_visible: true, icon: 'GraduationCap' },
  { id: 'default-4-5', label: 'Juegos Bíblicos 🎮', url: '/recursos/juegos', order_index: 50, parent_id: 'default-4', is_visible: true, icon: 'Gamepad2' },
  { id: 'default-5', label: 'Aula Virtual', url: '/aula-virtual', order_index: 50, is_visible: true, icon: 'GraduationCap' },
  { id: 'default-6', label: 'Tienda', url: '/tienda', order_index: 60, is_visible: true, icon: 'ShoppingBag' },
  { id: 'default-7', label: 'Contacto', url: '/contacto', order_index: 70, is_visible: true, icon: 'Mail' }
];

export const menuService = {
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('public_menu_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.warn('Error querying public_menu_items, using default fallback:', error?.message);
        return menuService.deduplicateItems(DEFAULT_MENU_ITEMS);
      }

      if (!data || data.length === 0) {
        // A public read must remain side-effect free. Seeding from the browser
        // creates duplicate writes when the table is empty or RLS blocks them.
        return menuService.deduplicateItems(DEFAULT_MENU_ITEMS);
      }
      
      return menuService.deduplicateItems(data);
    } catch (err) {
      console.warn('Error al obtener elementos del menú, usando fallback:', err);
      return menuService.deduplicateItems(DEFAULT_MENU_ITEMS);
    }
  },

  async seedDefaultMenuItems(): Promise<MenuItem[]> {
    try {
      const topLevelDefaults = DEFAULT_MENU_ITEMS.filter(i => !i.parent_id);
      const insertedTopLevel: MenuItem[] = [];
      const idMap = new Map<string, string>();

      for (const item of topLevelDefaults) {
        const { data, error } = await supabase
          .from('public_menu_items')
          .insert({
            label: item.label,
            url: item.url,
            icon: item.icon,
            order_index: item.order_index,
            is_visible: item.is_visible
          })
          .select()
          .single();

        if (!error && data) {
          insertedTopLevel.push(data);
          idMap.set(item.id, data.id);
        }
      }

      const childDefaults = DEFAULT_MENU_ITEMS.filter(i => i.parent_id);
      const insertedChildren: MenuItem[] = [];

      for (const item of childDefaults) {
        const realParentId = item.parent_id ? idMap.get(item.parent_id) : null;
        const { data, error } = await supabase
          .from('public_menu_items')
          .insert({
            label: item.label,
            url: item.url,
            icon: item.icon,
            order_index: item.order_index,
            parent_id: realParentId,
            is_visible: item.is_visible
          })
          .select()
          .single();

        if (!error && data) {
          insertedChildren.push(data);
        }
      }

      const allInserted = [...insertedTopLevel, ...insertedChildren].sort((a, b) => a.order_index - b.order_index);
      return allInserted.length > 0 ? allInserted : DEFAULT_MENU_ITEMS;
    } catch (err) {
      console.warn('No se pudo poblar la tabla menú por defecto:', err);
      return DEFAULT_MENU_ITEMS;
    }
  },

  deduplicateItems(items: MenuItem[]): MenuItem[] {
    const seen = new Set<string>();
    const result: MenuItem[] = [];

    for (const item of items) {
      const key = `${(item.label || '').trim().toLowerCase()}|${(item.url || '').trim().toLowerCase()}|${item.parent_id || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  },

  async addMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('public_menu_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('La tabla "public_menu_items" no existe en Supabase. Aplica la migración SQL 20260726000000_dynamic_menu.sql.');
      }
      throw error;
    }
    return data;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    if (id.startsWith('default-')) {
      const seeded = await menuService.seedDefaultMenuItems();
      const defaultItem = DEFAULT_MENU_ITEMS.find(i => i.id === id);
      if (defaultItem) {
        const match = seeded.find(i => i.label === defaultItem.label && i.url === defaultItem.url);
        if (match) {
          id = match.id;
        }
      }
    }

    const { data, error } = await supabase
      .from('public_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('La tabla "public_menu_items" no existe en Supabase. Aplica la migración SQL 20260726000000_dynamic_menu.sql.');
      }
      throw error;
    }
    return data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    if (id.startsWith('default-')) {
      const seeded = await menuService.seedDefaultMenuItems();
      const defaultItem = DEFAULT_MENU_ITEMS.find(i => i.id === id);
      if (defaultItem) {
        const match = seeded.find(i => i.label === defaultItem.label && i.url === defaultItem.url);
        if (match) {
          id = match.id;
        }
      }
    }

    const { error } = await supabase
      .from('public_menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('La tabla "public_menu_items" no existe en Supabase. Aplica la migración SQL 20260726000000_dynamic_menu.sql.');
      }
      throw error;
    }
  },

  async updateMenuOrder(items: { id: string; order_index: number; parent_id: string | null }[]): Promise<void> {
    const hasDefaultItems = items.some(i => i.id.startsWith('default-'));
    if (hasDefaultItems) {
      await menuService.seedDefaultMenuItems();
      const currentDb = await menuService.getMenuItems();
      items = items.map(item => {
        if (item.id.startsWith('default-')) {
          const def = DEFAULT_MENU_ITEMS.find(d => d.id === item.id);
          const match = def ? currentDb.find(db => db.label === def.label && db.url === def.url) : null;
          return match ? { ...item, id: match.id } : item;
        }
        return item;
      });
    }

    const results = await Promise.all(
      items.map((item) =>
        supabase
          .from('public_menu_items')
          .update({ order_index: item.order_index, parent_id: item.parent_id })
          .eq('id', item.id)
      )
    );

    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      if (firstError.code === '42P01' || firstError.message?.includes('does not exist')) {
        throw new Error('La tabla "public_menu_items" no existe en Supabase. Aplica la migración SQL 20260726000000_dynamic_menu.sql.');
      }
      throw firstError;
    }
  }
};
