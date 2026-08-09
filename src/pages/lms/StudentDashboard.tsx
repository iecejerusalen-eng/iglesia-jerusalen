import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Award, Calendar, BarChart3, ChevronRight, ShieldCheck, UserCheck, Loader2, School } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

import { StudentCalendar } from '../../features/student-dashboard/components/StudentCalendar';
import { StudentGrades } from '../../features/student-dashboard/components/StudentGrades';
import { StudentBadges } from '../../features/student-dashboard/components/StudentBadges';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { NotificationCenter } from '../../features/lms/components/NotificationCenter';
import { ProgressHero } from '../../features/student-dashboard/components/ProgressHero';
import { NextUpWidget } from '../../features/student-dashboard/components/NextUpWidget';
import { GradesOverviewWidget } from '../../features/student-dashboard/components/GradesOverviewWidget';
import { MyAttendanceWidget } from '../../features/student-dashboard/components/MyAttendanceWidget';
import { DigitalIDCard } from '../../features/student-dashboard/components/DigitalIDCard';
import { XPBarWidget } from '../../features/student-dashboard/components/XPBarWidget';
import { StudentStatsTab } from '../../features/lms/components/StudentStatsTab';
import { LeaderboardWidget } from '../../features/student-dashboard/components/LeaderboardWidget';
import { BadgeShowcase } from '../../features/student-dashboard/components/BadgeShowcase';
import { PendingTasksWidget } from '../../features/student-dashboard/components/PendingTasksWidget';
import { NumberTicker } from '../../components/ui/magicui/number-ticker';
import type { PendingTask } from '../../features/student-dashboard/components/PendingTasksWidget';
import { SchoolPortalGate } from '../../features/lms/components/SchoolPortalGate';
import type { SchoolPortalSchool } from '../../features/lms/hooks/useSchoolPortal';


// Define the interface for the enrollment progress object to replace `any`
interface CourseProgress {
  id: string;
  course_id: string;
  lms_courses?: {
    id: string;
    title: string;
    description: string;
    cover_image_url: string;
  } | null;
  progressPercentage: number;
  completed: number;
  total: number;
}

interface StudentBadgeItem {
  id: string;
  badge_name: string;
  badge_svg: string;
  awarded_at: string;
}

interface ShowcaseBadge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  unlocked_at: string;
}

type StudentTabId = 'courses' | 'attendance' | 'calendar' | 'grades' | 'badges' | 'stats';

const TAB_ALIASES: Record<string, StudentTabId> = {
  courses: 'courses', cursos: 'courses', attendance: 'attendance', asistencia: 'attendance',
  calendar: 'calendar', horario: 'calendar', grades: 'grades', calificaciones: 'grades',
  badges: 'badges', logros: 'badges', stats: 'stats', estadisticas: 'stats',
};

interface StudentSchoolDashboardProps {
  school: SchoolPortalSchool;
  onChangeSchool: () => void;
}

