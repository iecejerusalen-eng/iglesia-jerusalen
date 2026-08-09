import { useState } from 'react';
import { Plus, Award, Trash2, Compass, List } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import type { MemberWithRelations } from '../../features/members/utils/schema';
import { useMembers } from '../../features/members/hooks/useMembers';
import { useMembersMutations } from '../../features/members/hooks/useMembersMutations';
import { MemberForm } from '../../features/members/components/MemberForm';
import { MembersList } from '../../features/members/components/MembersList';
import { CareersModal } from '../../features/members/components/CareersModal';
import { DeletedMembersModal } from '../../features/members/components/DeletedMembersModal';
import { PurposeDashboard } from '../../features/members/components/PurposeDashboard';

const MembersManager = () => {
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { handleSave, handleDelete, isPending: actionLoading } = useMembersMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithRelations | null>(null);
  const [showCareersModal, setShowCareersModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [activeView, setActiveView] = useState<'purpose' | 'directory'>('purpose');

  const handleOpenCreate = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleOpenEdit = (member: MemberWithRelations) => {
    setEditingMember(member);
    setShowForm(true);
  };

  return (
    <AnimeFadeUp className="space-y-6 max-w-[1600px]">
      <AdminHeader 
        title="Base de Datos de Miembros (CRM)" 
        description="Gestiona las fichas personales, hitos espirituales, roles de liderazgo y habilidades/talentos de la congregación."
        action={
          !showForm && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowDeletedModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 size={16} className="text-red-500" />
                Papelera
              </button>
              <button
                type="button"
                onClick={() => setShowCareersModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
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

      {!showForm && (
        <div className="inline-flex w-full rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:w-auto">
          <button type="button" onClick={() => setActiveView('purpose')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${activeView === 'purpose' ? 'bg-primary text-white shadow-lg shadow-primary/15' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}><Compass size={17} /> Mapa de propósito</button>
          <button type="button" onClick={() => setActiveView('directory')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${activeView === 'directory' ? 'bg-primary text-white shadow-lg shadow-primary/15' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}><List size={17} /> Directorio CRM</button>
        </div>
      )}

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
      ) : activeView === 'purpose' ? (
        <PurposeDashboard members={members} loading={membersLoading} onEdit={handleOpenEdit} />
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

      {showDeletedModal && (
        <DeletedMembersModal onClose={() => setShowDeletedModal(false)} />
      )}
    </AnimeFadeUp>
  );
};

export default MembersManager;
