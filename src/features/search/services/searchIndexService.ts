import { supabase } from '../../../config/supabase';
import { SITE_NAVIGATION_ITEMS } from '../../../config/siteNavigationIndex';
import type { CustomSearchLink, SearchIndexItem, SearchAggregatedResults, ParsedBibleReference } from '../types';
import { slugifySongTitle } from '../../songs/utils/musicEngine';

// Cache TTL: 5 minutes in memory
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedIndex {
  timestamp: number;
  items: SearchIndexItem[];
  customLinks: CustomSearchLink[];
}

let memoryIndexCache: CachedIndex | null = null;
let isPreloading = false;

function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function escapeIlikeTerm(value: string): string {
  return value.trim().slice(0, 80).replace(/[(),]/g, ' ').replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Convierte un elemento de navegación estática a SearchIndexItem
 */
function staticToSearchItem(item: (typeof SITE_NAVIGATION_ITEMS)[number]): SearchIndexItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    path: item.path,
    category: item.category,
    keywords: item.keywords.map(normalizeSearchString),
    icon: item.icon,
    badge: item.badge,
    isExternal: item.external,
    source: 'static_route',
  };
}

/**
 * Pre-carga y mantiene en memoria el índice dinámico y rápido
 */
export async function preloadSearchIndex(forceRefresh = false): Promise<SearchIndexItem[]> {
  const now = Date.now();
  if (!forceRefresh && memoryIndexCache && (now - memoryIndexCache.timestamp) < CACHE_TTL_MS) {
    return memoryIndexCache.items;
  }

  if (isPreloading && memoryIndexCache) {
    return memoryIndexCache.items;
  }

  isPreloading = true;

  try {
    const staticItems: SearchIndexItem[] = SITE_NAVIGATION_ITEMS.map(staticToSearchItem);
    const dynamicItems: SearchIndexItem[] = [];

    // Consultas concurrentes a tablas dinámicas principales para pre-indexación rápida
    const [
      sermonsRes,
      coursesRes,
      editorialRes,
      ministriesRes,
      formsRes,
      changelogRes,
      settingsRes
    ] = await Promise.allSettled([
      supabase.from('sermons').select('id, title, pastor_name, date, description').order('date', { ascending: false }).limit(30),
      supabase.from('lms_courses').select('id, title, description').limit(20),
      supabase.from('editorial_spaces').select('id, name, slug, description').limit(20),
      supabase.from('ministries').select('id, name, slug, description').limit(20),
      supabase.from('dynamic_forms').select('id, title, slug, description').limit(15),
      supabase.from('changelog_versiones').select('id, version, titulo, resumen, fecha_lanzamiento').eq('estado', 'publicado').order('fecha_lanzamiento', { ascending: false }).limit(15),
      supabase.from('church_settings').select('appearance_config').limit(1).maybeSingle(),
    ]);

    // 1. Sermones y Prédicas
    if (sermonsRes.status === 'fulfilled' && sermonsRes.value.data) {
      for (const sermon of sermonsRes.value.data) {
        const pastorStr = sermon.pastor_name ? `Pastor ${sermon.pastor_name}` : 'Prédica';
        const formattedDate = sermon.date ? new Date(sermon.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        dynamicItems.push({
          id: `sermon-${sermon.id}`,
          title: sermon.title,
          subtitle: `${pastorStr} · ${formattedDate}`,
          path: `/predicas/${sermon.id}`,
          category: 'predicas',
          keywords: [normalizeSearchString(sermon.title), normalizeSearchString(pastorStr), 'predica', 'sermon', 'video'],
          source: 'sermon',
          meta: { pastor: sermon.pastor_name, date: sermon.date }
        });
      }
    }

    // 2. Cursos del Aula Virtual (LMS)
    if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
      for (const course of coursesRes.value.data) {
        dynamicItems.push({
          id: `course-${course.id}`,
          title: course.title,
          subtitle: course.description?.slice(0, 90) || 'Curso de formación bíblica y discipulado',
          path: `/aula-virtual`,
          category: 'formacion',
          keywords: [normalizeSearchString(course.title), 'curso', 'aula virtual', 'lms', 'discipulado', 'formacion'],
          badge: 'CURSO',
          source: 'course',
        });
      }
    }

    // 3. Espacios Editoriales y Artículos
    if (editorialRes.status === 'fulfilled' && editorialRes.value.data) {
      for (const space of editorialRes.value.data) {
        dynamicItems.push({
          id: `editorial-${space.id}`,
          title: space.name,
          subtitle: space.description?.slice(0, 90) || 'Espacio editorial y lecturas cristianas',
          path: `/publicaciones/${space.slug}`,
          category: 'publicaciones',
          keywords: [normalizeSearchString(space.name), 'editorial', 'blog', 'lecturas', 'articulos', 'devocional'],
          badge: 'BLOG',
          source: 'editorial_space',
        });
      }
    }

    // 4. Ministerios y Departamentos
    if (ministriesRes.status === 'fulfilled' && ministriesRes.value.data) {
      for (const min of ministriesRes.value.data) {
        dynamicItems.push({
          id: `ministry-${min.id}`,
          title: min.name,
          subtitle: min.description?.replace(/<[^>]*>/g, '').slice(0, 90) || 'Ministerio de la iglesia',
          path: `/ministerios/${min.slug}`,
          category: 'ministerios',
          keywords: [normalizeSearchString(min.name), 'ministerio', 'departamento', 'directiva', 'grupo'],
          source: 'ministry',
        });
      }
    }

    // 5. Formularios Dinámicos
    if (formsRes.status === 'fulfilled' && formsRes.value.data) {
      for (const form of formsRes.value.data) {
        dynamicItems.push({
          id: `form-${form.id}`,
          title: form.title,
          subtitle: form.description?.slice(0, 90) || 'Formulario de registro y participación',
          path: `/formularios/${form.id}`,
          category: 'formularios',
          keywords: [normalizeSearchString(form.title), 'formulario', 'inscripcion', 'registro', 'participacion'],
          badge: 'FORM',
          source: 'dynamic_form',
        });
      }
    }

    // 6. Versiones de Novedades (Changelog)
    if (changelogRes.status === 'fulfilled' && changelogRes.value.data) {
      for (const ver of changelogRes.value.data) {
        dynamicItems.push({
          id: `changelog-${ver.id}`,
          title: `${ver.version} — ${ver.titulo}`,
          subtitle: ver.resumen?.slice(0, 100) || `Lanzamiento oficial ${ver.fecha_lanzamiento}`,
          path: `/novedades/${encodeURIComponent(ver.version)}`,
          category: 'novedades',
          keywords: [normalizeSearchString(ver.version), normalizeSearchString(ver.titulo), 'changelog', 'novedades', 'version', 'actualizacion'],
          badge: ver.version,
          source: 'changelog',
        });
      }
    }

    // 7. Enlaces Personalizados desde church_settings
    let customLinks: CustomSearchLink[] = [];
    if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.appearance_config) {
      const config = settingsRes.value.data.appearance_config as Record<string, unknown>;
      if (Array.isArray(config.custom_search_links)) {
        customLinks = (config.custom_search_links as CustomSearchLink[]).filter(link => link && link.is_active !== false);
        for (const link of customLinks) {
          dynamicItems.push({
            id: `custom-link-${link.id}`,
            title: link.title,
            subtitle: link.subtitle || 'Enlace directo recomendado',
            path: link.url,
            category: link.category || 'destacados',
            keywords: (link.keywords || []).map(normalizeSearchString).concat([normalizeSearchString(link.title)]),
            badge: link.badge || 'DESTACADO',
            isExternal: link.is_external || link.url.startsWith('http'),
            source: 'custom_link',
          });
        }
      }
    }

    const mergedItems = [...staticItems, ...dynamicItems];

    memoryIndexCache = {
      timestamp: now,
      items: mergedItems,
      customLinks,
    };

    return mergedItems;
  } catch (err) {
    console.warn('Error al precargar el índice de búsqueda:', err);
    return SITE_NAVIGATION_ITEMS.map(staticToSearchItem);
  } finally {
    isPreloading = false;
  }
}

