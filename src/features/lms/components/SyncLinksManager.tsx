import { useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { Video, Clock, ExternalLink } from "lucide-react";

interface SyncLinksManagerProps {
  courseId: string;
}

export function SyncLinksManager({ courseId }: SyncLinksManagerProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, [courseId]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("lms_teacher_schedules")
        .select("*")
        .eq("course_id", courseId);

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || schedules.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
          <Video className="text-indigo-600 dark:text-indigo-400" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">
            Clases Sincrónicas (En Vivo)
          </h3>
          <p className="text-xs text-gray-500">
            Horarios y enlaces para conectarte con tu docente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-150 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 uppercase">
                <Clock size={12} /> {sch.day_of_week}
              </span>
              <p className="font-bold text-sm text-slate-800 dark:text-gray-100">
                {sch.start_time} - {sch.end_time}
              </p>
              <p className="text-xs text-gray-500">{sch.shift_name}</p>
            </div>

            {sch.meet_link ? (
              <a
                href={sch.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all shrink-0"
              >
                Unirse a la sala <ExternalLink size={16} />
              </a>
            ) : (
              <span className="text-xs text-gray-400 italic px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl">
                Enlace pendiente
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
