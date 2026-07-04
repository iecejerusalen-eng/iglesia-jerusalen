import { useState } from 'react';
import { Users, FileArchive, FileText } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useFonts } from '../hooks/useFonts';
import { useMembers } from '../../members/hooks/useMembers';
import { processBatchToZip, processBatchToSinglePdf, type BatchProgress } from '../utils/batchProcessor';
import { toast } from 'sonner';

export const BatchGenerator = () => {
  const { data: templates } = useTemplates();
  const { data: fonts } = useFonts();
  const { data: members, isLoading: loadingMembers } = useMembers();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  // Filtro simple para demostración (nombre, apellido, cédula)
  const filteredMembers = (members || []).filter(m => {
    const term = searchTerm.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    return fullName.includes(term) || (m.dni && m.dni.includes(term));
  });

  const handleSelectAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const toggleMember = (id: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMemberIds(newSet);
  };

  const executeBatch = async (mode: 'zip' | 'pdf') => {
    if (!selectedTemplate) return;
    
    const membersToProcess = members?.filter(m => selectedMemberIds.has(m.id)) || [];
    if (membersToProcess.length === 0) return;

    try {
      const fontMap = new Map<string, string>();
      fonts?.forEach(f => fontMap.set(f.id, f.font_url));

      if (mode === 'zip') {
        const zipBlob = await processBatchToZip(
          selectedTemplate,
          membersToProcess,
          fontMap,
          setProgress
        );
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lote_${selectedTemplate.name}_${new Date().getTime()}.zip`.replace(/\s+/g, '_');
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const pdfBytes = await processBatchToSinglePdf(
          selectedTemplate,
          membersToProcess,
          fontMap,
          setProgress
        );
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lote_${selectedTemplate.name}_Consolidado.pdf`.replace(/\s+/g, '_');
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success('Lote generado exitosamente');
      setTimeout(() => setProgress(null), 3000); // Limpiar progreso después de un tiempo
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el lote');
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="dark-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">1. Selecciona la Plantilla</label>
            <select 
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full dark-input p-3"
            >
              <option value="">-- Seleccionar Plantilla --</option>
              {templates?.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col justify-end">
             {selectedTemplate && selectedTemplate.field_mappings.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Esta plantilla no tiene campos configurados.
                </p>
             )}
          </div>
        </div>
      </div>

      <div className="dark-card flex flex-col h-[500px]">
        <div className="p-4 border-b dark:border-white/10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <h3 className="font-bold text-lg mb-1">2. Selecciona Miembros ({selectedMemberIds.size} seleccionados)</h3>
            <input 
              type="text" 
              placeholder="Buscar por nombre o cédula..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full dark-input p-2 text-sm"
            />
          </div>
          
          <div className="flex gap-2 shrink-0 self-end">
            <button 
              onClick={() => executeBatch('pdf')}
              disabled={selectedMemberIds.size === 0 || !selectedTemplate || !!progress}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-bold text-sm disabled:opacity-50"
            >
              <FileText size={16} /> PDF Combinado
            </button>
            <button 
              onClick={() => executeBatch('zip')}
              disabled={selectedMemberIds.size === 0 || !selectedTemplate || !!progress}
              className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 font-bold text-sm disabled:opacity-50"
            >
              <FileArchive size={16} /> ZIP Individuales
            </button>
          </div>
        </div>

        {progress && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/50">
            <div className="flex justify-between text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">
              <span>Generando documentos...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-950 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loadingMembers ? (
            <div className="p-8 text-center text-gray-500">Cargando base de datos...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredMembers.length > 0 && selectedMemberIds.size === filteredMembers.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="p-3 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Miembro</th>
                  <th className="p-3 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Cédula</th>
                  <th className="p-3 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Ministerio</th>
                  <th className="p-3 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Bautismo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => toggleMember(member.id)}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedMemberIds.has(member.id)}
                        onChange={() => toggleMember(member.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-sm">{member.first_name} {member.last_name}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{member.dni || '-'}</td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{member.ministries?.name || '-'}</td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {member.baptism_date ? new Date(member.baptism_date).toLocaleDateString('es-ES') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {filteredMembers.length === 0 && !loadingMembers && (
            <div className="p-12 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No se encontraron miembros con esos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
