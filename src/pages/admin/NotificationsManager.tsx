import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatContacts, useChatMutations } from '../../features/chat/hooks';
import {
  MessageSquare,
  Send,
  Gift,
  Award,
  RefreshCw,
  Phone,
  Copy,
  Search,
  Clock,
  Trash2,
  Calendar,
  Eye,
  Users,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import type { NotificationLog, Member } from '../../types';
import { formatWhatsAppLink } from '../../utils/whatsapp';

interface MinistryData {
  id: string;
  name: string;
  anniversary_date: string | null;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  member_id: string | null;
  ministry_id: string | null;
  email: string | null;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'general',
    name: 'Comunicado General',
    title: 'Anuncio Iglesia Jerusalén ⛪',
    message: 'Estimados hermanos de la Iglesia Jerusalén, les compartimos la siguiente información de interés: ',
  },
  {
    id: 'birthday',
    name: 'Felicitación de Cumpleaños',
    title: '¡Feliz Cumpleaños! 🎉',
    message:
      '¡Hola [Nombre]! 🎉 En nombre de la Iglesia Jerusalén, te deseamos un bendecido y muy feliz cumpleaños. Que el Señor cumpla las peticiones de tu corazón y te llene de Su gracia hoy y siempre. "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz." (Números 6:24-26)',
  },
  {
    id: 'anniversary',
    name: 'Aniversario Ministerial',
    title: 'Aniversario Ministerial 🌟',
    message:
      '¡Felicidades al equipo de [Nombre]! 🎉 Hoy celebramos su aniversario de servicio en el ministerio. Agradecemos su fiel entrega a Dios y a la congregación en la Iglesia Jerusalén. ¡Que el Señor siga prosperando su labor!',
  },
  {
    id: 'service_invite',
    name: 'Invitación a Culto Especial',
    title: 'Invitación a Culto Especial ⛪',
    message:
      'Estimados hermanos, les invitamos cordialmente a nuestro culto especial este domingo a las 10:00 AM. Acompáñanos junto a tu familia a alabar al Señor y recibir una palabra fresca de bendición. ¡Te esperamos!',
  },
  {
    id: 'leaders_meeting',
    name: 'Convocatoria a Reunión de Líderes',
    title: 'Reunión de Planificación de Líderes 📋',
    message:
      'Estimados líderes, les convocamos a una reunión de coordinación, planificación y oración el próximo sábado a las 5:00 PM en las instalaciones de nuestra iglesia. Su puntual asistencia es de suma importancia. Dios les bendiga.',
  },
];

const MOCK_CELEBRANTS: Member[] = [
  {
    id: 'mock-1',
    first_name: 'Hermano Carlos',
    last_name: 'Mendoza',
    photo_url: null,
    dni: null,
    address: null,
    maps_link: null,
    leadership_role: 'Líder de Servidores',
    ministry_id: null,
    role_id: null,
    phone: '+593991234567',
    phone_country_code: '+593',
    birth_date: new Date().toISOString(),
    conversion_date: null,
    baptism_date: null,
    is_leader: true,
    tithes_sum: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    first_name: 'Hna. Beatriz',
    last_name: 'Morales',
    photo_url: null,
    dni: null,
    address: null,
    maps_link: null,
    leadership_role: null,
    ministry_id: null,
    role_id: null,
    phone: '+593987654321',
    phone_country_code: '+593',
    birth_date: new Date().toISOString(),
    conversion_date: null,
    baptism_date: null,
    is_leader: false,
    tithes_sum: 0,
    created_at: new Date().toISOString(),
  },
];

const glassPanel =
  'rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60';
const softButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:text-primary cursor-pointer';
const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer';

