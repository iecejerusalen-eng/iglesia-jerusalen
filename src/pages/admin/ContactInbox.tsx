import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { Button } from '../../components/ui/button';
import { supabase } from '../../config/supabase';

type MessageStatus = 'unread' | 'read';
type StatusFilter = 'all' | MessageStatus;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
}

const PAGE_SIZE = 12;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sanitizeSearchTerm = (value: string) =>
  value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const ContactInbox = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const cleanSearch = sanitizeSearchTerm(search);

      let messagesQuery = supabase
        .from('contact_messages')
        .select('id,name,email,subject,message,status,created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (statusFilter !== 'all') {
        messagesQuery = messagesQuery.eq('status', statusFilter);
      }

      if (cleanSearch) {
        messagesQuery = messagesQuery.or(
          `name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,subject.ilike.%${cleanSearch}%,message.ilike.%${cleanSearch}%`,
        );
      }

      const [messagesResult, unreadResult] = await Promise.all([
        messagesQuery,
        supabase
          .from('contact_messages')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'unread'),
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (unreadResult.error) throw unreadResult.error;

      const nextMessages = (messagesResult.data ?? []) as ContactMessage[];
      const nextTotal = messagesResult.count ?? 0;
      setMessages(nextMessages);
      setTotal(nextTotal);
      setUnreadTotal(unreadResult.count ?? 0);

      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > nextTotalPages) setPage(nextTotalPages);
    } catch (caughtError) {
      console.error('No se pudo cargar la bandeja de contacto:', caughtError);
      setError(`No se pudieron cargar los mensajes. ${getErrorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      void loadMessages();
    }, 250);

    return () => window.clearTimeout(requestTimer);
  }, [loadMessages]);

  const pageRange = useMemo(() => {
    if (total === 0) return '0 mensajes';
    const first = (page - 1) * PAGE_SIZE + 1;
    const last = Math.min(page * PAGE_SIZE, total);
    return `${first}–${last} de ${total}`;
  }, [page, total]);

  const updateStatus = async (message: ContactMessage, status: MessageStatus) => {
    if (message.status === status) return;
    setUpdatingId(message.id);

    try {
      const { data, error: updateError } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', message.id)
        .select('id,status')
        .single();

      if (updateError) throw updateError;
      if (!data || data.id !== message.id || data.status !== status) {
        throw new Error('La base de datos no confirmó el cambio de estado.');
      }

      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, status } : item)),
      );
      setSelectedMessage((current) =>
        current?.id === message.id ? { ...current, status } : current,
      );
      setUnreadTotal((current) =>
        Math.max(0, current + (status === 'unread' ? 1 : -1)),
      );
      toast.success(status === 'read' ? 'Mensaje marcado como leído.' : 'Mensaje marcado como no leído.');
    } catch (caughtError) {
      console.error('No se pudo actualizar el mensaje de contacto:', caughtError);
      toast.error(`No se pudo actualizar el mensaje. ${getErrorMessage(caughtError)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'unread') void updateStatus(message, 'read');
  };

  return (
    <AnimeFadeUp className="mx-auto max-w-[1500px] space-y-6">
      <AdminHeader
        title="Bandeja de contacto"
        description="Revisa los mensajes enviados desde el sitio, organiza los pendientes y responde desde tu correo habitual."
        action={
          <Button variant="outline" onClick={() => void loadMessages()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/65">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensajes encontrados</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/75 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Sin leer</p>
          <p className="mt-2 text-3xl font-black text-amber-800 dark:text-amber-200">{unreadTotal}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="grid gap-3 border-b border-slate-200/80 p-4 dark:border-white/10 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <span className="sr-only">Buscar mensajes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Buscar por nombre, correo, asunto o contenido…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/5" aria-label="Filtrar por estado">
            {(['all', 'unread', 'read'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatusFilter(status);
                }}
                aria-pressed={statusFilter === status}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  statusFilter === status
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-amber-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'unread' ? 'Sin leer' : 'Leídos'}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-400/20 dark:bg-red-500/10">
            <p className="font-semibold text-red-800 dark:text-red-200">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadMessages()}>
              Intentar de nuevo
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-4" aria-label="Cargando mensajes">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto text-slate-300 dark:text-slate-600" size={46} />
            <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">No hay mensajes en esta vista</h2>
            <p className="mt-1 text-sm text-slate-500">Prueba otro filtro o una búsqueda diferente.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`grid gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
                  message.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-500/[0.06]' : ''
                }`}
              >
                <div className={`flex size-10 items-center justify-center rounded-xl ${message.status === 'unread' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
                  {message.status === 'unread' ? <Mail size={18} /> : <MailOpen size={18} />}
                </div>
                <button type="button" onClick={() => openMessage(message)} className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{message.name}</h2>
                    {message.status === 'unread' && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">Nuevo</span>}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{message.subject || 'Sin asunto'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{message.message}</p>
                </button>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <time className="text-xs text-slate-400" dateTime={message.created_at}>{formatDate(message.created_at)}</time>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={updatingId === message.id}
                    onClick={() => void updateStatus(message, message.status === 'unread' ? 'read' : 'unread')}
                  >
                    {message.status === 'unread' ? <CheckCheck size={15} /> : <Mail size={15} />}
                    {message.status === 'unread' ? 'Marcar leído' : 'Marcar no leído'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-slate-200/80 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">{pageRange}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft size={16} /> Anterior
            </Button>
            <span className="min-w-20 text-center text-xs font-bold text-slate-600 dark:text-slate-300">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        </footer>
      </section>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="contact-message-title">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/20 bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-amber-300">Mensaje de {selectedMessage.name}</p>
                <h2 id="contact-message-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">{selectedMessage.subject || 'Sin asunto'}</h2>
                <a href={`mailto:${selectedMessage.email}`} className="mt-2 inline-block break-all text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">{selectedMessage.email}</a>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} aria-label="Cerrar detalle">
                <X size={20} />
              </Button>
            </div>
            <time className="mt-4 block text-xs text-slate-400" dateTime={selectedMessage.created_at}>{formatDate(selectedMessage.created_at)}</time>
            <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:bg-white/5 dark:text-slate-200">{selectedMessage.message}</div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" loading={updatingId === selectedMessage.id} onClick={() => void updateStatus(selectedMessage, selectedMessage.status === 'read' ? 'unread' : 'read')}>
                {selectedMessage.status === 'read' ? <Mail size={16} /> : <CheckCheck size={16} />}
                {selectedMessage.status === 'read' ? 'Marcar no leído' : 'Marcar leído'}
              </Button>
              <Button asChild>
                <a href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject || 'Mensaje desde Iglesia Jerusalén'}`)}`}>
                  <Mail size={16} /> Responder por correo
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
};

export default ContactInbox;
