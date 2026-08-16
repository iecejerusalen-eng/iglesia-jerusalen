import { supabase } from '../../config/supabase';
import type { JoshuaResource, JoshuaResponse } from './types';

interface JoshuaRequest {
  resource: JoshuaResource;
  page?: number;
  limit?: number;
  search?: string;
  continent?: string;
  country?: string;
}

const isJoshuaResponse = (value: unknown): value is JoshuaResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.records)
    && typeof candidate.fetchedAt === 'string'
    && candidate.source === 'Joshua Project';
};

export const fetchJoshuaProject = async (request: JoshuaRequest): Promise<JoshuaResponse> => {
  const { data, error } = await supabase.functions.invoke('joshua-project', { body: request });

  if (error) {
    console.warn('La fuente internacional de Joshua Project no está disponible:', error);
    throw new Error('No se pudo contactar la fuente internacional. Verifica que la función segura esté desplegada.');
  }
  if (!isJoshuaResponse(data)) throw new Error('Joshua Project devolvió una respuesta con formato inesperado.');

  return data;
};

export const formatMissionNumber = (value?: number) => {
  if (value == null || !Number.isFinite(value)) return 'No disponible';
  return new Intl.NumberFormat('es-EC', { notation: value >= 1_000_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
};
