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
  Sparkles
} from 'lucide-react';

export interface AdminModule {
  id: string;      // Permission key used in Database (e.g. 'dashboard', 'logos')
  label: string;   // Display name for the Permissions Matrix / RBAC GUI
  name: string;    // Display name for the Sidebar item
  path: string;    // Router path (e.g. '/admin/logos')
  icon: React.ComponentType<{ size?: number }>; // Lucide Icon component
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'dashboard',
    label: 'Resumen (Dashboard)',
    name: 'Resumen',
    path: '/admin',
    icon: LayoutDashboard
  },
  {
    id: 'dashboard',
    label: 'Catálogo de Animaciones',
    name: 'Catálogo Animaciones',
    path: '/admin/animaciones',
    icon: Sparkles
  },
  {
    id: 'analytics',
    label: 'Análisis (Métricas)',
    name: 'Análisis (Métricas)',
    path: '/admin/analisis',
    icon: BarChart3
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    name: 'Notificaciones',
    path: '/admin/notificaciones',
    icon: Bell
  },
  {
    id: 'sermons',
    label: 'Sermones',
    name: 'Sermones',
    path: '/admin/sermones',
    icon: Video
  },
  {
    id: 'songs',
    label: 'Alabanzas (Biblioteca)',
    name: 'Alabanzas',
    path: '/admin/alabanzas',
    icon: Music
  },
  {
    id: 'programs',
    label: 'Educación (LMS)',
    name: 'Cursos / LMS',
    path: '/admin/lms',
    icon: GraduationCap
  },
  {
    id: 'members',
    label: 'Miembros (CRM)',
    name: 'Miembros (CRM)',
    path: '/admin/miembros',
    icon: Users
  },
  {
    id: 'map',
    label: 'Mapa Estratégico',
    name: 'Mapa Estratégico',
    path: '/admin/mapa-estrategico',
    icon: Compass
  },
  {
    id: 'events',
    label: 'Eventos (Calendario)',
    name: 'Eventos (Calendario)',
    path: '/admin/eventos',
    icon: Calendar
  },
  {
    id: 'ministries',
    label: 'Ministerios',
    name: 'Ministerios',
    path: '/admin/ministerios',
    icon: Layers
  },
  {
    id: 'logos',
    label: 'Catálogo de Logos',
    name: 'Catálogo de Logos',
    path: '/admin/logos',
    icon: ImageIcon
  },
  {
    id: 'petitions',
    label: 'Peticiones Oración',
    name: 'Peticiones Oración',
    path: '/admin/peticiones',
    icon: FileText
  },
  {
    id: 'finances',
    label: 'Finanzas',
    name: 'Finanzas',
    path: '/admin/finanzas',
    icon: DollarSign
  },
  {
    id: 'products',
    label: 'Productos',
    name: 'Productos',
    path: '/admin/productos',
    icon: Store
  },
  {
    id: 'pages',
    label: 'Editor de Páginas',
    name: 'Editor Páginas',
    path: '/admin/paginas',
    icon: FileText
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios (Admin)',
    name: 'Gestión Usuarios',
    path: '/admin/usuarios',
    icon: UserCog
  },
  {
    id: 'settings',
    label: 'Datos de Iglesia',
    name: 'Datos Iglesia',
    path: '/admin/configuracion',
    icon: Settings
  },
  {
    id: 'production',
    label: 'Logística de Producción',
    name: 'Logística',
    path: '/admin/produccion',
    icon: Columns
  },
  {
    id: 'media_vault',
    label: 'Bóveda de Media',
    name: 'Bóveda Media',
    path: '/admin/media-vault',
    icon: FolderLock
  },
  {
    id: 'chat',
    label: 'Chat de Mensajería',
    name: 'Mensajería Chat',
    path: '/admin/chat',
    icon: MessageSquare
  },
  {
    id: 'inventory',
    label: 'Inventario de Equipos',
    name: 'Inventario',
    path: '/admin/inventario',
    icon: Package
  }
];
