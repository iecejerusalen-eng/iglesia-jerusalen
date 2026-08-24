import { useState } from 'react';
import { Bell, Inbox, MessageSquare, Send, History } from 'lucide-react';
import ContactInbox from './ContactInbox';
import NotificationsManager from './NotificationsManager';

type CommunicationView = 'inbox' | 'notifications';

/** Punto único para atender entradas y comunicaciones salientes sin perder las rutas antiguas. */
const CommunicationCenter = () => {
  const [view, setView] = useState<CommunicationView>('inbox');

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-6 text-white shadow-xl dark:border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
              <MessageSquare size={13} /> Centro de comunicaciones
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">Una sola bandeja para escuchar y responder</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Organiza mensajes recibidos, avisos, automatizaciones y el historial de envíos desde el mismo espacio.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Inbox className="mb-2 text-blue-300" size={17} />Entrada</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Send className="mb-2 text-amber-300" size={17} />Salidas</div>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm dark:border-white/10 dark:bg-slate-900/70" aria-label="Secciones de comunicaciones">
        <button type="button" onClick={() => setView('inbox')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'inbox' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
          <Inbox size={16} /> Bandeja de contacto
        </button>
        <button type="button" onClick={() => setView('notifications')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'notifications' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
          <Bell size={16} /> Notificaciones y envíos
        </button>
        <span className="ml-auto hidden items-center gap-1.5 px-3 text-xs font-semibold text-slate-400 md:flex"><History size={14} /> Historial disponible dentro de Notificaciones</span>
      </nav>

      <div role="tabpanel" aria-label={view === 'inbox' ? 'Bandeja de contacto' : 'Notificaciones y envíos'}>
        {view === 'inbox' ? <ContactInbox /> : <NotificationsManager />}
      </div>
    </div>
  );
};

export default CommunicationCenter;
