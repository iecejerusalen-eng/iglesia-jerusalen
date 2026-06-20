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
  Palette
} from 'lucide-react';

export type ModuleGroup =
  | 'admin'          // Administración y Métricas
  | 'tienda'         // Tienda y Productos
  | 'educacion'      // LMS y Educación
  | 'comunidad'      // CRM, Ministerios y Comunicación
  | 'eventos_medios' // Calendario, Sermones, Alabanzas y Notificaciones
  | 'diseno'         // Personalización, Logos, Animaciones, Páginas
  | 'operaciones';   // Logística, Inventario, Media Vault

export interface ModuleGroupMetadata {
  key: ModuleGroup;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

export const MODULE_GROUPS: ModuleGroupMetadata[] = [
  {
    key: 'admin',
    label: 'Administración',
    description: 'Gestión general, métricas del sistema, configuraciones y finanzas.',
    icon: Shield
  },
  {
    key: 'comunidad',
    label: 'Comunidad y CRM',
    description: 'Control de membresía, ministerios activos, peticiones de oración y chat.',
    icon: Users
  },
  {
    key: 'educacion',
    label: 'Educación',
    description: 'Gestión de cursos, lecciones, cuestionarios y recursos abiertos.',
    icon: GraduationCap
  },
  {
    key: 'eventos_medios',
    label: 'Eventos y Medios',
    description: 'Programación de eventos, biblioteca de alabanzas, sermones y avisos.',
    icon: Calendar
  },
  {
    key: 'tienda',
    label: 'Tienda',
    description: 'Administración de productos de la librería de la iglesia y pedidos.',
    icon: Store
  },
  {
    key: 'diseno',
    label: 'Diseño y Recursos',
    description: 'Catálogo de logos, animaciones multimedia y editor de páginas públicas.',
    icon: Palette
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    description: 'Logística de producción dominical, inventario de equipos y bóveda de media.',
    icon: Package
  }
];

export interface AdminModule {
  id: string;      // Permission key used in Database (e.g. 'dashboard', 'logos')
  label: string;   // Display name for the Permissions Matrix / RBAC GUI
  name: string;    // Display name for the Sidebar item
  path: string;    // Router path (e.g. '/admin/logos')
  icon: React.ComponentType<any>; // Lucide Icon component
  group: ModuleGroup;
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'dashboard',
    label: 'Resumen (Dashboard)',
    name: 'Resumen',
    path: '/admin',
    icon: LayoutDashboard,
    group: 'admin'
  },
  {
    id: 'dashboard',
    label: 'Catálogo de Animaciones',
    name: 'Catálogo Animaciones',
    path: '/admin/animaciones',
    icon: Sparkles,
    group: 'diseno'
  },
  {
    id: 'analytics',
    label: 'Análisis (Métricas)',
    name: 'Análisis (Métricas)',
    path: '/admin/analisis',
    icon: BarChart3,
    group: 'admin'
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
    id: 'sermons',
    label: 'Sermones',
    name: 'Sermones',
    path: '/admin/sermones',
    icon: Video,
    group: 'eventos_medios'
  },
  {
    id: 'songs',
    label: 'Alabanzas (Biblioteca)',
    name: 'Alabanzas',
    path: '/admin/alabanzas',
    icon: Music,
    group: 'eventos_medios'
  },
  {
    id: 'programs',
    label: 'Educación (LMS)',
    name: 'Cursos / LMS',
    path: '/admin/lms',
    icon: GraduationCap,
    group: 'educacion'
  },
  {
    id: 'programs',
    label: 'Recursos Abiertos',
    name: 'Recursos Abiertos',
    path: '/admin/recursos-abiertos',
    icon: FileText,
    group: 'educacion'
  },
  {
    id: 'members',
    label: 'Miembros (CRM)',
    name: 'Miembros (CRM)',
    path: '/admin/miembros',
    icon: Users,
    group: 'comunidad'
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
    id: 'events',
    label: 'Eventos (Calendario)',
    name: 'Eventos (Calendario)',
    path: '/admin/eventos',
    icon: Calendar,
    group: 'eventos_medios'
  },
  {
    id: 'ministries',
    label: 'Ministerios',
    name: 'Ministerios',
    path: '/admin/ministerios',
    icon: Layers,
    group: 'comunidad'
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
    id: 'petitions',
    label: 'Peticiones Oración',
    name: 'Peticiones Oración',
    path: '/admin/peticiones',
    icon: FileText,
    group: 'comunidad'
  },
  {
    id: 'finances',
    label: 'Finanzas',
    name: 'Finanzas',
    path: '/admin/finanzas',
    icon: DollarSign,
    group: 'admin'
  },
  {
    id: 'products',
    label: 'Productos',
    name: 'Productos',
    path: '/admin/productos',
    icon: Store,
    group: 'tienda'
  },
  {
    id: 'pages',
    label: 'Editor de Páginas',
    name: 'Editor Páginas',
    path: '/admin/paginas',
    icon: FileText,
    group: 'diseno'
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios (Admin)',
    name: 'Gestión Usuarios',
    path: '/admin/usuarios',
    icon: UserCog,
    group: 'admin'
  },
  {
    id: 'settings',
    label: 'Datos de Iglesia',
    name: 'Datos Iglesia',
    path: '/admin/configuracion',
    icon: Settings,
    group: 'admin'
  },
  {
    id: 'production',
    label: 'Logística de Producción',
    name: 'Logística',
    path: '/admin/produccion',
    icon: Columns,
    group: 'operaciones'
  },
  {
    id: 'media_vault',
    label: 'Bóveda de Media',
    name: 'Bóveda Media',
    path: '/admin/media-vault',
    icon: FolderLock,
    group: 'operaciones'
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
    id: 'inventory',
    label: 'Inventario de Equipos',
    name: 'Inventario',
    path: '/admin/inventario',
    icon: Package,
    group: 'operaciones'
  },
  {
    id: 'programs',
    label: 'Matrículas y Solicitudes',
    name: 'Solicitudes Matrícula',
    path: '/admin/lms/matriculas',
    icon: Users,
    group: 'educacion'
  },
  {
    id: 'settings',
    label: 'Gestor de Extensiones',
    name: 'Extensiones / Plugins',
    path: '/admin/extensiones',
    icon: Sparkles,
    group: 'diseno'
  }
];
