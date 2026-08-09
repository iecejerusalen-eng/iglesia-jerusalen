import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Eye, CheckCircle, XCircle, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';

interface OnboardingData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthPlace?: string;
  hasDisability?: string;
  disabilityTypes?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isBaptized?: string;
  ministryInterest?: string;
  spiritualGifts?: string;
  talents?: string;
}

interface CrmSubmission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  raw_data: OnboardingData;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export default function CrmSubmissions() {
  const [submissions, setSubmissions] = useState<CrmSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<CrmSubmission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const readOnly = usePermissions().isReadOnly('members');
  const userId = useAuthStore((state) => state.user?.id ?? null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_onboarding_submissions')
        .select('id, status, raw_data, created_at, processed_at, processed_by')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: unknown) {
      toast.error('Error cargando solicitudes: ' + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchSubmissions(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleApprove = async (sub: CrmSubmission) => {
    if (readOnly) {
      toast.error('Tu rol permite revisar solicitudes, pero no aprobarlas.');
      return;
    }
    setProcessingId(sub.id);
    try {
      const { raw_data } = sub;
      const normalizedEmail = raw_data.email?.trim().toLowerCase() || null;
      if (normalizedEmail) {
        const { data: existingEmail, error: emailLookupError } = await supabase
          .from('member_emails')
          .select('member_id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        if (emailLookupError) throw emailLookupError;
        if (existingEmail) throw new Error('Ya existe una persona registrada con este correo.');
      }

      const { data: newMember, error: insertError } = await supabase
        .from('members')
        .insert([{
          first_name: raw_data.firstName?.trim() || '',
          last_name: raw_data.lastName?.trim() || '',
          birth_date: raw_data.birthDate || null,
          phone: raw_data.phone?.trim() || '',
          gender: raw_data.gender || null,
          marital_status: raw_data.maritalStatus || null,
          birth_place: raw_data.birthPlace || null,
          has_disability: raw_data.hasDisability === 'true',
          disability_types: raw_data.disabilityTypes ? [raw_data.disabilityTypes] : [],
          medical_notes: raw_data.medicalNotes || null,
          emergency_contact_name: raw_data.emergencyContactName || null,
          emergency_contact_phone: raw_data.emergencyContactPhone || null,
          // Notas o detalles adicionales
          baptism_date: null,
        }])
        .select('id')
        .single();
        
      if (insertError) throw insertError;

      if (normalizedEmail) {
        const { error: memberEmailError } = await supabase
          .from('member_emails')
          .insert({ member_id: newMember.id, email: normalizedEmail });
        if (memberEmailError) throw memberEmailError;
      }

      // Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('crm_onboarding_submissions')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: userId,
        })
        .eq('id', sub.id);
        
      if (updateError) throw updateError;
      
      toast.success('Miembro importado al CRM correctamente');
      setSelectedSubmission(null);
      fetchSubmissions();

    } catch (error: unknown) {
      toast.error('Error aprobando solicitud: ' + getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (readOnly) {
      toast.error('Tu rol permite revisar solicitudes, pero no rechazarlas.');
      return;
    }
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud? No se insertará en el CRM.')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('crm_onboarding_submissions')
        .update({ status: 'rejected', processed_at: new Date().toISOString(), processed_by: userId })
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Solicitud rechazada');
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: unknown) {
      toast.error('Error rechazando solicitud: ' + getErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Pendiente</span>;
      case 'approved': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Aprobado</span>;
      case 'rejected': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Rechazado</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Ingreso</h1>
          <p className="text-sm text-gray-500 mt-1">Revisa y aprueba los formularios enviados por los miembros.</p>
        </div>
        <button onClick={fetchSubmissions} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">Actualizar Lista</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando solicitudes...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay solicitudes para mostrar.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{sub.raw_data?.firstName} {sub.raw_data?.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sub.raw_data?.phone}</div>
                      <div className="text-sm text-gray-500">{sub.raw_data?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 ml-auto"
                      >
                        <Eye className="w-4 h-4" /> Revisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Revisión */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Revisar Solicitud de Ingreso</h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-500">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos Personales</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Nombres</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Apellidos</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Nacimiento</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.birthDate} ({selectedSubmission.raw_data?.birthPlace})</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Género / Estado Civil</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.gender} / {selectedSubmission.raw_data?.maritalStatus}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contacto</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Teléfono</dt>
                      <dd className="font-medium text-gray-900 flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedSubmission.raw_data?.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900 flex items-center gap-1"><Mail className="w-3 h-3"/> {selectedSubmission.raw_data?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Dirección</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.address}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Salud y Emergencia</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Discapacidad</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedSubmission.raw_data?.hasDisability === 'true' 
                          ? `Sí (${selectedSubmission.raw_data?.disabilityTypes})` 
                          : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Notas Médicas</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.medicalNotes || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Contacto Emergencia</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedSubmission.raw_data?.emergencyContactName} <br/>
                        {selectedSubmission.raw_data?.emergencyContactPhone}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vida Espiritual</h4>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Bautizado</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.isBaptized === 'true' ? 'Sí' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Interés en Ministerio</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.ministryInterest || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Dones / Talentos</dt>
                      <dd className="font-medium text-gray-900">{selectedSubmission.raw_data?.spiritualGifts}</dd>
                      <dd className="text-gray-600 mt-1">{selectedSubmission.raw_data?.talents}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              {selectedSubmission.status === 'pending' && !readOnly && (
                <>
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    disabled={processingId !== null}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSubmission)}
                    disabled={processingId !== null}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processingId === selectedSubmission.id ? 'Importando...' : 'Aprobar e Importar al CRM'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
