import { useState, useEffect } from 'react';
import { Users, BookOpen, MessageSquare, Award, BookMarked, MonitorPlay, LayoutTemplate, Calendar as CalendarIcon, AlertTriangle, CheckSquare, School } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

import { useTeacherData } from '../../features/teacher-dashboard/hooks/useTeacherData';
import { useTeacherMutations } from '../../features/teacher-dashboard/hooks/useTeacherMutations';

import { StudentsTab } from '../../features/teacher-dashboard/components/StudentsTab';
import { PlanningTab } from '../../features/teacher-dashboard/components/PlanningTab';
import { CommunicationTab } from '../../features/teacher-dashboard/components/CommunicationTab';
import { GradesTab } from '../../features/teacher-dashboard/components/GradesTab';
import { ComplianceTab } from '../../features/teacher-dashboard/components/ComplianceTab';
import { IntegrationsTab } from '../../features/teacher-dashboard/components/IntegrationsTab';
import { OverviewTab } from '../../features/teacher-dashboard/components/OverviewTab';
import { QuestionBankTab } from '../../features/teacher-dashboard/components/QuestionBankTab';
import { ClassesTab } from '../../features/teacher-dashboard/components/ClassesTab';
import { UniversityCalendar } from '../../features/lms/components/UniversityCalendar';
import { NotificationCenter } from '../../features/lms/components/NotificationCenter';
import { ForumManager } from '../../features/lms/components/ForumManager';
import { SchoolPortalGate } from '../../features/lms/components/SchoolPortalGate';
import type { SchoolPortalSchool } from '../../features/lms/hooks/useSchoolPortal';
import { AcademicWorkspaceProvider } from '../../features/lms/context/AcademicWorkspaceProvider';
import { useAcademicWorkspace } from '../../features/lms/context/useAcademicWorkspace';

interface TeacherSchoolDashboardProps {
  school: SchoolPortalSchool;
  onChangeSchool: () => void;
}

