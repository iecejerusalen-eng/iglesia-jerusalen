import { useState, useMemo } from 'react';
import { useLogos } from '../../features/logos/hooks/useLogos';
import type { LogoData } from '../../features/logos/types';
import LogoUploadForm from '../../features/logos/components/LogoUploadForm';
import LogosFilterBar from '../../features/logos/components/LogosFilterBar';
import LogoGrid from '../../features/logos/components/LogoGrid';
import SvgEditorModal from '../../features/logos/components/SvgEditorModal';

export default function LogosManager() {
  const { data: logos = [], isLoading } = useLogos();

  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [filterVariant, setFilterVariant] = useState<string>('all');
  const [editingLogo, setEditingLogo] = useState<LogoData | null>(null);

  const filteredLogos = useMemo(() => {
    return logos.filter(logo => {
      const matchesMinistry = filterMinistry === 'all' || 
        (filterMinistry === 'general' && logo.ministry_id === null) ||
        (logo.ministry_id === filterMinistry);
      
      const matchesVariant = filterVariant === 'all' || logo.variant === filterVariant;

      return matchesMinistry && matchesVariant;
    });
  }, [logos, filterMinistry, filterVariant]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary dark:text-church-gold-bright">Catálogo de Logos</h1>
        <p className="text-gray-500 dark:text-gray-450 text-sm">Administra la identidad visual de la iglesia y sus ministerios en un solo lugar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LogoUploadForm />

        <div className="lg:col-span-2 space-y-4">
          <LogosFilterBar 
            filterMinistry={filterMinistry}
            setFilterMinistry={setFilterMinistry}
            filterVariant={filterVariant}
            setFilterVariant={setFilterVariant}
          />
          
          <LogoGrid 
            logos={filteredLogos} 
            isLoading={isLoading} 
            onEditSvg={(logo) => setEditingLogo(logo)} 
          />
        </div>
      </div>

      {editingLogo && (
        <SvgEditorModal 
          editingLogo={editingLogo} 
          onClose={() => setEditingLogo(null)} 
        />
      )}
    </div>
  );
}
