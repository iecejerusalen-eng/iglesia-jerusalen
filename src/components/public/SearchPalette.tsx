import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BookOpen, Music, Calendar, Heart, 
  ShoppingBag, ArrowRight, Loader2, Send, Globe,
  MapPin, Megaphone, Sparkles, ShieldCheck,
  GraduationCap, Video, FileText, Layers, ExternalLink, RefreshCw
} from 'lucide-react';
import { useSearchStore } from '../../store/useSearchStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { ADMIN_MODULES, getAdminModulePermission } from '../../config/adminModules';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp, AnimeScaleIn } from '../animations/AnimeWrappers';
import { 
  preloadSearchIndex, 
  searchLocalIndex, 
  searchDeepSupabase, 
  parseBibleReferences,
  invalidateSearchIndexCache
} from '../../features/search/services/searchIndexService';
import type { SearchIndexItem, ParsedBibleReference, SearchAggregatedResults } from '../../features/search/types';

interface MemberSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  phone: string | null;
  phone_country_code: string | null;
}

const cmdkStyles = `
  [cmdk-root] {
    max-width: 680px;
    width: 100%;
    border-radius: 24px;
    padding: 8px;
    font-family: inherit;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
    color: #0f172a;
    transition: all 300ms ease;
  }
  .dark [cmdk-root],
  html.dark [cmdk-root] {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }
  [cmdk-input] {
    font-family: inherit;
    width: 100%;
    font-size: 16px;
    padding: 16px 12px;
    outline: none;
    border: none;
    background: transparent;
    color: #0f172a;
    font-weight: 500;
  }
  .dark [cmdk-input],
  html.dark [cmdk-input] {
    color: #f8fafc;
  }
  [cmdk-input]::placeholder {
    color: #64748b;
  }
  .dark [cmdk-input]::placeholder,
  html.dark [cmdk-input]::placeholder {
    color: #94a3b8;
  }
  [cmdk-item] {
    cursor: pointer;
    min-height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    user-select: none;
    transition: all 150ms ease;
    color: #334155;
  }
  .dark [cmdk-item],
  html.dark [cmdk-item] {
    color: #cbd5e1;
  }
  [cmdk-item][data-selected='true'] {
    background: #f1f5f9;
    color: #0f172a;
  }
  .dark [cmdk-item][data-selected='true'],
  html.dark [cmdk-item][data-selected='true'] {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
  [cmdk-group-heading] {
    user-select: none;
    font-size: 11px;
    font-weight: 800;
    color: #475569;
    padding: 12px 16px 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .dark [cmdk-group-heading],
  html.dark [cmdk-group-heading] {
    color: #94a3b8;
  }
  [cmdk-empty] {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 96px;
    color: #64748b;
    font-weight: 500;
  }
  .dark [cmdk-empty],
  html.dark [cmdk-empty] {
    color: #94a3b8;
  }
`;

