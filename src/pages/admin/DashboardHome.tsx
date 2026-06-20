import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import { 
  Users, Heart, ArrowRight, Activity, 
  Gift, Sparkles, BookOpen, Layers, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ChartSkeleton } from '../../components/common/Skeletons';
import { usePermissions } from '../../hooks/usePermissions';
import { MODULE_GROUPS, ADMIN_MODULES } from '../../config/adminModules';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORS = ['#1e3a8a', '#d97706', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

const BIBLE_VERSES = [
  "Jehová te bendiga y te guarde; Jehová haga resplandecer su rostro sobre ti... (Números 6:24-25)",
  "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz y no de mal... (Jeremías 29:11)",
  "El Señor es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar... (Salmo 23:1-2)",
  "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón. (Salmo 37:4)",
  "Gracia y paz os sean multiplicadas, en el conocimiento de Dios y de nuestro Señor Jesús. (2 Pedro 1:2)"
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold">
        <p className="font-serif font-bold text-gold mb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || '#D4AF37' }}></div>
            <span className="text-gray-300 capitalize">{item.name === 'cantidad' ? 'Cantidad' : item.name === 'miembros' ? 'Miembros' : item.name}:</span>
            <span className="font-mono font-bold text-white ml-auto">{item.value !== undefined ? (typeof item.value === 'number' && item.value > 1000 ? `$${item.value.toLocaleString()}` : item.value) : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardHome = () => {
  const { user, firstName, userRole } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState({
    usersCount: 0,
    sermonsCount: 0,
    totalDonationsAmount: 0,
    membersCount: 0,
    leadersCount: 0,
    inventoryCount: 0,
    inventoryValue: 0,
    petitionsCount: 0,
    pendingPetitions: 0,
    ministriesCount: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart Data States
  const [ageData, setAgeData] = useState<any[]>([]);
  const [areasData, setAreasData] = useState<any[]>([]);
  const [talentsData, setTalentsData] = useState<any[]>([]);
  const [talentCategoriesData, setTalentCategoriesData] = useState<any[]>([]);
  const [baptismsData, setBaptismsData] = useState<any[]>([]);

  // Active chart tab for skills card
  const [skillsTab, setSkillsTab] = useState<'individual' | 'categories'>('categories');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch counts
      const [
        profilesRes,
        sermonsRes,
        donationsRes,
        membersRes,
        inventoryRes,
        petitionsRes,
        ministriesRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sermons').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('amount'),
        supabase.from('members')
        .select(`
          *,
          member_emails(email),
          member_service_areas(catalog_roles(name)),
          member_talents(catalog_roles(name)),
          member_spiritual_gifts(catalog_roles(name))
        `),
        supabase.from('inventory_items').select('price, quantity'),
        supabase.from('petitions').select('status'),
        supabase.from('ministries').select('*', { count: 'exact', head: true })
      ]);

      const donations = donationsRes.data || [];
      const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const members = membersRes.data || [];
      const leadersCount = members.filter(m => m.is_leader).length;

      const inventory = inventoryRes.data || [];
      const inventoryCount = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const inventoryValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      const petitions = petitionsRes.data || [];
      const petitionsCount = petitions.length;
      const pendingPetitions = petitions.filter(p => p.status === 'pendiente').length;

      setStats({
        usersCount: profilesRes.count || 0,
        sermonsCount: sermonsRes.count || 0,
        totalDonationsAmount: totalAmount,
        membersCount: members.length,
        leadersCount,
        inventoryCount,
        inventoryValue,
        petitionsCount,
        pendingPetitions,
        ministriesCount: ministriesRes.count || 0,
      });

      // 2. Process Weekly Alerts (Birthdays and Conversion anniversaries)
      const weeklyAlerts = getWeeklyAlerts(members);
      setAlerts(weeklyAlerts);

      // 3. Process Chart Data
      processChartData(members);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyAlerts = (membersList: any[]) => {
    const today = new Date();
    const list: any[] = [];

    membersList.forEach(m => {
      if (m.birth_date) {
        const birth = new Date(m.birth_date);
        const bDayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        // Calculate difference in days
        const diffTime = bDayThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= -1 && diffDays <= 7) {
          list.push({
            id: `${m.id}-bday`,
            name: `${m.first_name} ${m.last_name}`,
            type: 'birthday',
            dateLabel: `${birth.getDate()} de ${MONTHS[birth.getMonth()]}`,
            verse: BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)]
          });
        }
      }

      if (m.conversion_date) {
        const conv = new Date(m.conversion_date);
        const cDayThisYear = new Date(today.getFullYear(), conv.getMonth(), conv.getDate());
        
        const diffTime = cDayThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= -1 && diffDays <= 7) {
          const years = today.getFullYear() - conv.getFullYear();
          list.push({
            id: `${m.id}-faith`,
            name: `${m.first_name} ${m.last_name}`,
            type: 'faith',
            dateLabel: `${conv.getDate()} de ${MONTHS[conv.getMonth()]}`,
            years: years > 0 ? `${years} años de fe` : 'Aniversario',
            verse: BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)]
          });
        }
      }
    });

    return list;
  };

  const processChartData = (membersList: any[]) => {
    const today = new Date();
    const ages: number[] = [];
    const areaCounts: { [key: string]: number } = {};
    const talentCounts: { [key: string]: number } = {};
    const talentCategoryCounts: { [key: string]: number } = {};
    const baptismYearCounts: { [key: string]: number } = {};

    membersList.forEach(m => {
      // 1. Age calculation
      if (m.birth_date) {
        const birth = new Date(m.birth_date);
        const age = today.getFullYear() - birth.getFullYear();
        ages.push(age);
      }

      // 2. Service areas tally
      if (m.member_service_areas) {
        m.member_service_areas.forEach((sa: any) => {
          if (sa.catalog_roles) {
            const name = sa.catalog_roles.name;
            areaCounts[name] = (areaCounts[name] || 0) + 1;
          }
        });
      }

      // 3. Talents tally (detailed and grouped by category)
      if (m.member_talents) {
        m.member_talents.forEach((t: any) => {
          if (t.catalog_roles) {
            const name = t.catalog_roles.name;
            // Extract clean name
            const displayName = name.replace(/^\[.*?\]\s*/, '');
            talentCounts[displayName] = (talentCounts[displayName] || 0) + 1;

            // Extract category prefix
            const match = name.match(/^\[(.*?)\]\s*(.*)$/);
            const category = match ? match[1] : 'Otros';
            talentCategoryCounts[category] = (talentCategoryCounts[category] || 0) + 1;
          }
        });
      }

      // 4. Baptism progression
      if (m.baptism_date) {
        const year = new Date(m.baptism_date).getFullYear().toString();
        baptismYearCounts[year] = (baptismYearCounts[year] || 0) + 1;
      }
    });

    // Format Age groups
    const groups = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
    ages.forEach(age => {
      if (age <= 18) groups['0-18']++;
      else if (age <= 30) groups['19-30']++;
      else if (age <= 50) groups['31-50']++;
      else if (age <= 70) groups['51-70']++;
      else groups['70+']++;
    });

    setAgeData(Object.entries(groups).map(([range, count]) => ({ range, cantidad: count })));

    // Format Service Areas
    setAreasData(Object.entries(areaCounts).map(([name, value]) => ({ name, miembros: value })));

    // Format Talents (Detailed)
    setTalentsData(Object.entries(talentCounts)
      .sort((a, b) => b[1] - a[1]) // Sort desc
      .slice(0, 8) // Limit to top 8
      .map(([name, value]) => ({ name, value })));

    // Format Talents (Categories)
    setTalentCategoriesData(Object.entries(talentCategoryCounts).map(([name, value]) => ({ name, value })));

    // Format Baptisms
    const sortedBaptisms = Object.entries(baptismYearCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, count]) => ({ year, cantidad: count }));
    setBaptismsData(sortedBaptisms);
  };

  const displayName = firstName ? `${firstName}` : user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      
      {/* Welcome Hero & Bible Verse Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0B1530] via-[#102046] to-[#1e3a8a] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center border border-white/5">
          <div className="absolute right-0 bottom-0 opacity-5 flex items-center justify-center pointer-events-none -mr-8 -mb-8">
            <Activity size={240} />
          </div>
          <div className="relative z-10 space-y-3">
            <span className="inline-flex bg-gold/15 text-gold border border-gold/30 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
              Consola Central CRM & BI
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              ¡Hola, {displayName}!
            </h1>
            <p className="text-gray-305 text-sm max-w-xl font-medium leading-relaxed">
              Bienvenido al Centro de Control de la Iglesia Jerusalén. Monitorea el crecimiento espiritual, analiza talentos, gestiona el inventario físico y mantén al día la comunidad en tiempo real.
            </p>
          </div>
        </div>

        {/* Versiculo de la Semana */}
        <div className="bg-gradient-to-br from-[#D4AF37]/5 via-white dark:via-slate-900 to-white dark:to-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-gold/10 font-serif text-8xl pointer-events-none select-none">
            “
          </div>
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Promesa Bíblica Diaria</span>
            <p className="text-xs font-serif italic text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
              {BIBLE_VERSES[stats.membersCount % BIBLE_VERSES.length]}
            </p>
          </div>
          <div className="border-t border-gray-100 dark:border-white/10 pt-3 mt-4 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-gold animate-pulse" />
            Edificando en sana doctrina
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members CRM */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:translate-y-[-2px] hover:shadow-xs transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Membresía CRM</span>
            {loading ? (
              <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
            ) : (
              <div>
                <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.membersCount}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Líderes activos: {stats.leadersCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Donaciones */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:translate-y-[-2px] hover:shadow-xs transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 text-gold dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center shrink-0">
            <Heart size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Finanzas Totales</span>
            {loading ? (
              <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
            ) : (
              <div>
                <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">${stats.totalDonationsAmount.toLocaleString('es-EC', { maximumFractionDigits: 0 })}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Donaciones registradas</span>
              </div>
            )}
          </div>
        </div>

        {/* Peticiones */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:translate-y-[-2px] hover:shadow-xs transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50/70 dark:bg-red-950/20 text-accent-red dark:text-red-400 border border-rose-100 dark:border-red-900/30 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Peticiones Oración</span>
            {loading ? (
              <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
            ) : (
              <div>
                <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.petitionsCount}</span>
                <span className="text-[9px] text-accent-red block font-bold mt-0.5">Pendientes de oración: {stats.pendingPetitions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Patrimonio e Inventario */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:translate-y-[-2px] hover:shadow-xs transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 text-accent-purple dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Activos e Inventario</span>
            {loading ? (
              <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
            ) : (
              <div>
                <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.inventoryCount} uds</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-bold mt-0.5">Valor estimado: ${stats.inventoryValue.toLocaleString('es-EC', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHARTS CONTAINER (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
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
                          <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.85}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25}/>
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
                      skillsTab === 'categories' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-3xs' : 'text-gray-400 dark:text-gray-500 hover:text-gray-650'
                    }`}
                  >
                    Categorías
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillsTab('individual')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      skillsTab === 'individual' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-3xs' : 'text-gray-400 dark:text-gray-500 hover:text-gray-655'
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
                    <div className="h-full flex items-center justify-center text-xs text-gray-450 dark:text-gray-500 font-semibold">Sin categorías de talentos</div>
                  )
                ) : (
                  // Individual Bar Chart
                  talentsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={talentsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTalents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity={0.85}/>
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.25}/>
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
                    <div className="h-full flex items-center justify-center text-xs text-gray-450 dark:text-gray-500 font-semibold">Sin talentos detallados</div>
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
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
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
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorBaptisms)" 
                        activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-450 dark:text-gray-500 font-semibold">Sin bautismos registrados</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS AND LINKS PANEL (Right 1 col) */}
        <div className="space-y-6">
          
          {/* Alertas de la Semana */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/10 pb-2 flex items-center gap-1.5">
              <Gift size={16} className="text-gold" />
              Alertas de la Semana
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-xl border flex gap-3 items-start transition-colors ${
                      alert.type === 'birthday' 
                        ? 'bg-amber-50/40 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50/70 dark:hover:bg-amber-900/40' 
                        : 'bg-green-50/40 dark:bg-green-900/20 border-green-100 dark:border-green-900/50 hover:bg-green-50/70 dark:hover:bg-green-900/40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {alert.type === 'birthday' ? (
                        <Gift className="text-gold" size={16} />
                      ) : (
                        <Sparkles className="text-green-600 animate-pulse" size={16} />
                      )}
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="font-bold text-xs text-gray-800 dark:text-gray-100 block leading-tight">{alert.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 block">
                        {alert.type === 'birthday' ? `Cumpleaños: ${alert.dateLabel}` : `Conversión: ${alert.dateLabel} (${alert.years})`}
                      </span>
                      <p className="text-[9px] text-gray-500 dark:text-gray-450 italic font-semibold pt-1 border-t border-gray-100/50 mt-1">
                        {alert.verse}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                  Sin cumpleaños o aniversarios esta semana.
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/10 pb-2">
              Enlaces Directos
            </h3>
            
            <div className="space-y-2">
              <Link 
                to="/admin/miembros" 
                className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-all duration-200 shadow-3xs"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-white transition-colors">Base de Miembros (CRM)</span>
                  <span className="text-[9px] text-gray-400 font-medium">Ver y editar fichas de miembros</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>

              {(userRole === 'admin' || userRole === 'pastor') && (
                <Link 
                  to="/admin/sermones" 
                  className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-all duration-200 shadow-3xs"
                >
                  <div className="text-left">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-white transition-colors">Prédicas y Sermones</span>
                    <span className="text-[9px] text-gray-400 font-medium">Administrar material y videos</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}

              <Link 
                to="/admin/ministerios" 
                className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-all duration-200 shadow-3xs"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-white transition-colors">Ministerios</span>
                  <span className="text-[9px] text-gray-400 font-medium">Actualizar líderes y horarios</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link 
                to="/admin/inventario" 
                className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-all duration-200 shadow-3xs"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-white transition-colors">Inventario y Stock</span>
                  <span className="text-[9px] text-gray-400 font-medium">Equipos técnicos y recursos</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all animate-none" />
              </Link>

              <Link 
                to="/admin/analisis" 
                className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-between transition-all duration-200 shadow-3xs"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-white transition-colors">Inteligencia de Datos (BI)</span>
                  <span className="text-[9px] text-gray-400 font-medium">Reportes y consultas a medida</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Secciones de Módulos y Herramientas */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-serif font-bold text-primary dark:text-white flex items-center gap-2">
              <Layers className="text-gold" size={20} />
              Módulos del Sistema
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Explora y accede directamente a todas las herramientas administrativas organizadas por categorías de servicio.
            </p>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            {ADMIN_MODULES.length} Herramientas
          </span>
        </div>

        {/* Grid of groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MODULE_GROUPS.map((group) => {
            const groupModules = ADMIN_MODULES.filter(m => m.group === group.key);
            
            return (
              <div 
                key={group.key} 
                className="bg-slate-50/50 dark:bg-slate-950/20 border border-gray-150 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Group Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 shadow-3xs flex items-center justify-center text-primary dark:text-white shrink-0 group-hover:text-gold transition-colors duration-300">
                      <group.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">{group.label}</h3>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{groupModules.length} items</span>
                    </div>
                  </div>

                  {/* Group Description */}
                  <p className="text-[11px] text-gray-450 dark:text-gray-505 leading-relaxed font-medium">
                    {group.description}
                  </p>

                  {/* Modules List */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5">
                    {groupModules.map((mod) => {
                      const hasAccess = hasPermission(mod.id, 'view');
                      
                      if (hasAccess) {
                        return (
                          <Link
                            key={mod.path}
                            to={mod.path}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/60 text-xs text-gray-650 dark:text-gray-350 hover:text-primary dark:hover:text-white font-bold transition-all duration-200 shadow-4xs hover:shadow-3xs border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                            style={{ minHeight: '38px' }}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <mod.icon size={14} className="text-gold/80 shrink-0" />
                              <span className="truncate">{mod.name}</span>
                            </div>
                            <ArrowRight size={12} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                          </Link>
                        );
                      } else {
                        return (
                          <div
                            key={mod.path}
                            className="flex items-center justify-between p-2 rounded-lg text-xs text-gray-400 dark:text-gray-600 font-medium select-none bg-gray-100/30 dark:bg-slate-900/10 cursor-not-allowed border border-transparent"
                            style={{ minHeight: '38px' }}
                            title="No tienes permisos para acceder a esta herramienta"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <mod.icon size={14} className="opacity-40 shrink-0" />
                              <span className="truncate">{mod.name}</span>
                            </div>
                            <Lock size={10} className="text-gray-350 dark:text-gray-750 shrink-0" />
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;