function StudentSchoolDashboard({ school, onChangeSchool }: StudentSchoolDashboardProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<CourseProgress[]>([]);
  const [badges, setBadges] = useState<StudentBadgeItem[]>([]);
  const [stats, setStats] = useState({
    activeCourses: 0,
    totalXp: 0,
    level: 1,
    streak: 0,
    attendance: 100,
    overallProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentTabId>(() => TAB_ALIASES[searchParams.get('tab') || ''] || 'courses');
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ShowcaseBadge | null>(null);

  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: enrollData, error: enrollError } = await supabase
        .from('lms_enrollments')
        .select(`
          id,
          course_id,
          lms_courses!inner (
            id,
            title,
            description,
            cover_image_url,
            school_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('lms_courses.school_id', school.id);

      if (enrollError) throw enrollError;
      
      const coursesWithProgress = await Promise.all((enrollData || []).map(async (enr) => {
        const { data: totalLessons, error: lessonsError } = await supabase
          .from('lms_lessons')
          .select('id, lms_modules!inner(subject_id, lms_subjects!inner(course_id))')
          .eq('lms_modules.lms_subjects.course_id', enr.course_id);

        if (lessonsError) throw lessonsError;

        const total = totalLessons?.length || 0;
        let completed = 0;
        if (totalLessons && totalLessons.length > 0) {
          const lessonIds = totalLessons.map(l => l.id);
          const { data: progressData, error: progressError } = await supabase
            .from('lms_lesson_completions')
            .select('is_completed')
            .eq('student_id', user.id)
            .in('lesson_id', lessonIds)
            .eq('is_completed', true);
          if (progressError) throw progressError;
          completed = progressData?.length || 0;
        }

        const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
        
        // Ensure proper typing since joined tables can return objects or arrays of objects
        const courseData = Array.isArray(enr.lms_courses) ? enr.lms_courses[0] : enr.lms_courses;

        return {
          id: enr.id,
          course_id: enr.course_id,
          lms_courses: courseData,
          progressPercentage,
          completed,
          total
        } as CourseProgress;
      }));

      setEnrollments(coursesWithProgress);

      const { data: badgesData, error: badgesError } = await supabase
        .from('lms_student_badges')
        .select('*')
        .eq('student_id', user.id)
        .order('awarded_at', { ascending: false });
      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Fetch pending tasks
      const courseIds = (enrollData || []).map((e) => e.course_id);
      if (courseIds.length > 0) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('lms_lessons')
          .select(`
            id,
            title,
            due_date,
            lms_modules!inner (
              lms_subjects!inner (
                course_id,
                lms_courses ( title )
              )
            )
          `)
          .eq('type', 'assignment')
          .not('due_date', 'is', null)
          .in('lms_modules.lms_subjects.course_id', courseIds);
        if (assignmentsError) throw assignmentsError;

        if (assignmentsData && assignmentsData.length > 0) {
          const assignmentIds = assignmentsData.map((a) => a.id);
          
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('lms_lesson_submissions')
            .select('lesson_id')
            .eq('student_id', user.id)
            .in('lesson_id', assignmentIds);
          if (submissionsError) throw submissionsError;

          const submittedIds = new Set(submissionsData?.map((s) => s.lesson_id) || []);

          interface AssignmentSubject {
            lms_courses?: { title: string } | { title: string }[];
          }
          interface AssignmentModule {
            lms_subjects?: AssignmentSubject | AssignmentSubject[];
          }
          interface AssignmentItem {
            id: string;
            title: string;
            due_date: string;
            lms_modules?: AssignmentModule | AssignmentModule[];
          }

          const formattedTasks = assignmentsData
            .filter((a) => !submittedIds.has(a.id))
            .map((a: AssignmentItem) => {
              // Handle Supabase nested array return structures
              const modules: AssignmentModule | undefined = Array.isArray(a.lms_modules) ? a.lms_modules[0] : a.lms_modules;
              const subjects: AssignmentSubject | undefined = modules && Array.isArray(modules.lms_subjects) ? modules.lms_subjects[0] : (modules?.lms_subjects as AssignmentSubject | undefined);
              const courses: { title: string } | undefined = subjects && Array.isArray(subjects.lms_courses) ? subjects.lms_courses[0] : (subjects?.lms_courses as { title: string } | undefined);
              const courseTitle = courses?.title || 'Curso';
              return {
                id: a.id,
                title: a.title,
                courseTitle,
                dueDate: new Date(a.due_date),
                status: 'PENDING' as const
              };
            })
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
            
          setPendingTasks(formattedTasks);
        } else {
          setPendingTasks([]);
        }
      }
      else {
        setPendingTasks([]);
      }

      // Fetch global stats (Gamification)
      const { data: statsData, error: statsError } = await supabase
        .from('lms_student_stats')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      if (statsError) throw statsError;

      let overall = 0;
      if (coursesWithProgress.length > 0) {
        const sum = coursesWithProgress.reduce((acc, c) => acc + c.progressPercentage, 0);
        overall = sum / coursesWithProgress.length;
      }

      // Get attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('lms_attendance')
        .select('status, lms_class_sessions!inner(lms_courses!inner(school_id))')
        .eq('student_id', user.id)
        .eq('lms_class_sessions.lms_courses.school_id', school.id);
      if (attendanceError) throw attendanceError;
        
      let attendancePercentage = 100;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.status === 'present' || a.status === 'zoom').length;
        attendancePercentage = Math.round((presentCount / attendanceData.length) * 100);
      }

      setStats({
        activeCourses: enrollData?.length || 0,
        totalXp: statsData?.xp_total || 0,
        level: statsData?.level || 1,
        streak: statsData?.current_streak || 0,
        attendance: attendancePercentage,
        overallProgress: overall
      });

    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      toast.error('Error al cargar el panel de estudiante');
    } finally {
      setIsLoading(false);
    }
  }, [school.id, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, navigate, fetchDashboardData]);

  const selectTab = (tabId: StudentTabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'courses' ? {} : { tab: tabId }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#f7f8fb] pt-20 dark:bg-slate-950">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><Loader2 className="animate-spin" size={25} /></span>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Organizando tu aula...</p>
      </div>
    );
  }

  const tabs: Array<{ id: StudentTabId; label: string; icon: typeof BookOpen }> = [
    { id: 'courses', label: 'Mis Cursos', icon: BookOpen },
    { id: 'attendance', label: 'Mi Asistencia', icon: UserCheck },
    { id: 'calendar', label: 'Horario', icon: Calendar },
    { id: 'grades', label: 'Calificaciones', icon: Award },
    { id: 'badges', label: 'Mis Logros', icon: ShieldCheck },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fb] pb-24 pt-24 text-slate-800 dark:bg-slate-950 dark:text-white md:pb-14">
      <div className="mx-auto mt-3 max-w-7xl px-4 sm:mt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-indigo-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-indigo-400/15 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><School size={19} /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Escuela activa</p><p className="font-bold text-slate-900 dark:text-white">{school.name}</p></div>
          </div>
          <button type="button" onClick={onChangeSchool} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Cambiar escuela</button>
        </div>
        <ProgressHero 
          userFullName={user?.user_metadata?.full_name || 'Estudiante'}
          avatarUrl={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
          activeCourses={stats.activeCourses}
          pendingTasksCount={pendingTasks.length}
          totalXp={stats.totalXp}
          streak={stats.streak}
          attendance={stats.attendance}
          overallProgress={stats.overallProgress}
          onOpenIDCard={() => setIsIdCardOpen(true)}
        />
        
        {/* Widgets Grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {enrollments.length > 0 && (
            <div className="lg:col-span-1">
              <NextUpWidget 
                courseId={enrollments[0]?.lms_courses?.id || ""}
                courseTitle={enrollments[0]?.lms_courses?.title || ""}
                lessonTitle="Continuar desde donde te quedaste"
                type="video"
                timeEstimate={15}
              />
            </div>
          )}

          {/* Widget Rendimiento por Curso */}
          <div className="lg:col-span-1">
            <GradesOverviewWidget enrollments={enrollments} />
          </div>

          {/* Gamification XP Bar */}
          <div className="lg:col-span-1">
            <XPBarWidget xp={stats.totalXp} level={stats.level} streak={stats.streak} />
          </div>

          {/* New Pending Tasks Widget */}
          <div className="lg:col-span-1">
            <PendingTasksWidget 
              tasks={pendingTasks} 
            />
          </div>

          {/* Gamification Leaderboard */}
          <div className="lg:col-span-1">
            <LeaderboardWidget />
          </div>
        </div>
      </div>

      {/* Top Menu (Tabs) */}
      <div className="sticky top-[72px] z-20 mt-6 border-y border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 lg:px-8">
          <div className="hide-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 sm:rounded-2xl sm:p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-all sm:rounded-xl sm:px-5 sm:text-sm ${
                    isActive 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notification Center */}
          <div className="ml-3 flex shrink-0 items-center sm:ml-4 sm:pl-3">
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        
        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <AnimeFadeUp className="space-y-8">
            {enrollments.length === 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-8 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-12">
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="mb-2 text-2xl font-bold">Tu acceso ya está activo</h3>
                <p className="mx-auto mb-6 max-w-xl text-base text-gray-500 sm:text-lg">Todavía no tienes una clase asignada dentro de {school.name}. La coordinación debe ubicarte en el curso, rango o paralelo que te corresponde.</p>
                <button type="button" onClick={onChangeSchool} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
                  Revisar otras escuelas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                {enrollments.map((enr, idx) => (
                  <motion.div
                    key={enr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-400/30 sm:flex-row"
                  >
                    {/* Image side */}
                    <div className="relative h-44 w-full shrink-0 overflow-hidden border-b border-slate-100 dark:border-white/5 sm:h-auto sm:w-48 sm:border-b-0 sm:border-r lg:w-52">
                      <img loading="lazy" 
                        src={enr.lms_courses?.cover_image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'} 
                        alt={enr.lms_courses?.title || 'Curso'}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    {/* Content side */}
                    <div className="flex flex-grow flex-col p-5 sm:p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold font-serif text-xl line-clamp-2 text-slate-900 dark:text-white pr-2">
                          {enr.lms_courses?.title || 'Curso Desconocido'}
                        </h3>
                        <div className="bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 shrink-0 whitespace-nowrap border border-gray-200 dark:border-white/5">
                          {Math.round(enr.progressPercentage)}%
                        </div>
                      </div>
                      
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">
                        {enr.lms_courses?.description || 'Sin descripción disponible.'}
                      </p>
                      
                      <div className="mt-auto pt-4 flex flex-col gap-3">
                        <div className="w-full bg-gray-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gold h-full rounded-full transition-all duration-1000" style={{ width: `${enr.progressPercentage}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 dark:text-gray-400 flex items-center gap-1">
                            <NumberTicker value={enr.completed} className="font-bold text-slate-700 dark:text-gray-300" /> de {enr.total} Lecciones
                          </span>
                          
                          <Link 
                            to={`/lms/curso/${enr.course_id}`}
                            className="flex min-h-10 items-center gap-1 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300"
                          >
                            {enr.progressPercentage === 0 ? 'Comenzar' : enr.progressPercentage === 100 ? 'Repasar' : 'Continuar'}
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimeFadeUp>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <StudentCalendar />
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <MyAttendanceWidget schoolId={school.id} />
        )}

        {/* GRADES TAB */}
        {activeTab === 'grades' && (
          <StudentGrades schoolId={school.id} />
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <StudentStatsTab courses={enrollments} />
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <StudentBadges badges={badges} onSelectBadge={setSelectedBadge} />
        )}

      </div>

      {user && (
        <DigitalIDCard 
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          student={{
            id: user.id,
            name: user.user_metadata?.full_name || 'Estudiante',
            role: user.user_metadata?.role || 'student',
            avatarUrl: user.user_metadata?.avatar_url || null,
            email: user.email || ''
          }}
        />
      )}

      <BadgeShowcase 
        badge={selectedBadge} 
        isOpen={!!selectedBadge} 
        onClose={() => setSelectedBadge(null)} 
        isNewUnlock={false}
      />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <SchoolPortalGate mode="student">
      {(school, leaveSchool) => <StudentSchoolDashboard school={school} onChangeSchool={leaveSchool} />}
    </SchoolPortalGate>
  );
}
