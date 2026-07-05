import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { Profile, LMSCourse, LMSTeacherSchedule } from '../../../types';
import { GraduationCap, BookOpen, Clock, Link2, Plus, Trash2, Edit3, Search, UserCheck, ShieldCheck, Video, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export function AcademicStaffManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [schedules, setSchedules] = useState<LMSTeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  // Modal / Form state for assigning shift
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<LMSTeacherSchedule | null>(null);
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formShiftName, setFormShiftName] = useState('Turno 1 [09:00 AM a 10:30 AM]');
  const [formDayOfWeek, setFormDayOfWeek] = useState('Domingo');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formMeetLink, setFormMeetLink] = useState('');
  const [formRoom, setFormRoom] = useState('Aula Virtual / Meet');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, coursesRes, schedulesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('first_name', { ascending: true }),
        supabase.from('lms_courses').select('*').order('title', { ascending: true }),
        supabase.from('lms_teacher_schedules').select('*').order('day_of_week', { ascending: true })
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (coursesRes.data) {
        setCourses(coursesRes.data as LMSCourse[]);
        if (coursesRes.data.length > 0 && !formCourseId) {
          setFormCourseId(coursesRes.data[0].id);
        }
      }
      if (schedulesRes.data) setSchedules(schedulesRes.data as LMSTeacherSchedule[]);
    } catch (err) {
      console.error('Error fetching academic staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formCourseId || !formShiftName) {
      setNotification({ type: 'error', message: 'Por favor completa todos los campos obligatorios.' });
      return;
    }

    try {
      const payload = {
        course_id: formCourseId,
        teacher_id: formTeacherId,
        shift_name: formShiftName,
        day_of_week: formDayOfWeek,
        start_time: formStartTime,
        end_time: formEndTime,
        meet_link: formMeetLink || null,
        room_or_location: formRoom || 'Virtual / Meet'
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('lms_teacher_schedules')
          .update(payload)
          .eq('id', editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lms_teacher_schedules')
          .insert([payload]);
        if (error) throw error;
      }

      // Ensure teacher is in lms_course_teachers
      await supabase
        .from('lms_course_teachers')
        .upsert({ course_id: formCourseId, user_id: formTeacherId, role: 'teacher' }, { onConflict: 'course_id,user_id' });

      setNotification({ type: 'success', message: 'Turno y carga docente configurados con éxito.' });
      setIsModalOpen(false);
      setEditingSchedule(null);
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el turno.';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este turno y carga horaria?')) return;
    try {
      const { error } = await supabase.from('lms_teacher_schedules').delete().eq('id', id);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Turno eliminado correctamente.' });
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar el turno.';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const openEditModal = (sch: LMSTeacherSchedule) => {
    setEditingSchedule(sch);
    setFormTeacherId(sch.teacher_id);
    setFormCourseId(sch.course_id);
    setFormShiftName(sch.shift_name);
    setFormDayOfWeek(sch.day_of_week);
    setFormStartTime(sch.start_time);
    setFormEndTime(sch.end_time);
    setFormMeetLink(sch.meet_link || '');
    setFormRoom(sch.room_or_location || 'Virtual / Meet');
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setFormTeacherId(profiles[0]?.id || '');
    if (courses[0]) setFormCourseId(courses[0].id);
    setFormShiftName('Turno 1 [09:00 AM a 10:30 AM]');
    setFormDayOfWeek('Domingo');
    setFormStartTime('09:00');
    setFormEndTime('10:30');
    setFormMeetLink('');
    setFormRoom('Aula Virtual / Meet');
    setIsModalOpen(true);
  };

  const filteredSchedules = schedules.filter(sch => {
    const courseMatch = selectedCourseId === 'all' || sch.course_id === selectedCourseId;
    const teacher = profiles.find(p => p.id === sch.teacher_id);
    const teacherName = `${teacher?.first_name || ''} ${teacher?.last_name || ''}`.trim();
    const searchMatch = !searchTerm || teacherName.toLowerCase().includes(searchTerm.toLowerCase()) || sch.shift_name.toLowerCase().includes(searchTerm.toLowerCase());
    return courseMatch && searchMatch;
  });

  return (
    <AnimeFadeUp className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-gold" /> RBAC & CRM Académico
            </div>
            <h2 className="text-3xl font-black font-serif tracking-tight">Gestión de Personal Docente y Turnos</h2>
            <p className="text-gray-300 max-w-2xl text-sm">
              Asigna profesores desde el CRM general de la iglesia, configura sus turnos de clases sincrónicas (Estilo UNEMI) y enlaza salas de videollamada de forma centralizada.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gold hover:bg-gold/90 text-slate-950 font-bold shadow-lg shadow-gold/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Plus size={20} />
            Asignar Nuevo Turno / Docente
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por profesor o turno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <BookOpen size={18} className="text-gold flex-shrink-0" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full md:w-64 py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los Cursos / Materias</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedules Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-slate-800/60 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 p-8 space-y-4">
          <GraduationCap size={48} className="mx-auto text-gray-300 dark:text-slate-700 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No hay turnos ni cargas asignadas</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Configura el primer turno para que los docentes impartan sus clases y los alumnos vean los horarios en tiempo real en su calendario.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all"
          >
            <Plus size={16} /> Asignar Turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map(sch => {
            const teacher = profiles.find(p => p.id === sch.teacher_id);
            const course = courses.find(c => c.id === sch.course_id);
            return (
              <div
                key={sch.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                      <Clock size={12} /> {sch.day_of_week} ({sch.start_time} - {sch.end_time})
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(sch)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-indigo-600 transition-colors"
                        title="Editar turno"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-gray-500 hover:text-red-600 transition-colors"
                        title="Eliminar turno"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-gold transition-colors line-clamp-1">
                      {course?.title || 'Materia sin título'}
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">{sch.shift_name}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold text-sm flex-shrink-0">
                      {teacher?.first_name ? teacher.first_name.substring(0, 2).toUpperCase() : 'DOC'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {`${teacher?.first_name || ''} ${teacher?.last_name || ''}`.trim() || 'Profesor sin asignar'}
                      </p>
                      <p className="text-xs text-gray-400">Docente Titular / CRM</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <UserCheck size={13} className="text-emerald-500" /> {sch.room_or_location}
                  </span>
                  {sch.meet_link ? (
                    <a
                      href={sch.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-all"
                    >
                      <Video size={13} /> Sala Meet / Zoom
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sin enlace virtual</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Drawer for Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-gold" size={22} />
                {editingSchedule ? 'Editar Turno y Horario' : 'Asignar Nuevo Docente y Turno'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Docente (Miembro en CRM)</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecciona un profesor del CRM...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email} ({p.role || 'Miembro'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia / Curso</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Turno (Estilo UNEMI)</label>
                <input
                  type="text"
                  value={formShiftName}
                  onChange={(e) => setFormShiftName(e.target.value)}
                  placeholder="Ej: Turno 9 [14:00 PM a 14:59 PM] | Martes"
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Día</label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-medium"
                  >
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enlace de Videollamada (Meet / Zoom)</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="url"
                    value={formMeetLink}
                    onChange={(e) => setFormMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación o Sala</label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  placeholder="Ej: Aula Virtual 1 / Edificio Principal"
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingSchedule ? 'Guardar Cambios' : 'Asignar Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
}
