import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatContacts, useChatMutations } from '../../features/chat/hooks';
import { 
  Bell, MessageSquare, Send, CheckCircle, 
  Gift, Award, RefreshCw, Phone, Copy, Search, Check,
  Clock, Trash2, Calendar, ShieldAlert, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationLog, Member } from '../../types';
import { formatWhatsAppLink } from '../../utils/whatsapp';

interface MinistryData {
  id: string;
  name: string;
  anniversary_date: string | null;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'general',
    name: 'Comunicado General',
    title: 'Anuncio Iglesia Jerusalén ⛪',
    message: 'Estimados hermanos de la Iglesia Jerusalén, les compartimos la siguiente información de interés: '
  },
  {
    id: 'birthday',
    name: 'Felicitación de Cumpleaños',
    title: '¡Feliz Cumpleaños! 🎉',
    message: '¡Hola [Nombre]! 🎉 En nombre de la Iglesia Jerusalén, te deseamos un bendecido y muy feliz cumpleaños. Que el Señor cumpla las peticiones de tu corazón y te llene de Su gracia hoy y siempre. "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz." (Números 6:24-26)'
  },
  {
    id: 'anniversary',
    name: 'Aniversario Ministerial',
    title: 'Aniversario Ministerial 🌟',
    message: '¡Felicidades al equipo de [Nombre]! 🎉 Hoy celebramos su aniversario de servicio en el ministerio. Agradecemos su fiel entrega a Dios y a la congregación en la Iglesia Jerusalén. ¡Que el Señor siga prosperando su labor!'
  },
  {
    id: 'service_invite',
    name: 'Invitación a Culto Especial',
    title: 'Invitación a Culto Especial ⛪',
    message: 'Estimados hermanos, les invitamos cordialmente a nuestro culto especial este domingo a las 10:00 AM. Acompáñanos junto a tu familia a alabar al Señor y recibir una palabra fresca de bendición. ¡Te esperamos!'
  },
  {
    id: 'leaders_meeting',
    name: 'Convocatoria a Reunión de Líderes',
    title: 'Reunión de Planificación de Líderes 📋',
    message: 'Estimados líderes, les convocamos a una reunión de coordinación, planificación y oración el próximo sábado a las 5:00 PM en las instalaciones de nuestra iglesia. Su puntual asistencia es de suma importancia. Dios les bendiga.'
  }
];

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  member_id: string | null;
  ministry_id: string | null;
  email: string | null;
}

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
  const ministries = contactsData?.ministries || [];

  // Manual message form
  const [recipientGroup, setRecipientGroup] = useState('todos');
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<'general' | 'cumpleanos' | 'aniversario' | 'reunion' | 'evento'>('general');
  const [deliveryMethod, setDeliveryMethod] = useState<'billboard' | 'direct_chat'>('billboard');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Progress tracker
  const [broadcastProgress, setBroadcastProgress] = useState<{ sent: number; total: number } | null>(null);

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
    const bdays = membersList.filter(m => {
      if (!m.birth_date) return false;
      const bDate = new Date(m.birth_date);
      return bDate.getDate() === currentDay && (bDate.getMonth() + 1) === currentMonth;
    });

    // Scan anniversaries
    const annivs = ministriesList.filter(m => {
      if (!m.anniversary_date) return false;
      const aDate = new Date(m.anniversary_date);
      return aDate.getDate() === currentDay && (aDate.getMonth() + 1) === currentMonth;
    });

    setBirthdaysToday(bdays);
    setAnniversariesToday(annivs);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, logsRes, profilesRes] = await Promise.all([
        supabase.from('members').select('*').is('deleted_at', null),
        supabase.from('notification_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, first_name, last_name, role, member_id, ministry_id')
      ]);

      const fetchedMembers = membersRes.data || [];
      const fetchedLogs = logsRes.data || [];
      const fetchedProfiles: ProfileData[] = (profilesRes.data || []) as unknown as ProfileData[];

      setMembers(fetchedMembers);
      setLogs(fetchedLogs);
      setProfiles(fetchedProfiles);

      // Perform Daily Scan
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
    loadData();
  }, [loadData]);

  const logNotification = async (
    type: 'whatsapp' | 'push', 
    title: string, 
    message: string, 
    group: string, 
    status: 'enviado' | 'fallido' | 'programado' = 'enviado',
    scheduledAt: string | null = null,
    category: string = 'general',
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
          target_ministry_id: targetMinistryId
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local logs state
      setLogs(prev => [data, ...prev]);
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
    const tmpl = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setNotifTitle(tmpl.title);
      setNotifMessage(tmpl.message);
      
      // Set appropriate category based on template ID
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
      const groupLabel = recipientGroup === 'todos' ? 'Todos los Miembros' : 
                         recipientGroup === 'lideres' ? 'Líderes de Ministerios' : 
                         `Miembros del Ministerio: ${ministries.find(m => m.id === selectedMinistryId)?.name || 'Especial'}`;

      const status = isScheduled ? 'programado' : 'enviado';
      const scheduledAt = isScheduled && scheduledDate ? new Date(scheduledDate).toISOString() : null;
      const targetMinistryId = recipientGroup === 'ministry' ? selectedMinistryId : null;

      // Direct Chat Broadcast (if not scheduled)
      if (deliveryMethod === 'direct_chat' && !isScheduled) {
        // Filter profiles
        let targetProfiles: ProfileData[] = [];
        if (recipientGroup === 'todos') {
          targetProfiles = profiles.filter(p => p.id !== user?.id);
        } else if (recipientGroup === 'lideres') {
          const leaderMemberIds = new Set(members.filter(m => m.is_leader).map(m => m.id));
          targetProfiles = profiles.filter(p => 
            p.id !== user?.id && 
            (p.role === 'leader' || p.role === 'admin' || p.role === 'pastor' || p.role === 'secretary' || p.role === 'secretaria' || p.role === 'editor' || (p.member_id && leaderMemberIds.has(p.member_id)))
          );
        } else if (recipientGroup === 'ministry' && selectedMinistryId) {
          const ministryMemberIds = new Set(members.filter(m => m.ministry_id === selectedMinistryId).map(m => m.id));
          targetProfiles = profiles.filter(p => 
            p.id !== user?.id && 
            (p.ministry_id === selectedMinistryId || (p.member_id && ministryMemberIds.has(p.member_id)))
          );
        }

        if (targetProfiles.length === 0) {
          toast.error('No hay usuarios registrados en el grupo seleccionado para enviar mensajes de chat.');
          setSubmitting(false);
          return;
        }

        const targetIds = targetProfiles.map(p => p.id);
        
        await sendBroadcast.mutateAsync({
          targetProfileIds: targetIds, 
          messageContent: notifMessage.trim(), 
          ministries, 
          onProgress: (sent, total) => {
            setBroadcastProgress({ sent, total });
          }
        });

        await logNotification('push', notifTitle.trim(), notifMessage.trim(), groupLabel, 'enviado', null, notifCategory, targetMinistryId);
        toast.success(`Mensajes de chat enviados con éxito a ${targetIds.length} usuarios.`);
      } else {
        // Post as billboard announcement (saved in notification_logs)
        await logNotification('push', notifTitle.trim(), notifMessage.trim(), groupLabel, status, scheduledAt, notifCategory, targetMinistryId);
        
        if (isScheduled) {
          toast.success('Aviso programado con éxito.');
        } else {
          toast.success('Aviso publicado en la cartelera general con éxito.');
        }
      }
      
      // Reset form
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
      
      setLogs(prev => prev.map(l => l.id === logId ? data : l));
      toast.success('Aviso publicado de inmediato.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error('Error al publicar aviso: ' + errorMsg);
    }
  };

  const handleCancelSchedule = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setLogs(prev => prev.filter(l => l.id !== logId));
      toast.success('Envío programado cancelado y eliminado.');
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

    const member = members.find(m => m.id === memberId);
    const countryCode = member ? member.phone_country_code : '+593';

    // Personalize message details
    let textToSend = details;
    if (member) {
      const role = member.leadership_role || 'Miembro';
      const ministryName = ministries.find(m => m.id === member.ministry_id)?.name || '';
      
      if (type === 'birthday') {
        textToSend = `¡Hola ${name}! 🎉 En nombre de la Iglesia Jerusalén, te deseamos un bendecido y muy feliz cumpleaños. Que el Señor cumpla las peticiones de tu corazón y te llene de Su gracia hoy y siempre. "${details}"`;
      } else if (type === 'anniversary') {
        textToSend = `¡Felicidades al equipo de ${name}! 🎉 Hoy celebramos su aniversario ministerial. Agradecemos su fiel servicio a Dios y al cuerpo de Cristo. ¡Que sigan siendo de gran bendición!`;
      }
      
      // General placeholders
      textToSend = textToSend
        .replace(/\[Nombre\]/g, name)
        .replace(/\[Apellido\]/g, member.last_name || '')
        .replace(/\[Rol\]/g, role)
        .replace(/\[Ministerio\]/g, ministryName);
    }

    const waUrl = formatWhatsAppLink(phone, countryCode, textToSend);
    window.open(waUrl, '_blank');

    if (memberId) {
      setSentMemberIds(prev => ({ ...prev, [memberId]: true }));
    }

    await logNotification('whatsapp', `Envío masivo: ${type === 'birthday' ? 'Cumpleaños' : type === 'anniversary' ? 'Aniversario' : 'Comunicado'}`, textToSend, name, 'enviado');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensaje copiado al portapapeles');
  };

  const getFilteredRecipients = () => {
    let list: Member[] = [];
    if (recipientGroup === 'todos') {
      list = members;
    } else if (recipientGroup === 'lideres') {
      list = members.filter(m => m.is_leader);
    } else if (recipientGroup === 'ministry') {
      list = members.filter(m => m.ministry_id === selectedMinistryId);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.first_name.toLowerCase().includes(q) || 
        m.last_name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
      );
    }

    if (statusFilter === 'pending') {
      list = list.filter(m => m.phone && !sentMemberIds[m.id]);
    } else if (statusFilter === 'sent') {
      list = list.filter(m => sentMemberIds[m.id]);
    } else if (statusFilter === 'no-phone') {
      list = list.filter(m => !m.phone);
    }

    return list;
  };

  const filteredRecipients = getFilteredRecipients();
  const recipientCount = filteredRecipients.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary dark:text-gold flex items-center gap-2">
            <Bell className="text-gold" />
            Notificaciones y Avisos
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Gestiona los recordatorios automáticos de aniversarios, felicitaciones de cumpleaños y anuncios grupales masivos.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Escanear Celebraciones
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Birthdays */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Cumpleaños Hoy</span>
            <p className="text-xl font-extrabold text-blue-900 dark:text-church-gold-bright tracking-tight">{birthdaysToday.length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Miembros festejados</span>
          </div>
          <div className="w-10 h-10 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-center text-blue-900 dark:text-church-gold-bright shrink-0">
            <Gift size={20} />
          </div>
        </div>

        {/* Card 2: Anniversaries */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Aniversarios Hoy</span>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{anniversariesToday.length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Ministerios / Deptos.</span>
          </div>
          <div className="w-10 h-10 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Award size={20} />
          </div>
        </div>

        {/* Card 3: Active Billboard Notices */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Avisos Publicados</span>
            <p className="text-xl font-extrabold text-slate-700 dark:text-gray-300 tracking-tight">
              {logs.filter(l => l.type === 'push' && l.status === 'enviado').length}
            </p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">En cartelera activa</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-650 dark:text-gray-400 shrink-0">
            <Eye size={20} />
          </div>
        </div>

        {/* Card 4: Scheduled Releases */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Avisos Programados</span>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
              {logs.filter(l => l.status === 'programado').length}
            </p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Lanzamientos futuros</span>
          </div>
          <div className="w-10 h-10 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'triggers'
              ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          🎉 Celebraciones del Día
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          💬 Mensajes y Envío Masivo
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          📋 Historial y Programados
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-8 flex justify-center items-center h-48 animate-pulse">
          <RefreshCw className="animate-spin text-primary dark:text-church-gold-bright" size={24} />
        </div>
      ) : (
        <>
          {/* TAB 1: TRIGGERS */}
          {activeTab === 'triggers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Birthdays Panel */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/5 pb-2 flex items-center gap-1.5">
                  <Gift size={16} className="text-gold" />
                  Cumpleaños del Día
                </h3>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {birthdaysToday.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-semibold italic">
                      No hay cumpleaños el día de hoy.
                    </div>
                  ) : (
                    birthdaysToday.map((m) => {
                      const age = m.birth_date ? new Date().getFullYear() - new Date(m.birth_date).getFullYear() : 0;
                      const isSent = sentMemberIds[m.id];
                      return (
                        <div key={m.id} className="p-4 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-xs text-gray-850 dark:text-gray-100 block">{m.first_name} {m.last_name}</span>
                            <span className="text-[10px] text-gray-450 dark:text-gray-400 font-bold block uppercase mt-0.5">
                              Hoy cumple {age} años
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {m.phone ? (
                              <button
                                onClick={() => triggerWhatsAppGreeting('birthday', `${m.first_name} ${m.last_name}`, m.phone, `Hoy cumples un año más de vida, Jehová te bendiga y guarde`, m.id)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
                                  isSent
                                    ? 'bg-green-100 border border-green-200 text-green-700 hover:bg-green-200 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {isSent ? <Check size={10} /> : <Phone size={10} />}
                                {isSent ? 'Enviado' : 'WhatsApp'}
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">Sin teléfono</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Anniversaries Panel */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/5 pb-2 flex items-center gap-1.5">
                  <Award size={16} className="text-gold" />
                  Aniversarios Ministeriales del Día
                </h3>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {anniversariesToday.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-semibold italic">
                      No hay aniversarios de departamentos hoy.
                    </div>
                  ) : (
                    anniversariesToday.map((min) => {
                      const years = min.anniversary_date ? new Date().getFullYear() - new Date(min.anniversary_date).getFullYear() : 0;
                      return (
                        <div key={min.id} className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-xs text-gray-850 dark:text-gray-100 block">{min.name}</span>
                            <span className="text-[10px] text-gray-450 dark:text-gray-400 font-bold block uppercase mt-0.5">
                              {years > 0 ? `Celebrando ${years} años de ministerio` : 'Aniversario Ministerial'}
                            </span>
                          </div>

                          <button
                            onClick={() => triggerWhatsAppGreeting('anniversary', min.name, '0999999999', '')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                          >
                            <Phone size={10} />
                            Felicitar Líderes
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL MESSAGES */}
          {activeTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-white/5">
                  <MessageSquare size={18} className="text-gold" />
                  Redactar Comunicación Grupal
                </h3>

                <form onSubmit={handleSendManualMessage} className="space-y-4">
                  {/* Channels & Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Plantilla Predeterminada
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650 dark:text-white"
                      >
                        <option value="">-- Usar texto personalizado / Vacío --</option>
                        {MESSAGE_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Canal de Envío
                      </label>
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'billboard' | 'direct_chat')}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650 dark:text-white"
                      >
                        <option value="billboard">Cartelera de Avisos (In-App)</option>
                        <option value="direct_chat">Mensajes de Chat Privados</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Categoría del Aviso
                      </label>
                      <select
                        value={notifCategory}
                        onChange={(e) => setNotifCategory(e.target.value as 'general' | 'cumpleanos' | 'aniversario' | 'reunion' | 'evento')}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650 dark:text-white"
                      >
                        <option value="general">📢 General</option>
                        <option value="cumpleanos">🎂 Cumpleaños</option>
                        <option value="aniversario">🌟 Aniversario</option>
                        <option value="reunion">📋 Reunión</option>
                        <option value="evento">⛪ Evento Especial</option>
                      </select>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Destinatarios (Grupo)
                      </label>
                      <select
                        value={recipientGroup}
                        onChange={(e) => setRecipientGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650 dark:text-white"
                      >
                        <option value="todos">Todos los Miembros de la Iglesia</option>
                        <option value="lideres">Solo Líderes de Ministerio</option>
                        <option value="ministry">Miembros de un Ministerio Específico</option>
                      </select>
                    </div>

                    {recipientGroup === 'ministry' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Selecciona el Ministerio
                        </label>
                        <select
                          value={selectedMinistryId}
                          onChange={(e) => setSelectedMinistryId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none text-slate-650 dark:text-white"
                        >
                          <option value="">-- Elige un ministerio --</option>
                          {ministries.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Scheduling controls */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isScheduled"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="isScheduled" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Programar lanzamiento para una fecha y hora futura
                      </label>
                    </div>

                    {isScheduled && (
                      <div className="space-y-1 max-w-xs animate-slideDown">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          Fecha y Hora de Publicación
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                        />
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold block">
                          * Nota: Los avisos programados de chat se publicarán como Avisos en Cartelera en la fecha indicada.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Asunto / Título de Notificación
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:text-white"
                      placeholder="Ej. Anuncio de Culto Especial de Oración"
                    />
                  </div>

                  {/* Message body */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Cuerpo del Mensaje (WhatsApp / In-App)
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(notifMessage)}
                        className="text-[9px] text-gray-400 font-bold uppercase hover:text-slate-600 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Copiar plantilla"
                      >
                        <Copy size={10} />
                        Copiar plantilla
                      </button>
                    </div>
                    <textarea
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      rows={5}
                      className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:text-white"
                      placeholder="Usa variables como [Nombre], [Apellido], [Rol] y [Ministerio] para personalizar el mensaje..."
                    />
                  </div>

                  {/* Broadcast Progress Bar */}
                  {broadcastProgress && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2 animate-pulse">
                      <div className="flex justify-between text-[10px] font-bold text-blue-900 dark:text-church-gold-bright">
                        <span>Enviando mensajes de chat individuales...</span>
                        <span>{broadcastProgress.sent} de {broadcastProgress.total} ({Math.round((broadcastProgress.sent / broadcastProgress.total) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 dark:bg-church-gold h-full rounded-full transition-all duration-300"
                          style={{ width: `${(broadcastProgress.sent / broadcastProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Form actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[10px] font-semibold text-slate-450 uppercase">
                      Total Destinatarios Estimados: <span className="font-bold text-slate-700 dark:text-gray-300">{recipientCount}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      <span>
                        {isScheduled ? 'Programar Lanzamiento' : deliveryMethod === 'direct_chat' ? 'Enviar Mensajes Privados' : 'Publicar Aviso'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* WhatsApp Mass list Helper */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col max-h-[65vh]">
                <div>
                  <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Directorio de Envíos WhatsApp</h4>
                  <p className="text-gray-400 text-[10px] mt-0.5">Usa esta lista para realizar envíos manuales rápidos uno a uno con el mensaje redactado.</p>
                </div>

                {/* Progress bar */}
                {filteredRecipients.length > 0 && (
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 p-2.5 rounded-xl text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Progreso de envío (sesión):</span>
                      <span className="font-bold text-slate-700 dark:text-gray-300 font-mono">
                        {filteredRecipients.filter(r => sentMemberIds[r.id]).length} de {filteredRecipients.filter(r => r.phone).length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(filteredRecipients.filter(r => r.phone).length > 0) 
                            ? (filteredRecipients.filter(r => sentMemberIds[r.id]).length / filteredRecipients.filter(r => r.phone).length) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Search & Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none bg-slate-50/50 dark:bg-slate-950 dark:text-white font-medium"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={12} />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'sent' | 'no-phone')}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-gray-450 bg-white dark:bg-slate-900 focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="sent">Enviados (Sesión)</option>
                      <option value="no-phone">Sin Teléfono</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {filteredRecipients.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No hay destinatarios que mostrar.
                    </div>
                  ) : (
                    filteredRecipients.map((rec) => {
                      const isSent = sentMemberIds[rec.id];
                      return (
                        <div key={rec.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 dark:text-gray-100 block truncate">{rec.first_name} {rec.last_name}</span>
                            <span className="text-[9px] text-gray-400 font-mono block truncate">
                              {rec.phone_country_code || '+593'} {rec.phone || 'Sin número'}
                            </span>
                          </div>

                          {rec.phone ? (
                            <button
                              onClick={() => triggerWhatsAppGreeting('manual', `${rec.first_name} ${rec.last_name}`, rec.phone, notifMessage, rec.id)}
                              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 text-[10px] font-bold ${
                                isSent 
                                  ? 'bg-green-150 border border-green-200 text-green-700 hover:bg-green-200 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              }`}
                              title="Enviar por WhatsApp"
                            >
                              {isSent ? <Check size={10} /> : <Phone size={10} />}
                              {isSent ? 'Enviado' : 'WhatsApp'}
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS / SCHEDULED */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-gray-150 dark:border-white/10">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Historial y Programación de Avisos</h3>
                <p className="text-gray-400 text-xs mt-0.5">Gestión de comunicados programados y registro general de envíos de la iglesia.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Canal</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Asunto / Título</th>
                      <th className="px-6 py-4">Mensaje</th>
                      <th className="px-6 py-4">Destinatario / Grupo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Programado / Enviado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-gray-400 font-semibold italic">
                          No hay logs de notificaciones guardados.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const isScheduledNotice = log.status === 'programado';
                        
                        // Category labels and colors
                        let catLabel = 'General';
                        let catBg = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
                        if (log.category === 'cumpleanos') {
                          catLabel = '🎂 Cumpleaños';
                          catBg = 'bg-pink-100 text-pink-800 dark:bg-pink-950/20 dark:text-pink-400';
                        } else if (log.category === 'aniversario') {
                          catLabel = '🌟 Aniversario';
                          catBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
                        } else if (log.category === 'reunion') {
                          catLabel = '📋 Reunión';
                          catBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
                        } else if (log.category === 'evento') {
                          catLabel = '⛪ Evento';
                          catBg = 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400';
                        }

                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            {/* Canal */}
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-0.5 ${
                                log.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
                              }`}>
                                {log.type === 'whatsapp' ? 'WhatsApp' : 'Push App'}
                              </span>
                            </td>

                            {/* Categoría */}
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${catBg}`}>
                                {catLabel}
                              </span>
                            </td>

                            {/* Título */}
                            <td className="px-6 py-4 font-semibold text-gray-850 dark:text-white">
                              {log.title}
                            </td>

                            {/* Mensaje */}
                            <td className="px-6 py-4 text-xs max-w-xs truncate text-gray-500 dark:text-gray-400" title={log.message}>
                              {log.message}
                            </td>

                            {/* Grupo */}
                            <td className="px-6 py-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                              {log.recipient_group}
                            </td>

                            {/* Estado */}
                            <td className="px-6 py-4">
                              {isScheduledNotice ? (
                                <span className="bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5">
                                  <Clock size={10} />
                                  Programado
                                </span>
                              ) : log.status === 'fallido' ? (
                                <span className="bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5">
                                  <ShieldAlert size={10} />
                                  Fallido
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5">
                                  <CheckCircle size={10} />
                                  Enviado
                                </span>
                              )}
                            </td>

                            {/* Fecha */}
                            <td className="px-6 py-4 text-gray-400 text-xs">
                              {isScheduledNotice && log.scheduled_at ? (
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                                  <Calendar size={12} />
                                  <span>
                                    {new Date(log.scheduled_at).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span>
                                  {new Date(log.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isScheduledNotice ? (
                                  <>
                                    <button
                                      onClick={() => handlePublishNow(log.id)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded cursor-pointer transition-colors"
                                      title="Publicar ahora de inmediato"
                                    >
                                      <Send size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleCancelSchedule(log.id)}
                                      className="p-1 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                                      title="Cancelar y eliminar"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleCancelSchedule(log.id)}
                                    className="p-1 text-gray-450 hover:text-red-650 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                                    title="Eliminar de historial"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
