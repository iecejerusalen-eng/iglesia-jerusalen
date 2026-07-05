import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { LMSSchool } from '../../../types';
import { School } from 'lucide-react';

interface SchoolSelectorProps {
  value: string;
  onChange: (schoolId: string) => void;
  className?: string;
}

export function SchoolSelector({ value, onChange, className = '' }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<LMSSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_schools')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
      if (error) throw error;
      setSchools(data as LMSSchool[]);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-10 w-48 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>;
  }

  if (schools.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
        <School size={16} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-64 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
      >
        <option value="all">Todas las Escuelas</option>
        {schools.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
