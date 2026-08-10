import React from 'react';
import {
  LayoutDashboard,
  Video,
  DollarSign,
  Store,
  Users,
  UserCog,
  Settings,
  Calendar,
  Layers,
  Compass,
  FileText,
  BarChart3,
  Bell,
  Music,
  GraduationCap,
  Image as ImageIcon,
  Columns,
  FolderLock,
  MessageSquare,
  Package,
  Sparkles,
  Shield,
  Palette,
  Gamepad2,
  Heart,
  Globe2,
  Building,
  Component,
  KeyRound,
  MonitorPlay,
  Inbox,
  Clock3,
  BookOpenCheck,
  Activity,
  LibraryBig,
} from 'lucide-react';

export type ModuleGroup =
  | 'inicio'
  | 'personas'
  | 'contenido'
  | 'formacion'
  | 'finanzas_tienda'
  | 'operaciones'
  | 'sistema';

export interface ModuleGroupMetadata {
  key: ModuleGroup;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const MODULE_GROUPS: ModuleGroupMetadata[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    description: 'Resumen, actividad e información para tomar decisiones.',
    icon: LayoutDashboard
  },
  {
    key: 'personas',
    label: 'Personas y comunidad',
    description: 'Miembros, ministerios, solicitudes y cuidado pastoral.',
    icon: Users
  },
  {
    key: 'contenido',
    label: 'Contenido y comunicación',
    description: 'Sitio público, publicaciones, agenda, mensajes y recursos multimedia.',
    icon: FileText
  },
  {
    key: 'formacion',
    label: 'Formación',
    description: 'Aula virtual, programas, discipulado y recursos educativos.',
    icon: GraduationCap
  },
  {
    key: 'finanzas_tienda',
    label: 'Finanzas y tienda',
    description: 'Aportes, productos, pedidos, pagos y envíos.',
    icon: DollarSign
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    description: 'Producción, inventario, presentaciones y reservas.',
    icon: Package
  },
  {
    key: 'sistema',
    label: 'Sitio y sistema',
    description: 'Accesos, datos de iglesia, apariencia e integraciones avanzadas.',
    icon: Settings
  }
];

export interface AdminModule {
  id: string;      // Unique navigation key.
  label: string;   // Display name for RBAC Matrix
  name: string;    // Display name for Sidebar item
  path: string;    // Router path (e.g. '/admin/componentes')
  icon: React.ElementType; // Lucide Icon component
  group: ModuleGroup;
  permission?: string;
  keywords?: string[];
  showInPermissions?: boolean;
  isAdvanced?: boolean;
  available?: boolean;
}

export const getAdminModulePermission = (module: AdminModule) => module.permission ?? module.id;