/**
 * Búsqueda instantánea en el índice local pre-cargado (0 ms de latencia)
 */
export function searchLocalIndex(query: string, items?: SearchIndexItem[]): SearchIndexItem[] {
  const index = items || (memoryIndexCache ? memoryIndexCache.items : SITE_NAVIGATION_ITEMS.map(staticToSearchItem));
  const cleanQ = normalizeSearchString(query);
  if (!cleanQ) return index;

  const terms = cleanQ.split(/\s+/).filter(Boolean);

  return index.filter(item => {
    const titleNorm = normalizeSearchString(item.title);
    const subtitleNorm = normalizeSearchString(item.subtitle || '');
    const pathNorm = normalizeSearchString(item.path);

    return terms.every(term => 
      titleNorm.includes(term) ||
      subtitleNorm.includes(term) ||
      pathNorm.includes(term) ||
      item.keywords.some(k => k.includes(term))
    );
  });
}

/**
 * Consulta profunda a Supabase para canciones, eventos, anuncios y productos
 */
export async function searchDeepSupabase(rawQuery: string): Promise<Partial<SearchAggregatedResults>> {
  const q = escapeIlikeTerm(rawQuery);
  if (!q) {
    return {
      songs: [],
      events: [],
      products: [],
      schedules: [],
      announcements: [],
      sermons: [],
      changelog: [],
    };
  }

  try {
    const [
      songsRes,
      eventsRes,
      productsRes,
      schedulesRes,
      announcementsRes,
      sermonsRes,
      changelogRes,
      coursesRes,
      editorialRes
    ] = await Promise.all([
      supabase.from('songs').select('id, title, artist, lyrics, slug').or(`title.ilike.%${q}%,lyrics.ilike.%${q}%`).limit(5),
      supabase.from('events').select('id, title, description, start_date, start_time, emoji').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
      supabase.from('products').select('id, name, description, price, category').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
      supabase.from('schedules').select('id, title, day, time_range, description').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(3),
      supabase.from('church_announcements').select('id, title, summary, body').eq('status', 'published').or(`title.ilike.%${q}%,summary.ilike.%${q}%,body.ilike.%${q}%`).limit(3),
      supabase.from('sermons').select('id, title, pastor_name, date, description').or(`title.ilike.%${q}%,pastor_name.ilike.%${q}%,description.ilike.%${q}%`).order('date', { ascending: false }).limit(4),
      supabase.from('changelog_versiones').select('id, version, titulo, resumen, fecha_lanzamiento').eq('estado', 'publicado').or(`version.ilike.%${q}%,titulo.ilike.%${q}%,resumen.ilike.%${q}%`).order('fecha_lanzamiento', { ascending: false }).limit(3),
      supabase.from('lms_courses').select('id, title, description').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(3),
      supabase.from('editorial_spaces').select('id, name, slug, description').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(3),
    ]);

    const songs: SearchIndexItem[] = (songsRes.data ?? []).map((song) => ({
      id: `song-${song.id}`,
      title: song.title,
      subtitle: `${song.artist ? `Por ${song.artist} — ` : ''}${song.lyrics.replace(/\[.*?\]/g, '').slice(0, 75)}...`,
      path: `/recursos/alabanzas/${song.slug || slugifySongTitle(song.title)}`,
      category: 'alabanzas',
      keywords: [normalizeSearchString(song.title), normalizeSearchString(song.artist || '')],
      source: 'song',
    }));

    const events: SearchIndexItem[] = (eventsRes.data ?? []).map((ev) => {
      const dateStr = new Date(ev.start_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      const timeStr = ev.start_time ? ` - ${ev.start_time.slice(0, 5)}` : '';
      return {
        id: `event-${ev.id}`,
        title: `${ev.emoji ? `${ev.emoji} ` : ''}${ev.title}`,
        subtitle: `${dateStr}${timeStr}`,
        path: `/eventos#${ev.id}`,
        category: 'eventos',
        keywords: [normalizeSearchString(ev.title), normalizeSearchString(ev.description || '')],
        source: 'event',
      };
    });

    const products: SearchIndexItem[] = (productsRes.data ?? []).map((p) => ({
      id: `prod-${p.id}`,
      title: p.name,
      subtitle: `$${p.price.toFixed(2)} — ${p.category}`,
      path: '/tienda',
      category: 'tienda',
      keywords: [normalizeSearchString(p.name), normalizeSearchString(p.category || '')],
      source: 'product',
    }));

    const schedules: SearchIndexItem[] = (schedulesRes.data ?? []).map((sch) => ({
      id: `sch-${sch.id}`,
      title: sch.title,
      subtitle: `${sch.day} — ${sch.time_range}`,
      path: '/#schedules',
      category: 'horarios',
      keywords: [normalizeSearchString(sch.title), normalizeSearchString(sch.day)],
      source: 'schedule',
    }));

    const announcements: SearchIndexItem[] = (announcementsRes.data ?? []).map((an) => ({
      id: `an-${an.id}`,
      title: an.title,
      subtitle: an.summary || an.body.replace(/<[^>]*>/g, '').slice(0, 80),
      path: `/anuncios#${an.id}`,
      category: 'anuncios',
      keywords: [normalizeSearchString(an.title), normalizeSearchString(an.summary || '')],
      source: 'announcement',
    }));

    const sermons: SearchIndexItem[] = (sermonsRes.data ?? []).map((s) => ({
      id: `sermon-${s.id}`,
      title: s.title,
      subtitle: `${s.pastor_name ? `Pastor ${s.pastor_name} · ` : ''}${s.date ? new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}`,
      path: `/predicas/${s.id}`,
      category: 'predicas',
      keywords: [normalizeSearchString(s.title), normalizeSearchString(s.pastor_name || '')],
      source: 'sermon',
    }));

    const changelog: SearchIndexItem[] = (changelogRes.data ?? []).map((ver) => ({
      id: `changelog-${ver.id}`,
      title: `${ver.version} — ${ver.titulo}`,
      subtitle: ver.resumen || `Lanzamiento ${ver.fecha_lanzamiento}`,
      path: `/novedades/${encodeURIComponent(ver.version)}`,
      category: 'novedades',
      keywords: [normalizeSearchString(ver.version), normalizeSearchString(ver.titulo)],
      badge: ver.version,
      source: 'changelog',
    }));

    const courses: SearchIndexItem[] = (coursesRes.data ?? []).map((c) => ({
      id: `course-${c.id}`,
      title: c.title,
      subtitle: c.description?.slice(0, 80) || 'Curso de formación',
      path: '/aula-virtual',
      category: 'formacion',
      keywords: [normalizeSearchString(c.title)],
      badge: 'CURSO',
      source: 'course',
    }));

    const editorialSpaces: SearchIndexItem[] = (editorialRes.data ?? []).map((sp) => ({
      id: `editorial-${sp.id}`,
      title: sp.name,
      subtitle: sp.description?.slice(0, 80) || 'Espacio editorial',
      path: `/publicaciones/${sp.slug}`,
      category: 'publicaciones',
      keywords: [normalizeSearchString(sp.name)],
      badge: 'BLOG',
      source: 'editorial_space',
    }));

    return {
      songs,
      events,
      products,
      schedules,
      announcements,
      sermons,
      changelog,
      courses,
      editorialSpaces,
    };
  } catch (error) {
    console.error('Error en búsqueda remota profunda:', error);
    return {};
  }
}

/**
 * Permite a los administradores registrar enlaces dinámicos o personalizados
 * que se integran automáticamente en el buscador general.
 */
export async function addCustomSearchLink(link: Omit<CustomSearchLink, 'id'>): Promise<CustomSearchLink | null> {
  try {
    const { data: currentSettings } = await supabase
      .from('church_settings')
      .select('id, appearance_config')
      .limit(1)
      .maybeSingle();

    if (!currentSettings) return null;

    const currentConfig = (currentSettings.appearance_config || {}) as Record<string, unknown>;
    const currentLinks = Array.isArray(currentConfig.custom_search_links) 
      ? (currentConfig.custom_search_links as CustomSearchLink[])
      : [];

    const newLink: CustomSearchLink = {
      ...link,
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      is_active: link.is_active ?? true,
    };

    const updatedLinks = [...currentLinks, newLink];

    const { error } = await supabase
      .from('church_settings')
      .update({
        appearance_config: {
          ...currentConfig,
          custom_search_links: updatedLinks,
        },
      })
      .eq('id', currentSettings.id);

    if (error) throw error;

    // Invalidar caché local para que se refleje inmediatamente
    invalidateSearchIndexCache();

    return newLink;
  } catch (error) {
    console.error('Error al agregar enlace personalizado de búsqueda:', error);
    return null;
  }
}

/**
 * Invalida el caché en memoria para forzar recarga en la siguiente apertura
 */
export function invalidateSearchIndexCache(): void {
  memoryIndexCache = null;
}

/**
 * Mapa canónico de alias → código de libro (66 libros completos).
 * Cada alias normalizado (sin tildes, sin espacios, minúsculas) apunta al código estándar.
 */
const BIBLE_BOOKS_MAP: Record<string, string> = {
  // Pentateuco
  'gen': 'GEN', 'genesis': 'GEN', 'geneis': 'GEN',
  'exo': 'EXO', 'exodo': 'EXO',
  'lev': 'LEV', 'levitico': 'LEV',
  'num': 'NUM', 'numeros': 'NUM',
  'deu': 'DEU', 'deuteronomio': 'DEU',
  // Históricos
  'jos': 'JOS', 'josue': 'JOS',
  'jue': 'JDG', 'jueces': 'JDG',
  'rut': 'RUT', 'ruth': 'RUT',
  '1sa': '1SA', '1sam': '1SA', '1samuel': '1SA',
  '2sa': '2SA', '2sam': '2SA', '2samuel': '2SA',
  '1re': '1KI', '1rey': '1KI', '1reyes': '1KI',
  '2re': '2KI', '2rey': '2KI', '2reyes': '2KI',
  '1cr': '1CH', '1cro': '1CH', '1cronicas': '1CH',
  '2cr': '2CH', '2cro': '2CH', '2cronicas': '2CH',
  'esd': 'EZR', 'esdras': 'EZR',
  'neh': 'NEH', 'nehemias': 'NEH',
  'est': 'EST', 'ester': 'EST',
  // Poéticos
  'job': 'JOB',
  'sal': 'PSA', 'salmo': 'PSA', 'salmos': 'PSA', 'ps': 'PSA',
  'pro': 'PRO', 'proverbios': 'PRO', 'prov': 'PRO',
  'ecl': 'ECC', 'eclesiastes': 'ECC',
  'cnt': 'SNG', 'cantares': 'SNG', 'cantardeloscantares': 'SNG',
  // Profetas mayores
  'isa': 'ISA', 'isaias': 'ISA',
  'jer': 'JER', 'jeremias': 'JER',
  'lam': 'LAM', 'lamentaciones': 'LAM',
  'eze': 'EZK', 'ezequiel': 'EZK',
  'dan': 'DAN', 'daniel': 'DAN',
  // Profetas menores
  'ose': 'HOS', 'oseas': 'HOS',
  'joe': 'JOL', 'joel': 'JOL',
  'amo': 'AMO', 'amos': 'AMO',
  'abd': 'OBA', 'abdias': 'OBA',
  'jon': 'JON', 'jonas': 'JON',
  'miq': 'MIC', 'miqueas': 'MIC',
  'nah': 'NAM', 'nahum': 'NAM',
  'hab': 'HAB', 'habacuc': 'HAB',
  'sof': 'ZEP', 'sofonias': 'ZEP',
  'hag': 'HAG', 'hageo': 'HAG',
  'zac': 'ZEC', 'zacarias': 'ZEC',
  'mal': 'MAL', 'malaquias': 'MAL',
  // Nuevo Testamento
  'mat': 'MAT', 'mateo': 'MAT',
  'mar': 'MRK', 'marcos': 'MRK',
  'luc': 'LUK', 'lucas': 'LUK',
  'jua': 'JHN', 'juan': 'JHN', 'jn': 'JHN',
  'hch': 'ACT', 'hechos': 'ACT', 'act': 'ACT',
  'rom': 'ROM', 'romanos': 'ROM',
  '1co': '1CO', '1cor': '1CO', '1corintios': '1CO',
  '2co': '2CO', '2cor': '2CO', '2corintios': '2CO',
  'gal': 'GAL', 'galatas': 'GAL',
  'efe': 'EPH', 'efesios': 'EPH',
  'fil': 'PHP', 'filipenses': 'PHP',
  'col': 'COL', 'colosenses': 'COL',
  '1ts': '1TH', '1tes': '1TH', '1tesalonicenses': '1TH',
  '2ts': '2TH', '2tes': '2TH', '2tesalonicenses': '2TH',
  '1ti': '1TI', '1tim': '1TI', '1timoteo': '1TI',
  '2ti': '2TI', '2tim': '2TI', '2timoteo': '2TI',
  'tit': 'TIT', 'tito': 'TIT',
  'flm': 'PHM', 'filemon': 'PHM',
  'heb': 'HEB', 'hebreos': 'HEB',
  'stg': 'JAS', 'santiago': 'JAS',
  '1pe': '1PE', '1ped': '1PE', '1pedro': '1PE',
  '2pe': '2PE', '2ped': '2PE', '2pedro': '2PE',
  '1jn': '1JN', '1juan': '1JN',
  '2jn': '2JN', '2juan': '2JN',
  '3jn': '3JN', '3juan': '3JN',
  'jud': 'JUD', 'judas': 'JUD',
  'apo': 'REV', 'apoc': 'REV', 'apocalipsis': 'REV', 'rev': 'REV',
};

/** Nombres legibles para mostrar al usuario */
const BIBLE_BOOK_DISPLAY_NAMES: Record<string, string> = {
  'GEN': 'Génesis', 'EXO': 'Éxodo', 'LEV': 'Levítico', 'NUM': 'Números', 'DEU': 'Deuteronomio',
  'JOS': 'Josué', 'JDG': 'Jueces', 'RUT': 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reyes', '2KI': '2 Reyes', '1CH': '1 Crónicas', '2CH': '2 Crónicas',
  'EZR': 'Esdras', 'NEH': 'Nehemías', 'EST': 'Ester', 'JOB': 'Job',
  'PSA': 'Salmos', 'PRO': 'Proverbios', 'ECC': 'Eclesiastés', 'SNG': 'Cantares',
  'ISA': 'Isaías', 'JER': 'Jeremías', 'LAM': 'Lamentaciones', 'EZK': 'Ezequiel', 'DAN': 'Daniel',
  'HOS': 'Oseas', 'JOL': 'Joel', 'AMO': 'Amós', 'OBA': 'Abdías', 'JON': 'Jonás',
  'MIC': 'Miqueas', 'NAM': 'Nahúm', 'HAB': 'Habacuc', 'ZEP': 'Sofonías',
  'HAG': 'Hageo', 'ZEC': 'Zacarías', 'MAL': 'Malaquías',
  'MAT': 'Mateo', 'MRK': 'Marcos', 'LUK': 'Lucas', 'JHN': 'Juan',
  'ACT': 'Hechos', 'ROM': 'Romanos', '1CO': '1 Corintios', '2CO': '2 Corintios',
  'GAL': 'Gálatas', 'EPH': 'Efesios', 'PHP': 'Filipenses', 'COL': 'Colosenses',
  '1TH': '1 Tesalonicenses', '2TH': '2 Tesalonicenses', '1TI': '1 Timoteo', '2TI': '2 Timoteo',
  'TIT': 'Tito', 'PHM': 'Filemón', 'HEB': 'Hebreos', 'JAS': 'Santiago',
  '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Juan', '2JN': '2 Juan', '3JN': '3 Juan',
  'JUD': 'Judas', 'REV': 'Apocalipsis',
};

export function parseBibleReferences(term: string): ParsedBibleReference[] {
  const match = term.match(/^(\d?\s*[a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+)?)\s+(\d+)(?::(\d+(?:-\d+)?))?/i);
  if (!match) return [];

  const chapter = parseInt(match[2], 10);
  const verses = match[3] || '1';

  // Normalizar el alias: minúsculas, sin tildes, sin espacios
  const rawAlias = match[1]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  // Búsqueda exacta primero
  const exactCode = BIBLE_BOOKS_MAP[rawAlias];
  if (exactCode) {
    return [{
      bookId: exactCode,
      bookName: BIBLE_BOOK_DISPLAY_NAMES[exactCode] ?? match[1].trim(),
      chapter: isNaN(chapter) ? 1 : chapter,
      verses,
    }];
  }

  // Fallback: prefijo exacto (mínimo 3 caracteres para evitar colisiones)
  if (rawAlias.length >= 3) {
    for (const [alias, code] of Object.entries(BIBLE_BOOKS_MAP)) {
      if (alias.startsWith(rawAlias) && alias !== rawAlias) {
        return [{
          bookId: code,
          bookName: BIBLE_BOOK_DISPLAY_NAMES[code] ?? match[1].trim(),
          chapter: isNaN(chapter) ? 1 : chapter,
          verses,
        }];
      }
    }
  }

  return [];
}