export default function NotificationsManager() {
  const [activeTab, setActiveTab] = useState<'triggers' | 'manual' | 'logs'>('triggers');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);

  // Auth & Chat Hooks
  const { user } = useAuthStore();
  const { data: contactsData } = useChatContacts();
  const { sendBroadcast } = useChatMutations();
  const ministries = useMemo(() => contactsData?.ministries || [], [contactsData?.ministries]);

  // Manual message form
  const [recipientGroup, setRecipientGroup] = useState('todos');
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<
    'general' | 'cumpleanos' | 'aniversario' | 'reunion' | 'evento'
  >('general');
  const [deliveryMethod, setDeliveryMethod] = useState<'billboard' | 'direct_chat'>('billboard');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Progress tracker
  const [broadcastProgress, setBroadcastProgress] = useState<{ sent: number; total: number } | null>(
    null
  );

  // Daily Scan Triggers
  const [birthdaysToday, setBirthdaysToday] = useState<Member[]>([]);
  const [anniversariesToday, setAnniversariesToday] = useState<MinistryData[]>([]);

  // Enhanced WhatsApp sending controls
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'no-phone'>('all');
  const [sentMemberIds, setSentMemberIds] = useState<Record<string, boolean>>({});

  const scanCelebrants = useCallback((membersList: Member[], ministriesList: MinistryData[]) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-indexed

    // Scan birthdays
    const bdays = membersList.filter((m) => {
      if (!m.birth_date) return false;
      const bDate = new Date(m.birth_date);
      return bDate.getDate() === currentDay && bDate.getMonth() + 1 === currentMonth;
    });

    // Scan anniversaries
    const annivs = ministriesList.filter((m) => {
      if (!m.anniversary_date) return false;
      const aDate = new Date(m.anniversary_date);
      return aDate.getDate() === currentDay && aDate.getMonth() + 1 === currentMonth;
    });

    setBirthdaysToday(bdays.length > 0 ? bdays : MOCK_CELEBRANTS);
    setAnniversariesToday(annivs);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, logsRes, profilesRes] = await Promise.all([
        supabase.from('members').select('*').is('deleted_at', null),
        supabase.from('notification_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, first_name, last_name, role, member_id, ministry_id'),
      ]);

      const fetchedMembers = membersRes.data || [];
      const fetchedLogs = logsRes.data || [];
      const fetchedProfiles: ProfileData[] = (profilesRes.data || []) as unknown as ProfileData[];

      setMembers(fetchedMembers);
      setLogs(fetchedLogs);
      setProfiles(fetchedProfiles);

      scanCelebrants(fetchedMembers, ministries);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error fetching notifications data:', err);
      toast.error('Error al cargar datos: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, [scanCelebrants, ministries]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const logNotification = async (
    type: 'whatsapp' | 'push',
    title: string,
    message: string,
    group: string,
    status: 'enviado' | 'fallido' | 'programado' = 'enviado',
    scheduledAt: string | null = null,
    category = 'general',
    targetMinistryId: string | null = null
  ) => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .insert({
          type,
          title,
          message,
          recipient_group: group,
          status,
          scheduled_at: scheduledAt,
          sender_id: user?.id || null,
          category,
          target_ministry_id: targetMinistryId,
        })
        .select()
        .single();

      if (error) throw error;
      setLogs((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Error inserting notification log:', err);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setNotifTitle('');
      setNotifMessage('');
      return;
    }
    const tmpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setNotifTitle(tmpl.title);
      setNotifMessage(tmpl.message);

      if (templateId === 'birthday') setNotifCategory('cumpleanos');
      else if (templateId === 'anniversary') setNotifCategory('aniversario');
      else if (templateId === 'leaders_meeting') setNotifCategory('reunion');
      else if (templateId === 'service_invite') setNotifCategory('evento');
      else setNotifCategory('general');
    }
  };

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('Ingresa título y mensaje de la notificación.');
      return;
    }

    setSubmitting(true);
    setBroadcastProgress(null);
    try {
      const groupLabel =
        recipientGroup === 'todos'
          ? 'Todos los Miembros'
          : recipientGroup === 'lideres'
          ? 'Líderes de Ministerios'
          : `Miembros del Ministerio: ${
              ministries.find((m) => m.id === selectedMinistryId)?.name || 'Especial'
            }`;

      const status = isScheduled ? 'programado' : 'enviado';
      const scheduledAt = isScheduled && scheduledDate ? new Date(scheduledDate).toISOString() : null;
      const targetMinistryId = recipientGroup === 'ministry' ? selectedMinistryId : null;

      if (deliveryMethod === 'direct_chat' && !isScheduled) {
        let targetProfiles: ProfileData[] = [];
        if (recipientGroup === 'todos') {
          targetProfiles = profiles.filter((p) => p.id !== user?.id);
        } else if (recipientGroup === 'lideres') {
          const leaderMemberIds = new Set(members.filter((m) => m.is_leader).map((m) => m.id));
          targetProfiles = profiles.filter(
            (p) =>
              p.id !== user?.id &&
              (p.role === 'leader' ||
                p.role === 'admin' ||
                p.role === 'pastor' ||
                p.role === 'secretary' ||
                (p.member_id && leaderMemberIds.has(p.member_id)))
          );
        } else if (recipientGroup === 'ministry' && selectedMinistryId) {
          const ministryMemberIds = new Set(
            members.filter((m) => m.ministry_id === selectedMinistryId).map((m) => m.id)
          );
          targetProfiles = profiles.filter(
            (p) =>
              p.id !== user?.id &&
              (p.ministry_id === selectedMinistryId ||
                (p.member_id && ministryMemberIds.has(p.member_id)))
          );
        }

        if (targetProfiles.length === 0) {
          toast.error('No hay usuarios registrados en el grupo seleccionado.');
          setSubmitting(false);
          return;
        }

        const targetIds = targetProfiles.map((p) => p.id);
        await sendBroadcast.mutateAsync({
          targetProfileIds: targetIds,
          messageContent: notifMessage.trim(),
          ministries,
          onProgress: (sent, total) => {
            setBroadcastProgress({ sent, total });
          },
        });

        await logNotification(
          'push',
          notifTitle.trim(),
          notifMessage.trim(),
          groupLabel,
          'enviado',
          null,
          notifCategory,
          targetMinistryId
        );
        toast.success(`Mensajes de chat enviados con éxito a ${targetIds.length} usuarios.`);
      } else {
        await logNotification(
          'push',
          notifTitle.trim(),
          notifMessage.trim(),
          groupLabel,
          status,
          scheduledAt,
          notifCategory,
          targetMinistryId
        );

        if (isScheduled) {
          toast.success('Aviso programado con éxito.');
        } else {
          toast.success('Aviso publicado en la cartelera general con éxito.');
        }
      }

      setNotifTitle('');
      setNotifMessage('');
      setSelectedTemplate('');
      setIsScheduled(false);
      setScheduledDate('');
      setBroadcastProgress(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error sending manual message:', err);
      toast.error('Error al enviar: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = async (logId: string) => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .update({ status: 'enviado', scheduled_at: new Date().toISOString() })
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;
      setLogs((prev) => prev.map((l) => (l.id === logId ? data : l)));
      toast.success('Aviso publicado de inmediato.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error('Error al publicar aviso: ' + errorMsg);
    }
  };

  const handleCancelSchedule = async (logId: string) => {
    try {
      const { error } = await supabase.from('notification_logs').delete().eq('id', logId);
      if (error) throw error;
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success('Envío programado cancelado.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error('Error al cancelar envío: ' + errorMsg);
    }
  };

  const triggerWhatsAppGreeting = async (
    type: 'birthday' | 'anniversary' | 'manual',
    name: string,
    phone: string | null,
    details: string,
    memberId?: string
  ) => {
    if (!phone) {
      toast.error('Este destinatario no tiene teléfono registrado.');
      return;
    }

    const member = members.find((m) => m.id === memberId);
    const countryCode = member ? member.phone_country_code : '+593';

    let textToSend = details;
    if (member) {
      const role = member.leadership_role || 'Miembro';
      const ministryName = ministries.find((m) => m.id === member.ministry_id)?.name || '';

      if (type === 'birthday') {
        textToSend = `¡Hola ${name}! 🎉 En nombre de la Iglesia Jerusalén, te deseamos un bendecido y muy feliz cumpleaños. Que el Señor cumpla las peticiones de tu corazón y te llene de Su gracia hoy y siempre. "${details}"`;
      } else if (type === 'anniversary') {
        textToSend = `¡Felicidades al equipo de ${name}! 🎉 Hoy celebramos su aniversario ministerial. Agradecemos su fiel servicio a Dios y al cuerpo de Cristo. ¡Que sigan siendo de gran bendición!`;
      }

      textToSend = textToSend
        .replace(/\[Nombre\]/g, name)
        .replace(/\[Apellido\]/g, member.last_name || '')
        .replace(/\[Rol\]/g, role)
        .replace(/\[Ministerio\]/g, ministryName);
    }

    const waUrl = formatWhatsAppLink(phone, countryCode, textToSend);
    window.open(waUrl, '_blank');

    if (memberId) {
      setSentMemberIds((prev) => ({ ...prev, [memberId]: true }));
    }

    await logNotification(
      'whatsapp',
      `Envío masivo: ${
        type === 'birthday' ? 'Cumpleaños' : type === 'anniversary' ? 'Aniversario' : 'Comunicado'
      }`,
      textToSend,
      name,
      'enviado'
    );
  };

  const copyToClipboard = (text: string) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    toast.success('Mensaje copiado al portapapeles');
  };

  const getFilteredRecipients = () => {
    let list: Member[] = [];
    if (recipientGroup === 'todos') {
      list = members.length > 0 ? members : MOCK_CELEBRANTS;
    } else if (recipientGroup === 'lideres') {
      list = members.filter((m) => m.is_leader);
    } else if (recipientGroup === 'ministry') {
      list = members.filter((m) => m.ministry_id === selectedMinistryId);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q))
      );
    }

    if (statusFilter === 'pending') {
      list = list.filter((m) => m.phone && !sentMemberIds[m.id]);
    } else if (statusFilter === 'sent') {
      list = list.filter((m) => sentMemberIds[m.id]);
    } else if (statusFilter === 'no-phone') {
      list = list.filter((m) => !m.phone);
    }

    return list;
  };

  const filteredRecipients = getFilteredRecipients();

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        eyebrow="Comunicación & Alertas"
        title="Notificaciones y Avisos"
        description="Gestiona los recordatorios automáticos de aniversarios, felicitaciones de cumpleaños y anuncios grupales masivos."
        action={
          <button
            onClick={() => void loadData()}
            className={softButton}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Escanear Celebraciones
          </button>
        }
      />

      {/* KPI STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Cumpleaños Hoy
            </span>
            <p className="text-3xl font-black text-indigo-600 dark:text-amber-400 tracking-tight">
              {birthdaysToday.length}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">Miembros festejados</span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-amber-500/10 border border-indigo-500/20 dark:border-amber-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-amber-400 shrink-0">
            <Gift size={22} />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Aniversarios Hoy
            </span>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {anniversariesToday.length}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">Ministerios / Deptos.</span>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <Award size={22} />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Avisos Publicados
            </span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {logs.filter((l) => l.type === 'push' && l.status === 'enviado').length}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">En cartelera activa</span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
            <Eye size={22} />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Avisos Programados
            </span>
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {logs.filter((l) => l.status === 'programado').length}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">Lanzamientos futuros</span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 shrink-0">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('triggers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'triggers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gift size={16} /> Celebraciones del Día
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'manual'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} /> Mensajes y Envío Masivo
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar size={16} /> Historial y Programados
        </button>
      </div>

      {/* TAB 1: CELEBRATIONS */}
      {activeTab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Birthdays Card */}
          <div className={`${glassPanel} p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-500 dark:text-amber-400" />
                Cumpleaños del Día
              </h3>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 dark:text-amber-400 rounded-full text-xs font-bold">
                {birthdaysToday.length} festejados
              </span>
            </div>

            <div className="space-y-3">
              {birthdaysToday.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-md">
                      {member.first_name.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {member.phone ? member.phone : 'Sin teléfono registrado'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      triggerWhatsAppGreeting(
                        'birthday',
                        `${member.first_name} ${member.last_name}`,
                        member.phone,
                        'Jehová te bendiga y te guarde; Jehová haga resplandecer su rostro sobre ti (Números 6:24-26)',
                        member.id
                      )
                    }
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Phone size={14} /> Felicitar por WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Anniversaries Card */}
          <div className={`${glassPanel} p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Aniversarios Ministeriales del Día
              </h3>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold">
                {anniversariesToday.length} departamentos
              </span>
            </div>

            <div className="space-y-3">
              {anniversariesToday.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No hay aniversarios ministeriales registrados hoy.</p>
                </div>
              ) : (
                anniversariesToday.map((min) => (
                  <div
                    key={min.id}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{min.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Aniversario de Servicio</p>
                    </div>

                    <button
                      onClick={() =>
                        triggerWhatsAppGreeting(
                          'anniversary',
                          min.name,
                          '+593991234567',
                          '¡Felicidades en su aniversario ministerial!'
                        )
                      }
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Phone size={14} /> Felicitar Equipo
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL & MASS MESSAGING */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className={`${glassPanel} p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-500" /> Creador de Anuncios y Comunicados Masivos
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Diseña y envía mensajes masivos a miembros, líderes o departamentos por cartelera general o chat directo.
              </p>
            </div>

            <form onSubmit={handleSendManualMessage} className="space-y-5">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  1. Elegir Plantilla Predeterminada
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MESSAGE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        selectedTemplate === t.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group & Delivery Method */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    2. Grupo Destinatario
                  </label>
                  <select
                    value={recipientGroup}
                    onChange={(e) => setRecipientGroup(e.target.value)}
                    className="w-full min-h-11 px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                  >
                    <option value="todos">Todos los Miembros</option>
                    <option value="lideres">Líderes de Ministerios</option>
                    <option value="ministry">Por Ministerio Específico</option>
                  </select>
                </div>

                {recipientGroup === 'ministry' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Seleccionar Ministerio
                    </label>
                    <select
                      value={selectedMinistryId}
                      onChange={(e) => setSelectedMinistryId(e.target.value)}
                      className="w-full min-h-11 px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                    >
                      <option value="">Selecciona un ministerio</option>
                      {ministries.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    3. Canal de Envío
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'billboard' | 'direct_chat')}
                    className="w-full min-h-11 px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                  >
                    <option value="billboard">Cartelera General (Push / Dashboard)</option>
                    <option value="direct_chat">Mensaje Directo de Chat</option>
                  </select>
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ej. Anuncio Importante Servicio Dominical"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Mensaje *
                  </label>
                  {notifMessage && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(notifMessage)}
                      className="text-xs text-indigo-500 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} /> Copiar texto
                    </button>
                  )}
                </div>
                <textarea
                  required
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Escribe aquí el contenido del anuncio o bendición..."
                  className="w-full p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white resize-none"
                />
              </div>

              {/* Scheduling Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-white/10">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded bg-white border-gray-300 text-indigo-600 focus:ring-0"
                  />
                  Programar para envío futuro
                </label>

                {isScheduled && (
                  <input
                    type="datetime-local"
                    required={isScheduled}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                  />
                )}
              </div>

              {broadcastProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>Enviando mensajes...</span>
                    <span>
                      {broadcastProgress.sent} / {broadcastProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (broadcastProgress.sent / broadcastProgress.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="submit" disabled={submitting} className={primaryButton}>
                  <Send size={15} /> {submitting ? 'Procesando...' : isScheduled ? 'Programar Aviso' : 'Publicar / Enviar'}
                </button>
              </div>
            </form>

            {/* Recipient Table Preview */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Destinatarios Seleccionados ({filteredRecipients.length})
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                        statusFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                        statusFilter === 'pending'
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Pendientes
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('sent')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                        statusFilter === 'sent'
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Enviados
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('no-phone')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                        statusFilter === 'no-phone'
                          ? 'bg-rose-600 text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Sin Teléfono
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar..."
                      className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
                  <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="py-2.5 px-4">Miembro</th>
                      <th className="py-2.5 px-4">Teléfono</th>
                      <th className="py-2.5 px-4">Rol / Ministerio</th>
                      <th className="py-2.5 px-4 text-right">Acción Directa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredRecipients.slice(0, 15).map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">
                          {m.first_name} {m.last_name}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-500 dark:text-slate-400">
                          {m.phone || 'Sin teléfono'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-slate-400">
                          {m.is_leader ? 'Líder' : 'Miembro'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() =>
                              triggerWhatsAppGreeting(
                                'manual',
                                `${m.first_name} ${m.last_name}`,
                                m.phone,
                                notifMessage || notifTitle || 'Bendiciones desde la Iglesia Jerusalén',
                                m.id
                              )
                            }
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Phone size={12} /> WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOGS & SCHEDULED */}
      {activeTab === 'logs' && (
        <div className={`${glassPanel} p-6 space-y-4`}>
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Historial y Avisos Programados ({logs.length})
            </h3>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No se han registrado publicaciones aún.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{log.title}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'enviado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{log.message}</p>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                      <span>Destino: {log.recipient_group}</span>
                      <span>Fecha: {new Date(log.created_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.status === 'programado' && (
                      <button
                        onClick={() => void handlePublishNow(log.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Send size={12} /> Publicar Ahora
                      </button>
                    )}
                    <button
                      onClick={() => void handleCancelSchedule(log.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
