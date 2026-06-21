import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import { X, Plus, Trash2, User, Mail, Phone, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../animations/AnimeWrappers';

const CRMRegistrationPrompt = () => {
  const { user, memberId, firstName, lastName, setMemberId, isLoading } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialization
  useEffect(() => {
    if (isLoading || !user || memberId) return;

    const dismissed = localStorage.getItem(`crm_prompt_dismissed_${user.id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
      setShowModal(false);
    } else {
      setIsDismissed(false);
      setShowModal(true);
    }

    setFormData({
      firstName: firstName || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
      lastName: lastName || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      phone: '',
    });
  }, [user, memberId, isLoading, firstName, lastName]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`crm_prompt_dismissed_${user.id}`, 'true');
    }
    setIsDismissed(true);
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleAddEmail = () => {
    setAdditionalEmails([...additionalEmails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...additionalEmails];
    newEmails.splice(index, 1);
    setAdditionalEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...additionalEmails];
    newEmails[index] = value;
    setAdditionalEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      toast.error('Por favor, completa los campos obligatorios (Nombre, Apellido y Teléfono).');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMemberId = null;

      // 1. Search if member already exists by email in member_emails (deduplication check)
      if (user.email) {
        const { data: emailMatch } = await supabase
          .from('member_emails')
          .select('member_id')
          .eq('email', user.email.trim())
          .maybeSingle();
        if (emailMatch) {
          finalMemberId = emailMatch.member_id;
        }
      }

      // 2. If no email match, check by first name and last name in members table
      if (!finalMemberId) {
        const { data: nameMatch } = await supabase
          .from('members')
          .select('id')
          .eq('first_name', formData.firstName.trim())
          .eq('last_name', formData.lastName.trim())
          .maybeSingle();
        if (nameMatch) {
          finalMemberId = nameMatch.id;
        }
      }

      if (finalMemberId) {
        // Option A: Member already exists — link profile FIRST to satisfy RLS update checks
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ member_id: finalMemberId })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Now that the profile is linked, we are authorized to update the member row
        const { error: updateError } = await supabase
          .from('members')
          .update({
            phone: formData.phone.trim(),
            photo_url: user.user_metadata?.avatar_url || null,
          })
          .eq('id', finalMemberId);

        if (updateError) throw updateError;
      } else {
        // Option B: Create new member
        const { data: newMember, error: insertError } = await supabase
          .from('members')
          .insert([{
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim(),
            is_leader: false,
            tithes_sum: 0,
            photo_url: user.user_metadata?.avatar_url || null,
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        finalMemberId = newMember.id;

        // Link the profile to the newly created member
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ member_id: finalMemberId })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // 4. Insert/upsert emails into member_emails
      if (user.email) {
        const emailsToInsert = [{ member_id: finalMemberId, email: user.email }];
        additionalEmails.forEach(email => {
          if (email.trim()) {
            emailsToInsert.push({ member_id: finalMemberId, email: email.trim() });
          }
        });

        // Ignore duplicates in member_emails
        const { error: emailsError } = await supabase
          .from('member_emails')
          .upsert(emailsToInsert, { onConflict: 'member_id, email' });

        if (emailsError) {
          console.error('Error inserting emails:', emailsError);
        }
      }

      // Success
      toast.success('¡Te has registrado con éxito!');
      setMemberId(finalMemberId);
      setShowModal(false);

    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error('Ocurrió un error al intentar registrarte: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading, not logged in, or already registered, render nothing
  if (isLoading || !user || memberId) return null;

  return (
    <>
      {/* Persistent Banner if Dismissed */}
      {isDismissed && !showModal && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleOpenModal}
            className="bg-accent-red hover:bg-red-700 text-white shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3 transition-transform hover:scale-105"
          >
            <AlertCircle size={20} />
            <div className="text-left">
              <p className="text-sm font-bold leading-tight">Completa tu Registro</p>
              <p className="text-xs text-red-100">Faltan datos de CRM</p>
            </div>
            <ChevronRight size={18} className="opacity-70 ml-1" />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss}></div>
          <AnimeFadeUp className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800">
            {/* Header */}
            <div className="bg-primary px-6 py-8 text-white relative">
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={30} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold">¡Bienvenido!</h2>
                  <p className="text-primary-100 text-sm mt-1">Completa tu ficha para integrarte a nuestra comunidad.</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="space-y-5">
                
                {/* Required Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white"
                      placeholder="Ej. Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white"
                      placeholder="Ej. Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} /> Teléfono / Celular *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white"
                    placeholder="+1 234 567 890"
                  />
                </div>

                {/* Emails Section */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mail size={14} /> Correos Electrónicos
                  </label>
                  <div className="space-y-3">
                    {/* Primary Email (ReadOnly) */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          value={user.email || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Principal</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Emails */}
                    {additionalEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white"
                          placeholder="correo.alternativo@ejemplo.com"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(index)}
                          className="p-2.5 text-gray-400 hover:text-accent-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="text-sm font-medium text-primary hover:text-blue-700 flex items-center gap-1.5 px-1 cursor-pointer transition-colors"
                    >
                      <Plus size={16} /> Añadir otro correo
                    </button>
                  </div>
                </div>

              </div>

              {/* Footer / Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Hacerlo más tarde
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-900 rounded-xl transition-colors cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                      Registrando...
                    </>
                  ) : (
                    'Completar Registro'
                  )}
                </button>
              </div>
            </form>
          </AnimeFadeUp>
        </div>
      )}
    </>
  );
};

export default CRMRegistrationPrompt;
