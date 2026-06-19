import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant } from '../types';

export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, variant = null, quantity = 1) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(item => 
          item.product.id === product.id && 
          ((!item.variant && !variant) || (item.variant?.id === variant?.id))
        );
        
        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingItemIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...currentItems, { product, variant, quantity }] });
        }
      },
      
      removeItem: (productId, variantId = null) => {
        const currentItems = get().items;
        set({ 
          items: currentItems.filter(item => 
            !(item.product.id === productId && 
              ((!item.variant && !variantId) || (item.variant?.id === variantId))
            )
          ) 
        });
      },
      
      updateQuantity: (productId, variantId = null, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        const currentItems = get().items;
        const newItems = currentItems.map(item => 
          (item.product.id === productId && 
           ((!item.variant && !variantId) || (item.variant?.id === variantId))) 
            ? { ...item, quantity } 
            : item
        );
        set({ items: newItems });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const basePrice = Number(item.product.price) || 0;
          const adjustment = item.variant?.price_adjustment ? Number(item.variant.price_adjustment) : 0;
          return total + ((basePrice + adjustment) * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'iglesia-jerusalen-cart', // Nombre de la clave en localStorage
    }
  )
);
