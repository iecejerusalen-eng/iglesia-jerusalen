import { useState } from 'react';
import { Plus, Award } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import type { MemberWithRelations } from '../../features/members/utils/schema';
import { useMembers } from '../../features/members/hooks/useMembers';
import { useMembersMutations } from '../../features/members/hooks/useMembersMutations';
import { MemberForm } from '../../features/members/components/MemberForm';
import { MembersList } from '../../features/members/components/MembersList';
import { CareersModal } from '../../features/members/components/CareersModal';

const MembersManager = () => {
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { handleSave, handleDelete, isPending: actionLoading } = useMembersMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithRelations | null>(null);
  const [showCareersModal, setShowCareersModal] = useState(false);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleOpenEdit = (member: MemberWithRelations) => {
    setEditingMember(member);
    setShowForm(true);
  };

  return (
    <AnimeFadeUp className="space-y-6 max-w-5xl">
      <AdminHeader 
        title="Base de Datos de Miembros (CRM)" 
        description="Gestiona las fichas personales, hitos espirituales, roles de liderazgo y habilidades/talentos de la congregación."
        action={
          !showForm && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowCareersModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Award size={16} className="text-primary" />
                Gestionar Carreras
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Registrar Miembro
              </button>
            </div>
          )
        }
      />

      {showForm ? (
        <MemberForm
          editingMember={editingMember}
          onClose={() => setShowForm(false)}
          actionLoading={actionLoading}
          onSubmitMember={async (data, id, areas, talents, gifts) => {
            const success = await handleSave(data, id, areas, talents, gifts);
            if (success) setShowForm(false);
          }}
        />
      ) : (
        <MembersList
          members={members}
          loading={membersLoading}
          actionLoading={actionLoading}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {showCareersModal && (
        <CareersModal onClose={() => setShowCareersModal(false)} />
      )}
    </AnimeFadeUp>
  );
};

export default MembersManager;
