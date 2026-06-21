import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, Users, Calendar, Award, Clock, 
  MessageSquare, Plus, X, Shield, PlusCircle, 
  Video, Save, Info, AlertTriangle, BarChart3, 
  FileDown, Activity
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#D4AF37', '#1E3A8A', '#8B5CF6', '#10B981', '#EF4444'];

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Navigation states
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'planning' | 'grades' | 'comm' | 'integrations'>('students');
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  // Tab 1: Alumnos / Asistencia / Grupos
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [groups, setGroups] = useState<any[]>([]);
  
  // Tab 2: Planificación / Biblioteca
  const [materials, setMaterials] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Tab 3: Calificaciones & Analytics
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [averageGrade, setAverageGrade] = useState<number>(0);
  const [strugglingStudents, setStrugglingStudents] = useState<any[]>([]);
  const [highlightStudents, setHighlightStudents] = useState<any[]>([]);

  // Tab 4: Comunicación & Tutorías
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tutoring, setTutoring] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newTutoring, setNewTutoring] = useState({ studentId: '', time: '', notes: '' });

  // Tab 5: Integraciones
  const [zoomLink, setZoomLink] = useState('');
  const [classroomSync, setClassroomSync] = useState(false);
  const [teamsLink, setTeamsLink] = useState('');

  // Modals / Create forms
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkRoleAndFetchCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData();
    }
  }, [selectedCourse, activeTab]);

  const checkRoleAndFetchCourses = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_teacher')
        .eq('id', user?.id)
        .single();

      const isAdmin = ['admin', 'pastor'].includes(profile?.role || '');
      const isTeacherFlag = profile?.is_teacher || false;
      setIsTeacher(isTeacherFlag || isAdmin);

      if (!isTeacherFlag && !isAdmin) {
        setIsLoading(false);
        return;
      }

      // Fetch assigned courses
      let query = supabase.from('lms_courses').select('*');
      if (!isAdmin) {
        const { data: assignments } = await supabase
          .from('lms_course_teachers')
          .select('course_id')
          .eq('user_id', user?.id);
        const assignedIds = assignments?.map(a => a.course_id) || [];
        query = query.in('id', assignedIds);
      }

      const { data: courseList } = await query;
      setCourses(courseList || []);
      if (courseList && courseList.length > 0) {
        setSelectedCourse(courseList[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cargando cursos del docente');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseData = async () => {
    if (!selectedCourse) return;
    try {
      // 1. Fetch Students Directory (Enrollments -> profiles -> members)
      const { data: enrollments, error: enrollError } = await supabase
        .from('lms_enrollments')
        .select('user_id')
        .eq('course_id', selectedCourse.id)
        .eq('role', 'student');

      if (enrollError) throw enrollError;

      let studentList: any[] = [];
      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            email,
            member_id,
            members:member_id (
              phone,
              emergency_contact_name,
              emergency_contact_phone,
              medical_notes
            )
          `)
          .in('id', studentIds);

        if (profilesError) throw profilesError;

        studentList = enrollments.map((e: any) => {
          const profile = profilesData?.find(p => p.id === e.user_id);
          return {
            id: e.user_id,
            first_name: profile?.first_name || 'Estudiante',
            last_name: profile?.last_name || '',
            email: profile?.email || '',
            phone: (profile?.members as any)?.phone || 'S/N',
            emergency_name: (profile?.members as any)?.emergency_contact_name || 'S/N',
            emergency_phone: (profile?.members as any)?.emergency_contact_phone || 'S/N',
            medical_notes: (profile?.members as any)?.medical_notes || 'Ninguna'
          };
        });
      }
      setStudents(studentList);

      if (activeTab === 'students') {
        // Fetch Attendance Sessions
        const { data: classSessions } = await supabase
          .from('lms_class_sessions')
          .select('*')
          .eq('course_id', selectedCourse.id)
          .order('session_date', { ascending: false });
        
        setSessions(classSessions || []);
        
        if (classSessions && classSessions.length > 0) {
          const defaultSession = classSessions[0].id;
          setSelectedSession(defaultSession);
          fetchSessionAttendance(defaultSession);
        }

        // Fetch Student Groups
        const { data: studentGroups } = await supabase
          .from('lms_student_groups')
          .select('*')
          .eq('course_id', selectedCourse.id);
        setGroups(studentGroups || []);
      } 
      else if (activeTab === 'planning') {
        // Fetch lessons and materials
        const { data: sections } = await supabase
          .from('lms_sections')
          .select('id')
          .eq('course_id', selectedCourse.id);
        const sectionIds = sections?.map(s => s.id) || [];
        
        const { data: materialsData } = await supabase
          .from('lms_activities')
          .select('*')
          .in('section_id', sectionIds)
          .eq('type', 'resource');
        setMaterials(materialsData || []);

        const { data: evalData } = await supabase
          .from('lms_activities')
          .select('*')
          .in('section_id', sectionIds)
          .in('type', ['assignment', 'quiz']);
        setActivities(evalData || []);
      }
      else if (activeTab === 'grades') {
        // Fetch Gradebook & Performance Metrics
        const { data: sections } = await supabase
          .from('lms_sections')
          .select('id')
          .eq('course_id', selectedCourse.id);
        const sectionIds = sections?.map(s => s.id) || [];
        
        const { data: evalData } = await supabase
          .from('lms_activities')
          .select('id, title, type')
          .in('section_id', sectionIds)
          .in('type', ['assignment', 'quiz']);
        const activityIds = evalData?.map(a => a.id) || [];
        
        if (activityIds.length > 0) {
          const { data: subsData, error: subsError } = await supabase
            .from('lms_assignment_submissions')
            .select('*')
            .in('activity_id', activityIds);

          if (subsError) throw subsError;

          let subs: any[] = [];
          if (subsData && subsData.length > 0) {
            const studentIds = [...new Set(subsData.map(s => s.student_id))];
            const { data: profData, error: profError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', studentIds);

            if (profError) throw profError;

            subs = subsData.map(sub => {
              const profile = profData?.find(p => p.id === sub.student_id);
              return {
                ...sub,
                profiles: profile ? {
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || ''
                } : null
              };
            });
          }
          
          setSubmissions(subs);
          calculateAnalytics(subs, studentList);
        }
      }
      else if (activeTab === 'comm') {
        // Fetch announcements
        const { data: announcementsData } = await supabase
          .from('lms_announcements')
          .select('*')
          .eq('course_id', selectedCourse.id)
          .order('created_at', { ascending: false });
        setAnnouncements(announcementsData || []);

        // Fetch tutoring sessions
        const { data: tutoringData, error: tutoringError } = await supabase
          .from('lms_tutoring_appointments')
          .select('*')
          .eq('course_id', selectedCourse.id)
          .order('scheduled_at', { ascending: true });

        if (tutoringError) throw tutoringError;

        let mappedTutoring: any[] = [];
        if (tutoringData && tutoringData.length > 0) {
          const studentIds = [...new Set(tutoringData.map(t => t.student_id))];
          const { data: profData, error: profError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', studentIds);

          if (profError) throw profError;

          mappedTutoring = tutoringData.map(t => {
            const profile = profData?.find(p => p.id === t.student_id);
            return {
              ...t,
              profiles: profile ? {
                first_name: profile.first_name || '',
                last_name: profile.last_name || ''
              } : null
            };
          });
        }
        setTutoring(mappedTutoring);
      }
      else if (activeTab === 'integrations') {
        // Sincronizaciones mock read from localStorage
        const zoom = localStorage.getItem(`zoom_${selectedCourse.id}`) || '';
        const teams = localStorage.getItem(`teams_${selectedCourse.id}`) || '';
        const classroom = localStorage.getItem(`classroom_${selectedCourse.id}`) === 'true';
        setZoomLink(zoom);
        setTeamsLink(teams);
        setClassroomSync(classroom);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cargando datos del aula');
    }
  };

  const fetchSessionAttendance = async (sessionId: string) => {
    try {
      const { data: att } = await supabase
        .from('lms_attendance')
        .select('student_id, status')
        .eq('session_id', sessionId);
      
      const map: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
      att?.forEach(item => {
        map[item.student_id] = item.status;
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!selectedSession) return;
    try {
      // Upsert attendance entry
      const { error } = await supabase
        .from('lms_attendance')
        .upsert([{
          session_id: selectedSession,
          student_id: studentId,
          status: status
        }], { onConflict: 'session_id,student_id' });

      if (error) throw error;
      setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
      toast.success('Asistencia registrada');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar asistencia');
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle || !newSessionDate) return;
    try {
      const { data, error } = await supabase
        .from('lms_class_sessions')
        .insert([{
          course_id: selectedCourse.id,
          title: newSessionTitle,
          session_date: newSessionDate
        }])
        .select();

      if (error) throw error;
      setSessions(prev => [data[0], ...prev]);
      setSelectedSession(data[0].id);
      setAttendanceMap({});
      setIsAddSessionOpen(false);
      setNewSessionTitle('');
      toast.success('Clase / Sesión creada');
    } catch (err) {
      console.error(err);
      toast.error('Error al agregar sesión');
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      const { data, error } = await supabase
        .from('lms_student_groups')
        .insert([{
          course_id: selectedCourse.id,
          name: newGroupName,
          description: newGroupDesc
        }])
        .select();
      if (error) throw error;
      setGroups(prev => [...prev, data[0]]);
      setIsAddGroupOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      toast.success('Subgrupo de trabajo creado');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear subgrupo');
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    try {
      const { data, error } = await supabase
        .from('lms_announcements')
        .insert([{
          course_id: selectedCourse.id,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          created_by: user?.id
        }])
        .select();
      if (error) throw error;
      setAnnouncements(prev => [data[0], ...prev]);
      setNewAnnouncement({ title: '', content: '' });
      toast.success('Anuncio publicado');
    } catch (err) {
      console.error(err);
      toast.error('Error al publicar anuncio');
    }
  };

  const handleAddTutoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTutoring.studentId || !newTutoring.time) return;
    try {
      const { error } = await supabase
        .from('lms_tutoring_appointments')
        .insert([{
          course_id: selectedCourse.id,
          student_id: newTutoring.studentId,
          teacher_id: user?.id,
          scheduled_at: new Date(newTutoring.time).toISOString(),
          notes: newTutoring.notes
        }])
        .select();
      if (error) throw error;
      fetchCourseData();
      setNewTutoring({ studentId: '', time: '', notes: '' });
      toast.success('Tutoría programada');
    } catch (err) {
      console.error(err);
      toast.error('Error al agendar tutoría');
    }
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`zoom_${selectedCourse.id}`, zoomLink);
    localStorage.setItem(`teams_${selectedCourse.id}`, teamsLink);
    localStorage.setItem(`classroom_${selectedCourse.id}`, classroomSync ? 'true' : 'false');
    toast.success('Integraciones guardadas');
  };

  const calculateAnalytics = (subs: any[], studentList: any[]) => {
    // Calculate Average grades
    const grades = subs
      .map(s => parseFloat(s.grade || '0'))
      .filter(g => !isNaN(g) && g > 0);
    
    const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    setAverageGrade(parseFloat(avg.toFixed(1)));

    // Categorize students
    const studentGrades: Record<string, number[]> = {};
    subs.forEach(s => {
      if (!studentGrades[s.student_id]) studentGrades[s.student_id] = [];
      const val = parseFloat(s.grade || '0');
      if (!isNaN(val) && val > 0) {
        studentGrades[s.student_id].push(val);
      }
    });

    const struggling: any[] = [];
    const highPerformers: any[] = [];

    studentList.forEach(s => {
      const sGrades = studentGrades[s.id] || [];
      const sAvg = sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0;
      
      if (sAvg > 0) {
        const studentInfo = { ...s, average: parseFloat(sAvg.toFixed(1)) };
        if (sAvg < 7.0) {
          struggling.push(studentInfo);
        } else if (sAvg >= 9.0) {
          highPerformers.push(studentInfo);
        }
      }
    });

    setStrugglingStudents(struggling);
    setHighlightStudents(highPerformers);
  };

  const handleExportPDF = () => {
    // Generate simple print dialog representation
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold font-serif">Acceso Restringido</h1>
          <p className="text-slate-500 text-xs">No posees permisos de Docente / Líder en la base de datos para ingresar al centro de control educativo.</p>
          <Link to="/" className="inline-block px-5 py-2 bg-gold text-white font-bold rounded-xl text-xs hover:bg-yellow-600 transition-all">Volver al Portal Público</Link>
        </div>
      </div>
    );
  }

  // Analytics chart datasets
  const metricsData = [
    { name: 'Excelente (9-10)', value: highlightStudents.length },
    { name: 'Regular (7-8.9)', value: Math.max(0, students.length - highlightStudents.length - strugglingStudents.length) },
    { name: 'Rezago (< 7)', value: strugglingStudents.length }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-slate-950 transition-colors duration-500 text-slate-800 dark:text-gray-100 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Title Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-gold" size={24} />
              Centro de Control del Docente (LMS)
            </h1>
            <p className="text-xs text-gray-500">Supervisa las clases, asistencia, libreta de calificaciones e integraciones del entorno virtual.</p>
          </div>
          
          {/* Selector de Curso Activo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Curso:</span>
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const course = courses.find(c => c.id === e.target.value);
                setSelectedCourse(course || null);
              }}
              className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-gold"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-px gap-2">
          {(['students', 'planning', 'grades', 'comm', 'integrations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeTab === tab 
                  ? 'border-gold text-gold font-extrabold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'students' ? 'Alumnos y Aulas' :
               tab === 'planning' ? 'Planificación y Recursos' :
               tab === 'grades' ? 'Seguimiento y Notas' :
               tab === 'comm' ? 'Tutorías y Avisos' :
               'Ajustes e Integraciones'}
            </button>
          ))}
        </div>

        {/* Content Tabs */}
        {selectedCourse ? (
          <div className="space-y-6">
            
            {/* TAB 1: ALUMNOS, ASISTENCIA Y SUBGRUPOS */}
            {activeTab === 'students' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Directorio de Alumnos */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Users size={18} className="text-gold" />
                      Directorio de Alumnos ({students.length})
                    </h3>
                    
                    <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-96 overflow-y-auto pr-1">
                      {students.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">No hay alumnos inscritos en este curso.</p>
                      ) : (
                        students.map(std => (
                          <div key={std.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                            <div>
                              <p className="font-bold text-sm text-slate-850 dark:text-white">{std.first_name} {std.last_name}</p>
                              <p className="text-[10px] text-gray-400">Contacto: {std.phone} | Correo: {std.email}</p>
                            </div>
                            
                            {/* Emergency & Medical box popover inside a small badge */}
                            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-2.5 rounded-xl text-left max-w-xs md:max-w-md">
                              <p className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                                <Activity size={10} />
                                Datos Médicos y de Emergencia
                              </p>
                              <p className="text-[10px] text-gray-700 dark:text-gray-300 mt-1">Contacto: {std.emergency_name} ({std.emergency_phone})</p>
                              <p className="text-[10px] text-gray-500 italic">Notas: {std.medical_notes}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Asignación de Grupos / Talleres */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield size={18} className="text-gold" />
                        Subgrupos de Trabajo / Talleres ({groups.length})
                      </h3>
                      <button 
                        onClick={() => setIsAddGroupOpen(true)}
                        className="text-xs text-gold font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Nuevo Grupo
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups.length === 0 ? (
                        <p className="text-xs text-gray-400 col-span-2 py-4">No hay subgrupos creados.</p>
                      ) : (
                        groups.map(group => (
                          <div key={group.id} className="p-4 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-white/5 rounded-xl text-left space-y-2">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{group.name}</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed">{group.description || 'Sin descripción'}</p>
                            <span className="text-[9px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded-full select-none inline-block">Grupo de Discipulado</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Control de Asistencia */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar size={18} className="text-gold" />
                      Control de Asistencia
                    </h3>
                    <button 
                      onClick={() => setIsAddSessionOpen(true)}
                      className="p-1 text-gold hover:bg-gold/10 rounded-lg cursor-pointer"
                      title="Registrar fecha de clase"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Session Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Fecha de Sesión</label>
                      {sessions.length === 0 ? (
                        <p className="text-xs text-red-500 font-semibold">Crea una sesión para registrar asistencia.</p>
                      ) : (
                        <select
                          value={selectedSession}
                          onChange={(e) => {
                            setSelectedSession(e.target.value);
                            fetchSessionAttendance(e.target.value);
                          }}
                          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                        >
                          {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.title} ({new Date(s.session_date).toLocaleDateString()})</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Attendance quick grid */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {students.map(std => {
                        const status = attendanceMap[std.id] || 'present';
                        return (
                          <div key={std.id} className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2 last:border-none">
                            <span className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate max-w-[120px]">{std.first_name} {std.last_name[0]}.</span>
                            
                            {/* Short attendance toggles */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(std.id, 'present')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                                  status === 'present' ? 'bg-green-500 text-white shadow-2xs' : 'text-gray-400 hover:text-green-500'
                                }`}
                                title="Presente"
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(std.id, 'absent')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                                  status === 'absent' ? 'bg-red-500 text-white shadow-2xs' : 'text-gray-400 hover:text-red-500'
                                }`}
                                title="Ausente"
                              >
                                F
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(std.id, 'late')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                                  status === 'late' ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-400 hover:text-amber-500'
                                }`}
                                title="Atraso"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(std.id, 'excused')}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                                  status === 'excused' ? 'bg-blue-500 text-white shadow-2xs' : 'text-gray-400 hover:text-blue-500'
                                }`}
                                title="Justificado"
                              >
                                J
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: CONTENIDO, BIBLIOTECA Y EVALUACIONES */}
            {activeTab === 'planning' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Biblioteca de Recursos */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-gold" />
                    Biblioteca de Recursos / Documentos
                  </h3>
                  
                  <div className="space-y-3">
                    {materials.length === 0 ? (
                      <p className="text-xs text-gray-500 py-6">No hay documentos o recursos cargados en el temario.</p>
                    ) : (
                      materials.map(mat => (
                        <div key={mat.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-850 dark:text-white">{mat.title}</p>
                            <p className="text-[9px] text-gray-400">Puntaje: {mat.weighting}%</p>
                          </div>
                          <span className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-full font-bold">Recurso</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Diseño de Evaluaciones y Tareas */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Award size={18} className="text-gold" />
                    Evaluaciones y Cuestionarios Programados
                  </h3>

                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-xs text-gray-500 py-6">No hay exámenes o cuestionarios calendarizados.</p>
                    ) : (
                      activities.map(act => (
                        <div key={act.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-850 dark:text-white">{act.title}</p>
                            <p className="text-[9px] text-gray-400">Tipo: <span className="capitalize">{act.type === 'assignment' ? 'Tarea' : 'Cuestionario'}</span></p>
                          </div>
                          <span className="text-[10px] text-gold bg-gold/15 px-2.5 py-1 rounded-full font-bold">Evaluación</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: SEGUIMIENTO, LIBRO DE NOTAS Y ANALYTICS */}
            {activeTab === 'grades' && (
              <div className="space-y-6">
                
                {/* Cuadros de Mando / Analytics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* General Stats */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Promedio General</h4>
                      <p className="text-4xl font-extrabold font-serif text-slate-900 dark:text-white">{averageGrade} <span className="text-sm font-sans font-semibold text-gray-400">/ 10</span></p>
                    </div>
                    <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Entregas Procesadas:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{submissions.length}</span>
                    </div>
                  </div>

                  {/* Rosca de Rendimiento */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
                    <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Rendimiento Grupal</h4>
                    <div className="h-28 flex justify-center items-center">
                      {metricsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <PieChart>
                            <Pie
                              data={metricsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={45}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {metricsData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-xs text-gray-400">Sin registros</span>
                      )}
                    </div>
                  </div>

                  {/* Estudiantes Destacados / Rezago */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full text-left space-y-3">
                    <h4 className="font-serif font-bold text-xs text-gray-455 uppercase tracking-wider">Centro de Alertas Académicas</h4>
                    
                    <div className="space-y-2 overflow-y-auto max-h-24">
                      {strugglingStudents.map(std => (
                        <div key={std.id} className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 p-1.5 rounded-lg">
                          <AlertTriangle size={12} />
                          <span>Rezago: {std.first_name} {std.last_name} ({std.average})</span>
                        </div>
                      ))}
                      {highlightStudents.map(std => (
                        <div key={std.id} className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 p-1.5 rounded-lg">
                          <Award size={12} />
                          <span>Destacado: {std.first_name} {std.last_name} ({std.average})</span>
                        </div>
                      ))}
                      {strugglingStudents.length === 0 && highlightStudents.length === 0 && (
                        <p className="text-[10px] text-gray-400">No hay alertas disponibles.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gradebook Matrix Table */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-gold" />
                      Matriz General de Calificaciones (Gradebook)
                    </h3>
                    <button 
                      onClick={handleExportPDF}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <FileDown size={14} /> Imprimir Boletines
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-100 dark:border-white/5 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/40 border-b border-gray-250 dark:border-white/5">
                          <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Estudiante</th>
                          <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Calificación Promedio</th>
                          <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Estado de Aprobación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(std => {
                          const sAvg = highlightStudents.find(h => h.id === std.id)?.average || strugglingStudents.find(s => s.id === std.id)?.average || 0;
                          return (
                            <tr key={std.id} className="border-b border-gray-100 dark:border-white/5 last:border-none hover:bg-gray-50/50">
                              <td className="p-3.5 font-bold text-xs text-slate-800 dark:text-white">{std.first_name} {std.last_name}</td>
                              <td className="p-3.5 font-mono font-bold text-xs">
                                {sAvg > 0 ? `${sAvg} / 10` : 'Sin entregas'}
                              </td>
                              <td className="p-3.5">
                                {sAvg === 0 ? (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold">N/C</span>
                                ) : sAvg >= 7 ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-[9px] font-bold">Aprobado</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[9px] font-bold">Reprobado (Alerta)</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: COMUNICACION, ANUNCIOS Y TUTORIAS */}
            {activeTab === 'comm' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tablón de Anuncios */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-gold" />
                    Tablón de Anuncios de la Clase
                  </h3>

                  {/* Publicar anuncio form */}
                  <form onSubmit={handleAddAnnouncement} className="p-4 bg-gray-55 dark:bg-slate-950/20 border border-gray-200 dark:border-white/5 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Publicar aviso circular</h4>
                    <input
                      type="text"
                      required
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="Título del Anuncio..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                    />
                    <textarea
                      required
                      rows={3}
                      value={newAnnouncement.content}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      placeholder="Contenido o aviso importante para el grupo..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="bg-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-yellow-600 transition-all cursor-pointer">
                        Publicar Anuncio
                      </button>
                    </div>
                  </form>

                  {/* Anuncios list */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-2">
                    {announcements.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">No hay anuncios publicados.</p>
                    ) : (
                      announcements.map(ann => (
                        <div key={ann.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-left space-y-1">
                          <h4 className="font-bold text-xs text-slate-850 dark:text-white">{ann.title}</h4>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400">{ann.content}</p>
                          <span className="text-[9px] text-gray-450 block">{new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Reservas de Tutorías */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-gold" />
                    Reservas de Tutorías y Consejería Individual
                  </h3>

                  {/* Agendar tutoría form */}
                  <form onSubmit={handleAddTutoring} className="p-4 bg-gray-55 dark:bg-slate-950/20 border border-gray-200 dark:border-white/5 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Programar mentoría</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-450 font-bold mb-1">Alumno</label>
                        <select
                          required
                          value={newTutoring.studentId}
                          onChange={e => setNewTutoring({ ...newTutoring, studentId: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                        >
                          <option value="">Selecciona...</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-455 font-bold mb-1">Horario</label>
                        <input
                          type="datetime-local"
                          required
                          value={newTutoring.time}
                          onChange={e => setNewTutoring({ ...newTutoring, time: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={newTutoring.notes}
                      onChange={e => setNewTutoring({ ...newTutoring, notes: e.target.value })}
                      placeholder="Notas / Tema de tutoría (Consejo espiritual)..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                    />

                    <div className="flex justify-end">
                      <button type="submit" className="bg-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-yellow-600 transition-all cursor-pointer">
                        Programar Tutoría
                      </button>
                    </div>
                  </form>

                  {/* List of tutoring appointments */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-2">
                    {tutoring.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">No hay mentorías o tutorías programadas.</p>
                    ) : (
                      tutoring.map(tut => (
                        <div key={tut.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between text-left">
                          <div>
                            <p className="font-bold text-xs text-slate-850 dark:text-white">Alumno: {tut.profiles ? `${tut.profiles.first_name} ${tut.profiles.last_name}` : 'Estudiante'}</p>
                            <p className="text-[10px] text-gray-500">Notas: {tut.notes || 'Ninguna'}</p>
                            <p className="text-[9px] text-gold font-bold">{new Date(tut.scheduled_at).toLocaleString()}</p>
                          </div>
                          <span className="text-[9px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-extrabold uppercase">{tut.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: INTEGRACIONES Y AJUSTES */}
            {activeTab === 'integrations' && (
              <form onSubmit={handleSaveIntegrations} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl text-left space-y-5">
                <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Video size={18} className="text-gold" />
                  Sincronización e Integración de Clases
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Enlace de Zoom (Clases en vivo)</label>
                    <input
                      type="url"
                      value={zoomLink}
                      onChange={e => setZoomLink(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Enlace de Microsoft Teams</label>
                    <input
                      type="url"
                      value={teamsLink}
                      onChange={e => setTeamsLink(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                      placeholder="https://teams.microsoft.com/..."
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950/30 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={classroomSync}
                        onChange={(e) => setClassroomSync(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-350 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                    </label>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-xs">Sincronización con Google Classroom</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Importa tareas, notas y alumnos de Classroom automáticamente.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-155 dark:border-white/5 flex justify-end">
                  <button
                    type="submit"
                    className="bg-gold hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save size={14} /> Guardar Configuración
                  </button>
                </div>
              </form>
            )}

          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
            <Info className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tienes cursos activos</h3>
            <p className="text-gray-500 dark:text-gray-400">No hay aulas registradas en el sistema para administrar en este momento.</p>
          </div>
        )}
      </div>

      {/* Add Session Modal */}
      {isAddSessionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddSession} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-left animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-gold" />
                Registrar Clase / Sesión
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddSessionOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Título de la Sesión *</label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Ej. Sesión 1: Introducción a Gálatas"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={newSessionDate}
                  onChange={e => setNewSessionDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsAddSessionOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs shadow-sm cursor-pointer"
              >
                Registrar Sesión
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Group Modal */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddGroup} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-left animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-gold" />
                Nuevo Subgrupo / Taller
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddGroupOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Ej. Taller Bíblico A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Describe la tarea o integrantes asignados..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsAddGroupOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs shadow-sm cursor-pointer"
              >
                Crear Grupo
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
