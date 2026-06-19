import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../config/supabase';
import { Loader2, Calendar as CalendarIcon, Save, Info } from 'lucide-react';
import type { MinistryMember, MemberAvailability } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePermissions } from '../../../hooks/usePermissions';

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const HOURS_OF_DAY = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM (22:00)

export default function SmartScheduler({ ministryId }: { ministryId: string }) {
  const [ministryMembers, setMinistryMembers] = useState<MinistryMember[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<MemberAvailability[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for editing a specific member's availability
  // Set of strings like "day-hour" (e.g. "1-14" for Monday 2PM)
  const [editGrid, setEditGrid] = useState<Set<string>>(new Set());
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const { role } = useAuthStore();
  const { hasPermission, isReadOnly } = usePermissions();
  const canEdit = role === 'admin' || role === 'leader' || (!isReadOnly('ministries') && hasPermission('ministries', 'edit'));

  useEffect(() => {
    fetchData();
  }, [ministryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch members of this ministry
      const { data: membersData, error: mError } = await supabase
        .from('ministry_members')
        .select(`
          *,
          members (
            id, first_name, last_name
          )
        `)
        .eq('ministry_id', ministryId);
      if (mError) throw mError;
      
      const members = membersData || [];
      setMinistryMembers(members);

      if (members.length > 0) {
        const memberIds = members.map(m => m.member_id);
        const { data: availData, error: aError } = await supabase
          .from('member_availabilities')
          .select('*')
          .in('member_id', memberIds);
        
        if (aError) throw aError;
        setAllAvailabilities(availData || []);
      } else {
        setAllAvailabilities([]);
      }

    } catch (err) {
      console.error('Error fetching scheduler data:', err);
    } finally {
      setLoading(false);
    }
  };

  // When selectedMemberId changes, populate editGrid if it's not 'all'
  useEffect(() => {
    if (selectedMemberId !== 'all') {
      const memberAvails = allAvailabilities.filter(a => a.member_id === selectedMemberId);
      const newGrid = new Set<string>();
      
      memberAvails.forEach(a => {
        const day = a.day_of_week;
        const startHour = parseInt(a.start_time.split(':')[0]);
        const endHour = parseInt(a.end_time.split(':')[0]);
        // Add all hours in the range
        for (let h = startHour; h < endHour; h++) {
          newGrid.add(`${day}-${h}`);
        }
      });
      setEditGrid(newGrid);
    } else {
      setEditGrid(new Set());
    }
  }, [selectedMemberId, allAvailabilities]);

  // Compute heatmap for 'all' mode
  const heatmap = useMemo(() => {
    if (selectedMemberId !== 'all') return null;
    
    const counts: Record<string, number> = {};
    const totalMembers = ministryMembers.length;

    allAvailabilities.forEach(a => {
      const day = a.day_of_week;
      const startHour = parseInt(a.start_time.split(':')[0]);
      const endHour = parseInt(a.end_time.split(':')[0]);
      for (let h = startHour; h < endHour; h++) {
        const key = `${day}-${h}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return { counts, totalMembers };
  }, [allAvailabilities, ministryMembers, selectedMemberId]);

  const topRecommendations = useMemo(() => {
    if (!heatmap || heatmap.totalMembers === 0) return [];
    
    // Convert heatmap counts to array
    const times = Object.entries(heatmap.counts).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, count, percentage: Math.round((count / heatmap.totalMembers) * 100) };
    });

    // Sort by count descending, then by day/hour
    times.sort((a, b) => b.count - a.count || a.day - b.day || a.hour - b.hour);

    return times.slice(0, 3);
  }, [heatmap]);

  const toggleCell = (day: number, hour: number, mode?: 'add' | 'remove') => {
    if (selectedMemberId === 'all' || !canEdit) return;
    
    setEditGrid(prev => {
      const key = `${day}-${hour}`;
      const newGrid = new Set(prev);
      const isAdding = mode === 'add' || (!mode && !prev.has(key));
      
      if (isAdding) {
        newGrid.add(key);
      } else {
        newGrid.delete(key);
      }
      return newGrid;
    });
  };

  const handleMouseDown = (day: number, hour: number) => {
    if (selectedMemberId === 'all' || !canEdit) return;
    const key = `${day}-${hour}`;
    const newMode = editGrid.has(key) ? 'remove' : 'add';
    setIsDragging(true);
    setDragMode(newMode);
    toggleCell(day, hour, newMode);
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (!isDragging || selectedMemberId === 'all' || !canEdit) return;
    toggleCell(day, hour, dragMode);
  };

  const saveAvailability = async () => {
    if (selectedMemberId === 'all' || !canEdit) return;
    setSaving(true);
    try {
      // 1. Delete existing for this member
      await supabase
        .from('member_availabilities')
        .delete()
        .eq('member_id', selectedMemberId);

      // 2. Convert grid to contiguous blocks
      const inserts: any[] = [];
      
      for (let day = 0; day < 7; day++) {
        let blockStart: number | null = null;
        
        for (let h = 0; h <= 24; h++) {
          const key = `${day}-${h}`;
          if (editGrid.has(key)) {
            if (blockStart === null) blockStart = h;
          } else {
            if (blockStart !== null) {
              // End of block
              inserts.push({
                member_id: selectedMemberId,
                day_of_week: day,
                start_time: `${blockStart.toString().padStart(2, '0')}:00:00`,
                end_time: `${h.toString().padStart(2, '0')}:00:00`
              });
              blockStart = null;
            }
          }
        }
      }

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('member_availabilities')
          .insert(inserts);
        if (error) throw error;
      }

      alert('Disponibilidad guardada correctamente.');
      fetchData(); // reload
    } catch (err) {
      console.error('Error saving availability:', err);
      alert('Error al guardar la disponibilidad.');
    } finally {
      setSaving(false);
    }
  };

  const getHeatmapColor = (count: number, total: number) => {
    if (count === 0 || total === 0) return 'bg-gray-50';
    const ratio = count / total;
    if (ratio > 0.8) return 'bg-green-500 text-white';
    if (ratio > 0.5) return 'bg-green-300 text-green-900';
    if (ratio > 0) return 'bg-green-100 text-green-800';
    return 'bg-gray-50';
  };

  if (loading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Planificador Inteligente</h3>
          <p className="text-sm text-gray-500">
            Descubre los mejores horarios para reunirse o edita la disponibilidad individual.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Ver modo:</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[200px]"
          >
            <option value="all">Resumen del Ministerio (Recomendado)</option>
            <optgroup label="Editar Disponibilidad Individual">
              {ministryMembers.map(m => (
                <option key={m.member_id} value={m.member_id}>
                  {m.members?.first_name} {m.members?.last_name} ({m.role})
                </option>
              ))}
            </optgroup>
          </select>

          {selectedMemberId !== 'all' && canEdit && (
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar
            </button>
          )}
        </div>
      </div>

      {selectedMemberId === 'all' && heatmap && heatmap.totalMembers > 0 && (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-800">
          <Info size={20} className="shrink-0 text-blue-500" />
          <p>
            El mapa de calor muestra en <span className="font-bold text-green-600">verde oscuro</span> las horas donde la mayoría de los <strong>{heatmap.totalMembers} miembros</strong> están disponibles. 
            Haz clic en un miembro en el selector de arriba para modificar sus horas libres.
          </p>
        </div>
      )}

      {selectedMemberId === 'all' && topRecommendations.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-gold">★</span> Horarios Óptimos Recomendados
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-150 rounded-lg">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                  rec.percentage === 100 ? 'bg-green-500' : rec.percentage >= 70 ? 'bg-green-400' : 'bg-green-300'
                }`}>
                  {rec.percentage}%
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{DAYS_OF_WEEK[rec.day]}</p>
                  <p className="text-xs text-gray-500 font-medium">{rec.hour.toString().padStart(2, '0')}:00</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMemberId === 'all' && heatmap && heatmap.totalMembers === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
          <CalendarIcon size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No hay miembros en este ministerio aún.</p>
        </div>
      )}

      {(selectedMemberId !== 'all' || (heatmap && heatmap.totalMembers > 0)) && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500 text-center">
              <div className="p-3 border-r border-gray-200">Hora</div>
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="p-3 border-r border-gray-200 last:border-0">{day}</div>
              ))}
            </div>
            
            <div className="divide-y divide-gray-100">
              {HOURS_OF_DAY.map(hour => (
                <div key={hour} className="grid grid-cols-8 text-center text-sm">
                  <div className="p-2 border-r border-gray-200 bg-gray-50 text-gray-500 font-medium flex items-center justify-center">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {DAYS_OF_WEEK.map((_, dayIdx) => {
                    if (selectedMemberId === 'all') {
                      // Heatmap view
                      const count = heatmap?.counts[`${dayIdx}-${hour}`] || 0;
                      const total = heatmap?.totalMembers || 1;
                      const colorClass = getHeatmapColor(count, total);
                      return (
                        <div key={dayIdx} className={`p-2 border-r border-gray-200 last:border-0 flex items-center justify-center transition-colors ${colorClass}`}>
                          {count > 0 ? `${count}/${total}` : ''}
                        </div>
                      );
                    } else {
                      // Edit view
                      const isSelected = editGrid.has(`${dayIdx}-${hour}`);
                      return (
                        <div
                          key={dayIdx}
                          onMouseDown={() => handleMouseDown(dayIdx, hour)}
                          onMouseEnter={() => handleMouseEnter(dayIdx, hour)}
                          className={`p-2 border-r border-gray-200 last:border-0 flex items-center justify-center cursor-pointer transition-colors select-none ${
                            isSelected ? 'bg-primary text-white shadow-inner' : 'hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <span className="text-xs">Libre</span>}
                        </div>
                      );
                    }
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
