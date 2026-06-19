import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Petition, PetitionCategory } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  Search, 
  Filter, 
  Trash2, 
  Plus, 
  Clock, 
  Flame, 
  CheckCircle, 
  ChevronRight, 
  HeartHandshake, 
  Save, 
  X,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';

const PetitionsManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { hasPermission, isReadOnly } = usePermissions();
  const readOnly = isReadOnly('petitions');

  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [categories, setCategories] = useState<PetitionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Categories CRUD state
  const [activeTab, setActiveTab] = useState<'petitions' | 'categories'>('petitions');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PetitionCategory | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [categoryDeletingId, setCategoryDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPetitions(), fetchCategories()]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          profiles(first_name, last_name, email),
          petition_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPetitions(data || []);
    } catch (err: any) {
      console.error('Error fetching petitions:', err);
      toast.error('Error al cargar peticiones');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('petition_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      toast.error('Error al cargar las categorías');
    }
  };

  const handleStatusChange = async (petitionId: string, newStatus: 'pendiente' | 'en_oracion' | 'respondida') => {
    if (readOnly) {
      toast.error('No tienes permisos para modificar peticiones');
      return;
    }

    try {
      const { error } = await supabase
        .from('petitions')
        .update({ status: newStatus })
        .eq('id', petitionId);

      if (error) throw error;

      setPetitions(prev =>
        prev.map(p => p.id === petitionId ? { ...p, status: newStatus } : p)
      );

      toast.success(`Petición marcada como: ${
        newStatus === 'pendiente' ? 'Recibido' : newStatus === 'en_oracion' ? 'En Oración' : 'Respondido'
      }`);
    } catch (err: any) {
      console.error('Error changing status:', err);
      toast.error('Error al cambiar el estado: ' + err.message);
    }
  };

  const handleDeletePetition = async (petitionId: string) => {
    if (!hasPermission('petitions', 'edit')) {
      toast.error('No tienes permisos para eliminar peticiones');
      return;
    }

    const confirmed = await confirm({
      title: 'Eliminar petición',
      message: '¿Estás seguro de que deseas eliminar esta petición de oración permanentemente?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('petitions')
        .delete()
        .eq('id', petitionId);

      if (error) throw error;

      setPetitions(prev => prev.filter(p => p.id !== petitionId));
      toast.success('Petición de oración eliminada');
    } catch (err: any) {
      console.error('Error deleting petition:', err);
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  // CATEGORIES CRUD FUNCTIONS
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      toast.error('No tienes permisos para crear categorías');
      return;
    }
    if (!newCategoryName.trim()) return;

    setAddingCategory(true);
    try {
      const { data, error } = await supabase
        .from('petition_categories')
        .insert({ name: newCategoryName.trim() })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      toast.success('Categoría agregada con éxito');
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error('Error al agregar categoría: ' + err.message);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (cat: PetitionCategory) => {
    if (readOnly) {
      toast.error('No tienes permisos para editar categorías');
      return;
    }
    if (!editedCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('petition_categories')
        .update({ name: editedCategoryName.trim() })
        .eq('id', cat.id);

      if (error) throw error;

      setCategories(prev =>
        prev.map(c => c.id === cat.id ? { ...c, name: editedCategoryName.trim() } : c)
      );
      setEditingCategory(null);
      toast.success('Categoría actualizada con éxito');
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!hasPermission('petitions', 'edit')) {
      toast.error('No tienes permisos para eliminar categorías');
      return;
    }

    try {
      const { error } = await supabase
        .from('petition_categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== catId));
      setCategoryDeletingId(null);
      toast.success('Categoría eliminada con éxito');
      fetchPetitions(); // Reload petitions in case category was cascade deleted
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error('Error al eliminar la categoría: ' + err.message);
    }
  };

  // FILTERING LOGIC
  const filteredPetitions = petitions.filter(pet => {
    const userName = `${pet.profiles?.first_name || ''} ${pet.profiles?.last_name || ''}`.toLowerCase();
    const userEmail = pet.profiles?.email ? pet.profiles.email.toLowerCase() : '';
    const content = pet.content.toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || 
                          userEmail.includes(searchTerm.toLowerCase()) || 
                          content.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pet.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || pet.category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: 'pendiente' | 'en_oracion' | 'respondida') => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            <Clock size={12} />
            Recibido
          </span>
        );
      case 'en_oracion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Flame size={12} className="text-amber-500" />
            En Oración
          </span>
        );
      case 'respondida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={12} className="text-emerald-500" />
            Respondido
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <HeartHandshake className="text-gold" />
            Gestión de Peticiones de Oración
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Administra los motivos de oración de la congregación y organiza las categorías de intercesión.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('petitions')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'petitions'
              ? 'border-gold text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Peticiones ({filteredPetitions.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'border-gold text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Categorías ({categories.length})
        </button>
      </div>

      {activeTab === 'petitions' ? (
        <>
          {/* Controls Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
            {/* Search Input */}
            <div className="md:col-span-5 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
              <label htmlFor="search_petitions" className="sr-only">Buscar peticiones</label>
              <Search className="text-gray-400" size={18} />
              <input
                id="search_petitions"
                type="text"
                placeholder="Buscar por hermano, correo o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-transparent focus:outline-none text-gray-700"
              />
            </div>

            {/* Filter Status */}
            <div className="md:col-span-3 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
              <label htmlFor="filter_status" className="sr-only">Filtrar por estado</label>
              <Filter className="text-gray-400" size={16} />
              <select
                id="filter_status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent focus:outline-none text-gray-600 cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Recibido</option>
                <option value="en_oracion">En Oración</option>
                <option value="respondida">Respondido</option>
              </select>
            </div>

            {/* Filter Category */}
            <div className="md:col-span-4 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
              <label htmlFor="filter_category" className="sr-only">Filtrar por categoría</label>
              <Filter className="text-gray-400" size={16} />
              <select
                id="filter_category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent focus:outline-none text-gray-600 cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Petitions */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-150 animate-pulse space-y-4 shadow-xs">
                  <div className="flex justify-between">
                    <div className="h-5 w-48 bg-gray-100 rounded"></div>
                    <div className="h-5 w-24 bg-gray-100 rounded"></div>
                  </div>
                  <div className="h-4 w-full bg-gray-50 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-50 rounded"></div>
                  <div className="h-6 w-32 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredPetitions.length === 0 ? (
            <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3 shadow-xs">
              <HeartHandshake size={48} className="text-gray-300 animate-pulse" />
              <p className="text-sm font-semibold">No se encontraron peticiones de oración.</p>
              <p className="text-xs text-gray-400">Prueba cambiando los términos de búsqueda o filtros.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPetitions.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 hover:shadow-md transition-all duration-200 flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    {/* User and Category info */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {pet.profiles?.first_name || pet.profiles?.last_name
                            ? `${pet.profiles?.first_name || ''} ${pet.profiles?.last_name || ''}`.trim()
                            : 'Anónimo / Sin nombre'}
                        </h3>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-mono text-gray-400">
                          {pet.profiles?.email || 'Sin correo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {pet.petition_categories?.name || 'Necesidades varias'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(pet.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Badge */}
                    <div>{getStatusBadge(pet.status)}</div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-750 text-sm whitespace-pre-line leading-relaxed font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    {pet.content}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-semibold mr-1">Marcar como:</span>
                      
                      {/* Enviar a pendiente */}
                      <button
                        onClick={() => handleStatusChange(pet.id, 'pendiente')}
                        disabled={readOnly || pet.status === 'pendiente'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                          pet.status === 'pendiente'
                            ? 'bg-gray-100 text-gray-800 border-gray-300 font-extrabold'
                            : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <Clock size={12} />
                        Recibido
                      </button>

                      {/* Enviar a oración */}
                      <button
                        onClick={() => handleStatusChange(pet.id, 'en_oracion')}
                        disabled={readOnly || pet.status === 'en_oracion'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                          pet.status === 'en_oracion'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold'
                            : 'bg-white hover:bg-amber-50 text-amber-600 border-gray-200'
                        }`}
                      >
                        <Flame size={12} className={pet.status === 'en_oracion' ? 'text-amber-500' : 'text-gray-400'} />
                        En Oración
                      </button>

                      {/* Enviar a respondido */}
                      <button
                        onClick={() => handleStatusChange(pet.id, 'respondida')}
                        disabled={readOnly || pet.status === 'respondida'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                          pet.status === 'respondida'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                            : 'bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200'
                        }`}
                      >
                        <CheckCircle size={12} className={pet.status === 'respondida' ? 'text-emerald-500' : 'text-gray-400'} />
                        Respondido
                      </button>
                    </div>

                    {!readOnly && (
                      <button
                        onClick={() => handleDeletePetition(pet.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        title="Eliminar petición"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* CATEGORIES CRUD TAB */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Add Category Form */}
          <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-serif font-bold text-primary flex items-center gap-2">
                <Plus size={18} className="text-gold" />
                Nueva Categoría
              </h2>
              <p className="text-xs text-gray-400 mt-1">Crea nuevas clasificaciones para agrupar las peticiones.</p>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label htmlFor="new_category_name" className="sr-only">Nombre de nueva categoría</label>
                <input
                  id="new_category_name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Finanzas, Salud Mental, etc."
                  disabled={readOnly || addingCategory}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs text-gray-700"
                />
              </div>
              <button
                type="submit"
                disabled={readOnly || addingCategory || !newCategoryName.trim()}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-55"
              >
                {addingCategory ? 'Creando...' : 'Crear Categoría'}
              </button>
            </form>
          </div>

          {/* List of Categories */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-serif font-bold text-primary">Categorías Existentes ({categories.length})</h2>
            </div>
            
            <ul className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  {editingCategory?.id === cat.id ? (
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <label htmlFor={`edit_category_${cat.id}`} className="sr-only">Editar nombre de categoría</label>
                      <input
                        id={`edit_category_${cat.id}`}
                        type="text"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Guardar"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="text-gold" size={14} />
                        <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditedCategoryName(cat.name);
                            }}
                            className="text-xs font-semibold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
                          >
                            Editar
                          </button>
                        )}

                        {!readOnly && (
                          categoryDeletingId === cat.id ? (
                            <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-200">
                              <span className="text-[10px] font-bold text-red-700 px-1 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                ¿Seguro?
                              </span>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setCategoryDeletingId(null)}
                                className="text-[10px] text-gray-500 hover:underline px-1 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCategoryDeletingId(cat.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                              title="Eliminar categoría"
                            >
                              <Trash2 size={15} />
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetitionsManager;
