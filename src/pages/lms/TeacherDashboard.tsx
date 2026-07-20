/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, MessageSquare, Award, BookMarked, MonitorPlay, LayoutTemplate, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
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
import { UniversityCalendar } from '../../features/lms/components/UniversityCalendar';
import { GroupManager } from '../../features/lms/components/GroupManager';
import { NotificationCenter } from '../../features/lms/components/NotificationCenter';
import { ForumManager } from '../../features/lms/components/ForumManager';

export default function TeacherDashboard() {
  const { user, roles, role: primaryRole } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Protect route
  useEffect(() => {
    const userRoles = roles || (primaryRole ? [primaryRole] : []);
    const isTeacher = userRoles.some(r => ['admin', 'pastor', 'leader', 'editor', 'teacher', 'maestro', 'docente'].includes(r));
    if (!isTeacher) {
      navigate('/dashboard');
    }
  }, [roles, primaryRole, navigate]);

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
    isLoading
  } = useTeacherData(selectedCourseId, activeTab);

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

  const classesToday = sessions.filter((s: any) => {
    const today = new Date().toISOString().split('T')[0];
    return s.start_time?.startsWith(today) || s.session_date?.startsWith(today);
  }).length;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center text-gold">
                <BookMarked size={20} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
                Espacio Docente
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
              Bienvenido, {user?.user_metadata?.first_name || 'Profesor'}. Gestiona tus clases, califica alumnos y estructura tu contenido.
            </p>
          </div>

          <div className="flex items-end gap-4 min-w-[250px]">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Seleccionar Curso</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-gold shadow-sm"
              >
                <option value="">Seleccione un curso...</option>
                {courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl h-[42px] px-2 flex items-center shadow-sm">
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-gray-150 dark:border-white/5 shadow-sm">
          {[
            { id: 'overview', label: 'Resumen', icon: LayoutTemplate },
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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold text-white shadow-md shadow-gold/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
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
                assignmentsToGrade={submissions.filter((s: any) => !s.grade).length}
                recentSubmissions={submissions}
              />
            )}

            {activeTab === 'calendar' && (
              <UniversityCalendar
                role="teacher"
                userId={user?.id}
                courseId={selectedCourseId || undefined}
                editable={true}
              />
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <GroupManager courseId={selectedCourseId} />
                <hr className="border-gray-200 dark:border-white/10" />
                <StudentsTab
                  students={students}
                  sessions={sessions}
                  groups={groups}
                  onAddSession={(e: any, title: string, date: string) => {
                    e.preventDefault();
                    createSessionMutation.mutate({ title, date });
                  }}
                  onAddGroup={(e: any, name: string, desc: string) => {
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
              />
            )}

            {activeTab === 'questions' && (
              <QuestionBankTab
                courseId={selectedCourseId}
                courses={courses}
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
                courseId={selectedCourseId}
              />
            )}

            {activeTab === 'comm' && (
              <div className="space-y-8">
                <CommunicationTab
                  students={students}
                  announcements={announcements}
                  tutoring={tutoring}
                  onAddAnnouncement={(e: any, title: any, content: any) => {
                    e?.preventDefault?.();
                    addAnnouncement.mutate({ title, content });
                  }}
                  onAddTutoring={(data: any) => addTutoring.mutate(data)}
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
