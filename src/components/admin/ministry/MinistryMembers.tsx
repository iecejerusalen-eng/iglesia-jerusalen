import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import type { MinistryMember, Member } from '../../../types';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/useAuthStore';

const PREDEFINED_ROLES = [
  'Coordinador',
  'Subcoordinador',
  'Secretario',
  'Tesorero',
  'Vocal 1',
  'Vocal 2',
  'Vocal 3'
];

export default function MinistryMembers({ ministryId }: { ministryId: string }) {
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [allMembers, setAllMembers] = useState<Partial<Member>[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [roleInput, setRoleInput] = useState('Vocal 1');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { role } = useAuthStore();
  const { hasPermission, isReadOnly } = usePermissions();
  const canEdit = role === 'admin' || role === 'leader' || (!isReadOnly('ministries') && hasPermission('ministries', 'edit'));

  useEffect(() => {
    fetchData();
  }, [ministryId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assigned members
      const { data: ministryMembersData, error: mError } = await supabase
        .from('ministry_members')
        .select(`
          *,
          members (
            id, first_name, last_name, photo_url, phone, phone_country_code
          )
        `)
        .eq('ministry_id', ministryId);
        
      if (mError) throw mError;
      setMembers(ministryMembersData || []);

      // Fetch all members to populate dropdown
      const { data: allMembersData, error: aError } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone')
        .is('deleted_at', null)
        .order('first_name');
        
      if (aError) throw aError;
      setAllMembers(allMembersData || []);
    } catch (error) {
      console.error('Error fetching ministry members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !canEdit) return;
    setAdding(true);
    try {
      const { error } = await supabase
        .from('ministry_members')
        .insert({
          ministry_id: ministryId,
          member_id: selectedMember,
          role: roleInput
        });
        
      if (error) {
        if (error.code === '23505') {
          alert('Este miembro ya está en el ministerio.');
        } else {
          throw error;
        }
      } else {
        setSelectedMember('');
        setMemberSearchTerm('');
        setRoleInput('Vocal 1');
        fetchData();
      }
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Hubo un error al añadir al miembro.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!canEdit) return;
    if (!confirm('¿Seguro que deseas remover a este miembro del ministerio?')) return;
    try {
      const { error } = await supabase
        .from('ministry_members')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Error al remover.');
    }
  };

  const filteredMembers = members.filter(m => 
    m.members?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.members?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectMember = (memberId: string, memberName: string) => {
    setSelectedMember(memberId);
    setMemberSearchTerm(memberName);
    setIsDropdownOpen(false);
  };

  const filteredDropdownMembers = allMembers.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Directiva y Miembros</h3>
          <p className="text-sm text-gray-500">Administra quiénes conforman este departamento y sus cargos.</p>
        </div>
      </div>

      {canEdit && (
        <form onSubmit={handleAddMember} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Miembro</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar miembro..."
                value={memberSearchTerm}
                onChange={(e) => {
                  setMemberSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedMember) setSelectedMember('');
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary/30 outline-none"
              />
            </div>
            {isDropdownOpen && filteredDropdownMembers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDropdownMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMember(m.id!, `${m.first_name} ${m.last_name}`)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    {m.first_name} {m.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rol / Cargo</label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary/30 outline-none"
            >
              {PREDEFINED_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !selectedMember}
            className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Añadir
          </button>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Buscar miembro o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol / Cargo</th>
              <th className="px-4 py-3">Contacto</th>
              {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-8 text-center text-gray-400">
                  No hay miembros asignados o no coinciden con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.members?.photo_url ? (
                        <img src={m.members.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                          {m.members?.first_name?.[0] || 'U'}
                        </div>
                      )}
                      <span className="font-semibold text-gray-800">{m.members?.first_name} {m.members?.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {m.role}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.members?.phone ? `${m.members.phone_country_code || '+593'} ${m.members.phone}` : '-'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md"
                        title="Remover del ministerio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
