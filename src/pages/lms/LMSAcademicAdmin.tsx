import { useState } from 'react';
import { BookOpen, LayoutDashboard, Settings, Edit3 } from 'lucide-react';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import LMSManager from '../admin/LMSManager';

export default function LMSAcademicAdmin() {
  const { roles, role: primaryRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('curriculum');
  
  // Protect route for academic staff
  const userRoles = roles || (primaryRole ? [primaryRole] : []);
  const isLmsAdmin = userRoles.some(r => ['admin', 'pastor', 'editor', 'maestro', 'docente', 'teacher', 'leader'].includes(r));
  
  if (!isLmsAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'curriculum', label: 'Gestión Curricular', icon: BookOpen, desc: 'Cursos, categorías y matrículas' },
    { id: 'landing', label: 'Página Pública', icon: Edit3, desc: 'Editar textos e imágenes del Aula Virtual' },
    { id: 'terms', label: 'Periodos Académicos', icon: LayoutDashboard, desc: 'Gestión de Semestres' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AnimeFadeUp>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
              <Settings className="text-gold" size={32} />
              Administración Académica (LMS)
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1">
              Panel exclusivo para el personal educativo y coordinadores del Aula Virtual.
            </p>
          </div>
        </div>
      </AnimeFadeUp>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isActive 
                  ? 'border-gold bg-gold/10 shadow-md ring-1 ring-gold' 
                  : 'border-gray-200 dark:border-white/10 hover:border-gold/50 dark:hover:border-gold/50 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}>
                  <Icon size={20} />
                </div>
                <h3 className={`font-bold ${isActive ? 'text-gold' : 'text-slate-700 dark:text-gray-200'}`}>
                  {tab.label}
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      <AnimeFadeUp key={activeTab} className="mt-8">
        {activeTab === 'curriculum' && (
          <div className="-mx-6 -mt-6">
            {/* Wrap the existing LMSManager but without its own main padding maybe, or just render it */}
            <LMSManager />
          </div>
        )}
        
        {activeTab === 'landing' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-white/10 text-center">
            <Edit3 className="mx-auto text-gold mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-2">Editor de Landing Page</h2>
            <p className="text-gray-500 mb-6">Próximamente: Interfaz visual para modificar el banner, testimonios y secciones de bienvenida del aula virtual.</p>
            <button className="bg-gold text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors">
              Guardar Cambios
            </button>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200 dark:border-white/10 text-center">
            <LayoutDashboard className="mx-auto text-gold mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-2">Gestión de Periodos</h2>
            <p className="text-gray-500 mb-6">Aquí podrás crear y activar los diferentes semestres o bimestres académicos.</p>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              Crear Nuevo Periodo
            </button>
          </div>
        )}
      </AnimeFadeUp>
    </div>
  );
}
