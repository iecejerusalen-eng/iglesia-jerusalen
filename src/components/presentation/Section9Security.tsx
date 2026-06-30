import { motion } from 'framer-motion';
import { ShieldCheck, BellRing, ChevronRight, UserCog, Send, BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Mock Data ---
const attendanceData = [
  { name: 'Ene', Presencial: 300, Online: 120 },
  { name: 'Feb', Presencial: 320, Online: 130 },
  { name: 'Mar', Presencial: 310, Online: 125 },
  { name: 'Abr', Presencial: 380, Online: 150 },
  { name: 'May', Presencial: 340, Online: 140 },
  { name: 'Jun', Presencial: 365, Online: 145 },
];

const demographicData = [
  { name: 'Jóvenes (18-25)', value: 120 },
  { name: 'Adultos (26-45)', value: 250 },
  { name: 'Mayores (46+)', value: 150 },
  { name: 'Niños (0-17)', value: 80 },
];
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const roles = [
  { role: 'Pastor', icon: '👑', perms: ['Acceso completo a todos los módulos', 'Ver peticiones privadas sensibles', 'Mapa estratégico y KPIs globales', 'Enviar notificaciones globales'] },
  { role: 'Administrador', icon: '⚙️', perms: ['Gestión de usuarios y roles', 'Todos los módulos excepto finanzas', 'Reportes y analíticas'] },
  { role: 'Tesorero', icon: '💰', perms: ['Dashboard financiero completo', 'Reportes de ingresos y gastos', 'Verificación de comprobantes'] },
];

const kpis = [
  { label: 'Asistencia Total', val: '510', trend: '+12%', icon: <Users className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Cursos (LMS)', val: '1,204', trend: '+24%', icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Crecimiento', val: '+45', trend: 'Nuevos', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Interacciones', val: '8.4k', trend: '+5%', icon: <BarChart3 className="w-5 h-5" />, color: 'text-[#C79D3F]', bg: 'bg-[#C79D3F]/10' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number | string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-lg shadow-xl border border-gray-100 dark:border-slate-800">
        <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Section9Security({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4 font-semibold text-sm">
          <BarChart3 className="w-5 h-5" /> Inteligencia de Datos (BI)
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Analíticas y Gobernanza
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Convierte los datos en decisiones pastorales. El tablero de Inteligencia de Negocios (BI) cruza 
          información de asistencia, educación y finanzas en tiempo real, protegido por estrictos controles de acceso (RBAC).
        </motion.p>
      </div>

      {/* KPIs Dashboard */}
      <div className="w-full max-w-6xl mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (i * 0.1) }}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between border-b-4 hover:-translate-y-1 transition-transform"
              style={{ borderBottomColor: kpi.color.replace('text-', '') }}>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-bold uppercase tracking-wider">{kpi.label}</div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{kpi.val}</div>
                <div className={`text-xs font-bold mt-1 ${kpi.color}`}>{kpi.trend} vs mes anterior</div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                {kpi.icon}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Charts Area */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Main Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="md:col-span-2 glass-panel p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-bold dark:text-white mb-2">Tendencia de Asistencia</h3>
          <p className="text-sm text-gray-500 mb-6">Comparativa de congregación presencial vs campus online (Últimos 6 meses)</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresencial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C79D3F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C79D3F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Presencial" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPresencial)" />
                <Area type="monotone" dataKey="Online" stroke="#C79D3F" strokeWidth={3} fillOpacity={1} fill="url(#colorOnline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Demographics Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-xl font-bold dark:text-white mb-2">Demografía</h3>
          <p className="text-sm text-gray-500 mb-2">Distribución por edades</p>
          <div className="flex-1 min-h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demographicData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {demographicData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold dark:text-white">600</span>
              <span className="text-xs text-gray-500">Miembros</span>
            </div>
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {demographicData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }}></span>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Security & Roles */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Roles Management */}
        <div className="glass-panel p-8 rounded-3xl border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <UserCog className="w-7 h-7 text-indigo-500" />
            <h3 className="text-2xl font-bold dark:text-white">Control de Acceso (RBAC)</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            La plataforma utiliza Políticas de Seguridad a Nivel de Fila (RLS) en Supabase. Un usuario solo puede leer y modificar los datos que su rol permite.
          </p>
          <div className="space-y-4">
            {roles.map((r, i) => (
              <div key={i} className="bg-gray-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{r.icon}</span>
                  <h4 className="font-bold dark:text-white">{r.role}</h4>
                </div>
                <ul className="space-y-1.5">
                  {r.perms.map((p, j) => (
                    <li key={j} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="glass-panel p-8 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <BellRing className="w-7 h-7 text-yellow-500" />
            <h3 className="text-2xl font-bold dark:text-white">Centro de Alertas (Web Push)</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            El Pastor puede enviar notificaciones instantáneas a los teléfonos móviles de los miembros sin necesidad de que tengan la app abierta.
          </p>
          
          <div className="space-y-3 mb-auto">
            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <div className="text-xl">⚠️</div>
              <div>
                <div className="font-bold text-sm text-red-700 dark:text-red-400">Alerta de Emergencia</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 italic">"El servicio presencial de hoy se cancela por clima. Nos vemos online."</div>
              </div>
            </div>
            <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
              <div className="text-xl">📢</div>
              <div>
                <div className="font-bold text-sm text-indigo-700 dark:text-indigo-400">Recordatorio Pastoral</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 italic">"Este domingo empezamos nueva serie. ¡Invita a un amigo!"</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <Send className="w-5 h-5 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Requiere PWA instalada y permisos de notificación aceptados en iOS/Android.
            </p>
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl hover:scale-105 transition-all">
        Ver Ministerios y Departamentos <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
