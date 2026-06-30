import type { PageSectionMetadata } from '../types';

export const PAGES_METADATA = {
  home: {
    name: 'Página de Inicio',
    sections: [
      { 
        id: 'home_hero', 
        name: 'Sección Principal (Héroe)', 
        defaultTitle: 'Bienvenido a la Iglesia Jerusalén',
        defaultSubtitle: 'Una Casa de Restauración y Bendición',
        description: 'Personaliza el mensaje principal de bienvenida, fondo y botones CTA.'
      },
      {
        id: 'home_gallery',
        name: 'Galería de Imágenes',
        defaultTitle: 'Nuestra Comunidad en Imágenes',
        defaultSubtitle: 'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.',
        description: 'Un carrusel interactivo que muestra fotografías de las actividades de la iglesia.'
      },
      { 
        id: 'home_welcome', 
        name: 'Nuestra Doctrina (4 Pilares)', 
        defaultTitle: 'Nuestra Doctrina',
        defaultSubtitle: 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.',
        description: 'Edita el texto introductorio de los cuatro pilares doctrinales.' 
      },
      { 
        id: 'home_schedules', 
        name: 'Horarios de Reunión', 
        defaultTitle: 'Horarios de Reunión',
        defaultSubtitle: 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!',
        description: 'Lista dinámica de horarios de servicio registrados en la iglesia.' 
      },
      { 
        id: 'home_events', 
        name: 'Próximos Eventos', 
        defaultTitle: 'Próximos Eventos',
        defaultSubtitle: 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.',
        description: 'Visualizador de los eventos más cercanos del calendario de la iglesia.' 
      },
      { 
        id: 'home_sermons', 
        name: 'Últimas Prédicas', 
        defaultTitle: 'Últimas Prédicas',
        defaultSubtitle: 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.',
        description: 'Listado de últimas prédicas grabadas en audio o video.' 
      },
      { 
        id: 'home_birthdays', 
        name: 'Cumpleaños de la Semana', 
        defaultTitle: 'Cumpleaños de la Semana',
        defaultSubtitle: 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!',
        description: 'Tarjetas dinámicas de los miembros que cumplen años en la semana.' 
      },
      { 
        id: 'home_donations', 
        name: 'Llamado a Ofrendas / Donativos', 
        defaultTitle: 'Apoya la Obra de Dios',
        defaultSubtitle: 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.',
        description: 'Personaliza la pancarta de invitación para diezmos y ofrendas.' 
      }
    ] as PageSectionMetadata[]
  },
  about: {
    name: 'Página "Nosotros"',
    sections: [
      { 
        id: 'about_hero', 
        name: 'Héroe Principal', 
        defaultTitle: 'Quiénes Somos',
        defaultSubtitle: 'Conoce la historia, misión y liderazgo de la Iglesia Jerusalén.',
        description: 'Configura la cabecera e introducción de la página de identidad.'
      },
      { 
        id: 'about_vision_mission', 
        name: 'Misión y Visión', 
        defaultTitle: 'Misión & Visión',
        defaultSubtitle: 'Nuestra guía en la expansión del evangelio.',
        description: 'Define de forma interactiva la declaración de propósito.'
      },
      { 
        id: 'about_history', 
        name: 'Nuestra Historia', 
        defaultTitle: 'Nuestra Historia',
        defaultSubtitle: 'La trayectoria y cimientos de la congregación.',
        description: 'Escribe y diseña la narrativa de la fundación de la iglesia.'
      },
      { 
        id: 'about_pillars', 
        name: 'Los 4 Pilares Cuadrangulares', 
        defaultTitle: 'Los 4 Pilares Cuadrangulares',
        defaultSubtitle: 'Fundamentados firmemente en el mensaje bíblico de la verdad eterna.',
        description: 'Visualizador interactivo de los principios de fe de la Iglesia Cuadrangular.' 
      },
      { 
        id: 'about_pastoral', 
        name: 'Liderazgo Pastoral', 
        defaultTitle: 'Liderazgo Pastoral',
        defaultSubtitle: 'Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.',
        description: 'Personaliza las biografías e imágenes de los pastores.'
      }
    ] as PageSectionMetadata[]
  }
};

export const SYSTEM_SECTION_OPTIONS = [
  { value: 'custom', label: 'Bloques de Contenido (Personalizada)' },
  { value: 'system_schedules', label: 'Especial: Horarios de Reunión' },
  { value: 'system_events', label: 'Especial: Próximos Eventos' },
  { value: 'system_sermons', label: 'Especial: Últimas Prédicas' },
  { value: 'system_birthdays', label: 'Especial: Cumpleaños de la Semana' },
  { value: 'system_gallery', label: 'Especial: Galería de Diapositivas' },
  { value: 'system_about_pillars', label: 'Especial: Los 4 Pilares Cuadrangulares' }
];
