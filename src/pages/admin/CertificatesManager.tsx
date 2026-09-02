import { lazy, Suspense, useState } from 'react';
import { FileCheck, Upload, Type, Users } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

const TemplateList = lazy(() => import('../../features/certificates/components/TemplateList').then((module) => ({ default: module.TemplateList })));
const FontManager = lazy(() => import('../../features/certificates/components/FontManager').then((module) => ({ default: module.FontManager })));
const SingleGeneratorForm = lazy(() => import('../../features/certificates/components/SingleGeneratorForm').then((module) => ({ default: module.SingleGeneratorForm })));
const BatchGenerator = lazy(() => import('../../features/certificates/components/BatchGenerator').then((module) => ({ default: module.BatchGenerator })));

type Tab = 'templates' | 'fonts' | 'single' | 'batch';

const CertificatesManager = () => {
  const [activeTab, setActiveTab] = useState<Tab>('templates');

  const tabs = [
    { id: 'templates', label: 'Plantillas', icon: FileCheck },
    { id: 'single', label: 'Generador Individual', icon: Upload },
    { id: 'batch', label: 'Generación por Lotes', icon: Users },
    { id: 'fonts', label: 'Fuentes Personalizadas', icon: Type },
  ];

  return (
    <AnimeFadeUp className="space-y-6 max-w-7xl mx-auto">
      <AdminHeader 
        title="Generador de Certificados" 
        description="Automatiza la creación de diplomas y certificados (individual o por lotes) usando plantillas personalizadas."
      />

      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold dark:border-church-gold-bright dark:text-church-gold-bright'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">Cargando herramienta…</div>}>
        <div className="mt-6">
          {activeTab === 'templates' && <TemplateList />}
          {activeTab === 'fonts' && <FontManager />}
          {activeTab === 'single' && <SingleGeneratorForm />}
          {activeTab === 'batch' && <BatchGenerator />}
        </div>
      </Suspense>
    </AnimeFadeUp>
  );
};

export default CertificatesManager;
