import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Clock, TrendingUp, Trophy, Target } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

const mockStudyData = [
  { name: 'Lun', horas: 2.5, lecciones: 3 },
  { name: 'Mar', horas: 1.0, lecciones: 1 },
  { name: 'Mié', horas: 3.5, lecciones: 4 },
  { name: 'Jue', horas: 0, lecciones: 0 },
  { name: 'Vie', horas: 4.2, lecciones: 5 },
  { name: 'Sáb', horas: 1.5, lecciones: 2 },
  { name: 'Dom', horas: 0.5, lecciones: 1 },
];

const mockProgressData = [
  { mes: 'Ene', progreso: 10 },
  { mes: 'Feb', progreso: 25 },
  { mes: 'Mar', progreso: 45 },
  { mes: 'Abr', progreso: 50 },
  { mes: 'May', progreso: 75 },
  { mes: 'Jun', progreso: 90 },
];

export function StudentStatsTab() {
  return (
    <AnimeFadeUp className="space-y-6">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: 'Horas Totales', value: '13.2h', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Target, label: 'Lecciones Completadas', value: '16', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: TrendingUp, label: 'Racha Actual', value: '3 Días', color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: Trophy, label: 'Promedio Calificaciones', value: '92/100', color: 'text-gold', bg: 'bg-gold/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas de Estudio (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Horas de Estudio (Esta semana)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStudyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="horas" fill="#c39d67" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progreso Histórico (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Progreso Histórico (Últimos 6 meses)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockProgressData}>
                <defs>
                  <linearGradient id="colorProgreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="progreso" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProgreso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </AnimeFadeUp>
  );
}