export default function SearchPalette() {
  const { isOpen, close } = useSearchStore();
  const [search, setSearch] = useState('');
  const [deepLoading, setDeepLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Pre-loaded index items (instant 0ms response)
  const [preloadedItems, setPreloadedItems] = useState<SearchIndexItem[]>([]);
  const [deepResults, setDeepResults] = useState<Partial<SearchAggregatedResults>>({});
  const [crmMembers, setCrmMembers] = useState<MemberSearchResult[]>([]);
  
  const navigate = useNavigate();
  const paletteRef = useRef<HTMLDivElement>(null);
  const deepRequestIdRef = useRef(0);

  const { user, role } = useAuthStore();
  const { hasPermission } = usePermissions();

  const userRoleLower = (role || '').toLowerCase();
  const isAuthenticated = !!user;
  const isGuest = !isAuthenticated || userRoleLower === 'guest';
  const isSuperAdminOrPastor = isAuthenticated && (
    userRoleLower === 'admin' ||
    userRoleLower === 'superadmin' ||
    userRoleLower === 'pastor'
  );

  // Control granular inteligente de permisos para módulos de administración:
  // Si es invitado/anónimo -> NINGÚN módulo administrativo (cero exposición de finanzas, miembros, etc.)
  // Si es pastor/admin -> acceso completo a todos los módulos
  // Si es otro rol (líder, músico, docente, etc.) -> solo los módulos para los cuales tiene permiso explícito
  const accessibleAdminModules = useMemo(() => {
    if (isGuest) return [];

    return ADMIN_MODULES.filter(m => {
      if (m.available === false) return false;
      if (isSuperAdminOrPastor) return true;
      const permKey = getAdminModulePermission(m);
      return hasPermission(permKey, 'view');
    });
  }, [isGuest, isSuperAdminOrPastor, hasPermission]);

  // Permiso para buscar miembros en el CRM
  const canSearchMembers = !isGuest && (isSuperAdminOrPastor || hasPermission('members', 'view'));

  // Pre-cargar índice al montar o abrir
  useEffect(() => {
    let isMounted = true;
    preloadSearchIndex().then((items) => {
      if (isMounted) setPreloadedItems(items);
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  // Atajo universal Ctrl+K / ⌘K y escuchas de eventos (funciona en público, admin y toda la app)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) close(); else useSearchStore.getState().open();
      }
    };

    const handleCustomOpen = () => {
      useSearchStore.getState().open();
    };

    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', handleCustomOpen);
    window.addEventListener('search:open', handleCustomOpen);
    window.addEventListener('admin-command-menu:open', handleCustomOpen);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', handleCustomOpen);
      window.removeEventListener('search:open', handleCustomOpen);
      window.removeEventListener('admin-command-menu:open', handleCustomOpen);
    };
  }, [isOpen, close]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      const resetTimer = window.setTimeout(() => {
        setSearch('');
        setDeepResults({});
        setCrmMembers([]);
        setSearchError(null);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
    return undefined;
  }, [isOpen]);

  // 1. Filtrado local instantáneo a 0ms de latencia
  const localFilteredItems = useMemo(() => {
    return searchLocalIndex(search, preloadedItems);
  }, [search, preloadedItems]);

  // 2. Detección instantánea de citas bíblicas
  const parsedBibleRef = useMemo<ParsedBibleReference | null>(() => {
    if (!search.trim()) return null;
    const parsed = parseBibleReferences(search);
    return parsed.length > 0 && parsed[0].bookId ? parsed[0] : null;
  }, [search]);

  // 3. Búsqueda remota profunda y de miembros CRM (debounced a 200ms)
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed || trimmed.length < 2) {
      setDeepResults({});
      setCrmMembers([]);
      setDeepLoading(false);
      return;
    }

    const reqId = ++deepRequestIdRef.current;
    const timer = setTimeout(async () => {
      setDeepLoading(true);
      try {
        const remotePromise = searchDeepSupabase(trimmed);
        const membersPromise = canSearchMembers 
          ? supabase.from('members').select('id, first_name, last_name, photo_url, phone, phone_country_code').is('deleted_at', null).or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`).limit(4)
          : Promise.resolve({ data: [] as MemberSearchResult[] });

        const [remote, membersRes] = await Promise.all([remotePromise, membersPromise]);

        if (reqId === deepRequestIdRef.current) {
          setDeepResults(remote);
          if (canSearchMembers && membersRes.data) {
            setCrmMembers(membersRes.data as MemberSearchResult[]);
          }
        }
      } catch (err) {
        console.error('Error en búsqueda profunda:', err);
        if (reqId === deepRequestIdRef.current) {
          setSearchError('Hubo un problema consultando datos remotos.');
        }
      } finally {
        if (reqId === deepRequestIdRef.current) {
          setDeepLoading(false);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, canSearchMembers]);

  if (!isOpen) return null;

  const handleSelect = (path: string, isExternal?: boolean) => {
    if (isExternal || path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
    close();
  };

  const handleRefreshIndex = async () => {
    invalidateSearchIndexCache();
    setDeepLoading(true);
    const refreshed = await preloadSearchIndex(true);
    setPreloadedItems(refreshed);
    setDeepLoading(false);
  };

  // Agrupamiento de elementos
  const customLinks = localFilteredItems.filter(i => i.source === 'custom_link');
  const sermons = [
    ...localFilteredItems.filter(i => i.source === 'sermon'),
    ...(deepResults.sermons || []).filter(s => !localFilteredItems.some(l => l.id === s.id))
  ];
  const courses = [
    ...localFilteredItems.filter(i => i.source === 'course'),
    ...(deepResults.courses || []).filter(c => !localFilteredItems.some(l => l.id === c.id))
  ];
  const editorialSpaces = [
    ...localFilteredItems.filter(i => i.source === 'editorial_space'),
    ...(deepResults.editorialSpaces || []).filter(e => !localFilteredItems.some(l => l.id === e.id))
  ];
  const dynamicForms = localFilteredItems.filter(i => i.source === 'dynamic_form');
  const ministries = localFilteredItems.filter(i => i.source === 'ministry');
  const changelog = [
    ...localFilteredItems.filter(i => i.source === 'changelog'),
    ...(deepResults.changelog || []).filter(c => !localFilteredItems.some(l => l.id === c.id))
  ];
  const songs = deepResults.songs || [];
  const events = deepResults.events || [];
  const announcements = deepResults.announcements || [];
  const schedules = deepResults.schedules || [];
  const products = deepResults.products || [];
  const sitePages = localFilteredItems.filter(i => i.source === 'static_route');

  // Módulos administrativos filtrados estrictamente por permisos del usuario
  const filteredAdminModules = accessibleAdminModules.filter(mod => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return mod.name.toLowerCase().includes(q) ||
      mod.label.toLowerCase().includes(q) ||
      mod.path.toLowerCase().includes(q) ||
      (mod.keywords || []).some(k => k.toLowerCase().includes(q));
  });

  // Clasificación de accesos directos
  const normalizedSearch = search.toLowerCase();
  const showLocation = /ubica|direc|dónde|mapa|milagro|llegar/i.test(normalizedSearch) || search.length === 0;
  const showSocials = /redes|social|facebook|youtube|instagram|canal|video|vivo|transmi/i.test(normalizedSearch) || search.length === 0;
  const showPetition = /peti|orar|orac|pedido|ayuda|rezar|necesi/i.test(normalizedSearch) || search.length === 0;
  const showDonation = /dona|ofren|diez|pagar|dinero|dar|apoyar/i.test(normalizedSearch) || search.length === 0;
  const showStore = /tienda|produ|comprar|venta|libro|biblia|camisa|agenda|precio/i.test(normalizedSearch);

  return (
    <>
      <style>{cmdkStyles}</style>
      
      <div 
        className="fixed inset-0 z-[160] flex items-start justify-center bg-slate-950/70 dark:bg-black/85 backdrop-blur-md p-4 pt-16 md:pt-[8vh] animate-fadeIn"
        onClick={close}
      >
        <AnimeScaleIn className="w-full max-w-2xl">
          <div 
            ref={paletteRef}
            onClick={(e) => e.stopPropagation()} 
            className="w-full"
          >
            <Command label="Buscador universal inteligente de Iglesia Jerusalén">
              {/* Input Header */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/70 dark:bg-slate-900/50">
                {deepLoading ? (
                  <Loader2 size={20} className="text-amber-500 animate-spin shrink-0" />
                ) : (
                  <Search size={20} className="text-slate-500 dark:text-slate-400 shrink-0" />
                )}
                <Command.Input 
                  value={search}
                  onValueChange={setSearch}
                  placeholder={
                    isGuest 
                      ? "¿Qué deseas buscar? (Prédicas, alabanzas, biblia, cultos...)"
                      : "¿Qué deseas buscar? (Herramientas, finanzas, miembros, prédicas...)"
                  } 
                  autoFocus
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRefreshIndex}
                    title="Actualizar índice de búsqueda"
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition"
                  >
                    <RefreshCw size={13} className={deepLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm cursor-pointer"
                  >
                    ESC
                  </button>
                </div>
              </div>

              <Command.List className="max-h-[62vh] overflow-y-auto p-3 custom-scrollbar space-y-4">
                <Command.Empty>
                  <div className="text-center py-6">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No encontramos resultados directos</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isGuest 
                        ? 'Prueba con "prédica", "biblia", "horarios" o el título de un canto.' 
                        : 'Prueba buscando el nombre de una herramienta, módulo o miembro del CRM.'}
                    </p>
                  </div>
                </Command.Empty>

                {searchError && (
                  <div role="alert" className="mx-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    {searchError}
                  </div>
                )}

                {/* 1. REFERENCIA BÍBLICA DETECTADA */}
                {parsedBibleRef && (
                  <AnimeFadeUp delay={0.02}>
                    <Command.Group heading="Referencia bíblica detectada">
                      <Command.Item
                        value={`biblia ${parsedBibleRef.bookName} ${parsedBibleRef.chapter} ${parsedBibleRef.verses}`}
                        onSelect={() => handleSelect(`/recursos/biblia?libro=${encodeURIComponent(parsedBibleRef.bookId)}&capitulo=${encodeURIComponent(parsedBibleRef.chapter)}`)}
                      >
                        <BookOpen size={18} className="text-indigo-500 shrink-0" />
                        <div className="flex-1 text-left">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            Abrir {parsedBibleRef.bookName} {parsedBibleRef.chapter}:{parsedBibleRef.verses}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Ir directamente al lector bíblico
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                      </Command.Item>
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 2. MÓDULOS DE ADMINISTRACIÓN (SEGÚN ROLES Y PERMISOS DEL USUARIO) */}
                {filteredAdminModules.length > 0 && (
                  <AnimeFadeUp delay={0.04}>
                    <Command.Group heading="Módulos de Gestión (Panel)">
                      {filteredAdminModules.map((mod) => (
                        <Command.Item
                          key={mod.id}
                          value={`admin panel gestion ${mod.name} ${mod.label} ${mod.group} ${mod.path} ${(mod.keywords || []).join(' ')}`}
                          onSelect={() => handleSelect(mod.path)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            <ShieldCheck size={16} />
                          </div>
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{mod.name}</span>
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                ADMIN
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block truncate">
                              {mod.path} {mod.label !== mod.name ? `— ${mod.label}` : ''}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                            Abrir <ArrowRight size={13} />
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 3. MIEMBROS DEL CRM (SOLO PARA ROLES CON PERMISOS DE MIEMBROS) */}
                {canSearchMembers && crmMembers.length > 0 && (
                  <AnimeFadeUp delay={0.05}>
                    <Command.Group heading="Miembros del CRM">
                      {crmMembers.map((member) => (
                        <Command.Item
                          key={member.id}
                          value={`miembro crm persona ${member.first_name} ${member.last_name} ${member.phone || ''}`}
                          onSelect={() => handleSelect('/admin/miembros')}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 overflow-hidden text-xs font-bold">
                            {member.photo_url ? (
                              <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`
                            )}
                          </div>
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {member.first_name} {member.last_name}
                              </span>
                              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
                                CRM
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block truncate">
                              {member.phone ? `Tel: ${member.phone}` : 'Sin teléfono registrado'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                            Ver ficha <ArrowRight size={13} />
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 4. ENLACES PERSONALIZADOS Y DESTACADOS */}
                {customLinks.length > 0 && (
                  <AnimeFadeUp delay={0.06}>
                    <Command.Group heading="Enlaces Destacados y Promocionados">
                      {customLinks.map((link) => (
                        <Command.Item
                          key={link.id}
                          value={`destacado ${link.title} ${link.subtitle || ''} ${(link.keywords || []).join(' ')}`}
                          onSelect={() => handleSelect(link.path, link.isExternal)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                            <Sparkles size={16} />
                          </div>
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{link.title}</span>
                              {link.badge && (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            {link.subtitle && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{link.subtitle}</span>
                            )}
                          </div>
                          {link.isExternal ? (
                            <ExternalLink size={14} className="text-slate-400 shrink-0" />
                          ) : (
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 5. PRÉDICAS Y SERMONES (AUTO-INDEXADOS) */}
                {sermons.length > 0 && (
                  <AnimeFadeUp delay={0.08}>
                    <Command.Group heading="Prédicas y Sermones">
                      {sermons.map((sermon) => (
                        <Command.Item
                          key={sermon.id}
                          value={`predica sermon mensaje pastor ${sermon.title} ${sermon.subtitle || ''}`}
                          onSelect={() => handleSelect(sermon.path)}
                        >
                          <Video size={18} className="text-blue-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{sermon.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {sermon.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 6. CURSOS DEL AULA VIRTUAL (AUTO-INDEXADOS) */}
                {courses.length > 0 && (
                  <AnimeFadeUp delay={0.1}>
                    <Command.Group heading="Cursos del Aula Virtual (LMS)">
                      {courses.map((course) => (
                        <Command.Item
                          key={course.id}
                          value={`curso aula virtual discipulado instituto ${course.title} ${course.subtitle || ''}`}
                          onSelect={() => handleSelect(course.path)}
                        >
                          <GraduationCap size={18} className="text-emerald-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{course.title}</span>
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                CURSO
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {course.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 7. ESPACIOS Y PUBLICACIONES EDITORIALES (AUTO-INDEXADOS) */}
                {editorialSpaces.length > 0 && (
                  <AnimeFadeUp delay={0.12}>
                    <Command.Group heading="Espacios Editoriales y Artículos">
                      {editorialSpaces.map((space) => (
                        <Command.Item
                          key={space.id}
                          value={`editorial blog espacio publicaciones articulo ${space.title} ${space.subtitle || ''}`}
                          onSelect={() => handleSelect(space.path)}
                        >
                          <FileText size={18} className="text-violet-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{space.title}</span>
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                BLOG
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {space.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 8. FORMULARIOS DINÁMICOS (AUTO-INDEXADOS) */}
                {dynamicForms.length > 0 && (
                  <AnimeFadeUp delay={0.13}>
                    <Command.Group heading="Formularios de Registro y Participación">
                      {dynamicForms.map((form) => (
                        <Command.Item
                          key={form.id}
                          value={`formulario inscripcion registro ${form.title} ${form.subtitle || ''}`}
                          onSelect={() => handleSelect(form.path)}
                        >
                          <Layers size={18} className="text-amber-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{form.title}</span>
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                FORM
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {form.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 9. ALABANZAS E HIMNOS (BÚSQUEDA PROFUNDA DE LETRAS) */}
                {songs.length > 0 && (
                  <AnimeFadeUp delay={0.14}>
                    <Command.Group heading="Alabanzas e Himnos">
                      {songs.map((song) => (
                        <Command.Item
                          key={song.id}
                          value={`letra cancion alabanza himno ${song.title} ${song.subtitle || ''}`}
                          onSelect={() => handleSelect(song.path)}
                        >
                          <Music size={18} className="text-emerald-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{song.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {song.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 10. EVENTOS Y ACTIVIDADES */}
                {events.length > 0 && (
                  <AnimeFadeUp delay={0.16}>
                    <Command.Group heading="Eventos y Actividades">
                      {events.map((ev) => (
                        <Command.Item
                          key={ev.id}
                          value={`evento reunion fecha horario ${ev.title} ${ev.subtitle || ''}`}
                          onSelect={() => handleSelect(ev.path)}
                        >
                          <Calendar size={18} className="text-violet-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{ev.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{ev.subtitle}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 11. MINISTERIOS Y DEPARTAMENTOS */}
                {ministries.length > 0 && (
                  <AnimeFadeUp delay={0.18}>
                    <Command.Group heading="Ministerios y Departamentos">
                      {ministries.map((min) => (
                        <Command.Item
                          key={min.id}
                          value={`ministerio departamento grupo ${min.title} ${min.subtitle || ''}`}
                          onSelect={() => handleSelect(min.path)}
                        >
                          <Heart size={18} className="text-rose-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{min.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{min.subtitle}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 12. NOVEDADES Y VERSIONES (CHANGELOG) */}
                {changelog.length > 0 && (
                  <AnimeFadeUp delay={0.2}>
                    <Command.Group heading="Novedades y Versiones (Changelog)">
                      {changelog.map((ver) => (
                        <Command.Item
                          key={ver.id}
                          value={`novedades changelog version actualizacion ${ver.title} ${ver.subtitle || ''}`}
                          onSelect={() => handleSelect(ver.path)}
                        >
                          <Sparkles size={18} className="text-amber-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{ver.title}</span>
                              {ver.badge && (
                                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                  {ver.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                              {ver.subtitle}
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 13. ANUNCIOS IMPORTANTES */}
                {announcements.length > 0 && (
                  <AnimeFadeUp delay={0.22}>
                    <Command.Group heading="Anuncios Parroquiales">
                      {announcements.map((an) => (
                        <Command.Item
                          key={an.id}
                          value={`anuncio aviso comunicado ${an.title} ${an.subtitle || ''}`}
                          onSelect={() => handleSelect(an.path)}
                        >
                          <Megaphone size={18} className="text-amber-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{an.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{an.subtitle}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 14. HORARIOS DE CULTOS */}
                {schedules.length > 0 && (
                  <AnimeFadeUp delay={0.24}>
                    <Command.Group heading="Horarios de Cultos">
                      {schedules.map((sch) => (
                        <Command.Item
                          key={sch.id}
                          value={`horario culto reunion ${sch.title} ${sch.subtitle || ''}`}
                          onSelect={() => handleSelect(sch.path)}
                        >
                          <Calendar size={18} className="text-amber-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{sch.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{sch.subtitle}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 15. PRODUCTOS DE LA TIENDA */}
                {products.length > 0 && (
                  <AnimeFadeUp delay={0.26}>
                    <Command.Group heading="Productos de la Tienda">
                      {products.map((prod) => (
                        <Command.Item
                          key={prod.id}
                          value={`tienda comprar producto libro ${prod.title} ${prod.subtitle || ''}`}
                          onSelect={() => handleSelect(prod.path)}
                        >
                          <ShoppingBag size={18} className="text-amber-500 shrink-0" />
                          <div className="flex-1 text-left truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{prod.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{prod.subtitle}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 16. SECCIONES Y PÁGINAS DEL SITIO (AUTO-INDEXADAS, FILTRADO INSTANTÁNEO) */}
                {sitePages.length > 0 && (
                  <AnimeFadeUp delay={0.28}>
                    <Command.Group heading="Secciones y Páginas del Sitio">
                      {sitePages.map((page) => {
                        const Icon = (page.icon as React.ElementType) || BookOpen;
                        return (
                          <Command.Item
                            key={page.id}
                            value={`seccion pagina enlace ${page.title} ${page.subtitle || ''} ${(page.keywords || []).join(' ')}`}
                            onSelect={() => handleSelect(page.path, page.isExternal)}
                          >
                            <Icon size={18} className="text-primary dark:text-gold shrink-0" />
                            <div className="flex-1 text-left truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{page.title}</span>
                                {page.badge && (
                                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                    {page.badge}
                                  </span>
                                )}
                              </div>
                              {page.subtitle && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{page.subtitle}</span>
                              )}
                            </div>
                            <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  </AnimeFadeUp>
                )}

                {/* 17. ACCESOS DIRECTOS DE ACCIÓN / AYUDA */}
                {(showLocation || showSocials || showPetition || showDonation || showStore) && (
                  <AnimeFadeUp delay={0.3}>
                    <Command.Group heading="Accesos Directos y Ayuda Rápida">
                      {showLocation && (
                        <Command.Item 
                          value="ubicación dirección dónde queda mapa milagro cómo llegar" 
                          onSelect={() => handleSelect('/contacto')}
                        >
                          <MapPin className="text-blue-500 shrink-0" size={18} />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-slate-900 dark:text-white block">Ubicación de la Iglesia</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ver mapa y dirección física en Milagro, Ecuador</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                        </Command.Item>
                      )}
                      {showSocials && (
                        <Command.Item 
                          value="redes sociales facebook youtube instagram canal video transmisión en vivo" 
                          onSelect={() => {
                            window.open('https://youtube.com', '_blank');
                            close();
                          }}
                        >
                          <Globe className="text-indigo-500 shrink-0" size={18} />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-slate-900 dark:text-white block">Canal de YouTube y Redes</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mira nuestras transmisiones de cultos en vivo</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                        </Command.Item>
                      )}
                      {showPetition && (
                        <Command.Item 
                          value="petición orar oración pedido ayuda rezar" 
                          onSelect={() => handleSelect('/peticiones')}
                        >
                          <Send className="text-pink-500 shrink-0" size={18} />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-slate-900 dark:text-white block">Enviar Petición de Oración</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Comparte tu motivo para orar e interceder por ti</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                        </Command.Item>
                      )}
                      {showDonation && (
                        <Command.Item 
                          value="donación ofrenda diezmo dar apoyar diezmos donaciones sembrar finanzas" 
                          onSelect={() => handleSelect('/donaciones')}
                        >
                          <Heart className="text-rose-500 shrink-0" size={18} />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-slate-900 dark:text-white block">Diezmos y Ofrendas</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Apoya el ministerio local y la obra misionera</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                        </Command.Item>
                      )}
                      {showStore && (
                        <Command.Item 
                          value="tienda comprar productos libros biblias camisetas recuerdos" 
                          onSelect={() => handleSelect('/tienda')}
                        >
                          <ShoppingBag className="text-amber-500 shrink-0" size={18} />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-slate-900 dark:text-white block">Ir a la Tienda de la Iglesia</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ver biblias, agendas y recursos disponibles</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                        </Command.Item>
                      )}
                    </Command.Group>
                  </AnimeFadeUp>
                )}
              </Command.List>

              {/* BARRA INFERIOR CON NAVEGACIÓN Y ESTADO DE PERMISOS */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium select-none">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd> Navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd> Abrir
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd> Cerrar
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isGuest && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={11} />
                      {isSuperAdminOrPastor ? 'Pastoral / Admin' : `Rol: ${userRoleLower}`}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Buscador Universal
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <a 
                    href="https://www.iecejerusalen.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline hidden sm:inline"
                  >
                    iecejerusalen.com
                  </a>
                </div>
              </div>
            </Command>
          </div>
        </AnimeScaleIn>
      </div>
    </>
  );
}
