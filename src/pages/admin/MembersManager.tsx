import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { sql } from '../../config/localDb';
import { useSyncStore } from '../../store/useSyncStore';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Plus, Search, User, Award, 
  Trash2, Edit2, Save, X, Loader2, Heart, CheckCircle2, Layers, Download, Phone, MapPin, Compass, Upload
} from 'lucide-react';
import type { 
  Member as DbMember, CatalogRole, Career
} from '../../types';
import { TableSkeleton } from '../../components/common/Skeletons';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { COUNTRY_CODES, formatWhatsAppLink } from '../../utils/whatsapp';

const CHURCH_COORDS = { lat: -2.139188, lng: -79.5949891 }; // Iglesia Jerusalén Central (Milagro, Ecuador)

// Helper to parse coordinates from pasted Google Maps url, iframe src, or raw coords
const parseCoordinates = (text: string) => {
  if (!text) return null;
  // Match @lat,lng
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // Match q=lat,lng or query=lat,lng
  const qMatch = text.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  // Match standard iframe embed src URL (pb=!1m18!1m12!1d...!2d-79.5950!3d-2.1391)
  const embedMatch = text.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (embedMatch) {
    return { lat: parseFloat(embedMatch[2]), lng: parseFloat(embedMatch[1]) };
  }

  // Matches generic lat,lng anywhere in text
  const genericMatch = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
};

// Zod validation schema
const memberSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  photo_url: z.string().url('Ingresa una URL de foto válida').or(z.literal('')),
  birth_date: z.string().or(z.literal('')),
  conversion_date: z.string().or(z.literal('')),
  baptism_date: z.string().or(z.literal('')),
  phone: z.string().or(z.literal('')),
  phone_country_code: z.string().optional(),
  dni: z.string().or(z.literal('')),
  address: z.string().or(z.literal('')),
  maps_link: z.string().or(z.literal('')),
  latitude: z.number().optional().nullable().or(z.literal('')),
  longitude: z.number().optional().nullable().or(z.literal('')),
  is_leader: z.boolean(),
  leadership_role: z.string().or(z.literal('')),
  ministry_id: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  tithes_sum: z.number({ message: 'El diezmo debe ser un número válido' }).min(0, 'El diezmo no puede ser negativo').or(z.nan()).transform((val) => isNaN(val) ? 0 : val),
  emails: z.array(z.object({
    email: z.string().email('Por favor ingresa un correo válido')
  })).min(1, 'Debes ingresar al menos un correo electrónico'),
  education_level: z.string().nullable().optional().or(z.literal('')),
  career_id: z.string().nullable().optional().or(z.literal('')),
  is_studying: z.boolean().optional(),
  studying_career_id: z.string().nullable().optional().or(z.literal('')),
});

type MemberForm = z.infer<typeof memberSchema>;

const MembersManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<DbMember | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'spiritual' | 'leadership' | 'skills'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Careers CRUD States
  const [showCareersModal, setShowCareersModal] = useState(false);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [editingCareerName, setEditingCareerName] = useState('');
  const [newCareerName, setNewCareerName] = useState('');
  const [savingCareer, setSavingCareer] = useState(false);
  const [careerSearchQuery, setCareerSearchQuery] = useState('');

  // Filter, Sort and Group State
  const [filterLeadership, setFilterLeadership] = useState<'all' | 'leaders' | 'regulars'>('all');
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'birth_date' | 'tithes_sum'>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'leadership' | 'ministry' | 'service_area' | 'birth_month'>('none');

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

  // Map Picker State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickerCoords, setPickerCoords] = useState({ lat: CHURCH_COORDS.lat, lng: CHURCH_COORDS.lng });
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalGeocoding, setModalGeocoding] = useState(false);
  const modalMapRef = useRef<any>(null);

  const handleOpenMapPicker = () => {
    const formLat = watch('latitude');
    const formLng = watch('longitude');
    
    if (formLat && formLng && typeof formLat === 'number' && typeof formLng === 'number') {
      setPickerCoords({ lat: formLat, lng: formLng });
    } else {
      setPickerCoords({ lat: CHURCH_COORDS.lat, lng: CHURCH_COORDS.lng });
    }
    setModalSearchQuery('');
    setShowMapPicker(true);
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

  const handleConfirmLocation = async () => {
    setValue('latitude', Number(pickerCoords.lat.toFixed(6)));
    setValue('longitude', Number(pickerCoords.lng.toFixed(6)));
    setValue('maps_link', `https://www.google.com/maps?q=${pickerCoords.lat.toFixed(6)},${pickerCoords.lng.toFixed(6)}`);
    
    toast.success(`Coordenadas fijadas: ${pickerCoords.lat.toFixed(6)}, ${pickerCoords.lng.toFixed(6)}`);
    
    // Reverse geocode to auto-fill address if current address is empty
    const currentAddress = watch('address');
    if (!currentAddress || currentAddress.trim() === '') {
      toast.promise(
        handleReverseGeocode(pickerCoords.lat, pickerCoords.lng).then((res) => {
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

  const handleModalSearch = async () => {
    if (!modalSearchQuery.trim()) return;
    setModalGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(modalSearchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        setPickerCoords({ lat, lng: lon });
        modalMapRef.current?.flyTo({
          center: [lon, lat],
          zoom: 16,
          duration: 1000
        });
      } else {
        toast.error('No se encontró esa ubicación en la búsqueda.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al realizar la búsqueda en el mapa.');
    } finally {
      setModalGeocoding(false);
    }
  };

  const handleMapClick = (e: any) => {
    setPickerCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };

  // Master lookup lists
  const [serviceAreas, setServiceAreas] = useState<CatalogRole[]>([]);
  const [talents, setTalents] = useState<CatalogRole[]>([]);
  const [spiritualGifts, setSpiritualGifts] = useState<CatalogRole[]>([]);
  const [rolesList, setRolesList] = useState<CatalogRole[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [careersList, setCareersList] = useState<Career[]>([]);

  // Selected relationships state
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      photo_url: '',
      birth_date: '',
      conversion_date: '',
      baptism_date: '',
      phone: '',
      phone_country_code: '+593',
      dni: '',
      address: '',
      maps_link: '',
      latitude: '',
      longitude: '',
      is_leader: false,
      leadership_role: '',
      ministry_id: null,
      role_id: null,
      tithes_sum: 0,
      emails: [{ email: '' }],
      education_level: '',
      career_id: '',
      is_studying: false,
      studying_career_id: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails'
  });

  useEffect(() => {
    fetchMembers();
    fetchLookups();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch user profiles first to map linked accounts
      let profilesList: any[] = [];
      try {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, member_id, email, role');
        profilesList = pData || [];
      } catch (pe) {
        console.warn('Could not load profiles for linkage mapping:', pe);
      }

      // Try fetching from local SQLite first
      let cached: any[] = [];
      try {
        cached = await Promise.race([
          sql`SELECT * FROM local_members WHERE deleted_at IS NULL ORDER BY last_name ASC;`,
          new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Local DB timeout')), 2000))
        ]);
      } catch (dbErr) {
        console.warn('Local DB failed or timed out, fallback to Supabase:', dbErr);
      }

      let loadedMembers: any[] = [];

      if (cached && cached.length > 0) {
        // Map SQLite attributes back to type model
        loadedMembers = cached.map(m => ({
          ...m,
          is_leader: m.is_leader === 1,
          is_studying: m.is_studying === 1,
          member_emails: m.emails ? JSON.parse(m.emails) : [],
          member_service_areas: m.service_areas ? JSON.parse(m.service_areas) : [],
          member_talents: m.talents ? JSON.parse(m.talents) : [],
          member_spiritual_gifts: m.spiritual_gifts ? JSON.parse(m.spiritual_gifts) : []
        }));
      } else {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            member_emails(email),
            member_service_areas(catalog_roles(id, name)),
            member_talents(catalog_roles(id, name)),
            member_spiritual_gifts(catalog_roles(id, name)),
            ministries(id, name),
            catalog_roles!role_id(id, name),
            careers!career_id(id, name),
            studying_careers:careers!studying_career_id(id, name)
          `)
          .is('deleted_at', null)
          .order('last_name', { ascending: true });

        if (error) throw error;
        loadedMembers = data || [];
      }

      // Map profiles onto loaded members
      const finalMembers = loadedMembers.map(m => ({
        ...m,
        profiles: profilesList.filter(p => p.member_id === m.id)
      }));

      setMembers(finalMembers);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      toast.error('Error al cargar miembros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [catalogRes, ministriesRes, careersRes] = await Promise.all([
        supabase.from('catalog_roles').select('*').order('name'),
        supabase.from('ministries').select('id, name').order('name'),
        supabase.from('careers').select('*').order('name'),
      ]);

      const catalogData: CatalogRole[] = catalogRes.data || [];
      setServiceAreas(catalogData.filter(x => x.category === 'Área de Servicios'));
      setTalents(catalogData.filter(x => x.category === 'Talentos'));
      setSpiritualGifts(catalogData.filter(x => x.category === 'Dones'));
      setRolesList(catalogData.filter(x => x.category === 'Roles'));
      setMinistries(ministriesRes.data || []);
      setCareersList(careersRes.data || []);
    } catch (err) {
      console.error('Error fetching lookup lists:', err);
    }
  };

  const handleAddCareer = async () => {
    if (!newCareerName.trim()) return;
    setSavingCareer(true);
    try {
      const { error } = await supabase
        .from('careers')
        .insert([{ name: newCareerName.trim() }]);

      if (error) throw error;
      toast.success('Carrera agregada exitosamente.');
      setNewCareerName('');
      fetchLookups();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al agregar carrera: ' + (err.message || 'Nombre duplicado o sin conexión.'));
    } finally {
      setSavingCareer(false);
    }
  };

  const handleUpdateCareer = async (id: string) => {
    if (!editingCareerName.trim()) return;
    setSavingCareer(true);
    try {
      const { error } = await supabase
        .from('careers')
        .update({ name: editingCareerName.trim() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Carrera actualizada exitosamente.');
      setEditingCareerId(null);
      setEditingCareerName('');
      fetchLookups();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar carrera: ' + err.message);
    } finally {
      setSavingCareer(false);
    }
  };

  const handleDeleteCareer = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar carrera',
      message: `¿Estás seguro de eliminar la carrera "${name}"?\n\nEsto removerá la referencia en todos los miembros vinculados.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setSavingCareer(true);
    try {
      const { error } = await supabase
        .from('careers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Carrera eliminada exitosamente.');
      fetchLookups();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al eliminar carrera: ' + err.message);
    } finally {
      setSavingCareer(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMember(null);
    setSelectedAreas([]);
    setSelectedTalents([]);
    setSelectedGifts([]);
    setActiveTab('personal');
    reset({
      first_name: '',
      last_name: '',
      photo_url: '',
      birth_date: '',
      conversion_date: '',
      baptism_date: '',
      phone: '',
      phone_country_code: '+593',
      dni: '',
      address: '',
      maps_link: '',
      latitude: '',
      longitude: '',
      is_leader: false,
      leadership_role: '',
      ministry_id: null,
      role_id: null,
      tithes_sum: 0,
      emails: [{ email: '' }],
      education_level: '',
      career_id: '',
      is_studying: false,
      studying_career_id: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (member: any) => {
    setEditingMember(member);
    setActiveTab('personal');

    // Extract emails
    const formattedEmails = member.member_emails && member.member_emails.length > 0
      ? member.member_emails.map((e: any) => ({ email: e.email }))
      : [{ email: '' }];

    // Map checked IDs
    const areas = member.member_service_areas 
      ? member.member_service_areas.map((a: any) => a.catalog_roles.id) 
      : [];
    const tlnts = member.member_talents 
      ? member.member_talents.map((t: any) => t.catalog_roles.id) 
      : [];
    const gfts = member.member_spiritual_gifts 
      ? member.member_spiritual_gifts.map((g: any) => g.catalog_roles.id) 
      : [];

    setSelectedAreas(areas);
    setSelectedTalents(tlnts);
    setSelectedGifts(gfts);

    reset({
      first_name: member.first_name,
      last_name: member.last_name,
      photo_url: member.photo_url || '',
      birth_date: member.birth_date || '',
      conversion_date: member.conversion_date || '',
      baptism_date: member.baptism_date || '',
      phone: member.phone || '',
      phone_country_code: member.phone_country_code || '+593',
      dni: member.dni || '',
      address: member.address || '',
      maps_link: member.maps_link || '',
      latitude: member.latitude ?? '',
      longitude: member.longitude ?? '',
      is_leader: member.is_leader,
      leadership_role: member.leadership_role || '',
      ministry_id: member.ministry_id || null,
      role_id: member.role_id || null,
      tithes_sum: member.tithes_sum || 0,
      emails: formattedEmails,
      education_level: member.education_level || '',
      career_id: member.career_id || '',
      is_studying: !!member.is_studying,
      studying_career_id: member.studying_career_id || '',
    });

    setShowForm(true);
  };
  const toTitleCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  };

  const onSubmit = async (data: MemberForm) => {
    setActionLoading(true);
    try {
      const memberId = editingMember ? editingMember.id : crypto.randomUUID();

      // Prevent duplicate DNI check locally
      if (data.dni && data.dni.trim() !== '') {
        const duplicate = members.find(m => m.dni === data.dni && m.id !== memberId);
        if (duplicate) {
          toast.error(`La cédula/DNI ${data.dni} ya está registrada por ${duplicate.first_name} ${duplicate.last_name}. Por favor verifica.`);
          setActionLoading(false);
          return;
        }
      }

      const memberPayload = {
        first_name: toTitleCase(data.first_name),
        last_name: toTitleCase(data.last_name),
        photo_url: data.photo_url || null,
        birth_date: data.birth_date || null,
        conversion_date: data.conversion_date || null,
        baptism_date: data.baptism_date || null,
        phone: data.phone || null,
        phone_country_code: data.phone_country_code || '+593',
        dni: data.dni || null,
        address: data.address || null,
        maps_link: data.maps_link || null,
        latitude: data.latitude === '' || data.latitude === null || isNaN(Number(data.latitude)) ? null : Number(data.latitude),
        longitude: data.longitude === '' || data.longitude === null || isNaN(Number(data.longitude)) ? null : Number(data.longitude),
        is_leader: data.is_leader,
        leadership_role: data.leadership_role || null,
        ministry_id: data.ministry_id || null,
        role_id: data.role_id || null,
        tithes_sum: data.tithes_sum,
        education_level: data.education_level || null,
        career_id: data.career_id || null,
        is_studying: data.is_studying || false,
        studying_career_id: data.studying_career_id || null,
        // Relationships:
        emails: data.emails,
        service_areas: selectedAreas.map(id => ({
          catalog_roles: { id, name: serviceAreas.find(x => x.id === id)?.name || '' }
        })),
        talents: selectedTalents.map(id => ({
          catalog_roles: { id, name: talents.find(x => x.id === id)?.name || '' }
        })),
        spiritual_gifts: selectedGifts.map(id => ({
          catalog_roles: { id, name: spiritualGifts.find(x => x.id === id)?.name || '' }
        }))
      };

      const syncStore = useSyncStore.getState();

      // Enqueue mutation to sync queue (optimistic local update in SQLite too)
      await syncStore.enqueueMutation(
        'members',
        memberId,
        editingMember ? 'UPDATE' : 'INSERT',
        memberPayload
      );

      // If online, push queue to Supabase immediately
      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }

      toast.success(editingMember ? 'Miembro guardado (cola local).' : 'Miembro registrado (cola local).');
      setShowForm(false);
      fetchMembers();
    } catch (err: any) {
      console.error('Error saving member:', err);
      toast.error('No se pudo guardar el registro: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar miembro',
      message: '¿Estás seguro de eliminar a este miembro del CRM?\n\nSe mantendrá en la base de datos de manera oculta (borrado lógico).',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    setActionLoading(true);
    try {
      const syncStore = useSyncStore.getState();

      // Soft delete mutation
      await syncStore.enqueueMutation(
        'members',
        id,
        'DELETE',
        { deleted_at: new Date().toISOString() }
      );

      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }

      toast.success('Miembro eliminado (borrado lógico local).');
      fetchMembers();
    } catch (err: any) {
      console.error('Error deleting member:', err);
      toast.error('No se pudo eliminar al miembro: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  // Toggle helpers for lookups selection
  const handleToggleArea = (id: string) => {
    setSelectedAreas(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleTalent = (id: string) => {
    setSelectedTalents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleGift = (id: string) => {
    setSelectedGifts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const headers = [
      'Nombres',
      'Apellidos',
      'Cédula/DNI',
      'Celular',
      'Fecha Nacimiento',
      'Dirección',
      'Latitud',
      'Longitud',
      'Enlace Maps',
      'Liderazgo',
      'Cargo Liderazgo',
      'Ministerio',
      'Correos'
    ];

    const rows = filteredMembers.map(m => {
      const emails = m.member_emails ? m.member_emails.map((e: any) => e.email).join('; ') : '';
      const isLeader = m.is_leader ? 'Sí' : 'No';
      const ministry = m.ministries ? m.ministries.name : '';
      return [
        m.first_name,
        m.last_name,
        m.dni || '',
        m.phone || '',
        m.birth_date || '',
        m.address || '',
        m.latitude ?? '',
        m.longitude ?? '',
        m.maps_link || '',
        isLeader,
        m.leadership_role || '',
        ministry,
        emails
      ];
    });

    // Generate CSV content with semicolon delimiter (standard for Excel in Spanish locales)
    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Add UTF-8 BOM
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

  // Filter members list by search query & custom filters
  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const phone = (member.phone || '').toLowerCase();
    const dni = (member.dni || '').toLowerCase();
    const matchesSearch = fullName.includes(search) || phone.includes(search) || dni.includes(search);
    
    if (!matchesSearch) return false;
    
    // Leadership filter
    if (filterLeadership === 'leaders' && !member.is_leader) return false;
    if (filterLeadership === 'regulars' && member.is_leader) return false;
    
    // Ministry filter
    if (filterMinistry !== 'all' && member.ministry_id !== filterMinistry) return false;
    
    // Skill/Area/Talent/Gift filter
    if (filterSkill !== 'all') {
      const hasArea = member.member_service_areas?.some((a: any) => a.catalog_roles?.id === filterSkill);
      const hasTalent = member.member_talents?.some((t: any) => t.catalog_roles?.id === filterSkill);
      const hasGift = member.member_spiritual_gifts?.some((g: any) => g.catalog_roles?.id === filterSkill);
      if (!hasArea && !hasTalent && !hasGift) return false;
    }
    
    return true;
  });

  // Sort filtered members list
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

  interface GroupedData {
    key: string;
    name: string;
    items: DbMember[];
  }

  const getGroupedMembers = (): GroupedData[] => {
    if (groupBy === 'none') {
      return [];
    }

    const groupsMap: Record<string, DbMember[]> = {};

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
        if (!groupsMap[key]) {
          groupsMap[key] = [];
        }
        groupsMap[key].push(m);
      });
    } 
    else if (groupBy === 'service_area') {
      sortedMembers.forEach(m => {
        const areas = m.member_service_areas || [];
        if (areas.length === 0) {
          const key = 'Sin Área de Servicio';
          if (!groupsMap[key]) {
            groupsMap[key] = [];
          }
          groupsMap[key].push(m);
        } else {
          areas.forEach((a: any) => {
            const key = a.catalog_roles?.name || 'Área Desconocida';
            if (!groupsMap[key]) {
              groupsMap[key] = [];
            }
            if (!groupsMap[key].some(item => item.id === m.id)) {
              groupsMap[key].push(m);
            }
          });
        }
      });
    } 
    else if (groupBy === 'birth_month') {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      monthNames.forEach(month => {
        groupsMap[month] = [];
      });
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
      .map(([name, items]) => ({
        key: name,
        name,
        items
      }))
      .filter(g => g.items.length > 0);
  };

  const renderMembersTable = (list: DbMember[]) => {
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
                <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-4">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-white/5 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 text-primary rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-gray-800 dark:text-gray-100 block leading-tight">{member.first_name} {member.last_name}</span>
                        {member.profiles && member.profiles.length > 0 && (
                          <span 
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 cursor-help"
                            title={`Usuario vinculado: ${member.profiles.map((p: any) => p.email).join(', ')} (${member.profiles.map((p: any) => p.role).join(', ')})`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Vinculado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 block font-semibold">
                        {member.member_emails && member.member_emails.length > 0 
                          ? member.member_emails.map((me: any) => me.email).join(', ') 
                          : 'Sin correo'}
                      </span>
                      {member.education_level && member.education_level !== 'Ninguno' && (
                        <span className="text-[10px] text-primary font-bold bg-blue-50/50 border border-blue-100 px-1.5 py-0.5 rounded mt-1 inline-block w-max leading-none">
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
                  </td>
                  <td className="py-4 px-6 font-semibold">
                    <span className="block text-gray-700 dark:text-gray-300">{member.dni || 'S/C'}</span>
                    {member.phone ? (
                      <a
                        href={formatWhatsAppLink(member.phone, member.phone_country_code, `Hola ${member.first_name}, te saludamos de la Iglesia Jerusalén...`)}
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
                        member.member_service_areas.map((a: any, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-primary border border-blue-100">
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
                      onClick={() => handleOpenEdit(member)}
                      className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer inline-block"
                      title="Editar ficha"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={actionLoading}
                      className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer inline-block"
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

  return (
    <AnimeFadeUp 
      className="space-y-6 max-w-5xl"
    >
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

      <>
        {showForm ? (
          <AnimeFadeUp 
            key="form"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8 animate-scale-in"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                {editingMember ? `Editar Ficha: ${editingMember.first_name} ${editingMember.last_name}` : 'Registrar Nuevo Miembro'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-650 rounded-lg p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Tabs */}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* TAB 1: DATOS PERSONALES */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Nombres</label>
                      <input
                        type="text"
                        {...register('first_name')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="Ej. Carlos Alfredo"
                      />
                      {errors.first_name && <p className="text-accent-red text-xs mt-1">{errors.first_name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Apellidos</label>
                      <input
                        type="text"
                        {...register('last_name')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="Ej. Mendoza Vera"
                      />
                      {errors.last_name && <p className="text-accent-red text-xs mt-1">{errors.last_name.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Cédula / DNI</label>
                      <input
                        type="text"
                        {...register('dni')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="Ej. 0991234567"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Celular / Teléfono</label>
                      <div className="flex gap-2">
                        <select
                          {...register('phone_country_code')}
                          className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none w-28 shrink-0 font-semibold"
                        >
                          {COUNTRY_CODES.map((country) => (
                            <option key={country.code} value={country.dialCode}>
                              {country.flag} {country.dialCode}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          {...register('phone')}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          placeholder="Ej. 0985263122"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        {...register('birth_date')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Enlace URL Foto de Perfil</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        {...register('photo_url')}
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="https://ejemplo.com/fotos/miembro.jpg"
                      />
                      <label className="px-4 py-2 bg-gold/15 text-gold border border-gold/30 rounded-xl text-xs font-bold hover:bg-gold/25 transition-all flex items-center gap-1.5 cursor-pointer select-none">
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            Subir Foto
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </label>
                    </div>
                    {errors.photo_url && <p className="text-accent-red text-xs mt-1">{errors.photo_url.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Dirección de Domicilio</label>
                      <input
                        type="text"
                        {...register('address')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="Calle, Barrio, Ciudad"
                      />
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
                            toast.success(`Coordenadas extraídas del enlace: ${coords.lat}, ${coords.lng}`);
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
                      <input
                        type="number"
                        step="any"
                        {...register('latitude', { valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
                        placeholder="Ej. -2.1391"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Longitud</label>
                      <input
                        type="number"
                        step="any"
                        {...register('longitude', { valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
                        placeholder="Ej. -79.5950"
                      />
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
                            (err) => {
                              toast.error('No se pudo capturar la ubicación GPS: ' + err.message);
                            }
                          );
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10 border border-slate-700 font-bold"
                        title="Capturar GPS en vivo"
                      >
                        <Compass size={14} className="text-gold shrink-0" />
                        GPS
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenMapPicker}
                        className="flex-1 bg-primary hover:bg-blue-900 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 h-10 shadow-sm font-bold"
                        title="Seleccionar ubicación en mapa interactivo"
                      >
                        <MapPin size={14} className="text-gold shrink-0" />
                        Mapa
                      </button>
                    </div>
                  </div>

                  {/* Multi-email inputs */}
                  <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-4 border border-gray-150 dark:border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider">Correos Electrónicos</span>
                      <button
                        type="button"
                        onClick={() => append({ email: '' })}
                        className="text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Agregar correo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {fields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-center">
                          <div className="flex-grow">
                            <input
                              type="email"
                              {...register(`emails.${idx}.email` as const)}
                              className="w-full px-4 py-1.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                              placeholder="miembro@correo.com"
                            />
                            {errors.emails?.[idx]?.email && (
                              <p className="text-accent-red text-[10px] mt-0.5">{errors.emails[idx].email?.message}</p>
                            )}
                          </div>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Remover correo"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Educación y Estudios Académicos */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-gray-150 dark:border-white/10 space-y-4">
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-1.5">
                      <Award size={14} className="text-primary" />
                      Educación y Estudios Académicos
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Nivel de Instrucción</label>
                        <select
                          {...register('education_level')}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold"
                        >
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
                        <div
                          className="animate-scale-in"
                        >
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Título de Tercer Grado / Carrera</label>
                          <select
                            {...register('career_id')}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold"
                          >
                            <option value="">Selecciona carrera...</option>
                            {careersList.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_studying"
                          {...register('is_studying')}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="is_studying" className="text-xs font-bold text-gray-650 dark:text-gray-400 cursor-pointer">
                          Actualmente estudiando en la Universidad / Tecnológico
                        </label>
                      </div>

                      {watch('is_studying') && (
                        <div
                          className="pl-6 animate-fadeUp"
                        >
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Carrera en curso</label>
                          <select
                            {...register('studying_career_id')}
                            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer font-semibold"
                          >
                            <option value="">Selecciona carrera que estudia...</option>
                            {careersList.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VIDA ESPIRITUAL */}
              {activeTab === 'spiritual' && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Aceptación / Conversión</label>
                      <input
                        type="date"
                        {...register('conversion_date')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Bautismo en Aguas</label>
                      <input
                        type="date"
                        {...register('baptism_date')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Registro de Aportes/Diezmos ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('tithes_sum', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
                      placeholder="0.00"
                    />
                    {errors.tithes_sum && <p className="text-accent-red text-xs mt-1">{errors.tithes_sum.message}</p>}
                    <span className="text-[10px] text-gray-400 font-medium mt-1 block">Suma histórica de diezmos registrados en el sistema de la iglesia.</span>
                  </div>
                </div>
              )}

              {/* TAB 3: LIDERAZGO */}
              {activeTab === 'leadership' && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_leader"
                      {...register('is_leader')}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="is_leader" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      ¿Este miembro desempeña un rol de liderazgo en la iglesia?
                    </label>
                  </div>

                  {watch('is_leader') && (
                    <div
                      className="space-y-4 animate-fadeUp"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Departamento / Ministerio</label>
                        <select
                          {...register('ministry_id')}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                        >
                          <option value="">Selecciona un departamento...</option>
                          {ministries.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {watch('ministry_id') && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Rol / Cargo</label>
                          <select
                            {...register('role_id')}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const roleObj = rolesList.find(r => r.id === selectedId);
                              setValue('leadership_role', roleObj ? roleObj.name : '');
                            }}
                          >
                            <option value="">Selecciona un cargo...</option>
                            {rolesList.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HABILIDADES, TALENTOS Y DONES */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  {/* Service Areas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                      <Layers size={14} className="text-gold" />
                      Áreas de Servicio en la Iglesia
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {serviceAreas.map((area) => {
                        const checked = selectedAreas.includes(area.id);
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => handleToggleArea(area.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              checked 
                                ? 'bg-primary text-white border-primary shadow-2xs' 
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-750'
                            }`}
                          >
                            {area.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Talents */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                      <Award size={14} className="text-gold" />
                      Habilidades y Talentos
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        // Group talents by prefix [Category]
                        const grouped: Record<string, CatalogRole[]> = {};
                        talents.forEach(t => {
                          const match = t.name.match(/^\[(.*?)\]\s*(.*)$/);
                          const catName = match ? match[1] : 'Otros';
                          if (!grouped[catName]) grouped[catName] = [];
                          grouped[catName].push(t);
                        });

                        return Object.entries(grouped).map(([categoryName, items]) => (
                          <div key={categoryName} className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3.5 border border-gray-150 dark:border-white/10">
                            <span className="text-[11px] font-bold text-primary dark:text-indigo-400 uppercase tracking-wider block border-b border-gray-100/50 dark:border-white/5 pb-1">
                              {categoryName}
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {items.map((talent) => {
                                const checked = selectedTalents.includes(talent.id);
                                const displayName = talent.name.replace(/^\[.*?\]\s*/, '');
                                return (
                                  <button
                                    key={talent.id}
                                    type="button"
                                    onClick={() => handleToggleTalent(talent.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                      checked 
                                        ? 'bg-primary text-white border-primary shadow-2xs' 
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-305 hover:bg-gray-50 dark:hover:bg-slate-750'
                                    }`}
                                  >
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

                  {/* Spiritual Gifts */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1 flex items-center gap-2">
                      <Heart size={14} className="text-gold" />
                      Dones Espirituales
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {spiritualGifts.map((gift) => {
                        const checked = selectedGifts.includes(gift.id);
                        return (
                          <button
                            key={gift.id}
                            type="button"
                            onClick={() => handleToggleGift(gift.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              checked 
                                ? 'bg-primary text-white border-primary shadow-2xs' 
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-355 hover:bg-gray-50 dark:hover:bg-slate-750'
                            }`}
                          >
                            {gift.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-250 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingMember ? 'Actualizar Ficha' : 'Registrar Miembro'}
                </button>
              </div>
            </form>
          </AnimeFadeUp>
        ) : (
          
          /* MEMBERS LIST VIEW */
          <AnimeFadeUp 
            key="list"
            className="space-y-5"
          >
            {/* Search, Filter, Sort and Group panel */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
              {/* Row 1: Search & Export */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <label htmlFor="search-members" className="sr-only">Buscar miembros</label>
                  <Search className="text-gray-400" size={18} />
                  <input
                    id="search-members"
                    name="searchQuery"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow text-sm focus:outline-none text-gray-700 dark:text-gray-300 bg-transparent font-medium"
                    placeholder="Buscar por nombre, apellido, cédula o celular..."
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer justify-center"
                  title="Exportar listado a CSV"
                >
                  <Download size={16} />
                  Exportar CSV
                </button>
              </div>

              {/* Row 2: Advanced Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                {/* 1. Liderazgo */}
                <div>
                  <label htmlFor="filter-leadership" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Liderazgo</label>
                  <select
                    id="filter-leadership"
                    name="filterLeadership"
                    value={filterLeadership}
                    onChange={(e) => setFilterLeadership(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                  >
                    <option value="all">Todos los miembros</option>
                    <option value="leaders">Solo Líderes</option>
                    <option value="regulars">Solo Miembros Regulares</option>
                  </select>
                </div>

                {/* 2. Ministerio */}
                <div>
                  <label htmlFor="filter-ministry" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Ministerio</label>
                  <select
                    id="filter-ministry"
                    name="filterMinistry"
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

                {/* 3. Habilidad / Área */}
                <div>
                  <label htmlFor="filter-skill" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Habilidad</label>
                  <select
                    id="filter-skill"
                    name="filterSkill"
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

                {/* 4. Ordenar Por */}
                <div className="flex gap-1.5 items-end">
                  <div className="flex-1">
                    <label htmlFor="sort-by" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ordenar Por</label>
                    <select
                      id="sort-by"
                      name="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
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

                {/* 5. Agrupar Por */}
                <div>
                  <label htmlFor="group-by" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Agrupar Por</label>
                  <select
                    id="group-by"
                    name="groupBy"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
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
                      {renderMembersTable(group.items)}
                    </div>
                  ))}
                </div>
              ) : (
                renderMembersTable(sortedMembers)
              )
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
                <User className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No se encontraron miembros</h3>
                <p className="text-gray-400 text-sm mt-1 font-medium">Prueba con otra búsqueda o agrega un nuevo registro en la base de datos.</p>
              </div>
            )}
          </AnimeFadeUp>
        )}
      </>
      {/* MAP PICKER POPUP MODAL */}
      <>
        {showMapPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[520px] animate-scale-in relative text-left">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-white/10 flex-shrink-0">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5 font-serif">
                  <MapPin className="text-gold animate-bounce" size={18} />
                  Ubicar Domicilio en el Mapa
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
                
                {/* Geocoding Search Bar */}
                <div className="flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleModalSearch() }}
                    placeholder="Busca una calle, barrio o ciudad..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleModalSearch}
                    disabled={modalGeocoding}
                    className="px-3.5 bg-primary hover:bg-blue-800 disabled:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-primary/15"
                  >
                    {modalGeocoding ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Search size={14} />
                        Buscar
                      </>
                    )}
                  </button>
                </div>

                {/* Maplibre Map Container */}
                <div className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 relative overflow-hidden shadow-2xs">
                  <Map
                    ref={modalMapRef}
                    initialViewState={{
                      longitude: pickerCoords.lng,
                      latitude: pickerCoords.lat,
                      zoom: 15
                    }}
                    mapStyle="https://tiles.openfreemap.org/styles/bright"
                    style={{ width: '100%', height: '100%' }}
                    onClick={handleMapClick}
                  >
                    <NavigationControl position="bottom-right" showCompass={false} />
                    
                    {/* Draggable Selector Pin */}
                    <Marker
                      longitude={pickerCoords.lng}
                      latitude={pickerCoords.lat}
                      anchor="bottom"
                      draggable
                      onDragEnd={(e) => setPickerCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                    >
                      <div className="cursor-grab active:cursor-grabbing flex flex-col items-center">
                        <div className="bg-slate-900 border border-slate-800 text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-xl whitespace-nowrap mb-1 font-sans">
                          Arrastra el pin
                        </div>
                        <MapPin size={32} className="text-accent-red fill-accent-red/20 drop-shadow-md" />
                      </div>
                    </Marker>
                  </Map>
                </div>

                {/* Info Text */}
                <p className="text-[10px] text-gray-500 dark:text-gray-450 font-semibold leading-normal flex items-start gap-1 flex-shrink-0">
                  <span className="text-gold">💡</span>
                  <span>Puedes escribir en el buscador, hacer clic en cualquier punto del mapa para mover el pin o arrastrar el pin rojo directamente.</span>
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-150 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white dark:bg-slate-900">
                <div className="text-[11px] text-gray-500 dark:text-gray-450 font-semibold font-mono">
                  Coords: <span className="text-primary font-bold">{pickerCoords.lat.toFixed(6)}, {pickerCoords.lng.toFixed(6)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(false)}
                    className="px-4 py-2 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-600/10"
                  >
                    Confirmar Ubicación
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </>

      {/* CAREERS CRUD MODAL */}
      <>
        {showCareersModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[520px] relative text-left animate-scale-in"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-white/10 flex-shrink-0">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5">
                  <Award className="text-primary" size={18} />
                  Catálogo de Carreras Universitarias
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCareersModal(false);
                    setEditingCareerId(null);
                  }}
                  className="text-gray-400 hover:text-gray-650 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-grow flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 space-y-4">
                {/* Form to Add Career */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3 shadow-2xs">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Registrar Nueva Carrera</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCareerName}
                      onChange={(e) => setNewCareerName(e.target.value)}
                      placeholder="Ej. Licenciatura en Teología"
                      className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCareer}
                      disabled={savingCareer || !newCareerName.trim()}
                      className="px-4 bg-primary hover:bg-blue-800 disabled:bg-slate-200 disabled:text-gray-400 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {savingCareer ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Search / Filter bar */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Search className="text-gray-400" size={14} />
                  <input
                    type="text"
                    value={careerSearchQuery}
                    onChange={(e) => setCareerSearchQuery(e.target.value)}
                    placeholder="Filtrar carreras..."
                    className="flex-grow text-xs focus:outline-none text-gray-700 dark:text-gray-300 bg-transparent font-semibold"
                  />
                  {careerSearchQuery && (
                    <button onClick={() => setCareerSearchQuery('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* List Container */}
                <div className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 shadow-2xs max-h-[260px]">
                  {(() => {
                    const filtered = careersList.filter(c =>
                      c.name.toLowerCase().includes(careerSearchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-400 text-xs font-medium">
                          No se encontraron carreras.
                        </div>
                      );
                    }

                    return filtered.map(c => (
                      <div key={c.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        {editingCareerId === c.id ? (
                          <div className="flex-grow flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingCareerName}
                              onChange={(e) => setEditingCareerName(e.target.value)}
                              className="flex-grow bg-white dark:bg-slate-900 border border-primary rounded px-2.5 py-1 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCareer(c.id)}
                              disabled={savingCareer || !editingCareerName.trim()}
                              className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 cursor-pointer"
                              title="Guardar"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCareerId(null);
                                setEditingCareerName('');
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.name}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCareerId(c.id);
                                  setEditingCareerName(c.name);
                                }}
                                className="text-gray-400 hover:text-primary p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Editar nombre"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCareer(c.id, c.name)}
                                className="text-gray-400 hover:text-accent-red p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar carrera"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-150 dark:border-white/10 flex justify-end flex-shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowCareersModal(false);
                    setEditingCareerId(null);
                  }}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </AnimeFadeUp>
  );
};

export default MembersManager;