function TeacherSchoolDashboardContent({ school, onChangeSchool }: TeacherSchoolDashboardProps) {
  const { user } = useAuthStore();
  const { periods, activePeriod, selectedPeriodId, setSelectedPeriodId, isLoading: periodsLoading } = useAcademicWorkspace();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSessionIdForAttendance, setSelectedSessionIdForAttendance] = useState('');

  // Fetch data with custom hooks
  const {
    courses = [],
    students,
    sessions = [],
    groups = [],
    modules = [],
    materials = [],
    resources = [],
    activities,
    submissions,
    announcements,
    tutoring,
    finalGrades,
    pendingAttendanceCount = 0,
    isLoading
  } = useTeacherData(selectedCourseId, activeTab, school.id, selectedPeriodId || undefined);

  const {
    addSession: createSessionMutation,
    addGroup: createGroupMutation,
    addAnnouncement,
    addTutoring,
    updateAttendance
  } = useTeacherMutations(selectedCourseId);

  // Set default course when loaded
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setTimeout(() => setSelectedCourseId(courses[0].id), 0);
    }
  }, [courses, selectedCourseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  const classesToday = sessions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.start_time?.startsWith(today) || s.session_date?.startsWith(today);
  }).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fb] pt-24 text-slate-800 dark:bg-slate-950 dark:text-slate-200 lg:flex-row lg:overflow-hidden">
      
      {/* Collapsed Icon Menu (Sidebar) */}
      <nav className="hide-scrollbar sticky top-20 z-20 flex w-full shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/95 lg:top-24 lg:h-[calc(100vh-6rem)] lg:w-64 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
        {[
          { id: 'overview', label: 'Resumen', icon: LayoutTemplate },
          { id: 'classes', label: 'Mis Clases (Diario)', icon: CheckSquare },
          { id: 'calendar', label: 'Horarios y Agenda', icon: CalendarIcon },
          { id: 'students', label: 'Alumnos y Aulas', icon: Users },
          { id: 'planning', label: 'Planificación', icon: BookOpen },
          { id: 'questions', label: 'Banco de Preguntas', icon: BookOpen },
          { id: 'grades', label: 'Calificaciones', icon: Award },
          { id: 'compliance', label: 'Incumplimientos', icon: AlertTriangle },
          { id: 'comm', label: 'Comunicación', icon: MessageSquare },
          { id: 'integrations', label: 'Integraciones', icon: MonitorPlay }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`relative flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition lg:w-full lg:justify-start lg:gap-3 lg:text-sm ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            <tab.icon className="size-4 shrink-0 lg:size-5" />
            
            <span className="whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="hide-scrollbar mx-auto h-auto w-full max-w-7xl flex-1 overflow-y-visible px-4 pb-16 pt-5 sm:px-6 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:px-8 lg:pt-7">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-indigo-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-indigo-400/15 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><School size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Escuela docente</p><p className="font-bold text-slate-900 dark:text-white">{school.name}</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="teacher-period">Periodo académico</label>
            <select id="teacher-period" value={selectedPeriodId} onChange={(event) => setSelectedPeriodId(event.target.value)} disabled={periodsLoading || periods.length === 0} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              {periods.length === 0 ? <option value="">Sin periodos configurados</option> : periods.map((period) => <option key={period.id} value={period.id}>{period.name}{period.is_active ? ' · Activo' : ''}</option>)}
            </select>
            <button type="button" onClick={onChangeSchool} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Cambiar escuela</button>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6 md:flex-row md:items-end md:justify-between lg:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <BookMarked size={20} />
              </div>
              <h1 className="font-serif text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
                Espacio Docente
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
              Bienvenido, {user?.user_metadata?.first_name || 'Profesor'}. Gestiona tus clases, califica alumnos y estructura tu contenido.{activePeriod ? ` Periodo: ${activePeriod.name}.` : ''}
            </p>
          </div>

          <div className="flex w-full items-end gap-3 md:w-auto md:min-w-[280px]">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Seleccionar Curso</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Seleccione un curso...</option>
                {courses.map((course: { id: string; title: string }) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-2 dark:border-white/10 dark:bg-slate-950">
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!selectedCourseId && activeTab !== 'overview' && activeTab !== 'calendar' ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-xl shadow-gray-200/20 dark:shadow-none">
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">Seleccione un curso</h2>
            <p className="text-sm text-gray-500">Por favor, elija un curso en el menú superior para administrar su contenido.</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <OverviewTab
                studentsCount={students.length}
                coursesCount={courses.length}
                classesToday={classesToday}
                assignmentsToGrade={submissions.filter((s: { grade?: number }) => !s.grade).length}
                recentSubmissions={submissions}
                courses={courses}
                activities={activities}
                pendingAttendanceCount={pendingAttendanceCount}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesTab 
                sessions={sessions} 
                courseId={selectedCourseId} 
                onTakeAttendance={(sessionId) => {
                  setSelectedSessionIdForAttendance(sessionId);
                  setActiveTab('students');
                }}
              />
            )}

            {activeTab === 'calendar' && (
              <UniversityCalendar
                role="teacher"
                userId={user?.id}
                courseId={selectedCourseId || undefined}
                periodId={selectedPeriodId || undefined}
                editable={true}
              />
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <StudentsTab
                  students={students}
                  sessions={sessions}
                  groups={groups}
                  initialSessionId={selectedSessionIdForAttendance}
                  onAddSession={(e: React.FormEvent, title: string, date: string) => {
                    e.preventDefault();
                    createSessionMutation.mutate({ title, date });
                  }}
                  onAddGroup={(e: React.FormEvent, name: string, desc: string) => {
                    e.preventDefault();
                    createGroupMutation.mutate({ name, description: desc });
                  }}
                  onAttendanceChange={(sessionId: string, studentId: string, status: 'present'|'zoom'|'absent'|'late'|'excused') => 
                    updateAttendance.mutate({ sessionId, studentId, status })
                  }
                />
              </div>
            )}

            {activeTab === 'planning' && (
              <PlanningTab
                modules={modules}
                materials={materials}
                activities={activities}
                resources={resources}
                courseId={selectedCourseId}
                schoolType={school.school_type}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionBankTab
                courseId={selectedCourseId}
              />
            )}

            {activeTab === 'grades' && (
              <GradesTab
                students={students}
                submissions={submissions}
                finalGrades={finalGrades}
                courseId={selectedCourseId}
                activities={activities}
              />
            )}

            {activeTab === 'compliance' && (
              <ComplianceTab
                students={students}
                submissions={submissions}
                activities={activities}
              />
            )}

            {activeTab === 'comm' && (
              <div className="space-y-8">
                <CommunicationTab
                  students={students}
                  announcements={announcements}
                  tutoring={tutoring}
                  onAddAnnouncement={(e: React.FormEvent, title: string, content: string) => {
                    e?.preventDefault?.();
                    addAnnouncement.mutate({ title, content });
                  }}
                  onAddTutoring={(e: React.FormEvent, studentId: string, time: string, notes: string) => {
                    e?.preventDefault?.();
                    addTutoring.mutate({ studentId, time, notes });
                  }}
                />
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white mb-4">
                    Foros de Debate
                  </h3>
                  <ForumManager courseId={selectedCourseId} />
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <IntegrationsTab
                selectedCourseId={selectedCourseId}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <SchoolPortalGate mode="teacher">
      {(school, leaveSchool) => <AcademicWorkspaceProvider school={school}><TeacherSchoolDashboardContent school={school} onChangeSchool={leaveSchool} /></AcademicWorkspaceProvider>}
    </SchoolPortalGate>
  );
}
