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

const isLocalHost = (hostname: string) => hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname === '::1'
  || /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

const isJoshuaResponse = (value: unknown): value is JoshuaResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.records)
    && typeof candidate.fetchedAt === 'string'
    && candidate.source === 'Joshua Project';
};

export const fetchJoshuaProject = async (request: JoshuaRequest): Promise<JoshuaResponse> => {
  const runningLocally = typeof window !== 'undefined' && isLocalHost(window.location.hostname);
  if (runningLocally && import.meta.env.VITE_JOSHUA_PROJECT_DEV !== 'true') {
    throw new Error('La fuente internacional se habilita en desarrollo con VITE_JOSHUA_PROJECT_DEV=true.');
  }

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
