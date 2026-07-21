import { z } from 'zod';
import type { Member as DbMember, CatalogRole } from '../../../types';

export const CHURCH_COORDS = { lat: -2.139188, lng: -79.5949891 };

export const parseCoordinates = (text: string) => {
  if (!text) return null;
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const qMatch = text.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  const embedMatch = text.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (embedMatch) {
    return { lat: parseFloat(embedMatch[2]), lng: parseFloat(embedMatch[1]) };
  }

  const genericMatch = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
};

export const memberSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  photo_url: z.string().url('Ingresa una URL de foto válida').or(z.literal('')),
  birth_date: z.string().or(z.literal('')),
  conversion_date: z.string().or(z.literal('')),
  baptism_date: z.string().or(z.literal('')),
  phone: z.string().or(z.literal('')),
  phone_country_code: z.string().optional(),
  dni: z.string().or(z.literal('')),
  address: z.string().or(z.literal('')),
  maps_link: z.string().or(z.literal('')),
  latitude: z.number().optional().nullable().or(z.literal('')),
  longitude: z.number().optional().nullable().or(z.literal('')),
  is_leader: z.boolean(),
  leadership_role: z.string().or(z.literal('')),
  ministry_id: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  tithes_sum: z.number({ message: 'El diezmo debe ser un número válido' }).min(0, 'El diezmo no puede ser negativo').or(z.nan()).transform((val) => isNaN(val) ? 0 : val),
  emails: z.array(z.object({
    email: z.string().email('Por favor ingresa un correo válido')
  })).min(1, 'Debes ingresar al menos un correo electrónico'),
  education_level: z.string().nullable().optional().or(z.literal('')),
  career_id: z.string().nullable().optional().or(z.literal('')),
  is_studying: z.boolean().optional(),
  studying_career_id: z.string().nullable().optional().or(z.literal('')),
  dedicated_verse: z.string().optional().nullable().or(z.literal('')),
  gender: z.enum(['Masculino', 'Femenino', 'Otro']).nullable().optional().or(z.literal('')),
  marital_status: z.string().nullable().optional().or(z.literal('')),
  birth_place: z.string().nullable().optional().or(z.literal('')),
  has_disability: z.boolean().optional(),
  disability_types: z.array(z.string()).nullable().optional(),
  additional_phones: z.array(z.object({
    phone: z.string(),
    phone_country_code: z.string().optional()
  })).optional(),
});

export type MemberForm = z.infer<typeof memberSchema>;

export interface MinistryData {
  id: string;
  name: string;
}

export interface Career {
  id: string;
  name: string;
}

export interface MemberWithRelations extends DbMember {
  member_emails?: { email: string }[];
  member_phones?: { phone: string, country_code: string }[];
  member_service_areas?: { catalog_roles: CatalogRole }[];
  member_talents?: Array<{ catalog_roles: CatalogRole }>;
  member_spiritual_gifts?: Array<{ catalog_roles: CatalogRole }>;
  ministries?: { id: string; name: string } | null;
  catalog_roles?: CatalogRole | null;
  careers?: { id: string; name: string } | null;
  studying_careers?: { id: string; name: string } | null;
  profiles?: Array<{ id: string; email: string; role: string }>;
}

export interface LocalMemberRow {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  conversion_date?: string | null;
  baptism_date?: string | null;
  phone?: string | null;
  phone_country_code?: string | null;
  dni?: string | null;
  address?: string | null;
  maps_link?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_leader: number;
  leadership_role?: string | null;
  ministry_id?: string | null;
  role_id?: string | null;
  marital_status?: string | null;
  gender?: string | null;
  birth_place?: string | null;
  has_disability?: number; // SQLite stores booleans as 0/1
  disability_types?: string | null; // SQLite stores arrays as JSON string
  tithes_sum?: number;
  education_level?: string | null;
  career_id?: string | null;
  is_studying: number;
  studying_career_id?: string | null;
  deleted_at?: string | null;
  emails: string; // JSON string
  phones: string; // JSON string
  service_areas: string; // JSON string
  talents?: string;
  spiritual_gifts?: string;
}
