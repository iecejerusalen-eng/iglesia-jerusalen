import { Plus, Edit2, X, Loader2 } from 'lucide-react';
import type { Supplier } from '../types';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onOpenCreate: (sup?: Supplier) => void;
  showModal: boolean;
  onCloseModal: () => void;
  editingSupplier: Partial<Supplier> | null;
  onSupplierChange: (sup: Partial<Supplier>) => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

const getKycBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Verificado</span>;
    case 'rejected':
      return <span className="text-[10px] bg-red-100 text-red-750 px-2 py-0.5 rounded-full font-bold">Rechazado</span>;
    default:
      return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Pendiente</span>;
  }
};

const SupplierManager = ({
  suppliers,
  onOpenCreate,
  showModal,
  onCloseModal,
  editingSupplier,
  onSupplierChange,
  onSave,
  saving
}: SupplierManagerProps) => {
  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500">Listado de Proveedores e Incorporación KYC</span>
        <button
          onClick={() => onOpenCreate()}
          className="bg-primary text-white hover:bg-blue-900 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          Incorporar Proveedor
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                <th className="py-4 px-6">Proveedor</th>
                <th className="py-4 px-6">Contacto</th>
                <th className="py-4 px-6">RUC / DNI</th>
                <th className="py-4 px-6">Cert. Bancaria</th>
                <th className="py-4 px-6">Acuerdo Comercial</th>
                <th className="py-4 px-6">Estado General</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
              {suppliers.length > 0 ? (
                suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold">{sup.name}</td>
                    <td className="py-4 px-6 text-[11px]">
                      <span className="block">{sup.email || 'Sin correo'}</span>
                      <span className="block text-gray-400">{sup.phone || 'Sin teléfono'}</span>
                    </td>
                    <td className="py-4 px-6">{getKycBadge(sup.kyc_tax_id_status)}</td>
                    <td className="py-4 px-6">{getKycBadge(sup.kyc_bank_status)}</td>
                    <td className="py-4 px-6">{getKycBadge(sup.kyc_agreement_status)}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        sup.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'
                      }`}>
                        {sup.status === 'active' ? 'Activo' : 'Pendiente/Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onOpenCreate(sup)}
                        className="text-primary hover:text-gold font-bold text-xs cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Edit2 size={12} />
                        Ver KYC
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 italic">No hay proveedores incorporados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">
                {editingSupplier.id ? 'Detalles & KYC de Proveedor' : 'Incorporar Nuevo Proveedor'}
              </h3>
              <button onClick={onCloseModal} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={onSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ''}
                  onChange={(e) => onSupplierChange({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Editorial Cristiana SA"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => onSupplierChange({ ...editingSupplier, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                    placeholder="contacto@editorial.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => onSupplierChange({ ...editingSupplier, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                    placeholder="+593 ..."
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-150 dark:border-white/5 space-y-3">
                <span className="font-bold text-slate-800 dark:text-gray-200 text-xs block">Carpeta KYC (Conformidad del Proveedor)</span>
                
                <div className="grid grid-cols-1 gap-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">1. Identidad Fiscal (RUC / DNI)</span>
                      <span className="text-[10px] text-gray-400">Verificación de cédula o registro tributario fiscal.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_tax_id_status || 'pending'}
                      onChange={(e) => onSupplierChange({ ...editingSupplier, kyc_tax_id_status: e.target.value as any })}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">2. Certificación Bancaria</span>
                      <span className="text-[10px] text-gray-400">Validación de cuenta corriente para transferencias.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_bank_status || 'pending'}
                      onChange={(e) => onSupplierChange({ ...editingSupplier, kyc_bank_status: e.target.value as any })}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">3. Acuerdo de Comercialización</span>
                      <span className="text-[10px] text-gray-400">Convenio comercial debidamente firmado.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_agreement_status || 'pending'}
                      onChange={(e) => onSupplierChange({ ...editingSupplier, kyc_agreement_status: e.target.value as any })}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas / Observaciones KYC</label>
                <textarea
                  rows={2}
                  value={editingSupplier.kyc_notes || ''}
                  onChange={(e) => onSupplierChange({ ...editingSupplier, kyc_notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ingresa correcciones pendientes o comentarios..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado Operacional</label>
                  <select
                    value={editingSupplier.status || 'pending'}
                    onChange={(e) => onSupplierChange({ ...editingSupplier, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="active">Activo / Operando</option>
                    <option value="inactive">Inactivo / Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-bold shadow-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
