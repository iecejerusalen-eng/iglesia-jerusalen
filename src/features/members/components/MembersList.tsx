import { useState } from 'react';
import { Search, X, Download, User, Edit2, Trash2, Phone, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '../../../components/common/Skeletons';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { formatWhatsAppLink } from '../../../utils/whatsapp';
import type { MemberWithRelations } from '../utils/schema';
import { useLookups } from '../hooks/useLookups';
import { useCareers } from '../hooks/useCareers';

interface MembersTableProps {
  list: MemberWithRelations[];
  onEdit: (member: MemberWithRelations) => void;
  onDelete: (id: string) => void;
  actionLoading: boolean;
  careersList?: any[];
}

const MembersTable = ({ list, onEdit, onDelete, actionLoading, careersList = [] }: MembersTableProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
              <th className="py-4 px-6">Miembro</th>
              <th className="py-4 px-6">Identificación / Celular</th>
              <th className="py-4 px-6">Liderazgo</th>
              <th className="py-4 px-6">Habilidades</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750 dark:text-gray-300">
            {list.map((member) => (
              <tr 
                key={member.id} 
                className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    {member.photo_url ? (
                    <img
                      loading="lazy"
                      src={member.photo_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-white/5 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-gray-800 dark:text-gray-100 block leading-tight">{member.first_name} {member.last_name}</span>
                      {member.profiles && member.profiles.length > 0 && (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 cursor-help"
                          title={`Usuario vinculado: ${member.profiles.map(p => p.email).join(', ')} (${member.profiles.map(p => p.role).join(', ')})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Vinculado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 block font-semibold">
                      {member.member_emails && member.member_emails.length > 0 
                        ? member.member_emails.map(me => me.email).join(', ') 
                        : 'Sin correo'}
                    </span>
                    {member.education_level && member.education_level !== 'Ninguno' && (
                      <span className="text-[10px] text-primary dark:text-church-gold-bright font-bold bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.5 rounded mt-1 inline-block w-max leading-none">
                        🎓 {member.education_level}
                        {careersList.find(c => c.id === member.career_id)?.name ? `: ${careersList.find(c => c.id === member.career_id)?.name}` : ''}
                        {member.is_studying && (
                          <span className="text-emerald-700 font-bold ml-1">
                            (Estudiando{careersList.find(c => c.id === member.studying_career_id)?.name ? `: ${careersList.find(c => c.id === member.studying_career_id)?.name}` : ''})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  </div>
                </td>
                <td className="py-4 px-6 font-semibold">
                  <span className="block text-gray-700 dark:text-gray-300">{member.dni || 'S/C'}</span>
                  {member.phone ? (
                    <a
                      href={formatWhatsAppLink(member.phone, member.phone_country_code || '+593', `Hola ${member.first_name}, te saludamos de la Iglesia Jerusalén...`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-850 hover:underline transition-colors font-bold mt-0.5"
                      title="Enviar mensaje de WhatsApp"
                    >
                      <Phone size={10} />
                      {member.phone}
                    </a>
                  ) : (
                    <span className="block text-xs text-gray-400 font-bold">S/N</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  {member.is_leader ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/20 block w-max">
                        {member.leadership_role || 'Líder'}
                      </span>
                      {member.ministries && (
                        <span className="text-[10px] text-gray-400 font-bold block leading-none">
                          {member.ministries.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs font-semibold">Miembro regular</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {member.member_service_areas && member.member_service_areas.length > 0 ? (
                      member.member_service_areas.map((a, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright border border-blue-100 dark:border-blue-900/30">
                          {a.catalog_roles?.name || 'Área'}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold">Sin áreas</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(member)}
                    className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-block"
                    title="Editar ficha"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(member.id)}
                    disabled={actionLoading}
                    className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer inline-block"
                    title="Eliminar miembro"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MembersCards = ({ list, onEdit, onDelete, actionLoading }: MembersTableProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {list.map((member) => (
        <div key={member.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 flex flex-col gap-4 shadow-xs hover:shadow-md transition-shadow relative group">
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(member)}
              className="text-gray-400 hover:text-primary p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-800 backdrop-blur-sm transition-colors cursor-pointer shadow-sm"
              title="Editar ficha"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              disabled={actionLoading}
              className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 backdrop-blur-sm transition-colors cursor-pointer shadow-sm"
              title="Eliminar miembro"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div className="flex items-start gap-4">
            {member.photo_url ? (
              <img
                loading="lazy"
                src={member.photo_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
                {member.first_name[0]}{member.last_name[0]}
              </div>
            )}
            <div className="pt-1">
              <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight group-hover:text-primary dark:group-hover:text-gold transition-colors">
                {member.first_name} <br/> {member.last_name}
              </h4>
              <div className="text-xs text-gray-500 font-medium mt-1">
                {member.is_leader ? (
                  <span className="text-primary font-bold">{member.leadership_role || 'Líder'}</span>
                ) : 'Miembro regular'}
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mt-auto">
            {member.phone && (
              <a
                href={formatWhatsAppLink(member.phone, member.phone_country_code || '+593', `Hola ${member.first_name}, te saludamos de la Iglesia Jerusalén...`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors w-max"
              >
                <div className="w-6 h-6 rounded bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                  <Phone size={12} />
                </div>
                <span className="font-semibold">{member.phone}</span>
              </a>
            )}
            
            <div className="flex flex-wrap gap-1.5 pt-1">
              {member.ministries && (
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/20">
                  {member.ministries.name}
                </span>
              )}
              {member.member_service_areas && member.member_service_areas.slice(0, 3).map((a, i) => (
                <span key={i} className="px-2 py-1 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright border border-blue-100 dark:border-blue-900/30">
                  {a.catalog_roles?.name || 'Área'}
                </span>
              ))}
              {member.member_service_areas && member.member_service_areas.length > 3 && (
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-50 dark:bg-slate-800 text-gray-500 border border-gray-200 dark:border-white/10">
                  +{member.member_service_areas.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface MembersListProps {
  members: MemberWithRelations[];
  loading: boolean;
  actionLoading: boolean;
  onEdit: (member: MemberWithRelations) => void;
  onDelete: (id: string) => void;
}

export const MembersList = ({ members, loading, actionLoading, onEdit, onDelete }: MembersListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLeadership, setFilterLeadership] = useState<'all' | 'leaders' | 'regulars'>('all');
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'birth_date' | 'tithes_sum'>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'leadership' | 'ministry' | 'service_area' | 'birth_month'>('none');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('crm_view_mode') as 'table' | 'grid') || 'table';
  });

  const { data: lookups } = useLookups();
  const { data: careersList = [] } = useCareers();
  
  const serviceAreas = lookups?.serviceAreas || [];
  const talents = lookups?.talents || [];
  const spiritualGifts = lookups?.spiritualGifts || [];
  const ministries = lookups?.ministries || [];

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const phone = (member.phone || '').toLowerCase();
    const dni = (member.dni || '').toLowerCase();
    const matchesSearch = fullName.includes(search) || phone.includes(search) || dni.includes(search);
    
    if (!matchesSearch) return false;
    
    if (filterLeadership === 'leaders' && !member.is_leader) return false;
    if (filterLeadership === 'regulars' && member.is_leader) return false;
    
    if (filterMinistry !== 'all' && member.ministry_id !== filterMinistry) return false;
    
    if (filterSkill !== 'all') {
      const hasArea = member.member_service_areas?.some(a => a.catalog_roles?.id === filterSkill);
      const hasTalent = member.member_talents?.some(t => t.catalog_roles?.id === filterSkill);
      const hasGift = member.member_spiritual_gifts?.some(g => g.catalog_roles?.id === filterSkill);
      if (!hasArea && !hasTalent && !hasGift) return false;
    }
    
    return true;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'first_name') {
      comparison = (a.first_name || '').localeCompare(b.first_name || '');
    } else if (sortBy === 'last_name') {
      comparison = (a.last_name || '').localeCompare(b.last_name || '');
    } else if (sortBy === 'birth_date') {
      const dateA = a.birth_date ? new Date(a.birth_date).getTime() : 0;
      const dateB = b.birth_date ? new Date(b.birth_date).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'tithes_sum') {
      comparison = (a.tithes_sum || 0) - (b.tithes_sum || 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const exportToCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const headers = [
      'Nombres', 'Apellidos', 'Cédula/DNI', 'Celular', 'Fecha Nacimiento',
      'Dirección', 'Latitud', 'Longitud', 'Enlace Maps', 'Liderazgo',
      'Cargo Liderazgo', 'Ministerio', 'Correos'
    ];

    const rows = filteredMembers.map(m => {
      const emails = m.member_emails ? m.member_emails.map(e => e.email).join('; ') : '';
      const isLeader = m.is_leader ? 'Sí' : 'No';
      const ministry = m.ministries ? m.ministries.name : '';
      return [
        m.first_name, m.last_name, m.dni || '', m.phone || '', m.birth_date || '',
        m.address || '', m.latitude ?? '', m.longitude ?? '', m.maps_link || '',
        isLeader, m.leadership_role || '', ministry, emails
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `miembros_iglesia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Listado de miembros exportado con éxito.');
  };

  interface GroupedData {
    key: string;
    name: string;
    items: MemberWithRelations[];
  }

  const getGroupedMembers = (): GroupedData[] => {
    if (groupBy === 'none') return [];

    const groupsMap: Record<string, MemberWithRelations[]> = {};

    if (groupBy === 'leadership') {
      groupsMap['Líderes'] = [];
      groupsMap['Miembros Regulares'] = [];
      
      sortedMembers.forEach(m => {
        const key = m.is_leader ? 'Líderes' : 'Miembros Regulares';
        groupsMap[key].push(m);
      });
    } 
    else if (groupBy === 'ministry') {
      sortedMembers.forEach(m => {
        const key = m.ministries?.name || 'Sin Ministerio';
        if (!groupsMap[key]) groupsMap[key] = [];
        groupsMap[key].push(m);
      });
    } 
    else if (groupBy === 'service_area') {
      sortedMembers.forEach(m => {
        const areas = m.member_service_areas || [];
        if (areas.length === 0) {
          const key = 'Sin Área de Servicio';
          if (!groupsMap[key]) groupsMap[key] = [];
          groupsMap[key].push(m);
        } else {
          areas.forEach(a => {
            const key = a.catalog_roles?.name || 'Área Desconocida';
            if (!groupsMap[key]) groupsMap[key] = [];
            if (!groupsMap[key].some(item => item.id === m.id)) {
              groupsMap[key].push(m);
            }
          });
        }
      });
    } 
    else if (groupBy === 'birth_month') {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthNames.forEach(month => { groupsMap[month] = []; });
      groupsMap['Sin registrar'] = [];

      sortedMembers.forEach(m => {
        if (m.birth_date) {
          const parts = m.birth_date.split('-');
          if (parts.length >= 2) {
            const monthIdx = parseInt(parts[1], 10) - 1;
            if (monthIdx >= 0 && monthIdx <= 11) {
              groupsMap[monthNames[monthIdx]].push(m);
            } else {
              groupsMap['Sin registrar'].push(m);
            }
          } else {
            groupsMap['Sin registrar'].push(m);
          }
        } else {
          groupsMap['Sin registrar'].push(m);
        }
      });
    }

    return Object.entries(groupsMap)
      .map(([name, items]) => ({ key: name, name, items }))
      .filter(g => g.items.length > 0);
  };

  return (
    <AnimeFadeUp key="list" className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <label htmlFor="search-members" className="sr-only">Buscar miembros</label>
            <Search className="text-gray-400" size={18} />
            <input
              id="search-members"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow text-sm focus:outline-none text-gray-700 dark:text-gray-300 bg-transparent font-medium"
              placeholder="Buscar por nombre, apellido, cédula o celular..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl p-1 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setViewMode('table');
                  localStorage.setItem('crm_view_mode', 'table');
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Vista de Tabla"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('crm_view_mode', 'grid');
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            
            <button
              type="button"
              onClick={exportToCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer justify-center whitespace-nowrap"
              title="Exportar listado a CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
          <div>
            <label htmlFor="filter-leadership" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Liderazgo</label>
            <select
              id="filter-leadership"
              value={filterLeadership}
              onChange={(e) => setFilterLeadership(e.target.value as 'all' | 'leaders' | 'regulars')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="all">Todos los miembros</option>
              <option value="leaders">Solo Líderes</option>
              <option value="regulars">Solo Miembros Regulares</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-ministry" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Ministerio</label>
            <select
              id="filter-ministry"
              value={filterMinistry}
              onChange={(e) => setFilterMinistry(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-755 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="all">Todos los Ministerios</option>
              {ministries.map((min) => (
                <option key={min.id} value={min.id}>{min.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-skill" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Habilidad</label>
            <select
              id="filter-skill"
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-755 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="all">Todas las Habilidades</option>
              <optgroup label="Áreas de Servicio">
                {serviceAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </optgroup>
              <optgroup label="Talentos">
                {talents.map((talent) => (
                  <option key={talent.id} value={talent.id}>{talent.name}</option>
                ))}
              </optgroup>
              <optgroup label="Dones Espirituales">
                {spiritualGifts.map((gift) => (
                  <option key={gift.id} value={gift.id}>{gift.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex gap-1.5 items-end">
            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ordenar Por</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'first_name' | 'last_name' | 'birth_date' | 'tithes_sum')}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-755 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
              >
                <option value="first_name">Nombre</option>
                <option value="last_name">Apellido</option>
                <option value="birth_date">Fecha Nacimiento</option>
                <option value="tithes_sum">Total Diezmado</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 border border-gray-200 dark:border-white/10 hover:bg-gray-100 text-gray-500 dark:text-gray-450 rounded-xl transition-all cursor-pointer flex-shrink-0 bg-slate-50 dark:bg-slate-950 h-[34px] flex items-center justify-center font-bold text-xs"
              title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
            >
              {sortDirection === 'asc' ? 'Asc ↑' : 'Desc ↓'}
            </button>
          </div>

          <div>
            <label htmlFor="group-by" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Agrupar Por</label>
            <select
              id="group-by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'leadership' | 'ministry' | 'service_area' | 'birth_month')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-755 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="none">Sin Agrupación</option>
              <option value="leadership">Por Liderazgo</option>
              <option value="ministry">Por Ministerio</option>
              <option value="service_area">Por Área de Servicio</option>
              <option value="birth_month">Por Mes de Nacimiento</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : filteredMembers.length > 0 ? (
        groupBy !== 'none' ? (
          <div className="space-y-6">
            {getGroupedMembers().map((group) => (
              <div key={group.key} className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base">{group.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 dark:text-gray-400 font-bold">
                    {group.items.length} {group.items.length === 1 ? 'miembro' : 'miembros'}
                  </span>
                </div>
                {viewMode === 'table' ? (
                  <MembersTable list={group.items} onEdit={onEdit} onDelete={onDelete} actionLoading={actionLoading} careersList={careersList} />
                ) : (
                  <MembersCards list={group.items} onEdit={onEdit} onDelete={onDelete} actionLoading={actionLoading} />
                )}
              </div>
            ))}
          </div>
        ) : (
          viewMode === 'table' ? (
            <MembersTable list={sortedMembers} onEdit={onEdit} onDelete={onDelete} actionLoading={actionLoading} careersList={careersList} />
          ) : (
            <MembersCards list={sortedMembers} onEdit={onEdit} onDelete={onDelete} actionLoading={actionLoading} />
          )
        )
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
          <User className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No se encontraron miembros</h3>
          <p className="text-gray-400 text-sm mt-1 font-medium">Prueba con otra búsqueda o agrega un nuevo registro en la base de datos.</p>
        </div>
      )}
    </AnimeFadeUp>
  );
};
