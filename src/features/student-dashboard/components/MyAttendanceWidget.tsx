import { useState, useEffect } from 'react';
import { UserCheck, Calendar, MapPin, CheckCircle, XCircle, AlertCircle, Loader2, Video } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  session_type: 'in_person' | 'zoom' | 'other';
  notes: string | null;
  lms_courses?: {
    title: string;
  };
}

export function MyAttendanceWidget() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  });

  useEffect(() => {
    async function fetchAttendance() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('lms_attendance')
          .select(`
            *,
            lms_courses(title)
          `)
          .eq('student_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        
        const fetchedRecords = (data as any) || [];
        setRecords(fetchedRecords);

        // Calculate summary
        const sum = fetchedRecords.reduce((acc: any, curr: AttendanceRecord) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          acc.total += 1;
          return acc;
        }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });

        setSummary(sum);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  const attendancePercentage = summary.total > 0 
    ? Math.round(((summary.present + summary.late + summary.excused) / summary.total) * 100) 
    : 100;

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{summary.present}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Presente</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-2">
            <XCircle size={24} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{summary.absent}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Faltas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="inline-flex p-3 rounded-full bg-orange-50 text-orange-600 mb-2">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{summary.late}</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Atrasos</p>
        </div>

        <div className="bg-gradient-to-br from-gold to-yellow-600 p-6 rounded-3xl border border-gold/20 shadow-lg text-center text-white flex flex-col justify-center">
          <h3 className="text-4xl font-black">{attendancePercentage}%</h3>
          <p className="text-sm font-bold uppercase tracking-wider opacity-90 mt-1">Asistencia Global</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Registro Detallado</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Historial de asistencia por clase y fecha.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay registros de asistencia todavía.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Curso</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Modalidad</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                      {record.lms_courses?.title || 'Curso General'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {record.session_type === 'zoom' ? <Video size={12} className="text-blue-500" /> : <MapPin size={12} className="text-emerald-500" />}
                        {record.session_type === 'zoom' ? 'Zoom' : record.session_type === 'in_person' ? 'Presencial' : 'Otro'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                        record.status === 'absent' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' :
                        record.status === 'late' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
                      }`}>
                        {record.status === 'present' ? 'Presente' : 
                         record.status === 'absent' ? 'Falta' : 
                         record.status === 'late' ? 'Atraso' : 'Justificado'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 italic">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AnimeFadeUp>
  );
}
