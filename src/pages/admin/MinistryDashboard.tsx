import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { ArrowLeft, Users, Calendar, Clock, FileText, Settings, ShieldAlert, Loader2, GraduationCap, ArrowRight, BookOpen } from 'lucide-react';
import type { Ministry, LMSSchool } from '../../types';
import MinistryMembers from '../../components/admin/ministry/MinistryMembers';
import SmartScheduler from '../../components/admin/ministry/SmartScheduler';
import MeetingNotes from '../../components/admin/ministry/MeetingNotes';
import MinistryCalendar from '../../components/admin/ministry/MinistryCalendar';
import { AcademicStaffManager } from '../../features/lms/components/AcademicStaffManager';
import { CoursesList } from '../../features/lms/components/CoursesList';
import { useCourses } from '../../features/lms/hooks/useCourses';

export default function MinistryDashboard() {
  const { id } = useParams();
  const { canEditMinistry } = usePermissions();

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [school, setSchool] = useState<LMSSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detalles');

  useEffect(() => {
    fetchMinistry();
  }, [id]);

  const { courses } = useCourses();

  const fetchMinistry = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setMinistry(data);

      // Check if this ministry has an associated school
      const { data: schoolData } = await supabase
        .from('lms_schools')
        .select('*')
        .eq('ministry_id', id)
        .maybeSingle();
      
      if (schoolData) {
        setSchool(schoolData as LMSSchool);
      }
    } catch (err) {
      console.error('Error fetching ministry:', err);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = canEditMinistry(id || '');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-white/10">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ministerio no encontrado</h2>
        <Link to="/admin/ministerios" className="text-primary hover:underline mt-2 inline-block">Volver</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'detalles', label: 'Información General', icon: Settings },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'calendario', label: 'Calendario Interno', icon: Calendar },
    { id: 'planificador', label: 'Planificador de Reuniones', icon: Clock },
    { id: 'actas', label: 'Actas', icon: FileText },
  ];

  if (school) {
    tabs.push({ id: 'escuela', label: 'Escuela Académica', icon: GraduationCap });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/ministerios" className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-450 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {ministry.name}
            {!canEdit && <span className="bg-gray-100 text-gray-500 dark:text-gray-450 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold border border-gray-200 dark:border-white/10">Solo Lectura</span>}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-450">Panel de control del ministerio/departamento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-150 dark:border-white/10 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'detalles' && (
            <div className="text-gray-600 dark:text-gray-400">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Detalles del Ministerio</h3>
              <p>Aquí se mostraría la vista de edición o detalles generales del ministerio.</p>
              {/* Could embed the MinistryManager form or a summary here */}
            </div>
          )}

          {activeTab === 'miembros' && (
            <MinistryMembers ministryId={ministry.id} />
          )}

          {activeTab === 'calendario' && (
            <MinistryCalendar ministryId={ministry.id} />
          )}

          {activeTab === 'planificador' && (
            <SmartScheduler ministryId={ministry.id} />
          )}

          {activeTab === 'actas' && (
            <MeetingNotes ministryId={ministry.id} />
          )}

          {activeTab === 'escuela' && school && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-950/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: school.color || '#4F46E5' }}>
                    {school.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white">{school.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Panel administrativo simplificado de la escuela.</p>
                  </div>
                </div>
                <Link to="/admin/lms" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md">
                  Ir al Aula Virtual Central <ArrowRight size={16} />
                </Link>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="text-gold" size={20} /> Cursos de la Escuela
                </h4>
                <CoursesList courses={courses.filter(c => c.school_id === school.id)} />
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-white/10">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="text-emerald-500" size={20} /> Plantilla Docente
                </h4>
                <AcademicStaffManager schoolId={school.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
