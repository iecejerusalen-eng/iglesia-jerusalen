import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Sparkles,
  Building2,
  BookOpen,
  FileText,
  RefreshCw,
  Church,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import MediaUploader from '../../common/MediaUploader';
import type { EditorialOwnerType } from '../../../features/editorial/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export interface PresetTemplate {
  id: string;
  icon: typeof FileText;
  title: string;
  owner_type: EditorialOwnerType;
  accent_color: string;
  description: string;
  badgeText: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'official-blog',
    icon: FileText,
    title: 'Blog Oficial y Noticias',
    owner_type: 'church',
    accent_color: '#d97706',
    description: 'Noticias, comunicados e historias oficiales de la iglesia.',
    badgeText: 'Iglesia general',
  },
  {
    id: 'daily-devotionals',
    icon: BookOpen,
    title: 'Devocionales Diarios',
    owner_type: 'church',
    accent_color: '#059669',
    description: 'Reflexiones y lecturas bíblicas diarias para la congregación.',
    badgeText: 'Iglesia general',
  },
  {
    id: 'ministry-posts',
    icon: Building2,
    title: 'Publicaciones de Ministerio',
    owner_type: 'ministry',
    accent_color: '#2563eb',
    description: 'Espacio editorial para publicar eventos, noticias y artículos del ministerio.',
    badgeText: 'Ministerio / departamento',
  },
  {
    id: 'discipleship-log',
    icon: BookOpen,
    title: 'Bitácora de Discipulado',
    owner_type: 'study_program',
    accent_color: '#7c3aed',
    description: 'Lecciones, guías de estudio y lecturas del programa de formación.',
    badgeText: 'Programa',
  },
];

const PRESET_COLORS = [
  '#d97706',
  '#059669',
  '#2563eb',
  '#7c3aed',
  '#ec4899',
  '#0284c7',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#ef4444',
];

interface CreateEditorialSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OptionItem {
  id: string;
  name: string;
}

interface MinistryOptionRow {
  id: string | number;
  name: string | null;
}

interface ProgramOptionRow {
  id: string | number;
  title: string | null;
  name: string | null;
}

