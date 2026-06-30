import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickLinksProps {
  userRoles: string[];
}

export const QuickLinks = ({ userRoles }: QuickLinksProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
      <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/10 pb-2">
        Enlaces Directos
      </h3>
      
      <div className="space-y-2">
        <Link 
          to="/admin/miembros" 
          className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-gold/30 hover:bg-white dark:hover:bg-slate-700/60 rounded-xl flex items-center justify-between transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-gold transition-colors">Base de Miembros (CRM)</span>
            <span className="text-[9px] text-gray-400 font-medium">Ver y editar fichas de miembros</span>
          </div>
          <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>

        {(userRoles.includes('admin') || userRoles.includes('pastor')) && (
          <Link 
            to="/admin/sermones" 
            className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-gold/30 hover:bg-white dark:hover:bg-slate-700/60 rounded-xl flex items-center justify-between transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <div className="text-left">
              <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-gold transition-colors">Prédicas y Sermones</span>
              <span className="text-[9px] text-gray-400 font-medium">Administrar material y videos</span>
            </div>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
          </Link>
        )}

        <Link 
          to="/admin/ministerios" 
          className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-gold/30 hover:bg-white dark:hover:bg-slate-700/60 rounded-xl flex items-center justify-between transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-gold transition-colors">Ministerios</span>
            <span className="text-[9px] text-gray-400 font-medium">Actualizar líderes y horarios</span>
          </div>
          <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link 
          to="/admin/inventario" 
          className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-gold/30 hover:bg-white dark:hover:bg-slate-700/60 rounded-xl flex items-center justify-between transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-gold transition-colors">Inventario y Stock</span>
            <span className="text-[9px] text-gray-400 font-medium">Equipos técnicos y recursos</span>
          </div>
          <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link 
          to="/admin/analisis" 
          className="group p-3 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 hover:border-gold/30 hover:bg-white dark:hover:bg-slate-700/60 rounded-xl flex items-center justify-between transition-all duration-300 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
        >
          <div className="text-left">
            <span className="font-bold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-primary dark:group-hover:text-gold transition-colors">Inteligencia de Datos (BI)</span>
            <span className="text-[9px] text-gray-400 font-medium">Reportes y consultas a medida</span>
          </div>
          <ArrowRight size={14} className="text-gray-400 group-hover:text-primary group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
};
