import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Loader2 } from 'lucide-react';

const DEPT_ORDER = [
  'cuerpo-ministerial',
  'dep-damas',
  'dep-caballeros',
  'dep-jovenes',
  'dep-escuela-dominical',
  'dep-cadetes',
  'dep-misiones-y-evangelismo'
];

const isLider = (cargo: string) => {
  return ['Pastor', 'Coordinador', 'Coordinadora', 'Superintendente'].includes(cargo);
};

export default function OrganizationChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch ministries of type 'departamento'
        const { data: ministries, error: mError } = await supabase
          .from('ministries')
          .select('id, name, slug')
          .eq('category', 'departamento');
          
        if (mError) throw mError;
        
        // Fetch directiva members for those ministries
        const { data: members, error: memError } = await supabase
          .from('ministry_members')
          .select(`
            id, ministry_id, role, member_name,
            members (
              first_name, last_name
            )
          `);
          
        if (memError) throw memError;
        
        // Group and sort
        const roleOrder = [
          'pastor', 'coordinador', 'coordinadora', 'subcoordinador', 'sub-coordinador', 'sub-coordinadora',
          'secretaria', 'secretario', 'tesorera', 'tesorero', 'vocal', 'vocal 1', 'vocal 2', 'vocal 3'
        ];
        
        const chartData = (ministries || [])
          .map((min) => {
            const minMembers = (members || [])
              .filter((m) => m.ministry_id === min.id)
              .map((m) => {
                const memberObj = Array.isArray(m.members) ? m.members[0] : m.members;
                return {
                  cargo: m.role,
                  nombre: memberObj ? `${memberObj.first_name} ${memberObj.last_name}` : m.member_name
                };
              })
              .sort((a, b) => {
                const roleA = a.cargo.toLowerCase();
                const roleB = b.cargo.toLowerCase();
                const idxA = roleOrder.findIndex(r => roleA.includes(r));
                const idxB = roleOrder.findIndex(r => roleB.includes(r));
                const valA = idxA === -1 ? 99 : idxA;
                const valB = idxB === -1 ? 99 : idxB;
                return valA - valB;
              });
              
            return {
              id: min.id,
              slug: min.slug,
              nombre: min.name.toUpperCase(),
              directiva: minMembers
            };
          })
          .sort((a, b) => {
            const idxA = DEPT_ORDER.indexOf(a.slug);
            const idxB = DEPT_ORDER.indexOf(b.slug);
            const valA = idxA === -1 ? 99 : idxA;
            const valB = idxB === -1 ? 99 : idxB;
            return valA - valB;
          });
          
        setData(chartData);
      } catch (err) {
        console.error('Error loading organization chart:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-transparent">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {data.map((dept) => (
        <section 
          key={dept.id} 
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white inline-block relative">
              {dept.nombre}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gold rounded-full"></div>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dept.directiva.length === 0 ? (
              <div className="col-span-full text-center py-6 text-slate-400 dark:text-slate-500 italic">
                Directiva no asignada.
              </div>
            ) : (
              dept.directiva.map((miembro: any, idx: number) => {
                const lider = isLider(miembro.cargo);
                const vacante = miembro.nombre === null || miembro.nombre === '';
                
                return (
                  <div 
                    key={`${dept.id}-${idx}`} 
                    className={`
                      p-6 rounded-2xl border transition-all flex flex-col justify-center
                      ${lider 
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-md md:col-span-2 lg:col-span-3 items-center text-center' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-1'
                      }
                    `}
                  >
                    <span className={`
                      text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2
                      ${lider ? 'text-blue-600 dark:text-blue-400' : 'text-gold dark:text-yellow-500'}
                    `}>
                      {miembro.cargo}
                    </span>
                    
                    <h3 className={`
                      font-serif leading-tight
                      ${vacante 
                        ? 'text-slate-400 dark:text-slate-500 italic text-base' 
                        : lider 
                          ? 'text-2xl md:text-3xl text-slate-900 dark:text-white font-bold' 
                          : 'text-lg text-slate-800 dark:text-slate-100 font-semibold'
                      }
                    `}>
                      {vacante ? 'Vacante' : miembro.nombre}
                    </h3>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