export default function CreateEditorialSpaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEditorialSpaceModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [ownerType, setOwnerType] = useState<EditorialOwnerType>('church');
  const [ministryId, setMinistryId] = useState('');
  const [programId, setProgramId] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  const [ministries, setMinistries] = useState<OptionItem[]>([]);
  const [programs, setPrograms] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch ministries and study programs options when modal opens
  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [minRes, progRes] = await Promise.all([
        supabase.from('ministries').select('id, name').order('name'),
        supabase
          .from('study_programs')
          .select('id, title, name')
          .order('created_at', { ascending: false }),
      ]);

      if (minRes.data) {
        setMinistries(
          (minRes.data as MinistryOptionRow[]).map((m) => ({
            id: String(m.id),
            name: String(m.name || 'Ministerio sin nombre'),
          }))
        );
      }

      if (progRes.data) {
        setPrograms(
          (progRes.data as ProgramOptionRow[]).map((p) => ({
            id: String(p.id),
            name: String(p.title || p.name || 'Programa de estudio'),
          }))
        );
      }
    } catch (error) {
      console.warn('Error al obtener ministerios o programas:', error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const loadTimer = window.setTimeout(() => { void fetchOptions(); }, 0);
      return () => window.clearTimeout(loadTimer);
    }
    return undefined;
  }, [isOpen, fetchOptions]);

  // Handle auto slug logic
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value));
    setIsSlugEdited(true);
  };

  const applyPreset = (template: PresetTemplate) => {
    setName(template.title);
    setSlug(slugify(template.title));
    setIsSlugEdited(false);
    setOwnerType(template.owner_type);
    setAccentColor(template.accent_color);
    setDescription(template.description);
    toast.success(`Plantilla "${template.title}" aplicada`);
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setIsSlugEdited(false);
    setDescription('');
    setOwnerType('church');
    setMinistryId('');
    setProgramId('');
    setAccentColor('#2563eb');
    setCoverImageUrl('');
    setIsPublished(true);
    setAllowComments(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Ingresa un nombre para el espacio editorial.');
      return;
    }

    const finalSlug = slug.trim() ? slugify(slug) : slugify(name);
    if (!finalSlug) {
      toast.error('El espacio debe tener un slug identificador único.');
      return;
    }

    if (ownerType === 'ministry' && !ministryId) {
      toast.error('Selecciona el ministerio responsable.');
      return;
    }

    if (ownerType === 'study_program' && !programId) {
      toast.error('Selecciona el programa de estudio correspondiente.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        owner_type: ownerType,
        ministry_id: ownerType === 'ministry' ? ministryId : null,
        program_id: ownerType === 'study_program' ? programId : null,
        accent_color: accentColor,
        cover_image_url: coverImageUrl.trim() || null,
        is_published: isPublished,
        allow_comments: allowComments,
      };

      const { error } = await supabase.from('editorial_spaces').insert(payload);

      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          toast.error('Ya existe un espacio editorial con este slug URL.');
        } else {
          toast.error(`Error al crear espacio: ${error.message}`);
        }
        return;
      }

      toast.success('¡Espacio editorial creado con éxito!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Error al insertar espacio editorial:', err);
      toast.error('Ocurrió un error inesperado al guardar el espacio.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="relative border-b border-white/10 p-6 sm:p-7">
            <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-400 shadow-inner">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold sm:text-2xl text-white">
                    Crear Espacio Editorial
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configura una nueva publicación, blog o bitácora de contenido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto p-6 sm:p-7 space-y-6">
            {/* Presets Grid */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-amber-300/90">
                Plantillas Prediseñadas en 1-Clic
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESET_TEMPLATES.map((tmpl) => {
                  const IconComp = tmpl.icon;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => applyPreset(tmpl)}
                      className="group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left transition hover:border-amber-400/40 hover:bg-white/10 active:scale-[0.98]"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: tmpl.accent_color }}
                      >
                        <IconComp size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs font-bold text-white group-hover:text-amber-300">
                            {tmpl.title}
                          </span>
                          <span className="ml-1 shrink-0 rounded-full border border-white/10 bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-300">
                            {tmpl.badgeText}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                          {tmpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-200">
                  Nombre del Espacio <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ej: Devocionales Diarios 2026"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-slate-950 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-200">
                  Slug URL <span className="text-amber-400">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 focus-within:border-amber-400 focus-within:bg-slate-950">
                  <span className="pl-3 text-xs font-semibold text-slate-500">/publicaciones/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="devocionales-diarios"
                    className="w-full bg-transparent px-2 py-2.5 text-sm text-amber-300 outline-none placeholder-slate-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-200">
                Descripción
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resume el objetivo de este espacio editorial para los lectores..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-slate-950 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Owner Type Selector */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200">
                Propietario / Pertenece a (`owner_type`)
              </label>
              <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-5 text-amber-100">
                Usa <strong>Iglesia general</strong> sólo para comunicaciones de toda la congregación y espacios como Cuerpo de Apoyo. Damas, Caballeros, Jóvenes, Niños, Alabanza y cualquier otro departamento deben registrarse como <strong>Ministerio / departamento</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setOwnerType('church')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${
                    ownerType === 'church'
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Church size={20} />
                  <span className="text-xs font-bold">Iglesia general</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOwnerType('ministry')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${
                    ownerType === 'ministry'
                      ? 'border-blue-400 bg-blue-500/15 text-blue-300 shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Building2 size={20} />
                  <span className="text-xs font-bold">Ministerio / departamento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOwnerType('study_program')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${
                    ownerType === 'study_program'
                      ? 'border-purple-400 bg-purple-500/15 text-purple-300 shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BookOpen size={20} />
                  <span className="text-xs font-bold">Programa / formación</span>
                </button>
              </div>
            </div>

            {/* Ministry Specific Selection */}
            {ownerType === 'ministry' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="mb-1.5 block text-xs font-bold text-slate-200">
                  Selecciona el ministerio o departamento <span className="text-amber-400">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                    <RefreshCw size={14} className="animate-spin" /> Cargando ministerios...
                  </div>
                ) : (
                  <select
                    value={ministryId}
                    onChange={(e) => setMinistryId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">-- Seleccionar ministerio / departamento --</option>
                    {ministries.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </motion.div>
            )}

            {/* Study Program Specific Selection */}
            {ownerType === 'study_program' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="mb-1.5 block text-xs font-bold text-slate-200">
                  Selecciona el Programa de Formación <span className="text-amber-400">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                    <RefreshCw size={14} className="animate-spin" /> Cargando programas...
                  </div>
                ) : (
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">-- Seleccionar Programa --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </motion.div>
            )}

            {/* Color Accent Picker */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Color de Acento del Espacio</span>
                <span className="font-mono text-[11px] text-amber-300">{accentColor}</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAccentColor(hex)}
                      className={`h-7 w-7 rounded-full border transition ${
                        accentColor.toLowerCase() === hex.toLowerCase()
                          ? 'scale-110 border-white ring-2 ring-amber-400'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                      aria-label={`Color ${hex}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cover Image Upload & Input */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200">
                Imagen de Portada (`cover_image_url`)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MediaUploader
                    folder="editorial/portadas"
                    label="Subir desde Media"
                    allowedFormats={['jpg', 'jpeg', 'png', 'webp', 'avif']}
                    onUploadSuccess={(url) => setCoverImageUrl(url)}
                    className="shrink-0"
                  />
                  <span className="text-xs text-slate-500">o pega la URL de la imagen:</span>
                </div>

                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />

                {coverImageUrl && (
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    <img
                      src={coverImageUrl}
                      alt="Vista previa de portada"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-xs text-white backdrop-blur-md hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-white">Visibilidad Pública</span>
                  <span className="text-[11px] text-slate-400">
                    Disponible en la web sin requerir autenticación
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-white">Permitir Comentarios</span>
                  <span className="text-[11px] text-slate-400">
                    Lectores pueden responder en publicaciones
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Crear Espacio
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
