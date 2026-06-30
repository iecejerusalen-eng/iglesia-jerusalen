import { useState } from 'react';
import { Layers, BookOpen, Users, Sparkles } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ChartSkeleton } from '../../../components/common/Skeletons';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { CustomTooltip } from './CustomTooltip';
import { COLORS } from '../constants';
import type { 
  AgeDataPoint, AreaDataPoint, TalentDataPoint, 
  TalentCategoryDataPoint, BaptismDataPoint 
} from '../types';

interface DashboardChartsProps {
  loading: boolean;
  areasData: AreaDataPoint[];
  talentCategoriesData: TalentCategoryDataPoint[];
  talentsData: TalentDataPoint[];
  ageData: AgeDataPoint[];
  baptismsData: BaptismDataPoint[];
}

export const DashboardCharts = ({
  loading,
  areasData,
  talentCategoriesData,
  talentsData,
  ageData,
  baptismsData
}: DashboardChartsProps) => {
  const [skillsTab, setSkillsTab] = useState<'individual' | 'categories'>('categories');

  return (
    <AnimeFadeUp delay={100} duration={800} className="lg:col-span-2 space-y-6">
      
      {/* Chart Row 1: Service Areas & Skills (categorized/individual tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Areas */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
            <Layers size={16} className="text-gold" />
            Miembros por Área de Servicio
          </h3>
          <div className="h-60 mt-2">
            {loading ? (
              <ChartSkeleton />
            ) : areasData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={areasData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAreas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.15}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-50 dark:opacity-10" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="miembros" name="miembros" fill="url(#colorAreas)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-semibold">Sin datos de áreas</div>
            )}
          </div>
        </div>

        {/* Talent distribution with Category/Individual tabs */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <BookOpen size={16} className="text-gold" />
              Habilidades y Talentos
            </h3>
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSkillsTab('categories')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  skillsTab === 'categories' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-3xs' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setSkillsTab('individual')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  skillsTab === 'individual' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-3xs' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Detallado
              </button>
            </div>
          </div>

          <div className="h-60 flex justify-center items-center mt-2">
            {loading ? (
              <ChartSkeleton />
            ) : skillsTab === 'categories' ? (
              // Categories Donut Chart
              talentCategoriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={talentCategoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {talentCategoriesData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-semibold">Sin categorías de talentos</div>
              )
            ) : (
              // Individual Bar Chart
              talentsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={talentsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTalents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-50 dark:opacity-10" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="cantidad" fill="url(#colorTalents)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-semibold">Sin talentos detallados</div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Chart Row 2: Age Demographics & Baptism Line/Area Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Age Brackets */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
            <Users size={16} className="text-gold" />
            Rangos de Edad en la Iglesia
          </h3>
          <div className="h-60 mt-2">
            {loading ? (
              <ChartSkeleton />
            ) : ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.25}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-50 dark:opacity-10" />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" name="cantidad" fill="url(#colorAges)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-semibold">Sin datos de edades</div>
            )}
          </div>
        </div>

        {/* Baptisms Growth Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
            <Sparkles size={16} className="text-gold animate-pulse" />
            Historial de Bautismos en Aguas
          </h3>
          <div className="h-60 mt-2">
            {loading ? (
              <ChartSkeleton />
            ) : baptismsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={baptismsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaptisms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10D38E" stopOpacity={0.45}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="opacity-50 dark:opacity-10" />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cantidad" 
                    name="Bautizados" 
                    stroke="#10D38E" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorBaptisms)" 
                    activeDot={{ r: 6, fill: '#10D38E', strokeWidth: 2, stroke: '#fff' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-455 dark:text-gray-500 font-semibold">Sin bautismos registrados</div>
            )}
          </div>
        </div>
      </div>
    </AnimeFadeUp>
  );
};
