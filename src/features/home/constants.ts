import type { PageSection } from './types';

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

export const DEFAULT_SECTIONS: PageSection[] = [
  { id: 'home_hero', section_type: 'custom', name: 'Sección Principal (Héroe)', title: 'Bienvenido a la Iglesia Jerusalén', subtitle: 'Una Casa de Restauración y Bendición', content_blocks: [] },
  { id: 'home_welcome', section_type: 'custom', name: 'Nuestra Doctrina (4 Pilares)', title: 'Nuestra Doctrina', subtitle: 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.', content_blocks: [] },
  { id: 'home_schedules', section_type: 'system_schedules', name: 'Horarios de Reunión', title: 'Horarios de Reunión', subtitle: 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!' },
  { id: 'home_events', section_type: 'system_events', name: 'Próximos Eventos', title: 'Próximos Eventos', subtitle: 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.' },
  { id: 'home_sermons', section_type: 'system_sermons', name: 'Últimas Prédicas', title: 'Últimas Prédicas', subtitle: 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.' },
  { id: 'home_gallery', section_type: 'system_gallery', name: 'Galería de Imágenes', title: 'Nuestra Comunidad en Imágenes', subtitle: 'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.', content_blocks: [] },
  { id: 'home_birthdays', section_type: 'system_birthdays', name: 'Cumpleaños de la Semana', title: 'Cumpleaños de la Semana', subtitle: 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!' },
  { id: 'home_donations', section_type: 'custom', name: 'Llamado a Ofrendas / Donativos', title: 'Apoya la Obra de Dios', subtitle: 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.', content_blocks: [] }
];
