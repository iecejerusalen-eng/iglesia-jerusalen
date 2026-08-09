import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Heart, User, MapPin, Activity, Sparkles } from 'lucide-react';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'welcome', title: 'Bienvenido', icon: Heart },
  { id: 'personal', title: 'Datos Personales', icon: User },
  { id: 'contact', title: 'Contacto y Ubicación', icon: MapPin },
  { id: 'health', title: 'Salud y Emergencia', icon: Activity },
  { id: 'spiritual', title: 'Vida Espiritual', icon: Sparkles },
];

export default function CrmOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    phone: '',
    email: '',
    address: '',
    birthPlace: '',
    hasDisability: 'false',
    disabilityTypes: '',
    medicalNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isBaptized: 'false',
    ministryInterest: '',
    spiritualGifts: '',
    talents: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender) {
        toast.error('Por favor completa todos los campos requeridos (*)');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.phone || !formData.email || !formData.address) {
        toast.error('Por favor completa los campos de contacto requeridos (*)');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('crm_onboarding_submissions').insert({
        raw_data: formData,
        status: 'pending'
      });
      if (error) throw error;
      setCurrentStep(STEPS.length); // go to success screen
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error enviando el formulario: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>

      <motion.div 
        className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 md:p-10 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Progress bar */}
        {currentStep < STEPS.length && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : isPast ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30'}`}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-1 w-8 mx-2 rounded-full transition-all duration-300 ${isPast ? 'bg-indigo-500/50' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-10">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <Heart className="w-10 h-10 text-pink-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Bienvenido a la Familia</h1>
              <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                Estamos emocionados de conocerte mejor. Este breve formulario nos ayudará a integrarte en nuestra comunidad, descubrir tus dones y brindarte el mejor acompañamiento espiritual.
              </p>
              <button onClick={nextStep} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 mx-auto">
                Comenzar <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Datos Personales</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassInput label="Nombres *" name="firstName" value={formData.firstName} onChange={handleChange} />
                  <GlassInput label="Apellidos *" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassInput label="Fecha de Nacimiento *" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
                  <GlassInput label="Lugar de Nacimiento" name="birthPlace" value={formData.birthPlace} onChange={handleChange} placeholder="Ej. Lima, Perú" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassSelect label="Género *" name="gender" value={formData.gender} onChange={handleChange} options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' }
                  ]} />
                  <GlassSelect label="Estado Civil" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: 'soltero', label: 'Soltero(a)' },
                    { value: 'casado', label: 'Casado(a)' },
                    { value: 'divorciado', label: 'Divorciado(a)' },
                    { value: 'viudo', label: 'Viudo(a)' },
                    { value: 'conviviente', label: 'Conviviente' }
                  ]} />
                </div>
              </div>
              <StepNavigation onPrev={prevStep} onNext={nextStep} />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Contacto y Ubicación</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassInput label="Correo Electrónico *" name="email" type="email" value={formData.email} onChange={handleChange} />
                  <GlassInput label="Teléfono / WhatsApp *" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
                <GlassInput label="Dirección de Domicilio *" name="address" value={formData.address} onChange={handleChange} />
              </div>
              <StepNavigation onPrev={prevStep} onNext={nextStep} />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Salud y Emergencia</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassInput label="Contacto de Emergencia" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Nombre de familiar" />
                  <GlassInput label="Teléfono de Emergencia" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
                </div>
                <GlassSelect label="¿Tienes alguna discapacidad?" name="hasDisability" value={formData.hasDisability} onChange={handleChange} options={[
                  { value: 'false', label: 'No' },
                  { value: 'true', label: 'Sí' }
                ]} />
                {formData.hasDisability === 'true' && (
                  <GlassInput label="Tipo de discapacidad" name="disabilityTypes" value={formData.disabilityTypes} onChange={handleChange} placeholder="Visual, Auditiva, Motora, etc." />
                )}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Notas Médicas (Opcional)</label>
                  <textarea name="medicalNotes" value={formData.medicalNotes} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all" rows={3} placeholder="Alergias, condiciones médicas a considerar..."></textarea>
                </div>
              </div>
              <StepNavigation onPrev={prevStep} onNext={nextStep} />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-white mb-6">Vida Espiritual y Dones</h2>
              <div className="space-y-4">
                <GlassSelect label="¿Estás bautizado en aguas?" name="isBaptized" value={formData.isBaptized} onChange={handleChange} options={[
                  { value: 'false', label: 'No, aún no' },
                  { value: 'true', label: 'Sí' }
                ]} />
                <GlassInput label="¿En qué ministerio te gustaría servir?" name="ministryInterest" value={formData.ministryInterest} onChange={handleChange} placeholder="Ej. Alabanza, Niños, Ujieres..." />
                <GlassInput label="¿Cuáles crees que son tus dones espirituales?" name="spiritualGifts" value={formData.spiritualGifts} onChange={handleChange} placeholder="Ej. Enseñanza, Servicio, Exhortación..." />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Talentos y Habilidades</label>
                  <textarea name="talents" value={formData.talents} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all" rows={3} placeholder="Ej. Toco guitarra, diseño gráfico, sé cocinar bien..."></textarea>
                </div>
              </div>
              <div className="flex items-center justify-between mt-8">
                <button onClick={prevStep} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Atrás
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Enviando...' : 'Finalizar y Enviar'} <Check className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === STEPS.length && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <Check className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">¡Gracias por registrarte!</h2>
              <p className="text-white/70 mb-8 max-w-sm mx-auto">Tus datos han sido enviados con éxito. Nuestro equipo revisará la información y te contactaremos pronto.</p>
              <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-3 rounded-full font-medium transition-all">
                Volver al Inicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Subcomponents

const GlassInput = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
    <input 
      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all"
      {...props}
    />
  </div>
);

const GlassSelect = ({ label, options, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
    <select 
      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all appearance-none"
      {...props}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
      ))}
    </select>
  </div>
);

const StepNavigation = ({ onPrev, onNext }: { onPrev: () => void, onNext: () => void }) => (
  <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
    <button onClick={onPrev} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
      <ChevronLeft className="w-5 h-5" /> Atrás
    </button>
    <button onClick={onNext} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-2.5 rounded-full font-medium transition-all flex items-center gap-2">
      Siguiente <ChevronRight className="w-5 h-5" />
    </button>
  </div>
);
