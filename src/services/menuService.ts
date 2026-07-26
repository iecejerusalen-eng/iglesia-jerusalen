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

export const menuService = {
  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('public_menu_items')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
    
    return data || [];
  },

  async addMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('public_menu_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('public_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('public_menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateMenuOrder(items: { id: string; order_index: number; parent_id: string | null }[]): Promise<void> {
    // Supabase doesn't have a bulk update for different values yet without RPC, 
    // but for a small menu, a Promise.all is sufficient.
    await Promise.all(
      items.map((item) =>
        supabase
          .from('public_menu_items')
          .update({ order_index: item.order_index, parent_id: item.parent_id })
          .eq('id', item.id)
      )
    );
  }
};
