import React, { useState } from 'react';
import type { SmallGroup } from '../types';
import { Users, Calendar, MapPin, Clock, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface GroupsCatalogProps {
  groups: SmallGroup[];
  onJoinGroup: (groupId: string) => Promise<void>;
}

export const GroupsCatalog: React.FC<GroupsCatalogProps> = ({ groups, onJoinGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoin = async (groupId: string) => {
    try {
      await onJoinGroup(groupId);
      toast.success('Solicitud enviada para unirte al grupo');
    } catch {
      toast.error('Error al enviar la solicitud');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Grupos Pequeños y Células
          </h2>
          <p className="text-sm text-slate-500">
            Conéctate, crece espiritualmente y comparte en comunidad
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm capitalize"
          >
            <option value="all">Todas las categorías</option>
            <option value="hombres">Hombres</option>
            <option value="mujeres">Mujeres</option>
            <option value="jovenes">Jóvenes</option>
            <option value="matrimonios">Matrimonios</option>
            <option value="mixtos">Mixtos</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {group.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {group.member_count || 0}/{group.max_members} integrantes
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {group.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {group.description || 'Grupo de crecimiento bíblico y compañerismo.'}
              </p>

              <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{group.meeting_day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{group.meeting_time}</span>
                </div>
                {group.location_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{group.location_name}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleJoin(group.id)}
              className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Unirme a este Grupo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
