import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Edit2, Check, X, FileText } from 'lucide-react';
import type { MinistryMeetingNote } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePermissions } from '../../../hooks/usePermissions';
import BlockEditor from '../BlockEditor';

export default function MeetingNotes({ ministryId }: { ministryId: string }) {
  const [notes, setNotes] = useState<MinistryMeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for creating/editing a note
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteContent, setNoteContent] = useState<string>('');

  const { user } = useAuthStore();
  const { canEditMinistry } = usePermissions();
  const canEdit = canEditMinistry(ministryId);

  useEffect(() => {
    fetchNotes();
  }, [ministryId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministry_meeting_notes')
        .select(`
          *
        `)
        .eq('ministry_id', ministryId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notesData = data || [];
      
      // Manually fetch profiles since foreign key might not be setup
      if (notesData.length > 0) {
        const userIds = [...new Set(notesData.map(n => n.created_by).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);
            
          if (profilesData) {
            notesData.forEach(note => {
              const profile = profilesData.find(p => p.id === note.created_by);
              if (profile) {
                note.profiles = profile;
              }
            });
          }
        }
      }
      
      setNotes(notesData);
    } catch (err) {
      console.error('Error fetching meeting notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingNoteId(null);
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNoteContent('');
  };

  const handleEdit = (note: MinistryMeetingNote) => {
    setIsEditing(true);
    setEditingNoteId(note.id);
    setNoteDate(note.date);
    setNoteContent(note.content || '');
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!confirm('¿Seguro que deseas eliminar esta acta?')) return;
    try {
      const { error } = await supabase
        .from('ministry_meeting_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Error al eliminar acta.');
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      const contentStr = noteContent;
      
      if (editingNoteId) {
        const { error } = await supabase
          .from('ministry_meeting_notes')
          .update({
            date: noteDate,
            content: contentStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNoteId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ministry_meeting_notes')
          .insert({
            ministry_id: ministryId,
            date: noteDate,
            content: contentStr,
            created_by: user?.id
          });
        if (error) throw error;
      }
      
      setIsEditing(false);
      fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Error al guardar acta.');
    }
  };

  if (loading && notes.length === 0) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (isEditing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-primary" />
            {editingNoteId ? 'Editar Acta' : 'Nueva Acta de Reunión'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-900 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check size={16} /> Guardar Acta
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de la Reunión</label>
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contenido (Acuerdos, Asistencia, Temas Tratados)</label>
            <div className="border border-gray-200 rounded-xl bg-gray-50/30 p-4">
              <BlockEditor content={noteContent} onChange={setNoteContent} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Actas de Reuniones</h3>
          <p className="text-sm text-gray-500">Registra los acuerdos y notas de cada reunión de este ministerio.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleCreateNew}
            className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Nueva Acta
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-500 mb-1">Sin actas registradas</h4>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Aún no hay notas o actas para este departamento. Crea la primera para mantener un registro de sus actividades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CalendarIcon size={18} />
                  {new Date(note.date + 'T12:00:00').toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
                {canEdit && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600 line-clamp-4 prose prose-sm max-w-none">
                {/* Parse the blocks to show some text preview */}
                {(() => {
                  try {
                    const blocks = JSON.parse(note.content || '[]');
                    if (Array.isArray(blocks)) {
                      return blocks.map(b => b.content).join(' ').replace(/<[^>]+>/g, '') || 'Sin contenido de texto.';
                    }
                    return note.content;
                  } catch {
                    return note.content;
                  }
                })()}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Registrado por:</span>
                <span className="font-medium text-gray-600">
                  {note.profiles ? `${note.profiles.first_name} ${note.profiles.last_name}` : 'Usuario anónimo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