export const ADMIN_MODULES: AdminModule[] = [
  // --- 1. ADMINISTRACIÓN Y MÉTRICAS ---
  {
    id: 'dashboard',
    label: 'Resumen (Dashboard)',
    name: 'Resumen',
    path: '/admin',
    icon: LayoutDashboard,
    group: 'inicio'
  },
  {
    id: 'analytics',
    label: 'Análisis (Métricas)',
    name: 'Análisis & Métricas',
    path: '/admin/analisis',
    icon: BarChart3,
    group: 'inicio'
  },
  {
    id: 'audit_activity',
    label: 'Actividad y auditoría',
    name: 'Actividad del sistema',
    path: '/admin/actividad',
    icon: Activity,
    group: 'inicio',
    permission: 'users',
    showInPermissions: false,
    keywords: ['auditoría', 'historial', 'cambios']
  },
  {
    id: 'finances',
    label: 'Finanzas',
    name: 'Gestión Financiera',
    path: '/admin/finanzas',
    icon: DollarSign,
    group: 'finanzas_tienda'
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios (Admin)',
    name: 'Usuarios & Permisos',
    path: '/admin/usuarios',
    icon: UserCog,
    group: 'sistema'
  },
  {
    id: 'settings',
    label: 'Datos de Iglesia',
    name: 'Configuración Iglesia',
    path: '/admin/configuracion',
    icon: Settings,
    group: 'sistema'
  },
  {
    id: 'map',
    label: 'Mapa Estratégico',
    name: 'Mapa Estratégico',
    path: '/admin/mapa-estrategico',
    icon: Compass,
    group: 'personas'
  },
  {
    id: 'appearance',
    label: 'Configuración del Panel',
    name: 'Personalizar Panel',
    path: '/admin/apariencia',
    icon: Palette,
    group: 'sistema'
  },

  // --- 2. SISTEMA DE DISEÑO Y COMPONENTES UI ---
  {
    id: 'components',
    label: 'Biblioteca Visual de Componentes UI',
    name: 'Biblioteca Componentes UI',
    path: '/admin/componentes',
    icon: Component,
    group: 'sistema',
    isAdvanced: true
  },
  {
    id: 'menu_manager',
    label: 'Gestor del Menú Principal',
    name: 'Menú de Navegación',
    path: '/admin/apariencia/menu',
    icon: Columns,
    group: 'contenido'
  },
  {
    id: 'button_studio',
    label: 'Estudio de Botones & Glassmorphism',
    name: 'Estudio Botones & Glass',
    path: '/admin/apariencia/botones',
    icon: Sparkles,
    group: 'sistema',
    isAdvanced: true
  },
  {
    id: 'design',
    label: 'Catálogo de Diseño & Estilos',
    name: 'Guía de Estilo / Tokens',
    path: '/admin/diseno',
    icon: Palette,
    group: 'sistema',
    isAdvanced: true
  },
  {
    id: 'animations',
    label: 'Catálogo de Animaciones',
    name: 'Catálogo Animaciones',
    path: '/admin/animaciones',
    icon: Sparkles,
    group: 'sistema',
    isAdvanced: true
  },
  {
    id: 'logos',
    label: 'Catálogo de Logos',
    name: 'Catálogo de Logos',
    path: '/admin/logos',
    icon: ImageIcon,
    group: 'sistema',
    isAdvanced: true
  },
  {
    id: 'pages',
    label: 'Editor de Páginas',
    name: 'Editor de Páginas',
    path: '/admin/paginas',
    icon: FileText,
    group: 'contenido'
  },
  {
    id: 'presentation_editor',
    label: 'Presentación (Pitch Deck)',
    name: 'Editor Presentaciones',
    path: '/admin/presentacion',
    icon: Sparkles,
    group: 'operaciones'
  },
  {
    id: 'plugins',
    label: 'Gestor de Extensiones',
    name: 'Extensiones & Plugins',
    path: '/admin/extensiones',
    icon: Sparkles,
    group: 'sistema',
    isAdvanced: true
  },

  // --- 3. EVENTOS, MEDIOS & NOTIFICACIONES ---
  {
    id: 'content_hub',
    label: 'Centro de contenido',
    name: 'Centro de contenido',
    path: '/admin/contenido',
    icon: LibraryBig,
    group: 'contenido',
    permission: 'pages',
    showInPermissions: false,
    keywords: ['sitio', 'publicar', 'editorial']
  },
  {
    id: 'contact_inbox',
    label: 'Buzón de contacto',
    name: 'Buzón de contacto',
    path: '/admin/buzon',
    icon: Inbox,
    group: 'contenido',
    permission: 'chat',
    showInPermissions: false,
    keywords: ['correo', 'mensajes', 'contacto']
  },
  {
    id: 'sermons',
    label: 'Sermones y Devocionales',
    name: 'Sermones & Predicas',
    path: '/admin/sermones',
    icon: Video,
    group: 'contenido'
  },
  {
    id: 'speakers',
    label: 'Liderazgo y Oradores',
    name: 'Liderazgo de la iglesia',
    path: '/admin/pastores',
    icon: UserCog,
    group: 'contenido'
  },
  {
    id: 'songs',
    label: 'Alabanzas (Biblioteca)',
    name: 'Biblioteca Alabanzas',
    path: '/admin/alabanzas',
    icon: Music,
    group: 'contenido'
  },
  {
    id: 'events',
    label: 'Eventos (Calendario)',
    name: 'Calendario Eventos',
    path: '/admin/eventos',
    icon: Calendar,
    group: 'contenido'
  },
  {
    id: 'schedules',
    label: 'Horarios de reuniones',
    name: 'Horarios de reuniones',
    path: '/admin/horarios',
    icon: Clock3,
    group: 'contenido',
    permission: 'events',
    showInPermissions: false,
    keywords: ['cultos', 'agenda', 'reuniones']
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    name: 'Notificaciones',
    path: '/admin/notificaciones',
    icon: Bell,
    group: 'contenido'
  },
  {
    id: 'audio_library',
    label: 'Gestor de Audios',
    name: 'Biblioteca Sonidos',
    path: '/admin/juegos/audio-library',
    icon: Music,
    group: 'contenido'
  },

  // --- 4. EDUCACIÓN Y LMS (AULA VIRTUAL) ---
  {
    id: 'programs',
    label: 'Aula Virtual (LMS)',
    name: 'Aula Virtual (LMS)',
    path: '/admin/lms',
    icon: GraduationCap,
    group: 'formacion'
  },
  {
    id: 'discipleship',
    label: 'Planes e insignias de discipulado',
    name: 'Planes e insignias',
    path: '/admin/discipulado',
    icon: BookOpenCheck,
    group: 'formacion',
    permission: 'study_programs',
    showInPermissions: false,
    keywords: ['lectura', 'biblia', 'insignias']
  },
  {
    id: 'study_programs',
    label: 'Programas y Estudios',
    name: 'Programas & Estudios',
    path: '/admin/programas',
    icon: FileText,
    group: 'formacion'
  },
  {
    id: 'editorial',
    label: 'Páginas & Blogs',
    name: 'Centro Editorial',
    path: '/admin/publicaciones',
    icon: MessageSquare,
    group: 'contenido'
  },
  {
    id: 'lms_enrollments',
    label: 'Matrículas y Solicitudes',
    name: 'Solicitudes Matrícula',
    path: '/admin/lms/matriculas',
    icon: Users,
    group: 'formacion'
  },
  {
    id: 'open_resources',
    label: 'Recursos educativos abiertos',
    name: 'Recursos abiertos',
    path: '/admin/recursos-abiertos',
    icon: LibraryBig,
    group: 'formacion'
  },
  {
    id: 'lms_director',
    label: 'Dirección Académica',
    name: 'Panel de Dirección Académica',
    path: '/lms/director',
    icon: Shield,
    group: 'formacion'
  },
  {
    id: 'games',
    label: 'Juegos Educativos',
    name: 'Juegos Educativos',
    path: '/admin/juegos',
    icon: Gamepad2,
    group: 'formacion'
  },

  // --- 5. COMUNIDAD, CRM & CHAT ---
  {
    id: 'members',
    label: 'Miembros (CRM)',
    name: 'Directorio Miembros (CRM)',
    path: '/admin/miembros',
    icon: Users,
    group: 'personas'
  },
  {
    id: 'member_requests',
    label: 'Solicitudes CRM',
    name: 'Solicitudes de Ingreso',
    path: '/admin/solicitudes',
    icon: UserCog,
    group: 'personas',
    permission: 'members',
    showInPermissions: false
  },
  {
    id: 'ministries',
    label: 'Ministerios',
    name: 'Ministerios Activos',
    path: '/admin/ministerios',
    icon: Layers,
    group: 'personas'
  },
  {
    id: 'missions',
    label: 'Misiones',
    name: 'Misiones & Campos',
    path: '/admin/misiones',
    icon: Globe2,
    group: 'personas'
  },
  {
    id: 'volunteering',
    label: 'Voluntariado',
    name: 'Gestión Voluntariado',
    path: '/admin/voluntariado',
    icon: Heart,
    group: 'personas'
  },
  {
    id: 'petitions',
    label: 'Peticiones Oración',
    name: 'Peticiones Oración',
    path: '/admin/peticiones',
    icon: FileText,
    group: 'personas'
  },
  {
    id: 'chat',
    label: 'Chat de Mensajería',
    name: 'Mensajería Chat',
    path: '/admin/chat',
    icon: MessageSquare,
    group: 'personas'
  },
  {
    id: 'certificates',
    label: 'Generador de Certificados (PDF)',
    name: 'Certificados & PDFs',
    path: '/admin/certificados',
    icon: FileText,
    group: 'formacion'
  },

  // --- 6. TIENDA Y LIBRERÍA ---
  {
    id: 'products',
    label: 'Productos de Tienda',
    name: 'Productos Tienda',
    path: '/admin/productos',
    icon: Store,
    group: 'finanzas_tienda'
  },
  {
    id: 'orders',
    label: 'Órdenes de Compra',
    name: 'Órdenes & Pedidos',
    path: '/admin/ordenes',
    icon: Package,
    group: 'finanzas_tienda'
  },
  {
    id: 'store_settings',
    label: 'Pagos y Envíos',
    name: 'Configuración Pagos',
    path: '/admin/pagos-envios',
    icon: DollarSign,
    group: 'finanzas_tienda'
  },

  // --- 7. OPERACIONES & LOGÍSTICA ---
  {
    id: 'production',
    label: 'Logística de Producción',
    name: 'Producción Dominical',
    path: '/admin/produccion',
    icon: Columns,
    group: 'operaciones'
  },
  {
    id: 'propresenter',
    label: 'Centro ProPresenter',
    name: 'Panel ProPresenter',
    path: '/admin/propresenter',
    icon: MonitorPlay,
    group: 'operaciones'
  },
  {
    id: 'inventory',
    label: 'Inventario de Equipos',
    name: 'Inventario Equipos',
    path: '/admin/inventario',
    icon: Package,
    group: 'operaciones'
  },
  {
    id: 'media_vault',
    label: 'Bóveda de Media',
    name: 'Bóveda Archivos Media',
    path: '/admin/media-vault',
    icon: FolderLock,
    group: 'contenido'
  },
  {
    id: 'bookings',
    label: 'Reservas de Espacios',
    name: 'Reserva Espacios',
    path: '/admin/reservas',
    icon: Building,
    group: 'operaciones'
  },
  {
    id: 'credentials_vault',
    label: 'Bóveda de Credenciales',
    name: 'Credenciales & Redes',
    path: '/admin/boveda-credenciales',
    icon: KeyRound,
    group: 'sistema',
    available: false,
    isAdvanced: true
  }
];

/** Modules shown in the role matrix. Navigation aliases and workspace hubs reuse
 * an existing permission and must not create duplicate rows. */
export const PERMISSION_MODULES = ADMIN_MODULES.filter((module) => module.showInPermissions !== false);
