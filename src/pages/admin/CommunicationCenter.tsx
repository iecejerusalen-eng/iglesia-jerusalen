import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Inbox, MessageSquare, Megaphone, Send, Sparkles, Mail, Radio } from 'lucide-react';
import ContactInbox from './ContactInbox';
import NotificationsManager from './NotificationsManager';
import ChatManager from './ChatManager';
import CampaignsManager from './CampaignsManager';
import ChurchAnnouncementsManager from './ChurchAnnouncementsManager';

type CommunicationView = 'inbox' | 'notifications' | 'chat' | 'campaigns' | 'announcements';

/** Punto único para atender entradas, chat en vivo, avisos y campañas masivas. */
const CommunicationCenter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as CommunicationView) || 'inbox';
  const [view, setView] = useState<CommunicationView>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as CommunicationView;
    if (tabParam && ['inbox', 'notifications', 'chat', 'campaigns', 'announcements'].includes(tabParam)) {
      setView(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newView: CommunicationView) => {
    setView(newView);
    setSearchParams({ tab: newView });
  };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-6 text-white shadow-xl dark:border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
              <MessageSquare size={13} /> Centro de Comunicaciones
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">Ecosistema de mensajes y avisos de la iglesia</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Gestiona entradas de contacto, chat en vivo, campañas por Email/SMS, anuncios oficiales y notificaciones del sistema.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Inbox className="mb-2 text-blue-300" size={17} />Bandeja</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><MessageSquare className="mb-2 text-emerald-300" size={17} />Chat</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Mail className="mb-2 text-pink-300" size={17} />Campañas</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Megaphone className="mb-2 text-amber-300" size={17} />Anuncios</div>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm dark:border-white/10 dark:bg-slate-900/70" aria-label="Secciones de comunicaciones">
        <button 
          type="button" 
          onClick={() => handleTabChange('inbox')} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'inbox' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
        >
          <Inbox size={16} /> Contacto & Consultas
        </button>

        <button 
          type="button" 
          onClick={() => handleTabChange('chat')} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'chat' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
        >
          <MessageSquare size={16} /> Chat en Vivo
        </button>

        <button 
          type="button" 
          onClick={() => handleTabChange('campaigns')} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'campaigns' ? 'bg-pink-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
        >
          <Mail size={16} /> Campañas Email / SMS
        </button>

        <button 
          type="button" 
          onClick={() => handleTabChange('announcements')} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'announcements' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
        >
          <Megaphone size={16} /> Anuncios Iglesia
        </button>

        <button 
          type="button" 
          onClick={() => handleTabChange('notifications')} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'notifications' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
        >
          <Bell size={16} /> Notificaciones & Push
        </button>
      </nav>

      <div role="tabpanel" aria-label="Contenido de comunicaciones">
        {view === 'inbox' && <ContactInbox />}
        {view === 'chat' && <ChatManager />}
        {view === 'campaigns' && <CampaignsManager />}
        {view === 'announcements' && <ChurchAnnouncementsManager />}
        {view === 'notifications' && <NotificationsManager />}
      </div>
    </div>
  );
};

export default CommunicationCenter;

