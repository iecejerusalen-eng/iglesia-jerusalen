import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Bell, MessageSquare, Send, CheckCircle, 
  Gift, Award, RefreshCw, Phone, Copy, Search, Check
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

export default function NotificationsManager() {
  const [activeTab, setActiveTab] = useState<'triggers' | 'manual' | 'logs'>('triggers');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [ministries, setMinistries] = useState<MinistryData[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  // Manual message form
  const [recipientGroup, setRecipientGroup] = useState('todos');
  const [selectedMinistryId, setSelectedMinistryId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Daily Scan Triggers
  const [birthdaysToday, setBirthdaysToday] = useState<Member[]>([]);
  const [anniversariesToday, setAnniversariesToday] = useState<MinistryData[]>([]);

  // Enhanced WhatsApp sending controls
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'no-phone'>('all');
  const [sentMemberIds, setSentMemberIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, ministriesRes, logsRes] = await Promise.all([
        supabase.from('members').select('*').is('deleted_at', null),
        supabase.from('ministries').select('id, name, anniversary_date'),
        supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      const fetchedMembers = membersRes.data || [];
      const fetchedMinistries = ministriesRes.data || [];
      const fetchedLogs = logsRes.data || [];

      setMembers(fetchedMembers);
      setMinistries(fetchedMinistries);
      setLogs(fetchedLogs);

      // Perform Daily Scan
      scanCelebrants(fetchedMembers, fetchedMinistries);

    } catch (err: any) {
      console.error('Error fetching notifications data:', err);
      toast.error('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const scanCelebrants = (membersList: Member[], ministriesList: MinistryData[]) => {
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
  };

  const logNotification = async (type: 'whatsapp' | 'push', title: string, message: string, group: string, status: 'enviado' | 'fallido' = 'enviado') => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .insert({
          type,
          title,
          message,
          recipient_group: group,
          status
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
    }
  };

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('Ingresa título y mensaje de la notificación.');
      return;
    }

    setSubmitting(true);
    try {
      const groupLabel = recipientGroup === 'todos' ? 'Todos los Miembros' : 
                         recipientGroup === 'lideres' ? 'Líderes de Ministerios' : 
                         `Miembros del Ministerio: ${ministries.find(m => m.id === selectedMinistryId)?.name || 'Especial'}`;

      // Simulate API or Push sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      await logNotification('push', notifTitle.trim(), notifMessage.trim(), groupLabel, 'enviado');
      
      toast.success('Notificación enviada con éxito (Registrada en logs).');
      
      // Reset form
      setNotifTitle('');
      setNotifMessage('');
      setSelectedTemplate('');
    } catch (err: any) {
      console.error('Error sending manual message:', err);
      toast.error('Error al enviar: ' + err.message);
    } finally {
      setSubmitting(false);
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

    // Prepare template text
    let textToSend = details;
    if (type === 'birthday') {
      textToSend = `¡Hola ${name}! 🎉 En nombre de la Iglesia Jerusalén, te deseamos un bendecido y muy feliz cumpleaños. Que el Señor cumpla las peticiones de tu corazón y te llene de Su gracia hoy y siempre. "${details}"`;
    } else if (type === 'anniversary') {
      textToSend = `¡Felicidades al equipo de ${name}! 🎉 Hoy celebramos su aniversario ministerial. Agradecemos su fiel servicio a Dios y al cuerpo de Cristo. ¡Que sigan siendo de gran bendición!`;
    } else {
      // For manual sending, replace [Nombre] placeholder dynamically
      textToSend = details.replace(/\[Nombre\]/g, name);
    }

    const waUrl = formatWhatsAppLink(phone, countryCode, textToSend);

    // Open WhatsApp
    window.open(waUrl, '_blank');

    // Register locally as sent in this session
    if (memberId) {
      setSentMemberIds(prev => ({ ...prev, [memberId]: true }));
    }

    // Log the notification
    await logNotification('whatsapp', `Envío masivo: ${type === 'birthday' ? 'Cumpleaños' : type === 'anniversary' ? 'Aniversario' : 'Comunicado'}`, textToSend, name, 'enviado');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensaje copiado al portapapeles');
  };

  // Recipient groups filtering for manual list sending helper
  const getFilteredRecipients = () => {
    let list: Member[] = [];
    if (recipientGroup === 'todos') {
      list = members;
    } else if (recipientGroup === 'lideres') {
      list = members.filter(m => m.is_leader);
    } else if (recipientGroup === 'ministry') {
      list = members.filter(m => m.ministry_id === selectedMinistryId);
    }

    // Apply name/phone query search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.first_name.toLowerCase().includes(q) || 
        m.last_name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
      );
    }

    // Apply delivery status filter
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
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <Bell className="text-gold" />
            Notificaciones y WhatsApp Masivo
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Gestiona los recordatorios automáticos de aniversarios, felicitaciones de cumpleaños y anuncios grupales masivos.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
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
            <p className="text-xl font-extrabold text-blue-900 tracking-tight">{birthdaysToday.length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Miembros festejados</span>
          </div>
          <div className="w-10 h-10 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-900 shrink-0">
            <Gift size={20} />
          </div>
        </div>

        {/* Card 2: Anniversaries */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Aniversarios Hoy</span>
            <p className="text-xl font-extrabold text-amber-600 tracking-tight">{anniversariesToday.length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Ministerios / Deptos.</span>
          </div>
          <div className="w-10 h-10 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Award size={20} />
          </div>
        </div>

        {/* Card 3: Logs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Mensajes en Logs</span>
            <p className="text-xl font-extrabold text-slate-700 dark:text-gray-300 tracking-tight">{logs.length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Historial reciente</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-650 shrink-0">
            <Bell size={20} />
          </div>
        </div>

        {/* Card 4: Session WhatsApps */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">WhatsApp Enviados</span>
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight">{Object.keys(sentMemberIds).length}</p>
            <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">En esta sesión</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Phone size={20} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'triggers'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🎉 Celebraciones del Día
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          💬 Mensajes y Envío Masivo
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Historial de Envíos
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-8 flex justify-center items-center h-48 animate-pulse">
          <RefreshCw className="animate-spin text-primary" size={24} />
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
                        <div key={m.id} className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-xs text-gray-850 block">{m.first_name} {m.last_name}</span>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase mt-0.5">
                              Hoy cumple {age} años
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {m.phone ? (
                              <button
                                onClick={() => triggerWhatsAppGreeting('birthday', `${m.first_name} ${m.last_name}`, m.phone, `Hoy cumples un año más de vida, Jehová te bendiga y guarde`, m.id)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
                                  isSent
                                    ? 'bg-green-100 border border-green-200 text-green-700 hover:bg-green-200'
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
                        <div key={min.id} className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-xs text-gray-850 block">{min.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase mt-0.5">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Plantilla Predeterminada
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650"
                      >
                        <option value="">-- Usar texto personalizado / Vacío --</option>
                        {MESSAGE_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Destinatarios (Grupo)
                      </label>
                      <select
                        value={recipientGroup}
                        onChange={(e) => setRecipientGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-slate-650"
                      >
                        <option value="todos">Todos los Miembros de la Iglesia</option>
                        <option value="lideres">Solo Líderes de Ministerio</option>
                        <option value="ministry">Miembros de un Ministerio Específico</option>
                      </select>
                    </div>
                  </div>

                  {recipientGroup === 'ministry' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Selecciona el Ministerio
                      </label>
                      <select
                        value={selectedMinistryId}
                        onChange={(e) => setSelectedMinistryId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none text-slate-650"
                      >
                        <option value="">-- Elige un ministerio --</option>
                        {ministries.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Asunto / Título de Notificación
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Ej. Anuncio de Culto Especial de Oración"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Cuerpo del Mensaje (WhatsApp / Push)
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(notifMessage)}
                        className="text-[9px] text-gray-400 font-bold uppercase hover:text-slate-600 flex items-center gap-1 cursor-pointer"
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
                      className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Hola hermanos, les recordamos que..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[10px] font-semibold text-slate-450 uppercase">
                      Total Destinatarios Estimados: <span className="font-bold text-slate-700 dark:text-gray-300">{recipientCount}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send size={12} />
                      <span>Registrar y Enviar Push</span>
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
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 p-2.5 rounded-xl text-[10px] font-semibold text-gray-500 dark:text-gray-450">
                    <div className="flex justify-between">
                      <span>Progreso de envío (sesión):</span>
                      <span className="font-bold text-slate-700 dark:text-gray-300 font-mono">
                        {filteredRecipients.filter(r => sentMemberIds[r.id]).length} de {filteredRecipients.filter(r => r.phone).length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
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
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none bg-slate-50/50 font-medium"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={12} />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
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
                                  ? 'bg-green-150 border border-green-200 text-green-700 hover:bg-green-200' 
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

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-gray-150 dark:border-white/10">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Historial Reciente de Envíos</h3>
                <p className="text-gray-400 text-xs mt-0.5">Registro de mensajes transmitidos por el equipo administrativo de la iglesia.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Canal</th>
                      <th className="px-6 py-4">Asunto / Título</th>
                      <th className="px-6 py-4">Mensaje</th>
                      <th className="px-6 py-4">Destinatario / Grupo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Fecha de Envío</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold italic">
                          No hay logs de notificaciones guardados.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-0.5 ${
                              log.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.type === 'whatsapp' ? 'WhatsApp' : 'Push App'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-850">
                            {log.title}
                          </td>
                          <td className="px-6 py-4 text-xs max-w-xs truncate text-gray-500 dark:text-gray-450" title={log.message}>
                            {log.message}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                            {log.recipient_group}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5">
                              <CheckCircle size={10} />
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {new Date(log.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
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
