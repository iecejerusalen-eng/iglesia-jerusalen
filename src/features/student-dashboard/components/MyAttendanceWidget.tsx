import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Loader2, MapPin, UserCheck, Video, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'zoom';

interface AttendanceCourse {
  title: string;
}

interface AttendanceSession {
  title: string;
  session_date: string;
  location: string | null;
  sync_link: string | null;
  lms_courses?: AttendanceCourse | AttendanceCourse[] | null;
}

interface AttendanceRow {
  id: string;
  status: AttendanceStatus;
  notes: string | null;
  lms_class_sessions?: AttendanceSession | AttendanceSession[] | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  sessionTitle: string;
  courseTitle: string;
  location: string | null;
  online: boolean;
  status: AttendanceStatus;
  notes: string | null;
}

interface MyAttendanceWidgetProps {
  schoolId: string;
}

const EMPTY_SUMMARY = { present: 0, absent: 0, late: 0, excused: 0, zoom: 0, total: 0 };

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export function MyAttendanceWidget({ schoolId }: MyAttendanceWidgetProps) {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    let cancelled = false;

    async function fetchAttendance() {
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lms_attendance')
          .select(`
            id,
            status,
            notes,
            lms_class_sessions!inner (
              title,
              session_date,
              location,
              sync_link,
              lms_courses!inner (title, school_id)
            )
          `)
          .eq('student_id', user.id)
          .eq('lms_class_sessions.lms_courses.school_id', schoolId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const normalized = ((data || []) as AttendanceRow[]).flatMap((row) => {
          const session = firstOf(row.lms_class_sessions);
          if (!session) return [];
          const course = firstOf(session.lms_courses);
          return [{
            id: row.id,
            date: session.session_date,
            sessionTitle: session.title,
            courseTitle: course?.title || 'Clase',
            location: session.location,
            online: Boolean(session.sync_link) || row.status === 'zoom',
            status: row.status,
            notes: row.notes,
          } satisfies AttendanceRecord];
        });

        const totals = normalized.reduce((acc, record) => {
          acc[record.status] += 1;
          acc.total += 1;
          return acc;
        }, { ...EMPTY_SUMMARY });

        if (!cancelled) {
          setRecords(normalized);
          setSummary(totals);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        if (!cancelled) toast.error('No se pudo cargar tu asistencia');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAttendance();
    return () => { cancelled = true; };
  }, [schoolId, user]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gold" size={40} /></div>;
  }

  const attendancePercentage = summary.total > 0
    ? Math.round(((summary.present + summary.zoom + summary.late + summary.excused) / summary.total) * 100)
    : 100;

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        {[
          { label: 'Presente', value: summary.present + summary.zoom, icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Faltas', value: summary.absent, icon: XCircle, tone: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
          { label: 'Atrasos', value: summary.late, icon: AlertCircle, tone: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white/85 p-4 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
            <span className={`mb-2 inline-flex rounded-full p-3 ${tone}`}><Icon size={24} /></span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-sm">{label}</p>
          </div>
        ))}
        <div className="col-span-2 flex flex-col justify-center rounded-3xl border border-gold/20 bg-gradient-to-br from-gold to-yellow-600 p-5 text-center text-white shadow-lg lg:col-span-1">
          <h3 className="text-4xl font-black">{attendancePercentage}%</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider opacity-90 sm:text-sm">Asistencia de la escuela</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10 sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"><UserCheck size={24} /></span>
          <div><h2 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">Registro detallado</h2><p className="text-sm text-gray-500">Historial real por clase y fecha.</p></div>
        </div>

        {records.length === 0 ? (
          <div className="py-14 text-center text-gray-500">No hay registros de asistencia en esta escuela.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {records.map((record) => (
              <article key={record.id} className="grid gap-3 p-4 transition hover:bg-slate-50/70 dark:hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 dark:text-white">{record.sessionTitle}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={13} />{new Date(`${record.date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} · {record.courseTitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  {record.online ? <Video size={14} className="text-blue-500" /> : <MapPin size={14} className="text-emerald-500" />}
                  <span className="truncate">{record.online ? 'En línea' : record.location || 'Presencial'}</span>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                  record.status === 'absent' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' :
                  record.status === 'late' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' :
                  record.status === 'excused' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                }`}>{record.status === 'zoom' ? 'En línea' : record.status === 'present' ? 'Presente' : record.status === 'absent' ? 'Falta' : record.status === 'late' ? 'Atraso' : 'Justificado'}</span>
                {record.notes && <p className="text-sm italic text-slate-500 sm:col-span-3">{record.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </AnimeFadeUp>
  );
}
