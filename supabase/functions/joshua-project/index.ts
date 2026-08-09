import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';

type JoshuaResource = 'daily' | 'totals' | 'countries' | 'people-groups' | 'languages';
type JsonRecord = Record<string, unknown>;

interface JoshuaRequest {
  resource: JoshuaResource;
  page?: number;
  limit?: number;
  search?: string;
  continent?: string;
  country?: string;
}

const RESOURCE_PATHS: Record<JoshuaResource, string> = {
  daily: 'people_groups/daily_unreached.json',
  totals: 'totals.json',
  countries: 'countries.json',
  'people-groups': 'people_groups.json',
  languages: 'languages.json',
};

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'https://iglesia-jerusalen.vercel.app',
]);

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = allowedOrigins.has(origin) || origin.endsWith('.vercel.app')
    ? origin
    : 'https://iglesia-jerusalen.vercel.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

const asRecord = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value)
  ? value as JsonRecord
  : {};

const firstValue = (record: JsonRecord, keys: string[]): unknown => {
  for (const key of keys) if (record[key] != null && record[key] !== '') return record[key];
  return undefined;
};

const asText = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replaceAll(',', '').replace('%', ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const SPANISH_TERMS: Record<string, string> = {
  Africa: 'África', Asia: 'Asia', Europe: 'Europa', Oceania: 'Oceanía',
  'North America': 'América del Norte', 'South America': 'América del Sur',
  Christianity: 'Cristianismo', Islam: 'Islam', Hinduism: 'Hinduismo',
  Buddhism: 'Budismo', 'Ethnic Religions': 'Religiones étnicas',
  'Non-Religious': 'Sin afiliación religiosa', Judaism: 'Judaísmo',
};

const toSpanishTerm = (value: unknown): string | undefined => {
  const text = asText(value);
  return text ? SPANISH_TERMS[text] || text : undefined;
};

const normalizeRecord = (record: JsonRecord, index: number) => {
  const id = asText(firstValue(record, ['PeopleID3', 'PeopleID1', 'ROG3', 'ROL3', 'ContinentCode', 'id', 'ID'])) || `registro-${index + 1}`;
  const name = asText(firstValue(record, [
    'PeopNameInCountry', 'PeopNameAcrossCountries', 'Ctry', 'Country', 'Language',
    'PrimaryLanguageName', 'Continent', 'RegionName', 'Name', 'name', 'TotalName',
  ])) || 'Registro sin nombre';

  const attributes: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      attributes[key] = value;
    }
  }

  return {
    id,
    name,
    country: asText(firstValue(record, ['Ctry', 'Country', 'CountryName'])),
    continent: toSpanishTerm(firstValue(record, ['Continent', 'ContinentName'])),
    region: toSpanishTerm(firstValue(record, ['RegionName', 'Region'])),
    language: asText(firstValue(record, ['PrimaryLanguageName', 'Language', 'LangName'])),
    religion: toSpanishTerm(firstValue(record, ['PrimaryReligion', 'Religion'])),
    population: asNumber(firstValue(record, ['Population', 'WorldPopulation', 'PoplPeop', 'PopulationTotal'])),
    unreachedPopulation: asNumber(firstValue(record, ['PopulationUnreached', 'PoplUnreached'])),
    peopleGroups: asNumber(firstValue(record, ['PeopleGroups', 'CountPeoples', 'PeopleGroupsTotal'])),
    unreachedGroups: asNumber(firstValue(record, ['UnreachedGroups', 'CountUnreached', 'PeopleGroupsUnreached'])),
    evangelicalPercent: asNumber(firstValue(record, ['PercentEvangelical', 'PercentEvangelicalRange'])),
    christianPercent: asNumber(firstValue(record, ['PercentAdherents', 'PercentChristianAdherents'])),
    progressScale: asNumber(firstValue(record, ['JPScale', 'ProgressScale'])),
    photoUrl: asText(firstValue(record, ['PhotoAddress', 'PhotoURL'])),
    sourceUrl: 'https://joshuaproject.net/',
    attributes,
  };
};

const parseRows = (payload: unknown): JsonRecord[] => {
  if (Array.isArray(payload)) return payload.map(asRecord);
  const record = asRecord(payload);
  for (const key of ['data', 'results', 'records']) {
    if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
  }
  return Object.keys(record).length ? [record] : [];
};

const errorResponse = (message: string, status: number, headers: Record<string, string>) => new Response(
  JSON.stringify({ error: message }),
  { status, headers: { ...headers, 'Content-Type': 'application/json' } },
);

serve(async (request: Request) => {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return errorResponse('Método no permitido.', 405, corsHeaders);

  try {
    const body = asRecord(await request.json()) as Partial<JoshuaRequest>;
    if (!body.resource || !(body.resource in RESOURCE_PATHS)) {
      return errorResponse('Recurso de Joshua Project no permitido.', 400, corsHeaders);
    }

    const resource = body.resource;
    const page = Math.max(1, Math.min(500, Math.trunc(Number(body.page) || 1)));
    const limit = Math.max(1, Math.min(24, Math.trunc(Number(body.limit) || 12)));
    const search = asText(body.search)?.slice(0, 80).toLocaleLowerCase('es') || '';
    const cacheKey = `${resource}:${page}:${limit}:${search}:${asText(body.continent) || ''}:${asText(body.country) || ''}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return errorResponse('El caché del servidor no está configurado.', 503, corsHeaders);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: cached, error: cacheReadError } = await admin
      .from('joshua_project_cache')
      .select('payload, fetched_at, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (cacheReadError) throw new Error(`No se pudo leer el caché: ${cacheReadError.message}`);
    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(JSON.stringify({ ...asRecord(cached.payload), cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
      });
    }

    const apiKey = Deno.env.get('JOSHUA_PROJECT_API_KEY');
    if (!apiKey) return errorResponse('La integración espera una nueva clave en JOSHUA_PROJECT_API_KEY.', 503, corsHeaders);

    const endpoint = new URL(`https://api.joshuaproject.net/v1/${RESOURCE_PATHS[resource]}`);
    endpoint.searchParams.set('api_key', apiKey);
    endpoint.searchParams.set('page', String(page));
    endpoint.searchParams.set('limit', String(limit));

    const upstream = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
    if (!upstream.ok) throw new Error(`Joshua Project respondió HTTP ${upstream.status}.`);
    const upstreamPayload: unknown = await upstream.json();
    let records = parseRows(upstreamPayload).map(normalizeRecord);
    if (search) {
      records = records.filter((record) => `${record.name} ${record.country || ''} ${record.language || ''} ${record.religion || ''}`.toLocaleLowerCase('es').includes(search));
    }

    const responsePayload = {
      resource,
      records,
      page,
      limit,
      fetchedAt: new Date().toISOString(),
      cached: false,
      source: 'Joshua Project' as const,
    };

    const { error: cacheWriteError } = await admin.from('joshua_project_cache').upsert({
      cache_key: cacheKey,
      payload: responsePayload,
      fetched_at: responsePayload.fetchedAt,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    });
    if (cacheWriteError) throw new Error(`No se pudo actualizar el caché: ${cacheWriteError.message}`);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
    });
  } catch (error: unknown) {
    console.error('joshua-project failed', error);
    const message = error instanceof Error ? error.message : 'Error desconocido en la integración.';
    return errorResponse(message, 502, corsHeaders);
  }
});
