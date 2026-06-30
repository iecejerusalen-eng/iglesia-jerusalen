import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un número válido' }).min(0, 'El precio no puede ser negativo'),
  discount_price: z.number().optional().nullable().or(z.literal('')),
  promo_tag: z.string().optional().nullable().or(z.literal('')),
  stock: z.number({ message: 'El stock debe ser un número entero' }).int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  type: z.enum(['physical', 'digital'], { message: 'El tipo debe ser Físico (physical) o Digital (digital)' }),
  image_url: z.string().url('Ingresa una URL de imagen válida').or(z.literal('')),
  description: z.string().min(1, 'La descripción es obligatoria'),
  features: z.string().optional(),
  drive_link: z.string().url('Ingresa una URL de Google Drive válida').or(z.literal('')),
  instructions: z.string().optional(),
});

export type ProductForm = z.infer<typeof productSchema>;

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price?: number | null;
  promo_tag?: string | null;
  image_url: string | null;
  stock: number;
  category: string;
  type?: 'physical' | 'digital';
  features?: any;
  cover_image_url?: string | null;
  created_at: string;
}

export interface FormVariant {
  id?: string;
  color_name: string;
  color_hex: string;
  size: string;
  cloudinary_image_url: string;
  stock: number;
  price_adjustment: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'inactive';
  kyc_tax_id_status: 'pending' | 'approved' | 'rejected';
  kyc_bank_status: 'pending' | 'approved' | 'rejected';
  kyc_agreement_status: 'pending' | 'approved' | 'rejected';
  kyc_notes: string | null;
  created_at?: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  user_id: string | null;
  type: 'fraud_suspicion' | 'broken_item' | 'wrong_item' | 'not_received' | 'other';
  description: string;
  status: 'open' | 'under_investigation' | 'resolved' | 'dismissed';
  resolution_notes: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string };
  orders?: { id: string; total: number; customer_name: string };
}

export interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}
