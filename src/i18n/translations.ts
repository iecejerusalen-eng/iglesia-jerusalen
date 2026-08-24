export type Language = 'es' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Nosotros',
    'nav.sermons': 'Predicas',
    'nav.podcast': 'Podcast',
    'nav.events': 'Eventos',
    'nav.giving': 'Donaciones',
    'nav.community': 'Comunidad',
    'nav.store': 'Tienda',
    'nav.lms': 'Aula Virtual',
    'nav.contact': 'Contacto',
    'nav.admin': 'Panel Admin',
    
    // Header & Buttons
    'header.welcome': 'Bienvenido a Iglesia Jerusalén',
    'header.language': 'Idioma',
    'btn.give_now': 'Ofrendar Ahora',
    'btn.join_group': 'Unirse a un Grupo',
    'btn.watch_live': 'Ver en Vivo',
    'btn.save': 'Guardar',
    'btn.cancel': 'Cancelar',
    'btn.submit': 'Enviar',
    
    // Community Feed
    'community.title': 'Muro de la Comunidad',
    'community.subtitle': 'Testimonios, peticiones y noticias de la familia en la fe.',
    'community.share_prompt': 'Comparte un testimonio, noticia o palabra de ánimo...',
    'community.post_btn': 'Publicar en la Comunidad',
    'community.all_categories': 'Todas las categorías',
    'community.testimonies': 'Testimonios',
    'community.prayers': 'Peticiones',
    'community.announcements': 'Anuncios',

    // Giving & Recurring
    'giving.title': 'Generosidad y Aportes',
    'giving.one_time': 'Donación Única',
    'giving.recurring': 'Donación Recurrente',
    'giving.frequency': 'Frecuencia de Aporte',
    'giving.weekly': 'Semanal',
    'giving.biweekly': 'Quincenal',
    'giving.monthly': 'Mensual',
    'giving.tax_statement': 'Descargar Certificado Fiscal (PDF)',

    // Admin & Metrics
    'admin.dashboard': 'Resumen Ejecutivo',
    'admin.families': 'Gestión de Familias',
    'admin.child_checkin': 'Check-In Seguro Infantil',
    'admin.forms': 'Constructor de Formularios',
    'admin.pastoral_health': 'Salud Pastoral & Analíticas',
    'admin.campuses': 'Gestión de Sedes (Campuses)',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.sermons': 'Sermons',
    'nav.podcast': 'Podcast',
    'nav.events': 'Events',
    'nav.giving': 'Giving',
    'nav.community': 'Community',
    'nav.store': 'Store',
    'nav.lms': 'Virtual Campus',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin Panel',

    // Header & Buttons
    'header.welcome': 'Welcome to Jerusalem Church',
    'header.language': 'Language',
    'btn.give_now': 'Give Now',
    'btn.join_group': 'Join a Group',
    'btn.watch_live': 'Watch Live',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.submit': 'Submit',

    // Community Feed
    'community.title': 'Community Wall',
    'community.subtitle': 'Testimonies, prayer requests and updates from our family in faith.',
    'community.share_prompt': 'Share a testimony, news or encouraging word...',
    'community.post_btn': 'Post to Community',
    'community.all_categories': 'All Categories',
    'community.testimonies': 'Testimonies',
    'community.prayers': 'Prayer Requests',
    'community.announcements': 'Announcements',

    // Giving & Recurring
    'giving.title': 'Generosity & Giving',
    'giving.one_time': 'One-Time Gift',
    'giving.recurring': 'Recurring Gift',
    'giving.frequency': 'Giving Frequency',
    'giving.weekly': 'Weekly',
    'giving.biweekly': 'Bi-Weekly',
    'giving.monthly': 'Monthly',
    'giving.tax_statement': 'Download Tax Statement (PDF)',

    // Admin & Metrics
    'admin.dashboard': 'Executive Overview',
    'admin.families': 'Family Management',
    'admin.child_checkin': 'Child Safety Check-In',
    'admin.forms': 'Dynamic Form Builder',
    'admin.pastoral_health': 'Pastoral Health & Analytics',
    'admin.campuses': 'Campus Management',
  },
};
