import type { Schedule, Sermon } from '../../types';

export const FALLBACK_SCHEDULES: Schedule[] = [
  { id: '1', day: 'Martes', title: 'Culto de Damas y Caballeros', time_range: '7:30pm - 9:00pm', description: 'Culto especial dirigido por el departamento de Damas y Caballeros.', order_index: 1, created_at: '' },
  { id: '2', day: 'Miércoles', title: 'Culto de Enseñanza', time_range: '7:30pm - 9:00pm', description: 'Estudio bíblico doctrinal para toda la congregación.', order_index: 2, created_at: '' },
  { id: '3', day: 'Jueves', title: 'Culto de Cadetes', time_range: '7:30pm - 9:00pm', description: 'Culto dinámico de adolescentes y pre-jóvenes.', order_index: 3, created_at: '' },
  { id: '4', day: 'Viernes', title: 'Culto en Células', time_range: '7:30pm - 9:00pm', description: 'Grupos pequeños reunidos en los hogares.', order_index: 4, created_at: '' },
  { id: '5', day: 'Sábado', title: 'Culto de Jóvenes', time_range: '7:30pm - 9:00pm', description: 'Servicio vibrante dirigido por el departamento de Jóvenes.', order_index: 5, created_at: '' },
  { id: '6', day: 'Domingo', title: '1ra Plenaria', time_range: '8:00am - 9:30am', description: 'Primer culto general de adoración.', order_index: 6, created_at: '' },
  { id: '7', day: 'Domingo', title: '2da Plenaria', time_range: '10:00am - 11:30am', description: 'Segundo culto general de adoración.', order_index: 7, created_at: '' }
];

export const MOCK_SERMONS: Sermon[] = [
  { id: '1', title: 'Caminando en Fe', pastor_name: 'Pastor David Nicola', youtube_url: 'https://youtube.com', content: '', created_at: '2026-06-07T00:00:00Z' },
  { id: '2', title: 'El Poder de la Oración', pastor_name: 'Pastora Corina Miranda', youtube_url: 'https://youtube.com', content: '', created_at: '2026-05-31T00:00:00Z' }
];

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const BIRTHDAY_VERSES = [
  { text: "Que te conceda lo que tu corazón desea; que haga que se cumplan todos tus planes.", ref: "Salmo 20:4" },
  { text: "El Señor te bendiga y te guarde; el Señor haga resplandecer su rostro sobre ti y tenga de ti misericordia.", ref: "Números 6:24-25" },
  { text: "Enséñanos a contar de tal modo nuestros días, que traigamos al corazón sabiduría.", ref: "Salmo 90:12" },
  { text: "Porque por mí se multiplicarán tus días, y años de vida se te añadirán.", ref: "Proverbios 9:11" },
  { text: "Deleítate asimismo en Jehová, y él te concederá las peticiones de tu corazón.", ref: "Salmo 37:4" },
  { text: "Jehová tu Dios está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría.", ref: "Sofonías 3:17" },
  { text: "Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano.", ref: "Efesios 2:10" },
  { text: "En tu mano están mis tiempos; líbrame de la mano de mis enemigos y de mis perseguidores.", ref: "Salmo 31:15" }
];

export const DEFAULT_SECTIONS = [
  { id: 'home_hero', section_type: 'custom', name: 'Sección Principal (Héroe)', title: 'Bienvenido a la Iglesia Jerusalén', subtitle: 'Una Casa de Restauración y Bendición', content_blocks: [] },
  { id: 'home_welcome', section_type: 'custom', name: 'Nuestra Doctrina (4 Pilares)', title: 'Nuestra Doctrina', subtitle: 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.', content_blocks: [] },
  { id: 'home_schedules', section_type: 'system_schedules', name: 'Horarios de Reunión', title: 'Horarios de Reunión', subtitle: 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!' },
  { id: 'home_events', section_type: 'system_events', name: 'Próximos Eventos', title: 'Próximos Eventos', subtitle: 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.' },
  { id: 'home_sermons', section_type: 'system_sermons', name: 'Últimas Prédicas', title: 'Últimas Prédicas', subtitle: 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.' },
  {
    id: 'home_gallery', section_type: 'system_gallery', name: 'Galería de Imágenes', title: 'Nuestra Comunidad en Imágenes', subtitle: 'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.', content_blocks: [
      {
        id: 'slide_1',
        url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=1200',
        caption: 'Alabanza y adoración congregacional',
        category: 'Adoración'
      },
      {
        id: 'slide_2',
        url: 'https://images.unsplash.com/photo-1504052434569-7c9302e09150?auto=format&fit=crop&q=80&w=1200',
        caption: 'Tiempo de enseñanza y estudio de la Palabra',
        category: 'Enseñanza'
      },
      {
        id: 'slide_3',
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200',
        caption: 'Comunión fraternal de los miembros',
        category: 'Comunidad'
      },
      {
        id: 'slide_4',
        url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
        caption: 'Grupos de crecimiento en hogares (Células)',
        category: 'Comunidad'
      },
      {
        id: 'slide_5',
        url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1200',
        caption: 'Escuela Dominical y formación en la fe',
        category: 'Niños'
      },
      {
        id: 'slide_6',
        url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=1200',
        caption: 'Proyectos de ayuda y servicio a la comunidad',
        category: 'Servicio'
      }
    ]
  },
  { id: 'home_birthdays', section_type: 'system_birthdays', name: 'Cumpleaños de la Semana', title: 'Cumpleaños de la Semana', subtitle: 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!' },
  { id: 'home_donations', section_type: 'custom', name: 'Llamado a Ofrendas / Donativos', title: 'Apoya la Obra de Dios', subtitle: 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.', content_blocks: [] }
];
