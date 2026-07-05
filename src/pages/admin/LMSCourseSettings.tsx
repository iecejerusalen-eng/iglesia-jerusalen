import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

export default function LMSCourseSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [course, setCourse] = useState<any>({
    title: '',
    description: '',
    format: 'weekly',
    grading_scale: '10/10',
    is_published: false,
    cover_image_url: '',
    category_id: '',
    term_id: '',
    capacity: 0,
    start_date: '',
    duration: '',
    schedule: ''
  });

  useEffect(() => {
    fetchMetadata();
    if (!isNew && id) {
      fetchCourse(id);
    }
  }, [id]);

  const fetchMetadata = async () => {
    try {
      const { data: catData } = await supabase.from('lms_categories').select('id, name');
      if (catData) setCategories(catData);
      
      const { data: termData } = await supabase.from('lms_terms').select('id, name');
      if (termData) setTerms(termData);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const fetchCourse = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('lms_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      if (data) {
        setCourse({
          ...data,
          start_date: data.start_date ? data.start_date.substring(0, 10) : ''
        });
      }
    } catch (error) {
      toast.error('Error al cargar el curso');
      navigate('/lms/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course.title) {
      toast.error('El título es requerido');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        title: course.title,
        description: course.description,
        format: course.format,
        grading_scale: course.grading_scale,
        is_published: course.is_published,
        cover_image_url: course.cover_image_url,
        category_id: course.category_id || null,
        term_id: course.term_id || null,
        capacity: course.capacity || 0,
        start_date: course.start_date || null,
        duration: course.duration || null,
        schedule: course.schedule || null,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { data, error } = await supabase.from('lms_courses').insert(payload).select().single();
        if (error) throw error;
        toast.success('Curso creado exitosamente');
        navigate(`/admin/lms/course/${data.id}`); // Navigate to curriculum builder
      } else {
        const { error } = await supabase.from('lms_courses').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Curso actualizado exitosamente');
        navigate(-1);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el curso');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-surface text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pt-24 pb-12">
      <AnimeFadeUp>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Volver al Administrador</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="text-gold" size={32} />
              {isNew ? 'Crear Nuevo Curso' : 'Configuración del Curso'}
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1">
              Establece las propiedades principales, fechas y detalles públicos del curso.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 dark:bg-slate-800 dark:border-white/10 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold hover:bg-yellow-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Curso'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Basics Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-gray-100 dark:border-white/10 pb-2">Información Principal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Título del Curso *</label>
                  <input
                    type="text"
                    required
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-shadow text-lg font-medium"
                    placeholder="Ej. Escuela Dominical: El Libro de Juan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Descripción</label>
                  <textarea
                    rows={4}
                    value={course.description}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-shadow"
                    placeholder="Describe brevemente de qué trata este curso..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Categoría</label>
                  <select
                    value={course.category_id}
                    onChange={(e) => setCourse({ ...course, category_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="">Sin Categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Periodo Académico (Semestre)</label>
                  <select
                    value={course.term_id}
                    onChange={(e) => setCourse({ ...course, term_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="">Sin Periodo</option>
                    {terms.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xl font-bold border-b border-gray-100 dark:border-white/10 pb-2">Media y Visibilidad</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">URL Imagen de Portada</label>
                    <input
                      type="text"
                      value={course.cover_image_url}
                      onChange={(e) => setCourse({ ...course, cover_image_url: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-white/5 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={course.is_published}
                        onChange={(e) => setCourse({ ...course, is_published: e.target.checked })}
                        className="w-5 h-5 text-gold bg-white border-gray-300 rounded focus:ring-gold"
                      />
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-white">Publicar Curso</span>
                        <span className="text-sm text-gray-500">Hazlo visible para que los alumnos puedan inscribirse.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center relative">
                  {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Vista previa de portada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Config Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xl font-bold border-b border-gray-100 dark:border-white/10 pb-2">Logística del Curso</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Formato Estructural</label>
                  <select
                    value={course.format}
                    onChange={(e) => setCourse({ ...course, format: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="weekly">Semanal (Por Fechas)</option>
                    <option value="topics">Por Temas (Unidades)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={course.start_date}
                    onChange={(e) => setCourse({ ...course, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Duración</label>
                  <input
                    type="text"
                    value={course.duration}
                    onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Ej. 8 Semanas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Cupo Máximo</label>
                  <input
                    type="number"
                    value={course.capacity}
                    onChange={(e) => setCourse({ ...course, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Deja 0 para ilimitado</span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </AnimeFadeUp>
    </div>
  );
}
