import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { LMSSchool, LMSLevel, Profile } from '../../../types';
import {
  GraduationCap, Plus, Pencil, Trash2, School, Users,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Layers, X, Save
} from 'lucide-react';

/**
 * SchoolManager — Full CRUD for Schools (Escuelas / Facultades) and their Levels.
 * Admin/Editor/Pastor can create, edit, delete schools and assign leaders.
 * Leaders can manage levels within their assigned school.
 */
export function SchoolManager() {
  const [schools, setSchools] = useState<LMSSchool[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, LMSLevel[]>>({});

  // School form state
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<LMSSchool | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#D4AF37');
  const [formLeaderId, setFormLeaderId] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Level form state
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LMSLevel | null>(null);
  const [levelSchoolId, setLevelSchoolId] = useState('');
  const [levelName, setLevelName] = useState('');
  const [levelDescription, setLevelDescription] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, profilesRes] = await Promise.all([
        supabase.from('lms_schools').select('*, profiles(id, first_name, last_name, email, role)').order('sort_order', { ascending: true }),
        supabase.from('profiles').select('id, first_name, last_name, email, role').order('first_name', { ascending: true })
      ]);

      if (schoolsRes.data) setSchools(schoolsRes.data as LMSSchool[]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    } catch (err) {
      setNotification({ type: 'error', message: 'Error al cargar escuelas.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async (schoolId: string) => {
    const { data } = await supabase
      .from('lms_levels')
      .select('*')
      .eq('school_id', schoolId)
      .order('sort_order', { ascending: true });
    if (data) {
      setLevels(prev => ({ ...prev, [schoolId]: data as LMSLevel[] }));
    }
  };

  const handleToggleExpand = (schoolId: string) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null);
    } else {
      setExpandedSchool(schoolId);
      if (!levels[schoolId]) {
        fetchLevels(schoolId);
      }
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // ==================== SCHOOL CRUD ====================

  const openNewSchoolModal = () => {
    setEditingSchool(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormColor('#D4AF37');
    setFormLeaderId('');
    setFormImageUrl('');
    setFormIsActive(true);
    setIsSchoolModalOpen(true);
  };

  const openEditSchoolModal = (school: LMSSchool) => {
    setEditingSchool(school);
    setFormName(school.name);
    setFormSlug(school.slug);
    setFormDescription(school.description || '');
    setFormColor(school.color || '#D4AF37');
    setFormLeaderId(school.leader_id || '');
    setFormImageUrl(school.cover_image_url || '');
    setFormIsActive(school.is_active);
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setNotification({ type: 'error', message: 'El nombre de la escuela es obligatorio.' });
      return;
    }

    const slug = formSlug.trim() || generateSlug(formName);
    const payload = {
      name: formName.trim(),
      slug,
      description: formDescription.trim() || null,
      cover_image_url: formImageUrl.trim() || null,
      color: formColor,
      leader_id: formLeaderId || null,
      is_active: formIsActive,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingSchool) {
        const { error } = await supabase.from('lms_schools').update(payload).eq('id', editingSchool.id);
        if (error) throw error;
        setNotification({ type: 'success', message: `"${formName}" actualizada correctamente.` });
      } else {
        const { error } = await supabase.from('lms_schools').insert([{ ...payload, sort_order: schools.length + 1 }]);
        if (error) throw error;
        setNotification({ type: 'success', message: `"${formName}" creada exitosamente.` });
      }
      setIsSchoolModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar escuela.';
      setNotification({ type: 'error', message: msg });
    }
  };

  const handleDeleteSchool = async (school: LMSSchool) => {
    if (!window.confirm(`¿Eliminar la escuela "${school.name}"? Se eliminarán todos sus niveles. Los cursos asociados quedarán sin escuela asignada.`)) return;
    try {
      const { error } = await supabase.from('lms_schools').delete().eq('id', school.id);
      if (error) throw error;
      setNotification({ type: 'success', message: `"${school.name}" eliminada.` });
      setSchools(prev => prev.filter(s => s.id !== school.id));
      if (expandedSchool === school.id) setExpandedSchool(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar.';
      setNotification({ type: 'error', message: msg });
    }
  };

  // ==================== LEVEL CRUD ====================

  const openNewLevelModal = (schoolId: string) => {
    setEditingLevel(null);
    setLevelSchoolId(schoolId);
    setLevelName('');
    setLevelDescription('');
    setIsLevelModalOpen(true);
  };

  const openEditLevelModal = (level: LMSLevel) => {
    setEditingLevel(level);
    setLevelSchoolId(level.school_id);
    setLevelName(level.name);
    setLevelDescription(level.description || '');
    setIsLevelModalOpen(true);
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelName.trim()) {
      setNotification({ type: 'error', message: 'El nombre del nivel es obligatorio.' });
      return;
    }

    const payload = {
      school_id: levelSchoolId,
      name: levelName.trim(),
      description: levelDescription.trim() || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingLevel) {
        const { error } = await supabase.from('lms_levels').update(payload).eq('id', editingLevel.id);
        if (error) throw error;
        setNotification({ type: 'success', message: `Nivel "${levelName}" actualizado.` });
      } else {
        const existingLevels = levels[levelSchoolId] || [];
        const { error } = await supabase.from('lms_levels').insert([{ ...payload, sort_order: existingLevels.length + 1 }]);
        if (error) throw error;
        setNotification({ type: 'success', message: `Nivel "${levelName}" creado.` });
      }
      setIsLevelModalOpen(false);
      fetchLevels(levelSchoolId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar nivel.';
      setNotification({ type: 'error', message: msg });
    }
  };

  const handleDeleteLevel = async (level: LMSLevel) => {
    if (!window.confirm(`¿Eliminar el nivel "${level.name}"?`)) return;
    try {
      const { error } = await supabase.from('lms_levels').delete().eq('id', level.id);
      if (error) throw error;
      setNotification({ type: 'success', message: `Nivel "${level.name}" eliminado.` });
      fetchLevels(level.school_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar nivel.';
      setNotification({ type: 'error', message: msg });
    }
  };

  // ==================== HELPERS ====================
  const getLeaderName = (school: LMSSchool) => {
    const leader = school.profiles;
    if (!leader) return 'Sin líder asignado';
    return `${leader.first_name || ''} ${leader.last_name || ''}`.trim() || leader.email || 'Sin nombre';
  };

  const presetColors = ['#D4AF37', '#4F46E5', '#059669', '#DC2626', '#7C3AED', '#0891B2', '#EA580C', '#DB2777'];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-400">Cargando ecosistema de escuelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <School className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black font-serif text-slate-900 dark:text-white">Ecosistema Multi-Escuela</h2>
            <p className="text-xs text-gray-500 font-medium">Gestiona escuelas, facultades y academias independientes con sus niveles de estudio.</p>
          </div>
        </div>
        <button
          onClick={openNewSchoolModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gold hover:bg-gold/90 text-slate-950 font-bold text-xs shadow-md shadow-gold/20 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus size={16} /> Nueva Escuela
        </button>
      </div>

      {/* Schools Grid */}
      {schools.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10">
          <GraduationCap className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-400">No hay escuelas creadas</h3>
          <p className="text-sm text-gray-400 mt-1">Crea tu primera escuela para comenzar a estructurar el sistema educativo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => {
            const isExpanded = expandedSchool === school.id;
            const schoolLevels = levels[school.id] || [];

            return (
              <div
                key={school.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden transition-all"
              >
                {/* School Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleToggleExpand(school.id)}>
                    {/* Color badge */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0"
                      style={{ backgroundColor: school.color || '#D4AF37' }}
                    >
                      {school.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{school.name}</h3>
                        {!school.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 uppercase">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-md">{school.description || 'Sin descripción'}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                          <Users size={12} /> Líder: <span className="text-slate-700 dark:text-gray-200">{getLeaderName(school)}</span>
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          /{school.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditSchoolModal(school)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-gray-500 hover:text-indigo-600 transition-all cursor-pointer"
                      title="Editar escuela"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchool(school)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 hover:text-red-600 transition-all cursor-pointer"
                      title="Eliminar escuela"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleExpand(school.id)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Levels Section (expandable) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-950/30 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Layers size={16} className="text-indigo-500" />
                        Niveles / Ciclos de "{school.name}"
                      </h4>
                      <button
                        onClick={() => openNewLevelModal(school.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Agregar Nivel
                      </button>
                    </div>

                    {schoolLevels.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-6 text-center">
                        No hay niveles configurados para esta escuela. Agrega el primer nivel para organizar los cursos.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {schoolLevels.map((level, idx) => (
                          <div
                            key={level.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-white/10 flex items-start justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                                style={{ backgroundColor: school.color || '#D4AF37' }}
                              >
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{level.name}</p>
                                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{level.description || 'Sin descripción'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => openEditLevelModal(level)}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-gray-400 hover:text-indigo-600 cursor-pointer"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(level)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== SCHOOL MODAL ==================== */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <School className="text-gold" size={22} />
                {editingSchool ? 'Editar Escuela' : 'Crear Nueva Escuela'}
              </h3>
              <button onClick={() => setIsSchoolModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de la Escuela *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingSchool) setFormSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Ej: Escuela de Cadetes, Escuela Dominical..."
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="cadetes"
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Identificador</label>
                  <div className="flex items-center gap-2">
                    {presetColors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${formColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripción breve de la escuela..."
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Líder Responsable</label>
                  <select
                    value={formLeaderId}
                    onChange={(e) => setFormLeaderId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sin líder asignado</option>
                    {profiles
                      .filter(p => ['admin', 'editor', 'pastor', 'leader', 'maestro', 'docente'].includes(p.role))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email} ({p.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Imagen de Portada</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-gold"
                  />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Escuela activa y visible</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-slate-950 font-bold text-sm shadow-md shadow-gold/20 transition-all cursor-pointer"
                >
                  <Save size={16} /> {editingSchool ? 'Guardar Cambios' : 'Crear Escuela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== LEVEL MODAL ==================== */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-indigo-500" size={22} />
                {editingLevel ? 'Editar Nivel' : 'Nuevo Nivel'}
              </h3>
              <button onClick={() => setIsLevelModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Nivel *</label>
                <input
                  type="text"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  placeholder="Ej: Explorador, Nivel Básico, Párvulos..."
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                <textarea
                  value={levelDescription}
                  onChange={(e) => setLevelDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripción del nivel..."
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsLevelModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Save size={16} /> {editingLevel ? 'Guardar' : 'Crear Nivel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
