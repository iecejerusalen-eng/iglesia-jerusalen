import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clipboard,
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { formatWhatsAppLink } from '../../../utils/whatsapp';
import type { BirthdayInfo } from '../hooks/useBirthdays';

type CampaignScope = 'hoy' | 'semana' | 'mes' | 'todos';

interface BirthdayContact {
  id: string;
  phone: string | null;
  phone_country_code: string | null;
}

interface BirthdayMessagingCenterProps {
  birthdays: BirthdayInfo[];
  initialBirthday?: BirthdayInfo | null;
  onClose: () => void;
}

const DEFAULT_TEMPLATE = '¡Hola [Nombre]! 🎉 En nombre de la Iglesia Jerusalén te deseamos un cumpleaños lleno de la gracia, la paz y el amor de Dios. Que el Señor bendiga tu vida y cumpla los buenos deseos de tu corazón. ¡Feliz cumpleaños!';

function getFullName(item: BirthdayInfo): string {
  return `${item.member.first_name} ${item.member.last_name}`.trim();
}

function personalizeMessage(template: string, item: BirthdayInfo): string {
  return template
    .replaceAll('[Nombre]', item.member.first_name)
    .replaceAll('[Nombre completo]', getFullName(item))
    .replaceAll('[Fecha]', item.formattedDate)
    .replaceAll('[Ministerio]', item.member.ministry_name || 'Familia Jerusalén');
}

