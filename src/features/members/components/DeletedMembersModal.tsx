import { X, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDeletedMembers } from '../hooks/useDeletedMembers';
import { useMembersMutations } from '../hooks/useMembersMutations';
import { getAvatarUrl } from '../utils/memberUtils';

interface DeletedMembersModalProps {
  onClose: () => void;
}

export const DeletedMembersModal = ({ onClose }: DeletedMembersModalProps) => {
  const { data: deletedMembers = [], isLoading } = useDeletedMembers();
  const { restoreMemberMutation } = useMembersMutations();

  const handleRestore = async (id: string, name: string) => {
    await restoreMemberMutation.mutateAsync({ id, name });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content - Glassmorphism */}
      <div className="relative w-full max-w-2xl bg-white/30 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-600 dark:text-red-400">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Papelera de Reciclaje</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Historial de miembros eliminados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
          ) : deletedMembers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="bg-white/20 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="opacity-50 text-slate-600 dark:text-slate-400" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">La papelera está vacía</p>
              <p className="text-sm mt-1">No hay miembros eliminados en el historial.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedMembers.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-white/5 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getAvatarUrl(member)}
                      alt={member.first_name}
                      className="w-12 h-12 rounded-full object-cover border border-white/40 dark:border-white/20"
                    />
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        {member.first_name} {member.last_name}
                      </h3>
                      {member.deleted_at && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                          Eliminado el {format(new Date(member.deleted_at), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRestore(member.id, `${member.first_name} ${member.last_name}`)}
                    disabled={restoreMemberMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {restoreMemberMutation.isPending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
