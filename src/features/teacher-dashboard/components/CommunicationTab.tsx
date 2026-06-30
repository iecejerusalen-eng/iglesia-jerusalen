import React, { useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';

interface CommunicationTabProps {
  students: any[];
  announcements: any[];
  tutoring: any[];
  onAddAnnouncement: (e: React.FormEvent, title: string, content: string) => void;
  onAddTutoring: (e: React.FormEvent, studentId: string, time: string, notes: string) => void;
}

export function CommunicationTab({
  students,
  announcements,
  tutoring,
  onAddAnnouncement,
  onAddTutoring
}: CommunicationTabProps) {
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newTutoring, setNewTutoring] = useState({ studentId: '', time: '', notes: '' });

  const handleAddAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    onAddAnnouncement(e, newAnnouncement.title, newAnnouncement.content);
    setNewAnnouncement({ title: '', content: '' });
  };

  const handleAddTutoringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTutoring.studentId || !newTutoring.time) return;
    onAddTutoring(e, newTutoring.studentId, newTutoring.time, newTutoring.notes);
    setNewTutoring({ studentId: '', time: '', notes: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-gold" />
          Tablón de Anuncios de la Clase
        </h3>

        <form onSubmit={handleAddAnnouncementSubmit} className="p-4 bg-gray-55 dark:bg-slate-950/20 border border-gray-200 dark:border-white/5 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Publicar aviso circular</h4>
          <input
            type="text"
            required
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            placeholder="Título del Anuncio..."
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
          />
          <textarea
            required
            rows={3}
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            placeholder="Contenido o aviso importante para el grupo..."
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
          />
          <div className="flex justify-end">
            <button type="submit" className="bg-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-yellow-600 transition-all cursor-pointer">
              Publicar Anuncio
            </button>
          </div>
        </form>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-2">
          {announcements.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay anuncios publicados.</p>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-left space-y-1">
                <h4 className="font-bold text-xs text-slate-850 dark:text-white">{ann.title}</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">{ann.content}</p>
                <span className="text-[9px] text-gray-450 block">{new Date(ann.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-gold" />
          Reservas de Tutorías y Consejería Individual
        </h3>

        <form onSubmit={handleAddTutoringSubmit} className="p-4 bg-gray-55 dark:bg-slate-950/20 border border-gray-200 dark:border-white/5 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Programar mentoría</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-450 font-bold mb-1">Alumno</label>
              <select
                required
                value={newTutoring.studentId}
                onChange={e => setNewTutoring({ ...newTutoring, studentId: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
              >
                <option value="">Selecciona...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-455 font-bold mb-1">Horario</label>
              <input
                type="datetime-local"
                required
                value={newTutoring.time}
                onChange={e => setNewTutoring({ ...newTutoring, time: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
              />
            </div>
          </div>

          <input
            type="text"
            value={newTutoring.notes}
            onChange={e => setNewTutoring({ ...newTutoring, notes: e.target.value })}
            placeholder="Notas / Tema de tutoría (Consejo espiritual)..."
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
          />

          <div className="flex justify-end">
            <button type="submit" className="bg-gold text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-yellow-600 transition-all cursor-pointer">
              Programar Tutoría
            </button>
          </div>
        </form>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-2">
          {tutoring.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay mentorías o tutorías programadas.</p>
          ) : (
            tutoring.map(tut => (
              <div key={tut.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between text-left">
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-white">Alumno: {tut.profiles ? `${tut.profiles.first_name} ${tut.profiles.last_name}` : 'Estudiante'}</p>
                  <p className="text-[10px] text-gray-500">Notas: {tut.notes || 'Ninguna'}</p>
                  <p className="text-[9px] text-gold font-bold">{new Date(tut.scheduled_at).toLocaleString()}</p>
                </div>
                <span className="text-[9px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-extrabold uppercase">{tut.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