export function BirthdayMessagingCenter({ birthdays, initialBirthday = null, onClose }: BirthdayMessagingCenterProps) {
  const user = useAuthStore((state) => state.user);
  const [contacts, setContacts] = useState<Map<string, BirthdayContact>>(new Map());
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [scope, setScope] = useState<CampaignScope>(initialBirthday ? 'todos' : 'mes');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => initialBirthday ? new Set([initialBirthday.member.id]) : new Set());
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>(initialBirthday ? 'manual' : 'auto');
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(initialBirthday?.member.id || null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let mounted = true;

    const loadContacts = async () => {
      const memberIds = birthdays.map((birthday) => birthday.member.id);
      if (memberIds.length === 0) {
        setLoadingContacts(false);
        return;
      }

      setLoadingContacts(true);
      setContactError(null);
      const { data, error } = await supabase
        .from('members')
        .select('id, phone, phone_country_code')
        .in('id', memberIds)
        .is('deleted_at', null);

      if (!mounted) return;
      if (error) {
        console.error('Error loading birthday contact data:', error);
        setContactError('No fue posible consultar los teléfonos del CRM.');
        setLoadingContacts(false);
        return;
      }

      const nextContacts = new Map<string, BirthdayContact>();
      for (const row of data || []) {
        if (typeof row.id !== 'string') continue;
        nextContacts.set(row.id, {
          id: row.id,
          phone: typeof row.phone === 'string' ? row.phone : null,
          phone_country_code: typeof row.phone_country_code === 'string' ? row.phone_country_code : null,
        });
      }
      setContacts(nextContacts);
      setLoadingContacts(false);
    };

    void loadContacts();
    return () => {
      mounted = false;
    };
  }, [birthdays]);

  const scopedBirthdays = useMemo(() => birthdays.filter((birthday) => {
    if (initialBirthday) return birthday.member.id === initialBirthday.member.id;
    if (scope === 'hoy') return birthday.isToday;
    if (scope === 'semana') return birthday.isThisWeek;
    if (scope === 'mes') return birthday.isThisMonth;
    return true;
  }).sort((a, b) => a.daysRemaining - b.daysRemaining), [birthdays, initialBirthday, scope]);

  const automaticallySelectedIds = useMemo(
    () => new Set(scopedBirthdays.filter((birthday) => contacts.get(birthday.member.id)?.phone).map((birthday) => birthday.member.id)),
    [contacts, scopedBirthdays]
  );
  const effectiveSelectedIds = selectionMode === 'auto' && !initialBirthday ? automaticallySelectedIds : selectedIds;

  const selectedBirthdays = useMemo(() => scopedBirthdays.filter((birthday) => effectiveSelectedIds.has(birthday.member.id)), [effectiveSelectedIds, scopedBirthdays]);
  const eligibleBirthdays = useMemo(() => selectedBirthdays.filter((birthday) => Boolean(contacts.get(birthday.member.id)?.phone)), [contacts, selectedBirthdays]);
  const pendingBirthdays = eligibleBirthdays.filter((birthday) => !openedIds.has(birthday.member.id));
  const activeRecipient = birthdays.find((birthday) => birthday.member.id === activeRecipientId) || eligibleBirthdays[0] || null;

  const toggleRecipient = (memberId: string) => {
    setSelectionMode('manual');
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const logWhatsAppOpen = async (item: BirthdayInfo, message: string) => {
    const { error } = await supabase.from('notification_logs').insert({
      type: 'whatsapp',
      title: 'Felicitación de cumpleaños',
      message,
      recipient_group: `WhatsApp abierto para ${getFullName(item)}`,
      status: 'enviado',
      sender_id: user?.id || null,
      category: 'cumpleanos',
    });

    if (error) {
      console.error('Error logging birthday WhatsApp open:', error);
      toast.warning('WhatsApp se abrió, pero no se pudo guardar el registro de actividad.');
    }
  };

  const openWhatsApp = async (item: BirthdayInfo) => {
    const contact = contacts.get(item.member.id);
    if (!contact?.phone) {
      toast.error('Esta persona no tiene teléfono registrado en el CRM.');
      return;
    }
    if (!template.trim()) {
      toast.error('Escribe un mensaje antes de continuar.');
      return;
    }

    const message = personalizeMessage(template.trim(), item);
    const whatsappWindow = window.open(formatWhatsAppLink(contact.phone, contact.phone_country_code, message), '_blank');
    if (!whatsappWindow) {
      toast.error('El navegador bloqueó la ventana de WhatsApp. Habilita las ventanas emergentes e inténtalo otra vez.');
      return;
    }
    whatsappWindow.opener = null;

    setOpenedIds((current) => new Set(current).add(item.member.id));
    const nextRecipient = pendingBirthdays.find((birthday) => birthday.member.id !== item.member.id);
    setActiveRecipientId(nextRecipient?.member.id || null);
    await logWhatsAppOpen(item, message);
  };

  const copyMessage = async () => {
    if (!activeRecipient) return;
    try {
      await navigator.clipboard.writeText(personalizeMessage(template, activeRecipient));
      toast.success('Mensaje personalizado copiado.');
    } catch (error: unknown) {
      console.error('Error copying birthday message:', error);
      toast.error('No fue posible copiar el mensaje.');
    }
  };

  const scopeOptions: Array<{ id: CampaignScope; label: string }> = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: '7 días' },
    { id: 'mes', label: 'Este mes' },
    { id: 'todos', label: 'Todo el año' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-md lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-labelledby="birthday-messaging-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#f8fafc] shadow-2xl dark:bg-slate-950 lg:rounded-[2rem]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 dark:border-white/10 sm:p-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300"><ShieldCheck size={13} /> Herramienta administrativa</span>
            <h2 id="birthday-messaging-title" className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Felicitaciones personalizadas</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Prepara cada mensaje y abre WhatsApp de forma controlada. El envío final siempre se confirma dentro de WhatsApp.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300" aria-label="Cerrar"><X size={19} /></button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex min-h-0 flex-col border-b border-slate-200/80 dark:border-white/10 lg:border-b-0 lg:border-r">
            {!initialBirthday && (
              <div className="flex flex-wrap gap-2 border-b border-slate-200/80 p-4 dark:border-white/10 sm:p-5">
                {scopeOptions.map((option) => <button key={option.id} type="button" onClick={() => setScope(option.id)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${scope === option.id ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:text-primary dark:bg-white/5 dark:text-slate-300'}`}>{option.label}</button>)}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Destinatarios</h3>
              <p className="text-xs text-slate-400">{effectiveSelectedIds.size} seleccionados · {eligibleBirthdays.length} con WhatsApp</p>
              </div>
              {!initialBirthday && scopedBirthdays.length > 0 && (
                <button type="button" onClick={() => { setSelectionMode('manual'); setSelectedIds(() => effectiveSelectedIds.size > 0 ? new Set() : new Set(scopedBirthdays.filter((birthday) => contacts.get(birthday.member.id)?.phone).map((birthday) => birthday.member.id))); }} className="text-xs font-bold text-primary dark:text-blue-300">{effectiveSelectedIds.size > 0 ? 'Limpiar' : 'Elegir todos'}</button>
              )}
            </div>
            <div className="min-h-[13rem] flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
              {loadingContacts ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400"><Loader2 size={17} className="animate-spin" /> Consultando CRM…</div>
              ) : contactError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"><AlertTriangle size={17} className="mb-2" />{contactError}</div>
              ) : scopedBirthdays.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center text-sm text-slate-400"><Users size={24} className="mb-2 opacity-50" />No hay cumpleañeros en este período.</div>
              ) : (
                <div className="space-y-2">
                  {scopedBirthdays.map((birthday) => {
                    const hasPhone = Boolean(contacts.get(birthday.member.id)?.phone);
                    const isSelected = effectiveSelectedIds.has(birthday.member.id);
                    const wasOpened = openedIds.has(birthday.member.id);
                    return (
                      <button key={birthday.member.id} type="button" disabled={!hasPhone || Boolean(initialBirthday)} onClick={() => toggleRecipient(birthday.member.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'} disabled:cursor-default disabled:opacity-70`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${wasOpened ? 'bg-emerald-500 text-white' : isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{wasOpened ? <Check size={16} /> : <span className="text-[10px] font-black">{birthday.day}</span>}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{getFullName(birthday)}</span><span className="block truncate text-[11px] text-slate-400">{hasPhone ? birthday.formattedDate : 'Sin teléfono en el CRM'}</span></span>
                        {hasPhone && <ChevronRight size={15} className="text-slate-300" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-bold text-slate-800 dark:text-white">Mensaje</h3><p className="mt-0.5 text-xs text-slate-400">Usa [Nombre], [Nombre completo], [Fecha] o [Ministerio].</p></div>
              <button type="button" onClick={() => setTemplate(DEFAULT_TEMPLATE)} className="text-xs font-bold text-primary dark:text-blue-300">Restaurar</button>
            </div>
            <textarea value={template} onChange={(event) => setTemplate(event.target.value)} rows={7} className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-church-gold/60 focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vista previa</span>{activeRecipient && <span className="truncate text-xs font-semibold text-slate-500 dark:text-slate-300">{getFullName(activeRecipient)}</span>}</div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{activeRecipient ? personalizeMessage(template, activeRecipient) : 'Selecciona al menos una persona con teléfono.'}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><span className="block text-2xl font-black text-primary dark:text-white">{openedIds.size}</span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp abiertos</span></div>
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><span className="block text-2xl font-black text-primary dark:text-white">{pendingBirthdays.length}</span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendientes</span></div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => void copyMessage()} disabled={!activeRecipient} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:text-primary disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"><Clipboard size={15} /> Copiar mensaje</button>
              <button type="button" onClick={() => activeRecipient && void openWhatsApp(activeRecipient)} disabled={!activeRecipient || pendingBirthdays.length === 0 || !template.trim()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle size={16} /> {initialBirthday ? 'Abrir en WhatsApp' : pendingBirthdays.length > 0 ? `Abrir siguiente · ${openedIds.size + 1}/${eligibleBirthdays.length}` : 'Cola completada'}</button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-400"><Send size={13} className="mt-0.5 shrink-0" /> Por seguridad y para evitar bloqueos, los mensajes masivos se abren uno por uno. Esta pantalla registra la apertura, no confirma la entrega ni la lectura.</p>
            <Link to="/admin/notificaciones" onClick={onClose} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline dark:text-blue-300">Ir al centro completo de notificaciones <ExternalLink size={13} /></Link>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
