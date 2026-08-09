import { supabase } from '../../config/supabase';
import type { EditorialDocumentResponse, EditorialSpaceFeed } from './types';

interface RpcErrorLike { code?: string; message?: string }

export const isEditorialSchemaMissing = (error: RpcErrorLike | null): boolean =>
  Boolean(error && (error.code === '42883' || error.code === 'PGRST202' || error.code === 'PGRST205' || error.message?.includes('editorial')));

const clientKey = 'jerusalem-editorial-client-id';
const tokenKey = (documentId: string): string => `jerusalem-editorial-token:${documentId}`;

export function getEditorialClientId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  const existing = window.localStorage.getItem(clientKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(clientKey, created);
  return created;
}

export function getEditorialAccessToken(documentId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(tokenKey(documentId));
}

export async function fetchEditorialSpace(slug: string): Promise<EditorialSpaceFeed | null> {
  const { data, error } = await supabase.rpc('get_editorial_space', { p_slug: slug });
  if (error) throw error;
  return data as EditorialSpaceFeed | null;
}

export async function fetchEditorialDocument(spaceSlug: string, documentId: string): Promise<EditorialDocumentResponse | null> {
  const { data, error } = await supabase.rpc('get_editorial_document', {
    p_space_slug: spaceSlug,
    p_document_id: documentId,
    p_access_token: getEditorialAccessToken(documentId),
  });
  if (error) throw error;
  return data as EditorialDocumentResponse | null;
}

export async function unlockEditorialDocument(documentId: string, password: string): Promise<'success' | 'incorrect' | 'rate_limited' | 'invalid'> {
  const { data, error } = await supabase.rpc('unlock_editorial_document', {
    p_document_id: documentId,
    p_password: password,
    p_client_id: getEditorialClientId(),
  });
  if (error) throw error;
  const result = data as { success?: boolean; reason?: 'incorrect' | 'rate_limited' | 'invalid'; token?: string } | null;
  if (result?.success && result.token) {
    window.sessionStorage.setItem(tokenKey(documentId), result.token);
    return 'success';
  }
  return result?.reason ?? 'invalid';
}

