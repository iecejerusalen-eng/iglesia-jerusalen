import { departamentos } from '../../config/departamentos';
import type { CargoMinisterial } from '../../types/organizacion';

const isLider = (cargo: CargoMinisterial) => {
  return ['Pastor', 'Coordinador', 'Coordinadora', 'Superintendente'].includes(cargo);
};

export default function OrganizationChart() {
  return (
    <div className="space-y-16">
      {departamentos.map((dept) => (
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
            {dept.directiva.map((miembro, idx) => {
              const lider = isLider(miembro.cargo);
              const vacante = miembro.nombre === null;
              
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
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
