import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X, Plus, Trash2, Upload, Loader2, Compass, MapPin, User, Heart, Award, CheckCircle2, Layers, Save } from 'lucide-react';
import { memberSchema, parseCoordinates, CHURCH_COORDS } from '../utils/schema';
import type { MemberForm as MemberFormType, MemberWithRelations } from '../utils/schema';
import { useLookups } from '../hooks/useLookups';
import { useCareers } from '../hooks/useCareers';
import { COUNTRY_CODES } from '../../../utils/whatsapp';
import { MapPickerModal } from './MapPickerModal';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface MemberFormProps {
  editingMember: MemberWithRelations | null;
  onClose: () => void;
  onSubmitMember: (data: MemberFormType, editingId: string | null, areas: string[], talents: string[], gifts: string[]) => void;
  actionLoading: boolean;
}

export const MemberForm = ({ editingMember, onClose, onSubmitMember, actionLoading }: MemberFormProps) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'spiritual' | 'leadership' | 'skills'>('personal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const { data: lookups } = useLookups();
  const { data: careersList = [] } = useCareers();
  
  const serviceAreas = lookups?.serviceAreas || [];
  const talents = lookups?.talents || [];
  const spiritualGifts = lookups?.spiritualGifts || [];
  const rolesList = lookups?.rolesList || [];
  const ministries = lookups?.ministries || [];

  // Map checked IDs
  const initialAreas = editingMember?.member_service_areas?.map((a) => a.catalog_roles?.id || '') || [];
  const initialTalents = editingMember?.member_talents?.map((t) => t.catalog_roles?.id || '') || [];
  const initialGifts = editingMember?.member_spiritual_gifts?.map((g) => g.catalog_roles?.id || '') || [];

  const [selectedAreas, setSelectedAreas] = useState<string[]>(initialAreas);
  const [selectedTalents, setSelectedTalents] = useState<string[]>(initialTalents);
  const [selectedGifts, setSelectedGifts] = useState<string[]>(initialGifts);

  const formattedEmails = editingMember?.member_emails && editingMember.member_emails.length > 0
    ? editingMember.member_emails.map((e) => ({ email: e.email }))
    : [{ email: '' }];

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<MemberFormType>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: editingMember?.first_name || '',
      last_name: editingMember?.last_name || '',
      photo_url: editingMember?.photo_url || '',
      birth_date: editingMember?.birth_date || '',
      conversion_date: editingMember?.conversion_date || '',
      baptism_date: editingMember?.baptism_date || '',
      phone: editingMember?.phone || '',
      phone_country_code: editingMember?.phone_country_code || '+593',
      dni: editingMember?.dni || '',
      address: editingMember?.address || '',
      maps_link: editingMember?.maps_link || '',
      latitude: editingMember?.latitude ?? '',
      longitude: editingMember?.longitude ?? '',
      is_leader: !!editingMember?.is_leader,
      leadership_role: editingMember?.leadership_role || '',
      ministry_id: editingMember?.ministry_id || null,
      role_id: editingMember?.role_id || null,
      tithes_sum: editingMember?.tithes_sum || 0,
      emails: formattedEmails,
      education_level: editingMember?.education_level || '',
      career_id: editingMember?.career_id || '',
      is_studying: !!editingMember?.is_studying,
      studying_career_id: editingMember?.studying_career_id || '',
      dedicated_verse: editingMember?.dedicated_verse || '',
      gender: editingMember?.gender || null,
      marital_status: editingMember?.marital_status || '',
      birth_place: editingMember?.birth_place || '',
      has_disability: !!editingMember?.has_disability,
      disability_types: editingMember?.disability_types || [],
    }
  });

  const hasDisability = watch('has_disability');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails'
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'iglesia_jerusalen_web');

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'degrlmvsq';
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen a Cloudinary');
      }

      const data = await response.json();
      setValue('photo_url', data.secure_url, { shouldValidate: true });
      toast.success('Foto de perfil cargada y vinculada con éxito.');
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al subir la foto a Cloudinary.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        return {
          address: data.display_name,
          street: data.address.road || data.address.suburb || data.address.neighbourhood || ''
        };
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
    return null;
  };

  const handleConfirmLocation = async (lat: number, lng: number) => {
    setValue('latitude', Number(lat.toFixed(6)));
    setValue('longitude', Number(lng.toFixed(6)));
    setValue('maps_link', `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`);
    
    toast.success(`Coordenadas fijadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    
    const currentAddress = watch('address');
    if (!currentAddress || currentAddress.trim() === '') {
      toast.promise(
        handleReverseGeocode(lat, lng).then((res) => {
          if (res) {
            setValue('address', res.address);
            return `Dirección física auto-completada: ${res.street || 'Ubicación seleccionada'}`;
          }
          throw new Error('No se pudo resolver la dirección');
        }),
        {
          loading: 'Obteniendo dirección física de las coordenadas...',
          success: (msg) => msg,
          error: 'Coordenadas guardadas, pero no se pudo obtener la dirección física.'
        }
      );
    }
    
    setShowMapPicker(false);
  };

  const handleToggleArea = (id: string) => {
    setSelectedAreas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleToggleTalent = (id: string) => {
    setSelectedTalents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleToggleGift = (id: string) => {
    setSelectedGifts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const _onSubmit = (data: MemberFormType) => {
    onSubmitMember(data, editingMember?.id || null, selectedAreas, selectedTalents, selectedGifts);
  };

  const formLat = watch('latitude');
  const formLng = watch('longitude');

  return (
    <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8 animate-scale-in">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
        <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
          {editingMember ? `Editar Ficha: ${editingMember.first_name} ${editingMember.last_name}` : 'Registrar Nuevo Miembro'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-650 rounded-lg p-1.5 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-250 dark:border-white/10 mb-6 overflow-x-auto gap-2">
        {[
          { id: 'personal', label: 'Datos Personales', icon: User },
          { id: 'spiritual', label: 'Vida Espiritual', icon: Heart },
          { id: 'leadership', label: 'Liderazgo', icon: Award },
          { id: 'skills', label: 'Habilidades y Talentos', icon: CheckCircle2 }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(_onSubmit)} className="space-y-6">
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Nombres</label>
                <input type="text" {...register('first_name')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Ej. Carlos Alfredo" />
                {errors.first_name && <p className="text-accent-red text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Apellidos</label>
                <input type="text" {...register('last_name')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Ej. Mendoza Vera" />
                {errors.last_name && <p className="text-accent-red text-xs mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Cédula / DNI</label>
                <input type="text" {...register('dni')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Ej. 0991234567" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Celular / Teléfono</label>
                <div className="flex gap-2">
                  <select {...register('phone_country_code')} className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none w-28 shrink-0 font-semibold">
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.dialCode}>{country.flag} {country.dialCode}</option>
                    ))}
                  </select>
                  <input type="text" {...register('phone')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Ej. 0985263122" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Nacimiento</label>
                <input type="date" {...register('birth_date')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Sexo</label>
                <select {...register('gender')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none">
                  <option value="">Seleccione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Estado Civil</label>
                <select {...register('marital_status')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none">
                  <option value="">Seleccione...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                  <option value="Unión Libre">Unión Libre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Lugar de Nacimiento</label>
                <input type="text" {...register('birth_place')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Ej. Guayaquil, Ecuador" />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" {...register('has_disability')} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tiene algún tipo de discapacidad</span>
              </label>

              {hasDisability && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-2">Tipos de Discapacidad</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Física', 'Visual', 'Auditiva', 'Intelectual', 'Psicosocial', 'Múltiple'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          value={type}
                          {...register('disability_types')}
                          className="w-3.5 h-3.5 text-primary rounded border-gray-300"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Enlace URL Foto de Perfil</label>
              <div className="flex gap-2">
                <input type="url" {...register('photo_url')} className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="https://ejemplo.com/fotos/miembro.jpg" />
                <label className="px-4 py-2 bg-gold/15 text-gold border border-gold/30 rounded-xl text-xs font-bold hover:bg-gold/25 transition-all flex items-center gap-1.5 cursor-pointer select-none">
                  {uploadingPhoto ? <><Loader2 className="animate-spin" size={14} /> Subiendo...</> : <><Upload size={14} /> Subir Foto</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                </label>
              </div>
              {errors.photo_url && <p className="text-accent-red text-xs mt-1">{errors.photo_url.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Dirección de Domicilio</label>
                <input type="text" {...register('address')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Calle, Barrio, Ciudad" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Enlace o Código de Google Maps</label>
                <input
                  type="text"
                  {...register('maps_link')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue('maps_link', val);
                    const coords = parseCoordinates(val);
                    if (coords) {
                      setValue('latitude', coords.lat);
                      setValue('longitude', coords.lng);
                      toast.success(`Coordenadas extraídas: ${coords.lat}, ${coords.lng}`);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Pega link de Google Maps, iframe o coordenadas..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Latitud</label>
                <input type="number" step="any" {...register('latitude', { valueAsNumber: true })} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono" placeholder="Ej. -2.1391" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Longitud</label>
                <input type="number" step="any" {...register('longitude', { valueAsNumber: true })} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono" placeholder="Ej. -79.5950" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error('La geolocalización no está soportada por tu navegador');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setValue('latitude', Number(pos.coords.latitude.toFixed(6)));
                        setValue('longitude', Number(pos.coords.longitude.toFixed(6)));
                        toast.success('Ubicación capturada con éxito vía GPS');
                      },
                      (err) => toast.error('No se pudo capturar la ubicación GPS: ' + err.message)
                    );
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10 border border-slate-700 font-bold"
                >
                  <Compass size={14} className="text-gold shrink-0" />
                  GPS
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="flex-1 bg-primary hover:bg-blue-900 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10 shadow-sm font-bold"
                >
                  <MapPin size={14} className="text-gold shrink-0" />
                  Mapa
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-4 border border-gray-150 dark:border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider">Correos Electrónicos</span>
                <button type="button" onClick={() => append({ email: '' })} className="text-[11px] text-primary dark:text-church-gold-bright font-bold hover:underline cursor-pointer flex items-center gap-1">
                  <Plus size={12} />
                  Agregar correo
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <div className="flex-grow">
                      <input type="email" {...register(`emails.${idx}.email` as const)} className="w-full px-4 py-1.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="miembro@correo.com" />
                      {errors.emails?.[idx]?.email && <p className="text-accent-red text-[10px] mt-0.5">{errors.emails[idx].email?.message}</p>}
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-gray-150 dark:border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-1.5">
                <Award size={14} className="text-primary" /> Educación y Estudios Académicos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Nivel de Instrucción</label>
                  <select {...register('education_level')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold">
                    <option value="">Selecciona nivel...</option>
                    <option value="Ninguno">Ninguno / Sin estudios</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria / Bachillerato</option>
                    <option value="Tercer Grado">Tercer Grado (Universidad / Tecnológico)</option>
                    <option value="Cuarto Grado">Cuarto Grado (Posgrado / Maestría)</option>
                    <option value="Doctorado">Doctorado / Ph.D.</option>
                  </select>
                </div>
                {['Tercer Grado', 'Cuarto Grado', 'Doctorado'].includes(watch('education_level') || '') && (
                  <div className="animate-scale-in">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Título de Tercer Grado / Carrera</label>
                    <select {...register('career_id')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold">
                      <option value="">Selecciona carrera...</option>
                      {careersList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_studying" {...register('is_studying')} className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                  <label htmlFor="is_studying" className="text-xs font-bold text-gray-650 dark:text-gray-400 cursor-pointer">Actualmente estudiando en la Universidad / Tecnológico</label>
                </div>
                {watch('is_studying') && (
                  <div className="pl-6 animate-fadeUp">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Carrera en curso</label>
                    <select {...register('studying_career_id')} className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold">
                      <option value="">Selecciona carrera que estudia...</option>
                      {careersList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spiritual' && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Aceptación / Conversión</label>
                <input type="date" {...register('conversion_date')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Bautismo en Aguas</label>
                <input type="date" {...register('baptism_date')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Registro de Aportes/Diezmos ($ USD)</label>
              <input type="number" step="0.01" min="0" {...register('tithes_sum', { valueAsNumber: true })} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono" placeholder="0.00" />
              {errors.tithes_sum && <p className="text-accent-red text-xs mt-1">{errors.tithes_sum.message}</p>}
              <span className="text-[10px] text-gray-400 font-medium mt-1 block">Suma histórica de diezmos registrados en el sistema de la iglesia.</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Versículo Bíblico Dedicado</label>
              <input type="text" {...register('dedicated_verse')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="Ej. Juan 3:16" />
              <span className="text-[10px] text-gray-400 font-medium mt-1 block">Este versículo se mostrará en su cumpleaños y enlazará directamente a la Biblia.</span>
            </div>
          </div>
        )}

        {activeTab === 'leadership' && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 p-4 rounded-xl">
              <input type="checkbox" id="is_leader" {...register('is_leader')} className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
              <label htmlFor="is_leader" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                ¿Este miembro desempeña un rol de liderazgo en la iglesia?
              </label>
            </div>
            {watch('is_leader') && (
              <div className="space-y-4 animate-fadeUp">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Departamento / Ministerio</label>
                  <select {...register('ministry_id')} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer">
                    <option value="">Selecciona un departamento...</option>
                    {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                {watch('ministry_id') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Rol / Cargo</label>
                    <select {...register('role_id')} onChange={(e) => {
                      const selectedId = e.target.value;
                      const roleObj = rolesList.find(r => r.id === selectedId);
                      setValue('leadership_role', roleObj ? roleObj.name : '');
                    }} className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer">
                      <option value="">Selecciona un cargo...</option>
                      {rolesList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                <Layers size={14} className="text-gold" />
                Áreas de Servicio en la Iglesia
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {serviceAreas.map((area) => {
                  const checked = selectedAreas.includes(area.id);
                  return (
                    <button key={area.id} type="button" onClick={() => handleToggleArea(area.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${checked ? 'bg-primary text-white border-primary shadow-2xs' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-750'}`}>
                      {area.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                <Award size={14} className="text-gold" />
                Habilidades y Talentos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const grouped: Record<string, typeof talents> = {};
                  talents.forEach(t => {
                    const match = t.name.match(/^\[(.*?)\]\s*(.*)$/);
                    const catName = match ? match[1] : 'Otros';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName].push(t);
                  });

                  return Object.entries(grouped).map(([categoryName, items]) => (
                    <div key={categoryName} className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3.5 border border-gray-150 dark:border-white/10">
                      <span className="text-[11px] font-bold text-primary dark:text-church-gold-bright uppercase tracking-wider block border-b border-gray-100/50 dark:border-white/5 pb-1">
                        {categoryName}
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {items.map((talent) => {
                          const checked = selectedTalents.includes(talent.id);
                          const displayName = talent.name.replace(/^\[.*?\]\s*/, '');
                          return (
                            <button key={talent.id} type="button" onClick={() => handleToggleTalent(talent.id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${checked ? 'bg-primary text-white border-primary shadow-2xs' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-305 hover:bg-gray-50 dark:hover:bg-slate-750'}`}>
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                <Heart size={14} className="text-gold" />
                Dones Espirituales
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {spiritualGifts.map((gift) => {
                  const checked = selectedGifts.includes(gift.id);
                  return (
                    <button key={gift.id} type="button" onClick={() => handleToggleGift(gift.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${checked ? 'bg-primary text-white border-primary shadow-2xs' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-355 hover:bg-gray-50 dark:hover:bg-slate-750'}`}>
                      {gift.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-250 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={actionLoading} className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {editingMember ? 'Actualizar Ficha' : 'Registrar Miembro'}
          </button>
        </div>
      </form>

      {showMapPicker && (
        <MapPickerModal
          initialLat={formLat && !isNaN(Number(formLat)) ? Number(formLat) : CHURCH_COORDS.lat}
          initialLng={formLng && !isNaN(Number(formLng)) ? Number(formLng) : CHURCH_COORDS.lng}
          onClose={() => setShowMapPicker(false)}
          onConfirm={handleConfirmLocation}
        />
      )}
    </AnimeFadeUp>
  );
};
