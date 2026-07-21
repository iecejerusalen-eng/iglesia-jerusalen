import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabase';
import { Search, Mail, Users, CheckCircle, ShieldOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantsTableProps {
  schoolId?: string; // Optional for filtering
  courseId?: string; // Optional for filtering
}

interface ParticipantData {
  id: string;
  user_id: string;
  course_id: string;
  role: string;
  status: string;
  enrolled_at?: string;
  created_at?: string;
  courses?: {
    id: string;
    title: string;
    school_id: string;
  };
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
    doc_id: string;
  };
}

export function ParticipantsTable({ schoolId, courseId }: ParticipantsTableProps) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [roleFilter, setRoleFilter] = useState('all'); // student, teacher, admin
  const [statusFilter, setStatusFilter] = useState('all'); // active, suspended
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lms_enrollments')
        .select(`
          id,
          user_id,
          course_id,
          role,
          status,
          enrolled_at,
          courses:course_id (id, title, school_id),
          profiles:user_id (id, first_name, last_name, email, avatar_url, doc_id)
        `);

      if (courseId && courseId !== 'all') {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let processedData = (data as unknown as ParticipantData[]) || [];
      if (schoolId && schoolId !== 'all') {
        processedData = processedData.filter(d => d.courses?.school_id === schoolId);
      }

      setParticipants(processedData);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  }, [schoolId, courseId]);

  useEffect(() => {
    // Evitar la advertencia del linter sobre setState síncrono retrasando la ejecución al siguiente tick
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchParticipants]);

  const filteredParticipants = React.useMemo(() => {
    let result = [...participants];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => {
        const fullName = `${p.profiles?.first_name ?? ''} ${p.profiles?.last_name ?? ''}`.toLowerCase();
        return (
          fullName.includes(lowerSearch) ||
          p.profiles?.email?.toLowerCase().includes(lowerSearch) ||
          p.profiles?.doc_id?.toLowerCase().includes(lowerSearch)
        );
      });
    }

    if (roleFilter !== 'all') {
      result = result.filter(p => p.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => (p.status || 'active') === statusFilter);
    }

    return result;
  }, [participants, searchTerm, roleFilter, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredParticipants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParticipants.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    if (action === 'delete') {
      if (!confirm('¿Estás seguro de eliminar estas matrículas? Esta acción no se puede deshacer.')) return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase.from('lms_enrollments').delete().in('id', selectedIds);
        if (error) throw error;
        toast.success('Matrículas eliminadas correctamente');
      } else {
        const newStatus = action === 'activate' ? 'active' : 'suspended';
        const { error } = await supabase.from('lms_enrollments').update({ status: newStatus }).in('id', selectedIds);
        if (error) throw error;
        toast.success(`Estado actualizado a ${newStatus}`);
      }
      
      setSelectedIds([]);
      fetchParticipants(); // Refresh
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al ejecutar la acción');
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gold" size={32} /></div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o cédula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-gold focus:border-gold outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none"
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="teacher">Docentes</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none"
          >
            <option value="all">Cualquier estado</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 px-5 flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
            {selectedIds.length} participantes seleccionados
          </span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('activate')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
              <CheckCircle size={14} /> Activar
            </button>
            <button onClick={() => handleBulkAction('suspend')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
              <ShieldOff size={14} /> Suspender
            </button>
            {/* Future: Agregar botón de Asignar Grupo masivo */}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-white/10">
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length > 0 && selectedIds.length === filteredParticipants.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-gold focus:ring-gold accent-gold"
                />
              </th>
              <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Participante</th>
              <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Rol / Estado</th>
              <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Curso</th>
              <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Matriculación</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <Users className="mx-auto text-gray-300 mb-3" size={48} />
                  <p>No se encontraron participantes con los filtros actuales.</p>
                </td>
              </tr>
            ) : (
              filteredParticipants.map(p => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded text-gold focus:ring-gold accent-gold"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {p.profiles?.avatar_url ? (
                          <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                            {(p.profiles?.first_name?.charAt(0) ?? p.profiles?.last_name?.charAt(0)) || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[200px]">
                          {p.profiles ? `${p.profiles.first_name ?? ''} ${p.profiles.last_name ?? ''}`.trim() || 'Sin Nombre' : 'Sin Nombre'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px] flex items-center gap-1">
                          <Mail size={10} /> {p.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        p.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.role === 'teacher' ? 'Docente' : 'Estudiante'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        (p.status || 'active') === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {(p.status || 'active') === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                    {p.courses?.title || 'Curso Desconocido'}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(p.enrolled_at || p.created_at || new Date().toISOString()).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
