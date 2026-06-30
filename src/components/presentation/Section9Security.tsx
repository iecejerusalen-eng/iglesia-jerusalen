import { motion } from 'framer-motion';
import { ShieldCheck, BellRing, Network, ChevronRight, UserCog, Send } from 'lucide-react';

const roles = [
  { role: 'Pastor', icon: '👑', perms: ['Acceso completo a todos los módulos', 'Ver peticiones privadas sensibles', 'Mapa estratégico y KPIs globales', 'Enviar notificaciones globales', 'Gestión de todos los roles'] },
  { role: 'Administrador', icon: '⚙️', perms: ['Gestión de usuarios y roles', 'Todos los módulos excepto finanzas privadas', 'Reportes y analíticas', 'Configuración del sistema'] },
  { role: 'Tesorero', icon: '💰', perms: ['Dashboard financiero completo', 'Reportes de ingresos y gastos', 'Gestión de órdenes de la tienda', 'Verificación de comprobantes'] },
  { role: 'Líder de Ministerio', icon: '🌟', perms: ['Ver miembros de su ministerio', 'Production Board (lectura)', 'Inventario de su área', 'LMS: ver avance de su grupo'] },
];

const kpis = [
  { label: 'Asistencia Promedio', val: '342', trend: '+8%', color: 'text-green-500' },
  { label: 'Miembros Activos', val: '218', trend: '+12%', color: 'text-blue-500' },
  { label: 'Cursos Completados', val: '67', trend: '+24%', color: 'text-purple-500' },
  { label: 'Bautismos del Año', val: '23', trend: '+3', color: 'text-[#C79D3F]' },
];

export default function Section9Security({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 mb-4 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5" /> Gobernanza de Datos
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Analíticas y Seguridad</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El nivel más alto de gestión. El Pastor y el equipo de liderazgo tienen acceso a indicadores 
          clave de salud de la iglesia y pueden gestionar los permisos de cada usuario desde un panel centralizado.
        </p>
      </div>

      {/* KPIs Dashboard */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-6 h-6 text-red-500" />
          <h3 className="text-2xl font-bold dark:text-white">Mapa Estratégico — Indicadores Clave (KPIs)</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
          El Pastor puede ver en una sola pantalla el pulso de la iglesia: asistencia, crecimiento, 
          educación y más. Los datos se actualizan en tiempo real.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="glass-panel p-5 rounded-2xl">
              <div className={`text-3xl font-extrabold ${kpi.color} mb-1`}>{kpi.val}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{kpi.label}</div>
              <div className={`text-xs font-bold ${kpi.color}`}>{kpi.trend} este mes</div>
            </motion.div>
          ))}
        </div>
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-sm text-gray-600 dark:text-gray-300">
          <strong>¿Cómo interpretar el Mapa Estratégico?</strong> Si la asistencia sube pero los cursos completados bajan, 
          puede indicar que se necesita promover más el Aula Virtual. Si los bautismos suben, 
          es indicador de evangelismo efectivo. El sistema cruza estos datos automáticamente.
        </div>
      </div>

      {/* Roles Management */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="w-6 h-6 text-blue-500" />
          <h3 className="text-2xl font-bold dark:text-white">Gestión de Roles (RBAC)</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Haz clic en un rol para ver sus permisos detallados. Para asignar un rol: Panel Admin → Usuarios → Seleccionar miembro → Cambiar Rol.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{r.icon}</span>
                <h4 className="text-lg font-bold dark:text-white">{r.role}</h4>
              </div>
              <ul className="space-y-2">
                {r.perms.map((p, j) => (
                  <li key={j} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-green-500 mt-0.5">✓</span>{p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="w-full max-w-6xl mb-12">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <BellRing className="w-7 h-7 text-[#C79D3F]" />
            <h3 className="text-2xl font-bold dark:text-white">Centro de Notificaciones Globales</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            El Pastor o Administrador puede enviar alertas instantáneas a toda la congregación mediante 
            Web Push (PWA). Útil para anuncios urgentes, cancelaciones o convocatorias especiales.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { title: 'Anuncio de Servicio', example: '"El culto del domingo comienza a las 10 AM. ¡Te esperamos!"', icon: '📢' },
              { title: 'Alerta de Emergencia', example: '"El servicio de hoy ha sido cancelado por condiciones climáticas."', icon: '⚠️' },
              { title: 'Recordatorio de Evento', example: '"El Congreso Juvenil es mañana. ¡No faltes!"', icon: '🎉' },
            ].map((n, i) => (
              <div key={i} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                <div className="text-2xl mb-2">{n.icon}</div>
                <div className="font-bold text-sm dark:text-white mb-1">{n.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">"{n.example}"</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#C79D3F]/10 border border-[#C79D3F]/20 rounded-xl">
            <Send className="w-4 h-4 text-[#C79D3F]" />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Las notificaciones funcionan incluso cuando el usuario no tiene la app abierta (tecnología PWA Web Push). 
              Requiere que el usuario haya aceptado los permisos de notificación en su dispositivo.
            </p>
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Arquitectura Técnica <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
