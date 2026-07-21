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
} from 'lucide-react';

export type ModuleGroup =
  | 'admin'          // Administración y Métricas
  | 'diseno'         // Sistema de Diseño, Componentes UI, Logos, Animaciones, Páginas
  | 'eventos_medios' // Calendario, Sermones, Alabanzas, Sonidos y Notificaciones
  | 'educacion'      // LMS, Aula Virtual, Cursos y Juegos
  | 'comunidad'      // CRM Miembros, Ministerios, Misiones, Chat y Oración
  | 'tienda'         // Tienda, Productos, Órdenes, Pagos y Envíos
  | 'operaciones';   // Logística, Inventario, Media Vault y Reservas

export interface ModuleGroupMetadata {
  key: ModuleGroup;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const MODULE_GROUPS: ModuleGroupMetadata[] = [
  {
    key: 'admin',
    label: 'Administración & Métricas',
    description: 'Gestión general del sistema, analítica, finanzas y configuración de iglesia.',
    icon: Shield
  },
  {
    key: 'diseno',
    label: 'Sistema de Diseño & Componentes',
    description: 'Biblioteca visual de componentes UI, Glassmorphism, logos, páginas y plugins.',
    icon: Palette
  },
  {
    key: 'eventos_medios',
    label: 'Eventos & Medios',
    description: 'Programación de eventos, sermones, biblioteca de alabanzas y avisos.',
    icon: Calendar
  },
  {
    key: 'educacion',
    label: 'Educación & Aula Virtual',
    description: 'Cursos, lecciones del LMS, solicitudes de matrícula y juegos interactivos.',
    icon: GraduationCap
  },
  {
    key: 'comunidad',
    label: 'Comunidad & CRM',
    description: 'Directorio de miembros, ministerios, misiones, chat y peticiones de oración.',
    icon: Users
  },
  {
    key: 'tienda',
    label: 'Tienda & Librería',
    description: 'Catálogo de productos de la librería, gestión de órdenes y envíos.',
    icon: Store
  },
  {
    key: 'operaciones',
    label: 'Operaciones & Logística',
    description: 'Producción dominical, inventario de equipos, reservas y bóveda de archivos media.',
    icon: Package
  }
];

export interface AdminModule {
  id: string;      // Permission key used in DB (e.g. 'dashboard', 'components')
  label: string;   // Display name for RBAC Matrix
  name: string;    // Display name for Sidebar item
  path: string;    // Router path (e.g. '/admin/componentes')
  icon: React.ElementType; // Lucide Icon component
  group: ModuleGroup;
}

export const ADMIN_MODULES: AdminModule[] = [
  // --- 1. ADMINISTRACIÓN Y MÉTRICAS ---
  {
    id: 'dashboard',
    label: 'Resumen (Dashboard)',
    name: 'Resumen',
    path: '/admin',
    icon: LayoutDashboard,
    group: 'admin'
  },
  {
    id: 'analytics',
    label: 'Análisis (Métricas)',
    name: 'Análisis & Métricas',
    path: '/admin/analisis',
    icon: BarChart3,
    group: 'admin'
  },
  {
    id: 'finances',
    label: 'Finanzas',
    name: 'Gestión Financiera',
    path: '/admin/finanzas',
    icon: DollarSign,
    group: 'admin'
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios (Admin)',
    name: 'Usuarios & Permisos',
    path: '/admin/usuarios',
    icon: UserCog,
    group: 'admin'
  },
  {
    id: 'settings',
    label: 'Datos de Iglesia',
    name: 'Configuración Iglesia',
    path: '/admin/configuracion',
    icon: Settings,
    group: 'admin'
  },
  {
    id: 'map',
    label: 'Mapa Estratégico',
    name: 'Mapa Estratégico',
    path: '/admin/mapa-estrategico',
    icon: Compass,
    group: 'admin'
  },
  {
    id: 'appearance',
    label: 'Configuración del Panel',
    name: 'Personalizar Panel',
    path: '/admin/apariencia',
    icon: Palette,
    group: 'admin'
  },

  // --- 2. SISTEMA DE DISEÑO Y COMPONENTES UI ---
  {
    id: 'components',
    label: 'Biblioteca Visual de Componentes UI',
    name: 'Biblioteca Componentes UI',
    path: '/admin/componentes',
    icon: Component,
    group: 'diseno'
  },
  {
    id: 'button_studio',
    label: 'Estudio de Botones & Glassmorphism',
    name: 'Estudio Botones & Glass',
    path: '/admin/apariencia/botones',
    icon: Sparkles,
    group: 'diseno'
  },
  {
    id: 'design',
    label: 'Catálogo de Diseño & Estilos',
    name: 'Guía de Estilo / Tokens',
    path: '/admin/diseno',
    icon: Palette,
    group: 'diseno'
  },
  {
    id: 'animations',
    label: 'Catálogo de Animaciones',
    name: 'Catálogo Animaciones',
    path: '/admin/animaciones',
    icon: Sparkles,
    group: 'diseno'
  },
  {
    id: 'logos',
    label: 'Catálogo de Logos',
    name: 'Catálogo de Logos',
    path: '/admin/logos',
    icon: ImageIcon,
    group: 'diseno'
  },
  {
    id: 'pages',
    label: 'Editor de Páginas',
    name: 'Editor de Páginas',
    path: '/admin/paginas',
    icon: FileText,
    group: 'diseno'
  },
  {
    id: 'presentation_editor',
    label: 'Presentación (Pitch Deck)',
    name: 'Editor Presentaciones',
    path: '/admin/presentacion',
    icon: Sparkles,
    group: 'diseno'
  },
  {
    id: 'plugins',
    label: 'Gestor de Extensiones',
    name: 'Extensiones & Plugins',
    path: '/admin/extensiones',
    icon: Sparkles,
    group: 'diseno'
  },

  // --- 3. EVENTOS, MEDIOS & NOTIFICACIONES ---
  {
    id: 'sermons',
    label: 'Sermones y Devocionales',
    name: 'Sermones & Predicas',
    path: '/admin/sermones',
    icon: Video,
    group: 'eventos_medios'
  },
  {
    id: 'songs',
    label: 'Alabanzas (Biblioteca)',
    name: 'Biblioteca Alabanzas',
    path: '/admin/alabanzas',
    icon: Music,
    group: 'eventos_medios'
  },
  {
    id: 'events',
    label: 'Eventos (Calendario)',
    name: 'Calendario Eventos',
    path: '/admin/eventos',
    icon: Calendar,
    group: 'eventos_medios'
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    name: 'Notificaciones',
    path: '/admin/notificaciones',
    icon: Bell,
    group: 'eventos_medios'
  },
  {
    id: 'audio_library',
    label: 'Gestor de Audios',
    name: 'Biblioteca Sonidos',
    path: '/admin/juegos/audio-library',
    icon: Music,
    group: 'eventos_medios'
  },

  // --- 4. EDUCACIÓN Y LMS (AULA VIRTUAL) ---
  {
    id: 'programs',
    label: 'Aula Virtual (LMS)',
    name: 'Aula Virtual (LMS)',
    path: '/admin/lms',
    icon: GraduationCap,
    group: 'educacion'
  },
  {
    id: 'open_resources',
    label: 'Programas y Estudios',
    name: 'Programas & Estudios',
    path: '/admin/recursos-abiertos',
    icon: FileText,
    group: 'educacion'
  },
  {
    id: 'lms_enrollments',
    label: 'Matrículas y Solicitudes',
    name: 'Solicitudes Matrícula',
    path: '/admin/lms/matriculas',
    icon: Users,
    group: 'educacion'
  },
  {
    id: 'games',
    label: 'Juegos Educativos',
    name: 'Juegos Educativos',
    path: '/admin/juegos',
    icon: Gamepad2,
    group: 'educacion'
  },

  // --- 5. COMUNIDAD, CRM & CHAT ---
  {
    id: 'members',
    label: 'Miembros (CRM)',
    name: 'Directorio Miembros (CRM)',
    path: '/admin/miembros',
    icon: Users,
    group: 'comunidad'
  },
  {
    id: 'ministries',
    label: 'Ministerios',
    name: 'Ministerios Activos',
    path: '/admin/ministerios',
    icon: Layers,
    group: 'comunidad'
  },
  {
    id: 'missions',
    label: 'Misiones',
    name: 'Misiones & Campos',
    path: '/admin/misiones',
    icon: Globe2,
    group: 'comunidad'
  },
  {
    id: 'volunteering',
    label: 'Voluntariado',
    name: 'Gestión Voluntariado',
    path: '/admin/voluntariado',
    icon: Heart,
    group: 'comunidad'
  },
  {
    id: 'petitions',
    label: 'Peticiones Oración',
    name: 'Peticiones Oración',
    path: '/admin/peticiones',
    icon: FileText,
    group: 'comunidad'
  },
  {
    id: 'chat',
    label: 'Chat de Mensajería',
    name: 'Mensajería Chat',
    path: '/admin/chat',
    icon: MessageSquare,
    group: 'comunidad'
  },
  {
    id: 'certificates',
    label: 'Generador de Certificados (PDF)',
    name: 'Certificados & PDFs',
    path: '/admin/certificados',
    icon: FileText,
    group: 'comunidad'
  },

  // --- 6. TIENDA Y LIBRERÍA ---
  {
    id: 'products',
    label: 'Productos de Tienda',
    name: 'Productos Tienda',
    path: '/admin/productos',
    icon: Store,
    group: 'tienda'
  },
  {
    id: 'orders',
    label: 'Órdenes de Compra',
    name: 'Órdenes & Pedidos',
    path: '/admin/ordenes',
    icon: Package,
    group: 'tienda'
  },
  {
    id: 'store_settings',
    label: 'Pagos y Envíos',
    name: 'Configuración Pagos',
    path: '/admin/pagos-envios',
    icon: DollarSign,
    group: 'tienda'
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
    group: 'operaciones'
  },
  {
    id: 'bookings',
    label: 'Reservas de Espacios',
    name: 'Reserva Espacios',
    path: '/admin/reservas',
    icon: Building,
    group: 'operaciones'
  }
];
