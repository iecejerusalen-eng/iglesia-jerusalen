import { Music, Users, Shield, Globe, Award, Sparkles } from 'lucide-react';

const MINISTRIES = [
  {
    name: 'Ministerio de Alabanza',
    icon: <Music size={24} />,
    description: 'Buscamos guiar a la congregación a una adoración profunda y genuina a través de la música y el canto, fomentando un altar de adoración en espíritu y en verdad.',
    schedule: 'Ensayos: Jueves 6:30pm | Servicio: Domingos',
    leader: 'Hno. David Martínez',
    color: 'bg-primary/10 text-primary dark:text-white border-primary/20'
  },
  {
    name: 'Jóvenes (Generación Fuego)',
    icon: <Users size={24} />,
    description: 'Un espacio dinámico para adolescentes y jóvenes, donde fortalecen su fe, comparten comunión fraternal, y son equipados como líderes para impactar su generación.',
    schedule: 'Reunión: Sábados 7:30pm',
    leader: 'Líderes Esteban y Sofía Vega',
    color: 'bg-accent-red/10 text-accent-red border-accent-red/20'
  },
  {
    name: 'Niños (Semillas de Fe)',
    icon: <Sparkles size={24} />,
    description: 'Enseñamos los principios eternos de la Biblia a los más pequeños en un lenguaje interactivo, alegre y adaptado a sus edades, sembrando valores cristianos sólidos.',
    schedule: 'Clases: Domingos 9:40am (Escuela Dominical)',
    leader: 'Hna. Raquel de Morales',
    color: 'bg-gold/10 text-gold border-gold/20'
  },
  {
    name: 'Damas & Caballeros',
    icon: <Shield size={24} />,
    description: 'Enfoque integral en el fortalecimiento del matrimonio, la paternidad espiritual y talleres prácticos de edificación para mujeres y hombres conforme al corazón de Dios.',
    schedule: 'Reunión: Martes alternos 7:30pm',
    leader: 'Diáconos Carlos y María Fuentes',
    color: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
  },
  {
    name: 'Misiones & Células',
    icon: <Globe size={24} />,
    description: 'Coordinamos la plantación de iglesias filiales, apoyo social directo en comunidades vulnerables y la visitación de células familiares en los diferentes vecindarios.',
    schedule: 'Células: Viernes en casas 7:30pm',
    leader: 'Pastor Roberto Gómez',
    color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
  }
];

const Ministries = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Users size={200} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Iglesia Activa
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Nuestros Ministerios</h1>
          <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light">
            Encuentra tu lugar de crecimiento, comunión y servicio. Hay un ministerio diseñado especialmente para ti y cada miembro de tu familia.
          </p>
        </div>
      </div>

      {/* LISTA DE MINISTERIOS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MINISTRIES.map((min, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${min.color} group-hover:scale-105 transition-transform`}>
                {min.icon}
              </div>
              <h3 className="font-serif font-bold text-xl text-gray-800 dark:text-gray-100">
                {min.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                {min.description}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/10 text-xs text-gray-400 dark:text-gray-550 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Horarios:</span>
                <span className="text-gray-700 dark:text-gray-300 font-bold">{min.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span>Responsable:</span>
                <span className="text-gray-600 dark:text-gray-350">{min.leader}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* INVITACION A SERVIR */}
      <section className="max-w-4xl mx-auto bg-surface/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center space-y-6">
        <div className="w-12 h-12 bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-300 rounded-full flex items-center justify-center mx-auto">
          <Award size={24} />
        </div>
        <h3 className="font-serif font-bold text-2xl text-primary dark:text-white">¿Deseas Servir a Dios con tus Dones?</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-xl mx-auto">
          Dios nos ha llamado a ser administradores de los dones que nos ha dado. Si sientes el deseo de integrarte a algún ministerio como colaborador activo, acércate a los líderes correspondientes o contáctanos directamente.
        </p>
        <a 
          href="/contacto" 
          className="px-6 py-2.5 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs inline-block"
        >
          Ponte en Contacto
        </a>
      </section>

    </div>
  );
};

export default Ministries;
