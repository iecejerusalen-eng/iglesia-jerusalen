import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, ChevronRight, Lock, UserPlus, Cake, Church, ArrowRight } from 'lucide-react';

const memberSteps = [
  { n: '1', title: 'Ir a "Miembros"', desc: 'En Panel Admin → Comunidad y CRM → Miembros. Haz clic en el botón "+ Nuevo Miembro".' },
  { n: '2', title: 'Datos Personales', desc: 'Rellena nombre completo, correo, teléfono y fecha de nacimiento. El sistema calculará automáticamente los cumpleaños.' },
  { n: '3', title: 'Datos Espirituales', desc: 'Registra la fecha de bautismo, si es miembro formal o asistente, y el estado actual (Activo, Inactivo, Visitante).' },
  { n: '4', title: 'Asignar Ministerio', desc: 'Selecciona el ministerio o ministerios en los que sirve. Esto conecta su ficha con el líder del ministerio correspondiente.' },
  { n: '5', title: 'Guardar', desc: 'Al guardar, el miembro recibirá (opcionalmente) un correo de bienvenida con sus credenciales de acceso a la plataforma.' },
];

const petitionFlow = [
  { state: 'Enviada', color: 'bg-yellow-500', desc: 'El congregante envía su petición de oración.' },
  { state: 'En Oración', color: 'bg-blue-500', desc: 'El líder la recibe y el equipo de oración intercede.' },
  { state: 'Contestada', color: 'bg-green-500', desc: 'El congregante marca la petición como contestada.' },
];

export default function Section4Community({ onNext }: { onNext: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 mb-4 font-semibold text-sm">
          <HeartHandshake className="w-5 h-5" /> Comunidad CRM
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">El Corazón de la Iglesia</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El CRM de miembros, el sistema de peticiones de oración y la gestión de ministerios mantienen 
          a la congregación conectada con el liderazgo pastoral. Todo en un panel centralizado.
        </p>
      </div>

      {/* Step-by-step: Register new member */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-6 h-6 text-teal-500" />
          <h3 className="text-2xl font-bold dark:text-white">Guía: Registrar un Nuevo Miembro</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sigue estos pasos desde el Panel Admin.</p>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {memberSteps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-3 rounded-xl text-left transition-all ${activeStep === i ? 'bg-teal-600 text-white shadow-lg' : 'glass-panel hover:scale-105'}`}>
              <div className={`text-lg font-black mb-1 ${activeStep === i ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`}>0{s.n}</div>
              <div className={`text-xs font-bold leading-tight ${activeStep === i ? 'text-white' : 'dark:text-gray-200'}`}>{s.title}</div>
            </button>
          ))}
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border-l-4 border-l-teal-500">
          <h4 className="font-bold text-lg dark:text-white mb-2">Paso {memberSteps[activeStep].n}: {memberSteps[activeStep].title}</h4>
          <p className="text-gray-600 dark:text-gray-300">{memberSteps[activeStep].desc}</p>
        </motion.div>
      </div>

      {/* Birthday System + Prayer Petitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 w-full max-w-6xl">

        {/* Birthday System */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Cake className="w-7 h-7 text-pink-500" />
            <h3 className="text-xl font-bold dark:text-white">Sistema de Cumpleaños Automático</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            El sistema revisa diariamente la base de datos. Cuando detecta que un miembro cumple años, 
            realiza las siguientes acciones de forma automática:
          </p>
          <ul className="space-y-3">
            {[
              'Notifica por correo al Pastor/Líder asignado al miembro.',
              'Muestra el cumpleañero del día en el panel de inicio del admin.',
              'Opcionalmente, envía al miembro un mensaje de felicitación personalizado.',
              'El módulo público de "Cumpleaños" muestra los festejados del mes a la congregación.',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />{item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Petition Flow */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <HeartHandshake className="w-7 h-7 text-red-500" />
            <h3 className="text-xl font-bold dark:text-white">Flujo de Peticiones de Oración</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            El líder de oración gestiona las peticiones desde el Panel Admin y actualiza el estado.
          </p>
          <div className="flex flex-col gap-3">
            {petitionFlow.map((pf, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full ${pf.color} mt-1 flex-shrink-0`} />
                <div>
                  <div className="font-bold text-sm dark:text-white">{pf.state}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{pf.desc}</div>
                </div>
                {i < petitionFlow.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 ml-auto self-center" />}
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-red-500" />
              <h4 className="text-red-800 dark:text-red-400 font-bold text-sm">Peticiones Privadas (Sensibles)</h4>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">
              Si un congregante marca su petición como "Privada", la base de datos (Supabase RLS) 
              garantiza a nivel de servidor que SOLO los usuarios con rol "Pastor" pueden leerla. 
              Es completamente invisible para otros miembros y líderes de ministerio.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Ministry Management */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Church className="w-6 h-6 text-teal-500" />
          <h3 className="text-2xl font-bold dark:text-white">Gestión de Ministerios</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-2xl">
          Cada ministerio tiene su propia ficha con descripción, líder asignado y lista de miembros activos. 
          El administrador puede crear nuevos ministerios desde el panel en segundos.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Alabanza', 'Jóvenes', 'Misiones', 'Diaconado', 'Damas', 'Oración', 'Medios', 'Niños'].map((m, i) => (
            <div key={i} className="glass-panel px-4 py-3 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-sm font-medium dark:text-gray-200">{m}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-xl text-sm text-teal-800 dark:text-teal-300">
          <strong>Tip para Líderes:</strong> Al asignar a un miembro a un ministerio, ese miembro automáticamente aparece 
          en los reportes del líder del ministerio. El líder puede ver el progreso educativo y las peticiones de los miembros de su grupo.
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Juegos Bíblicos <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
