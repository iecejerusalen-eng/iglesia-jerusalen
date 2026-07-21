import { useState, useEffect } from 'react';
import { Users, Mail, User, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';

interface CourseClassmatesTabProps {
  courseId: string;
}

interface Classmate {
  id: string;
  name: string;
  role: string;
  ministry: string;
  avatar: string | null;
}

export function CourseClassmatesTab({ courseId }: CourseClassmatesTabProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClassmates() {
    setLoading(true);
    try {
      // Usamos el join pre-configurado en lms_enrollments si existe, o hacemos una consulta de dos pasos si no.
      // Primero, obtenemos los enrollments.
      const { data: enrollments, error } = await supabase
        .from('lms_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('role', 'student');

      if (error) throw error;

      if (enrollments && enrollments.length > 0) {
        const userIds = enrollments.map(e => e.user_id);
        
        // Segundo, obtenemos los perfiles (asumiendo que las políticas RLS permiten leer perfiles básicos)
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url, role')
          .in('id', userIds);
          
        if (profError) throw profError;
        
        const mappedClassmates = enrollments.map(enrollment => {
          const profile = profiles?.find(p => p.id === enrollment.user_id);
          return {
            id: enrollment.user_id,
            name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario Sin Nombre' : 'Usuario Desconocido',
            role: enrollment.role === 'student' ? 'Estudiante' : enrollment.role,
            ministry: '', // Esto requeriría hacer un join con ministries si lo deseamos en el futuro
            avatar: profile?.photo_url || null
          };
        });
        
        setClassmates(mappedClassmates);
      } else {
        setClassmates([]);
      }
    } catch (err) {
      console.error('Error fetching classmates:', err);
    } finally {
      setLoading(false);
    }
  }
  
  fetchClassmates();
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10 min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Compañeros de Clase</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Conoce y conecta con otros estudiantes de este curso.</p>
          </div>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{classmates.length} Estudiantes inscritos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classmates.map(student => (
          <div key={student.id} className="bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow group">
            <div className="relative mb-4">
              {student.avatar ? (
                <img 
                  src={student.avatar} 
                  alt={student.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-gray-400">
                  <User size={32} />
                </div>
              )}
              {student.role !== 'Estudiante' && (
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {student.role}
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{student.name}</h3>
            {student.ministry && (
              <p className="text-xs text-gray-500 mt-1 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {student.ministry}
              </p>
            )}
            
            <div className="mt-6 w-full flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex-1 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 hover:border-sky-500 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1">
                <User size={14} /> Perfil
              </button>
              <button className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                <Mail size={14} /> Mensaje
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
