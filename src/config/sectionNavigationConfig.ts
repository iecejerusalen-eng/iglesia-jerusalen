import React from 'react';
import {
  Home,
  Info,
  Calendar,
  Users,
  BookOpen,
  Send,
  MapPin,
  Sparkles,
  Compass,
  Flame,
  Heart,
  Gift,
  ShoppingBag,
  GraduationCap,
  Music,
  Globe,
  Award,
  ShoppingCart,
  CreditCard,
  PackageCheck,
  MessageCircle,
  Clock,
  Mic,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Tv,
  Megaphone
} from 'lucide-react';

export interface SectionItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface PageSectionConfig {
  /** Match path exact or prefix/pattern */
  pathPattern: string;
  title: string;
  sections: SectionItem[];
}

/**
 * CONFIGURACIÓN CENTRALIZADA DE NAVEGACIÓN POR SECCIONES (STICKY / FLOATING NAV)
 * 
 * Para editar o agregar nuevas secciones a cualquier página o subpágina del sitio,
 * modifica únicamente esta lista. Asigna el `id` HTML del contenedor, la etiqueta descriptiva
 * y el icono SVG correspondiente.
 */
export const PAGE_SECTIONS_CONFIG: PageSectionConfig[] = [
  // 1. INICIO
  {
    pathPattern: '^/(inicio)?$',
    title: 'Inicio',
    sections: [
      { id: 'home_hero', label: 'Inicio', icon: Home },
      { id: 'home_welcome', label: 'Bienvenida', icon: Info },
      { id: 'home_schedules', label: 'Horarios', icon: Calendar },
      { id: 'home_announcements', label: 'Anuncios', icon: Megaphone },
      { id: 'home_events', label: 'Eventos', icon: Users },
      { id: 'home_sermons', label: 'Prédicas', icon: BookOpen },
      { id: 'home_birthdays', label: 'Cumpleaños', icon: Gift },
      { id: 'home_donations', label: 'Donaciones', icon: Heart },
      { id: 'home_gallery', label: 'Galería', icon: Sparkles },
      { id: 'stats_section', label: 'Impacto', icon: CheckCircle2 },
      { id: 'testimonials_section', label: 'Testimonios', icon: MessageCircle }
    ]
  },

  // 2. NOSOTROS
  {
    pathPattern: '^/nosotros$',
    title: 'Nosotros',
    sections: [
      { id: 'nosotros-hero', label: 'Quiénes Somos', icon: Info },
      { id: 'historia', label: 'Nuestra Historia', icon: BookOpen },
      { id: 'pilares', label: '4 Pilares', icon: Flame },
      { id: 'principios', label: 'Principios de Fe', icon: ShieldCheck },
      { id: 'liderazgo', label: 'Liderazgo', icon: Users }
    ]
  },

  // 3. COMUNIDAD & SUBPÁGINAS
  {
    pathPattern: '^/ministerios/[^/]+$',
    title: 'Detalle de Ministerio',
    sections: [
      { id: 'ministry_hero', label: 'Ministerio', icon: Users },
      { id: 'ministry_vision', label: 'Visión & Propósito', icon: Compass },
      { id: 'ministry_schedule', label: 'Actividades & Horarios', icon: Calendar },
      { id: 'ministry_leadership', label: 'Líderes', icon: Users },
      { id: 'ministry_join', label: 'Involúcrate', icon: Heart }
    ]
  },
  {
    pathPattern: '^/ministerios$',
    title: 'Comunidad & Ministerios',
    sections: [
      { id: 'ministries_hero', label: 'Ministerios', icon: Users },
      { id: 'ministries_grid', label: 'Nuestros Grupos', icon: Sparkles },
      { id: 'ministries_volunteer', label: 'Voluntariado', icon: Heart },
      { id: 'ministries_join', label: 'Forma Parte', icon: Send }
    ]
  },
  {
    pathPattern: '^/eventos$',
    title: 'Eventos',
    sections: [
      { id: 'events_hero', label: 'Eventos', icon: Calendar },
      { id: 'events_upcoming', label: 'Próximos Eventos', icon: Sparkles },
      { id: 'events_calendar', label: 'Calendario', icon: Clock }
    ]
  },
  {
    pathPattern: '^/anuncios$',
    title: 'Anuncios de la Iglesia',
    sections: [
      { id: 'announcements_hero', label: 'Anuncios', icon: Megaphone },
      { id: 'announcements_list', label: 'Comunicados', icon: Sparkles }
    ]
  },
  {
    pathPattern: '^/peticiones$',
    title: 'Peticiones de Oración',
    sections: [
      { id: 'petitions_hero', label: 'Peticiones', icon: Heart },
      { id: 'petitions_form', label: 'Enviar Oración', icon: Send },
      { id: 'petitions_wall', label: 'Muro de Fe', icon: MessageCircle }
    ]
  },
  {
    pathPattern: '^/cumpleanos$',
    title: 'Cumpleaños',
    sections: [
      { id: 'birthdays_hero', label: 'Cumpleaños', icon: Gift },
      { id: 'birthdays_today', label: 'Filtros y Fechas', icon: Calendar },
      { id: 'birthdays_card', label: 'Lista de Cumpleañeros', icon: Smile }
    ]
  },
  {
    pathPattern: '^/escuela-dominical$',
    title: 'Escuela Dominical',
    sections: [
      { id: 'sunday_hero', label: 'Niños & Jóvenes', icon: GraduationCap },
      { id: 'sunday_classes', label: 'Clases por Edades', icon: BookOpen },
      { id: 'sunday_materials', label: 'Materiales', icon: Sparkles },
      { id: 'sunday_register', label: 'Inscripción', icon: Send }
    ]
  },
  {
    pathPattern: '^/mi-horario$',
    title: 'Voluntariado',
    sections: [
      { id: 'volunteer_hero', label: 'Servicio', icon: Heart },
      { id: 'volunteer_roster', label: 'Turnos', icon: Calendar },
      { id: 'volunteer_signups', label: 'Sumarme', icon: Send }
    ]
  },

  // 4. RECURSOS & SUBPÁGINAS
  {
    pathPattern: '^/predicas$',
    title: 'Prédicas',
    sections: [
      { id: 'sermons_hero', label: 'Mensajes', icon: Tv },
      { id: 'sermons_latest', label: 'Última Prédica', icon: Sparkles },
      { id: 'sermons_series', label: 'Series', icon: BookOpen },
      { id: 'sermons_archive', label: 'Archivo completo', icon: Calendar }
    ]
  },
  {
    pathPattern: '^/expositores$',
    title: 'Expositores',
    sections: [
      { id: 'speakers_hero', label: 'Expositores', icon: Mic },
      { id: 'speakers_featured', label: 'Destacados', icon: Sparkles },
      { id: 'speakers_list', label: 'Predicadores', icon: Users }
    ]
  },
  {
    pathPattern: '^/recursos/alabanzas$',
    title: 'Biblioteca de Alabanzas',
    sections: [
      { id: 'songs_hero', label: 'Alabanzas', icon: Music },
      { id: 'songs_search', label: 'Buscador', icon: Sparkles },
      { id: 'songs_library', label: 'Repertorio', icon: BookOpen }
    ]
  },
  {
    pathPattern: '^/recursos/biblia$',
    title: 'Biblia Digital',
    sections: [
      { id: 'bible_hero', label: 'Biblia', icon: BookOpen },
      { id: 'bible_selector', label: 'Libros', icon: Compass },
      { id: 'bible_reader', label: 'Lectura', icon: Info }
    ]
  },
  {
    pathPattern: '^/recursos/juegos.*$',
    title: 'Juegos Bíblicos',
    sections: [
      { id: 'games_hero', label: 'Juegos Hub', icon: Sparkles },
      { id: 'games_grid', label: 'Seleccionar Juego', icon: Award },
      { id: 'games_leaderboard', label: 'Clasificación XP', icon: Users }
    ]
  },
  {
    pathPattern: '^/plan-lectura$',
    title: 'Plan de Lectura',
    sections: [
      { id: 'reading_hero', label: 'Plan Bíblico', icon: BookOpen },
      { id: 'reading_today', label: 'Lectura de Hoy', icon: Calendar },
      { id: 'reading_tracker', label: 'Mi Progreso', icon: CheckCircle2 }
    ]
  },

  // 5. AULA VIRTUAL & SUBPÁGINAS
  {
    pathPattern: '^/aula-virtual$',
    title: 'Aula Virtual',
    sections: [
      { id: 'lms_hero', label: 'Aula Virtual', icon: GraduationCap },
      { id: 'lms_portals', label: 'Accesos', icon: Users },
      { id: 'lms_courses', label: 'Cursos Destacados', icon: BookOpen },
      { id: 'lms_features', label: 'Beneficios & XP', icon: ShieldCheck }
    ]
  },
  {
    pathPattern: '^/programas/[^/]+$',
    title: 'Detalle de Programa',
    sections: [
      { id: 'program_hero', label: 'Programa', icon: GraduationCap },
      { id: 'program_curriculum', label: 'Módulos', icon: BookOpen },
      { id: 'program_docent', label: 'Docente', icon: Users },
      { id: 'program_enroll', label: 'Inscripción', icon: Send }
    ]
  },
  {
    pathPattern: '^/programas$',
    title: 'Catálogo de Programas',
    sections: [
      { id: 'programs_hero', label: 'Programas', icon: GraduationCap },
      { id: 'programs_categories', label: 'Categorías', icon: Compass },
      { id: 'programs_grid', label: 'Catálogo', icon: BookOpen }
    ]
  },

  // 6. TIENDA & SUBPÁGINAS
  {
    pathPattern: '^/tienda$',
    title: 'Tienda Jerusalén',
    sections: [
      { id: 'store_hero', label: 'Tienda', icon: ShoppingBag },
      { id: 'store_categories', label: 'Categorías', icon: Compass },
      { id: 'store_featured', label: 'Destacados', icon: Sparkles },
      { id: 'store_catalog', label: 'Catálogo', icon: ShoppingBag }
    ]
  },
  {
    pathPattern: '^/cart$',
    title: 'Carrito de Compras',
    sections: [
      { id: 'cart_hero', label: 'Mi Carrito', icon: ShoppingCart },
      { id: 'cart_items', label: 'Productos', icon: ShoppingBag },
      { id: 'cart_summary', label: 'Resumen', icon: CreditCard }
    ]
  },
  {
    pathPattern: '^/checkout$',
    title: 'Finalizar Pago',
    sections: [
      { id: 'checkout_hero', label: 'Pago', icon: CreditCard },
      { id: 'checkout_form', label: 'Datos de Envío', icon: Send },
      { id: 'checkout_confirm', label: 'Confirmación', icon: PackageCheck }
    ]
  },
  {
    pathPattern: '^/mis-compras$',
    title: 'Mis Compras',
    sections: [
      { id: 'purchases_hero', label: 'Mis Pedidos', icon: PackageCheck },
      { id: 'purchases_active', label: 'Pedidos Activos', icon: Clock },
      { id: 'purchases_history', label: 'Histórico', icon: CheckCircle2 }
    ]
  },

  // 7. CONTACTO
  {
    pathPattern: '^/contacto$',
    title: 'Contacto',
    sections: [
      { id: 'contact_hero', label: 'Contacto', icon: Send },
      { id: 'contact_info', label: 'Canales Directos', icon: MessageCircle },
      { id: 'contact_form', label: 'Enviar Mensaje', icon: Send },
      { id: 'contact_map', label: 'Ubicación', icon: MapPin }
    ]
  },

  // 8. MISIONES
  {
    pathPattern: '^/misiones.*$',
    title: 'Misiones',
    sections: [
      { id: 'missions_hero', label: 'Misiones Globales', icon: Globe },
      { id: 'missions_fields', label: 'Campos Misioneros', icon: MapPin },
      { id: 'missions_projects', label: 'Proyectos Activos', icon: Sparkles },
      { id: 'missions_support', label: 'Apoyo', icon: Heart },
      { id: 'missions_guide', label: 'Cómo leer los datos', icon: BookOpen }
    ]
  }
];

/**
 * Obtiene la lista de secciones para una ruta dada comparando con las expresiones regulares
 */
export function getSectionsForPath(pathname: string): { title: string; sections: SectionItem[] } | null {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  
  for (const config of PAGE_SECTIONS_CONFIG) {
    const regex = new RegExp(config.pathPattern, 'i');
    if (regex.test(cleanPath)) {
      return { title: config.title, sections: config.sections };
    }
  }

  return null;
}
