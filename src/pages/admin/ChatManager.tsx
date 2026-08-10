import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { usePluginStore } from '../../store/usePluginStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import type { Message } from '../../types';
import { useChats, useChatMessages, useChatContacts, useChatMutations, useChatRetentionDays, useChatRealtime } from '../../features/chat/hooks';
import { calculateAge, MAX_BROADCAST_RECIPIENTS, MAX_CHAT_MESSAGE_LENGTH } from '../../features/chat/chatRules';
import {
  Search,
  Send,
  MessageSquare,
  Users,
  Smile,
  ShieldAlert,
  Megaphone,
  X,
  ChevronLeft,
  Loader2,
  Check,
  Copy,
  Trash2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Clock3,
  Wifi,
  WifiOff,
  LockKeyhole
} from 'lucide-react';


// Simple list of quick-use emojis
const EMOJIS = [
  '😊', '😂', '🤣', '❤️', '👍', '🙏', '🙌', '🎉', '🚀', '💡',
  '⛪', '🌟', '⚠️', '🔥', '👏', '😍', '🤔', '😢', '😇', '✨'
];

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-250 dark:border-amber-900/30';
    case 'pastor':
      return 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-250 dark:border-rose-900/30';
    case 'leader':
      return 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-250 dark:border-sky-900/30';
    case 'secretary':
    case 'secretaria':
      return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-250 dark:border-emerald-900/30';
    case 'editor':
      return 'bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-250 dark:border-violet-900/30';
    case 'multimedia':
      return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-250 dark:border-indigo-900/30';
    case 'maestro':
    case 'docente':
      return 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-250 dark:border-teal-900/30';
    case 'estudiante':
    case 'student':
      return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-250 dark:border-blue-900/30';
    case 'musico':
      return 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-250 dark:border-orange-900/30';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'pastor': return 'Pastor';
    case 'leader': return 'Líder';
    case 'secretary':
    case 'secretaria': return 'Secretaria';
    case 'editor': return 'Editor General';
    case 'multimedia': return 'Multimedia';
    case 'maestro': return 'Maestro';
    case 'docente': return 'Docente';
    case 'estudiante':
    case 'student': return 'Estudiante';
    case 'musico': return 'Músico';
    case 'apoyo': return 'Apoyo';
    default: return 'Miembro';
  }
};

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="m-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">No pudimos cargar esta información</p>
          <p className="mt-1 break-words text-xs opacity-80">{message}</p>
          <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
            <RefreshCw size={14} aria-hidden="true" /> Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatManager() {
  const { user, role, roles, memberId } = useAuthStore();
  const cleanContent = usePluginStore((state) => state.cleanContent);
  const { hasPermission } = usePermissions();
  const userRoles = roles || (role ? [role] : []);
  const isPrivileged = userRoles.some(r => ['admin', 'pastor', 'leader'].includes(r));
  const confirm = useConfirmStore((state) => state.confirm);
  const { activeChat, setActiveChat } = useChatStore();
  
  const { data: chats = [], isLoading: loadingChats, error: chatsError, refetch: refetchChats } = useChats();
  const { data: contactsData, isLoading: loadingContacts, error: contactsError, refetch: refetchContacts } = useChatContacts();
  const { contacts = [], members = [], ministries = [] } = contactsData || {};
  const { data: messages = [], isLoading: loadingMessages, error: messagesError, refetch: refetchMessages } = useChatMessages(activeChat?.id);
  const { data: retentionDays, error: retentionError } = useChatRetentionDays();
  const { sendMessage, startChatWith, sendBroadcast, deleteMessage, leaveChat } = useChatMutations();
  
  const realtimeStatus = useChatRealtime(activeChat?.id || null);

  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Helper to highlight matching text in contacts search
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    const normalizedHighlight = highlight.toLocaleLowerCase('es');
    return (
      <span>
        {parts.map((part, i) =>
          part.toLocaleLowerCase('es') === normalizedHighlight ? (
            <mark key={i} className="bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Helper to group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [dateStr: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.created_at);
      const dateKey = date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  // Helper to format date header nicely
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar mensaje',
      message: 'El mensaje se eliminará para todas las personas de esta conversación y no se puede recuperar.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteMessage.mutateAsync(messageId);
      toast.success('Mensaje eliminado.');
    } catch (err) {
      toast.error('No se pudo eliminar el mensaje: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Mensaje copiado.');
    } catch (error) {
      console.error('No se pudo copiar el mensaje al portapapeles.', error);
      toast.error('El navegador no permitió copiar el mensaje.');
    }
  };

  // Handle scroll to check if user has scrolled up
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
      setShowScrollDown(isScrolledUp);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'department' | 'men_over_30' | 'ladies' | 'youth'>('all');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ sent: 0, total: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const broadcastCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isBroadcastOpen) return;
    broadcastCloseRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sendingBroadcast) setIsBroadcastOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isBroadcastOpen, sendingBroadcast]);

  // Scroll to bottom on active chat change or if user is near bottom
  useEffect(() => {
    if (messagesEndRef.current && !showScrollDown) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages, activeChat, showScrollDown]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChat || !messageInput.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const originalContent = messageInput.trim();
      const moderatedContent = cleanContent(originalContent).trim();
      await sendMessage.mutateAsync({ chatId: activeChat.id, content: moderatedContent });
      setMessageInput('');
      setShowEmojiPicker(false);
      if (moderatedContent !== originalContent) toast.info('El filtro de contenido ajustó el mensaje antes de enviarlo.');
    } catch (err) {
      toast.error('Error al enviar el mensaje: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async (contactId: string) => {
    try {
      const chat = await startChatWith.mutateAsync(contactId);
      setActiveChat(chat);
      setActiveTab('chats');
    } catch (err) {
      toast.error('No se pudo iniciar la conversación: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
  };

  // Determine current user's ministry if any
  const currentUserMember = members.find((m) => m.id === memberId);
  const myMinistryId = currentUserMember?.ministry_id || '';
  const myMinistry = ministries.find((m) => m.id === myMinistryId);

  // Check broadcasting capabilities
  const canBroadcast = isPrivileged && hasPermission('chat', 'edit');

  // Filter available ministries for the coordinator dropdown
  const availableMinistries = (() => {
    if (isPrivileged) {
      return ministries;
    }
    // For coordinators, only show ministries they are linked to
    return ministries.filter((m) => m.id === myMinistryId);
  })();

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) => {
    const fullName = c.first_name || c.last_name
      ? `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
      : (c.email || '').toLowerCase().split('@')[0];
    const email = (c.email || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  // Filter chats by search query
  const filteredChats = chats.filter((c) => {
    // If it's direct chat, look up other participant name
    const otherParticipant = c.participants?.find((p) => p.id !== user?.id);
    const chatName = c.is_group
      ? (c.name || 'Grupo sin nombre')
      : otherParticipant
        ? (otherParticipant.first_name || otherParticipant.last_name
          ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim()
          : otherParticipant.email?.split('@')[0] || 'Usuario')
        : 'Usuario';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Determine broadcast recipients based on selection
  const getBroadcastRecipients = () => {
    if (broadcastTarget === 'all') {
      return contacts;
    } else if (broadcastTarget === 'department') {
      const deptId = selectedDeptId || myMinistryId;
      if (!deptId) return [];
      // Get member IDs of that department
      const deptMembers = members.filter((m) => m.ministry_id === deptId);
      const deptMemberIds = deptMembers.map((m) => m.id);
      return contacts.filter((c) => c.member_id && deptMemberIds.includes(c.member_id));
    } else if (broadcastTarget === 'men_over_30') {
      // Men over 30 in the CRM
      const menOver30Members = members.filter((m) => {
        const age = calculateAge(m.birth_date);
        return m.gender === 'Masculino' && age !== null && age >= 30;
      });
      const menOver30Ids = menOver30Members.map((m) => m.id);
      return contacts.filter((c) => c.member_id && menOver30Ids.includes(c.member_id));
    } else if (broadcastTarget === 'ladies') {
      // Females in the CRM
      const ladiesMembers = members.filter((m) => m.gender === 'Femenino');
      const ladiesIds = ladiesMembers.map((m) => m.id);
      return contacts.filter((c) => c.member_id && ladiesIds.includes(c.member_id));
    } else if (broadcastTarget === 'youth') {
      // Youth under 30 in the CRM
      const youthMembers = members.filter((m) => {
        const age = calculateAge(m.birth_date);
        return age !== null && age < 30;
      });
      const youthIds = youthMembers.map((m) => m.id);
      return contacts.filter((c) => c.member_id && youthIds.includes(c.member_id));
    }
    return [];
  };

  const recipientsList = getBroadcastRecipients();

  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() || recipientsList.length === 0 || sendingBroadcast) return;
    if (recipientsList.length > MAX_BROADCAST_RECIPIENTS) {
      toast.error('Una difusión admite como máximo 100 destinatarios. Elige un segmento más pequeño.');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar difusión',
      message: `Se enviará este mensaje de forma individual a ${recipientsList.length} destinatarios. Si una entrega falla, no se enviará a ninguno.`,
      confirmText: 'Enviar difusión',
      cancelText: 'Revisar',
      variant: 'warning',
    });
    if (!confirmed) return;

    setSendingBroadcast(true);
    setBroadcastProgress({ sent: 0, total: recipientsList.length });

    try {
      const targetIds = recipientsList.map((r) => r.id);
      const moderatedBroadcast = cleanContent(broadcastContent.trim()).trim();
      const result = await sendBroadcast.mutateAsync({
        targetProfileIds: targetIds, 
        messageContent: moderatedBroadcast, 
        onProgress: (sent, total) => {
          setBroadcastProgress({ sent, total });
        }
      });

      toast.success(`Difusión enviada a ${result.sent} destinatarios.`);
      if (moderatedBroadcast !== broadcastContent.trim()) toast.info('El filtro de contenido ajustó la difusión antes de enviarla.');
      setIsBroadcastOpen(false);
      setBroadcastContent('');
    } catch (err) {
      toast.error('Error al enviar difusión: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <AnimeFadeUp
      className="relative flex h-[calc(100vh-128px)] min-h-[640px] flex-col space-y-4"
    >
      <div className="relative shrink-0 overflow-hidden rounded-3xl border border-white/75 bg-white/75 p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-5 dark:border-white/10 dark:bg-slate-950/65">
        <div className="absolute -right-10 -top-20 size-56 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <AdminHeader
            title="Mensajería segura"
            description="Conversaciones privadas, temporales y protegidas por participación."
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <LockKeyhole size={14} className="text-blue-600 dark:text-blue-300" aria-hidden="true" /> Solo participantes
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Clock3 size={14} className="text-amber-600 dark:text-amber-300" aria-hidden="true" />
              {retentionError ? 'Retención no disponible' : `${retentionDays ?? '—'} días`}
            </span>
            {activeChat && (
              <span className={`inline-flex min-h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold ${realtimeStatus === 'connected' ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300' : realtimeStatus === 'error' ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'}`}>
                {realtimeStatus === 'error' ? <WifiOff size={14} aria-hidden="true" /> : <Wifi size={14} aria-hidden="true" />}
                {realtimeStatus === 'connected' ? 'En tiempo real' : realtimeStatus === 'error' ? 'Reconexión necesaria' : 'Conectando'}
              </span>
            )}
            {canBroadcast && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptId(myMinistryId);
                  setBroadcastTarget('all');
                  setIsBroadcastOpen(true);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-slate-950"
              >
                <Megaphone size={16} aria-hidden="true" /> Nueva difusión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace split screen */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
        
        {/* Left Side: Navigation / Contacts / Chats */}
        <div
          className={`w-full md:w-[22rem] border-r border-slate-200/70 dark:border-white/10 flex flex-col shrink-0 ${
            activeChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Search & Tabs */}
          <div className="p-4 border-b border-gray-150 dark:border-white/10 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={activeTab === 'chats' ? 'Buscar chats...' : 'Buscar contactos...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:outline-none focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex bg-gray-55 dark:bg-slate-950/60 p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  setActiveTab('chats');
                  setSearchQuery('');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'chats'
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-indigo-400 shadow-xs'
                    : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <MessageSquare size={13} />
                Chats
              </button>
              <button
                onClick={() => {
                  setActiveTab('contacts');
                  setSearchQuery('');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === 'contacts'
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-indigo-400 shadow-xs'
                    : 'text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Users size={13} />
                Contactos
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chats' ? (
              chatsError ? (
                <InlineError message={chatsError.message} onRetry={() => { void refetchChats(); }} />
              ) : loadingChats ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="animate-spin text-primary dark:text-church-gold-bright" size={20} />
                  <span className="text-xxs text-gray-400">Cargando chats...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-1">
                  <MessageSquare className="mx-auto text-gray-300" size={32} />
                  <p className="text-xs text-gray-500 dark:text-gray-450 font-medium">No hay chats activos</p>
                  <p className="text-xxs text-gray-400">Ve a Contactos para iniciar una conversación.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {filteredChats.map((chat) => {
                    const otherParticipant = chat.participants?.find((p) => p.id !== user?.id);
                    const chatName = chat.is_group
                      ? (chat.name || 'Grupo sin nombre')
                      : otherParticipant
                        ? (otherParticipant.first_name || otherParticipant.last_name
                          ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim()
                          : otherParticipant.email?.split('@')[0] || 'Usuario')
                        : 'Usuario';
                    const chatRole = otherParticipant?.role || 'member';
                    const initials = chatName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const lastMsg = chat.last_message;
                    const isActive = activeChat?.id === chat.id;

                    return (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition cursor-pointer border-l-3 group/chat relative ${
                          isActive
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        {/* Profile Image / Initials */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {otherParticipant?.photo_url ? (
                            <img loading="lazy"
                              src={otherParticipant.photo_url}
                              alt={chatName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        {/* Middle metadata */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{highlightText(chatName, searchQuery)}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              {lastMsg && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const confirmed = await confirm({
                                     title: 'Salir de la conversación',
                                     message: `La conversación con "${chatName}" dejará de aparecer para ti. Los mensajes no se borrarán para la otra persona.`,
                                     confirmText: 'Salir',
                                     cancelText: 'Cancelar',
                                     variant: 'danger',
                                   });
                                   if (confirmed) {
                                     try {
                                       await leaveChat.mutateAsync(chat.id);
                                       if (activeChat?.id === chat.id) setActiveChat(null);
                                       toast.success('Saliste de la conversación.');
                                     } catch (err) {
                                       toast.error('No se pudo salir de la conversación: ' + (err instanceof Error ? err.message : String(err)));
                                     }
                                   }
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/35 text-gray-300 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition-all ml-1 shrink-0 opacity-100 md:opacity-0 md:group-hover/chat:opacity-100"
                                title="Salir de la conversación"
                                aria-label={`Salir de la conversación con ${chatName}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Badge showing role */}
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeStyle(chatRole)}`}>
                              {getRoleLabel(chatRole)}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 truncate">
                            {lastMsg ? lastMsg.content : 'Sin mensajes'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              contactsError ? (
                <InlineError message={contactsError.message} onRetry={() => { void refetchContacts(); }} />
              ) : loadingContacts ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="animate-spin text-primary dark:text-church-gold-bright" size={20} />
                  <span className="text-xxs text-gray-400">Cargando contactos...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-1">
                  <Users className="mx-auto text-gray-300" size={32} />
                  <p className="text-xs text-gray-500 dark:text-gray-455 font-medium">No se encontraron contactos</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {filteredContacts.map((contact) => {
                    const contactName = contact.first_name || contact.last_name
                      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                      : contact.email?.split('@')[0] || 'Usuario';
                    const initials = contactName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleStartConversation(contact.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-55 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {contact.photo_url ? (
                            <img loading="lazy"
                              src={contact.photo_url}
                              alt={contactName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate">{highlightText(contactName, searchQuery)}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeStyle(contact.role)}`}>
                              {getRoleLabel(contact.role)}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate">{highlightText(contact.email || '', searchQuery)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Side: Conversation Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-slate-950 dark:to-slate-900 relative">
          {activeChat ? (
            <>
              {/* Chat Window Header */}
              <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-150 dark:border-white/10 p-4 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xxs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-450 cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Profile info */}
                  {(() => {
                    const otherParticipant = activeChat.participants?.find((p) => p.id !== user?.id);
                    const chatName = activeChat.is_group
                      ? (activeChat.name || 'Grupo sin nombre')
                      : otherParticipant
                        ? (otherParticipant.first_name || otherParticipant.last_name
                          ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim()
                          : otherParticipant.email?.split('@')[0] || 'Usuario')
                        : 'Usuario';
                    const chatRole = otherParticipant?.role || 'member';
                    const initials = chatName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {otherParticipant?.photo_url ? (
                            <img loading="lazy"
                              src={otherParticipant.photo_url}
                              alt={chatName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{chatName}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0 rounded text-[9px] font-bold border ${getRoleBadgeStyle(chatRole)}`}>
                              {getRoleLabel(chatRole)}
                            </span>
                            <LockKeyhole size={10} className="text-slate-400" aria-hidden="true" />
                            <span className="text-[10px] text-gray-400">Conversación privada</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 backdrop-blur-xs border-b border-amber-100 dark:border-amber-900/30 p-2.5 px-4 flex items-center gap-3 shrink-0 relative z-10">
                <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0" size={16} />
                <p className="text-[10.5px] font-medium text-amber-800 dark:text-amber-300 leading-normal">
                  Solo se admite texto y emojis. {retentionError
                    ? 'No pudimos verificar ahora el plazo de eliminación automática.'
                    : <>Los mensajes se eliminarán automáticamente después de <strong>{retentionDays} días</strong>.</>}
                </p>
              </div>

              {/* Message History */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-transparent relative"
              >
                {messagesError ? (
                  <InlineError message={messagesError.message} onRetry={() => { void refetchMessages(); }} />
                ) : loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <Loader2 className="animate-spin text-primary dark:text-church-gold-bright" size={24} />
                    <span className="text-xs text-gray-500 dark:text-gray-450">Cargando mensajes...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 space-y-2">
                    <MessageSquare className="mx-auto text-gray-300" size={40} />
                    <p className="text-xs font-semibold">Inicia la conversación</p>
                    <p className="text-xxs">Envía un saludo con texto o emojis.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupMessagesByDate(messages)).map(([dateStr, dateMsgs]) => (
                      <div key={dateStr} className="space-y-3.5">
                        {/* Date Separator */}
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-xs text-slate-600 dark:text-gray-400 rounded-full text-[9px] font-bold tracking-wider uppercase border border-slate-300/30 dark:border-white/5 shadow-xxs">
                            {formatDateHeader(dateStr)}
                          </span>
                        </div>

                        {dateMsgs.map((msg) => {
                          const isMe = msg.sender_id === user?.id;
                          const senderName = isMe
                            ? 'Tú'
                            : msg.sender
                              ? (msg.sender.first_name || msg.sender.last_name
                                ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim()
                                : msg.sender.email?.split('@')[0] || 'Usuario')
                              : 'Usuario';

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              {/* Bubble wrapper */}
                              <div className="relative max-w-[75%]">
                                <div className={`rounded-2xl p-3 shadow-xs leading-relaxed relative ${
                                  isMe
                                    ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-none border border-primary/10'
                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-150 border border-gray-150 dark:border-white/5 rounded-tl-none'
                                }`}>
                                  <p className="text-xs break-words whitespace-pre-wrap">{cleanContent(msg.content)}</p>
                                </div>

                                {/* Floating actions on hover */}
                                <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 flex items-center bg-white dark:bg-slate-900 shadow-md border border-gray-150 dark:border-white/10 rounded-xl p-1 gap-1 z-10 ${
                                  isMe ? 'right-full mr-2' : 'left-full ml-2'
                                }`}>
                                  <button
                                    type="button"
                                    onClick={() => { void handleCopyMessage(msg.content); }}
                                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 transition cursor-pointer"
                                    title="Copiar texto"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-400 dark:text-rose-355 hover:text-rose-600 dark:hover:text-rose-200 transition cursor-pointer"
                                      title="Eliminar mensaje"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Time & Sender */}
                              <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-gray-400 select-none">
                                <span>{senderName}</span>
                                <span>•</span>
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && <Check size={10} aria-label="Enviado" className="text-primary/70 dark:text-church-gold-bright/70" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Scroll down indicator */}
              {showScrollDown && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-28 right-6 p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/95 transition-all duration-200 hover:scale-105 active:scale-95 animate-bounce z-40 cursor-pointer"
                  title="Ir al final"
                >
                  <ChevronDown size={16} />
                </button>
              )}

              {/* Chat Input Field Area */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-150 dark:border-white/10 p-3 shrink-0 relative z-20">
                
                {/* Popular Emojis Shortcut Bar */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-white/5 mb-2 overflow-x-auto">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-655 dark:hover:text-gray-200 transition shrink-0 cursor-pointer"
                    title="Insertar Emojis"
                  >
                    <Smile size={16} />
                  </button>
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xs p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 rounded transition shrink-0 cursor-pointer hover:scale-110 active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Grid Emoji Popover Overlay */}
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-md z-30 w-56 grid grid-cols-5 gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={`grid-${emoji}`}
                        onClick={() => {
                          handleEmojiClick(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-lg p-1 hover:bg-gray-55 dark:hover:bg-slate-800 rounded transition cursor-pointer text-center hover:scale-110 active:scale-90 text-gray-800 dark:text-gray-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Form input */}
                <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                  <textarea
                    rows={1}
                    aria-label="Mensaje"
                    placeholder="Escribe un mensaje…"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value.slice(0, MAX_CHAT_MESSAGE_LENGTH))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-950 dark:text-gray-100 dark:focus:bg-slate-850"
                    maxLength={MAX_CHAT_MESSAGE_LENGTH}
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    aria-label="Enviar mensaje"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm transition hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingMessage ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
                <div className="flex justify-between items-center mt-1 px-1 select-none">
                  <span className="text-[10px] text-gray-400">
                    Solo texto y emojis permitidos.
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {messageInput.length}/{MAX_CHAT_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="grid size-20 place-items-center rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 shadow-xl shadow-blue-900/5 dark:border-blue-400/15 dark:from-blue-400/10 dark:to-violet-400/10 dark:text-blue-300">
                <MessageSquare size={32} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Elige una conversación</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
                Abre un chat existente o busca un contacto. Solo las personas participantes pueden leer y enviar mensajes.
              </p>
              <button type="button" onClick={() => setActiveTab('contacts')} className="mt-5 min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-slate-950">
                Buscar contacto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      <>
        {isBroadcastOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="broadcast-dialog-title"
              className="flex max-h-[90vh] w-full max-w-lg flex-col space-y-4 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl animate-scale-in dark:border-white/10 dark:bg-slate-900/95"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
                <h3 id="broadcast-dialog-title" className="font-serif font-bold text-base text-primary dark:text-church-gold-bright flex items-center gap-2">
                  <Megaphone size={18} className="text-gold" />
                  Nueva Difusión de Mensajería
                </h3>
                <button
                  ref={broadcastCloseRef}
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  aria-label="Cerrar difusión"
                  className="grid size-10 place-items-center rounded-xl text-gray-400 hover:bg-slate-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Segment Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                    Segmento de Destinatarios
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* All Users option (only for pastor/admin/leader) */}
                    {isPrivileged && (
                      <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        broadcastTarget === 'all'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}>
                        <input
                          type="radio"
                          name="broadcast-target"
                          checked={broadcastTarget === 'all'}
                          onChange={() => setBroadcastTarget('all')}
                          className="text-primary focus:ring-primary/25"
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Todos los usuarios de la Iglesia</p>
                          <p className="text-[10px] text-gray-450 dark:text-gray-400">Enviar mensaje privado individual a cada contacto disponible.</p>
                        </div>
                      </label>
                    )}

                    {/* Department option */}
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                      broadcastTarget === 'department'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      <input
                        type="radio"
                        name="broadcast-target"
                        checked={broadcastTarget === 'department'}
                        onChange={() => setBroadcastTarget('department')}
                        className="text-primary focus:ring-primary/25"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                          {isPrivileged
                            ? 'Por Departamento / Ministerio'
                            : `Miembros de mi departamento: ${myMinistry?.name || 'Cargando...'}`}
                        </p>
                        <p className="text-[10px] text-gray-455 dark:text-gray-400">Difusión dirigida a los miembros adscritos a este ministerio.</p>
                        
                        {/* Dropdown if admin/pastor selects department */}
                        {broadcastTarget === 'department' && isPrivileged && (
                          <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            className="mt-2 w-full p-2 border border-gray-200 dark:border-white/10 rounded-lg text-xxs focus:outline-none bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100"
                          >
                            <option value="">Selecciona un departamento...</option>
                            {availableMinistries.map((min) => (
                              <option key={min.id} value={min.id}>
                                {min.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>

                    {/* Men over 30 option */}
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                      broadcastTarget === 'men_over_30'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      <input
                        type="radio"
                        name="broadcast-target"
                        checked={broadcastTarget === 'men_over_30'}
                        onChange={() => setBroadcastTarget('men_over_30')}
                        className="text-primary focus:ring-primary/25"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Caballeros de la Iglesia (Hombres &gt; 30 años)</p>
                        <p className="text-[10px] text-gray-455 dark:text-gray-400">Calculado dinámicamente mediante el CRM usando fecha de nacimiento y género.</p>
                      </div>
                    </label>

                    {/* Ladies option */}
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                      broadcastTarget === 'ladies'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      <input
                        type="radio"
                        name="broadcast-target"
                        checked={broadcastTarget === 'ladies'}
                        onChange={() => setBroadcastTarget('ladies')}
                        className="text-primary focus:ring-primary/25"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Damas de la Iglesia (Mujeres)</p>
                        <p className="text-[10px] text-gray-455 dark:text-gray-400">Calculado dinámicamente usando el género registrado en el CRM.</p>
                      </div>
                    </label>

                    {/* Youth option */}
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                      broadcastTarget === 'youth'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      <input
                        type="radio"
                        name="broadcast-target"
                        checked={broadcastTarget === 'youth'}
                        onChange={() => setBroadcastTarget('youth')}
                        className="text-primary focus:ring-primary/25"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Jóvenes de la Iglesia (Menores de 30 años)</p>
                        <p className="text-[10px] text-gray-455 dark:text-gray-400">Calculado dinámicamente mediante el CRM usando la fecha de nacimiento.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Recipient summary badge */}
                <div className="bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-gray-500 dark:text-gray-450" />
                    <span className="text-xxs font-semibold text-gray-600 dark:text-gray-400">Destinatarios estimados:</span>
                  </div>
                  <span className={`px-2 py-0.5 font-bold text-xxs rounded-full ${recipientsList.length > MAX_BROADCAST_RECIPIENTS ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300' : 'bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright'}`}>
                    {recipientsList.length} usuarios
                  </span>
                </div>
                {recipientsList.length > MAX_BROADCAST_RECIPIENTS && (
                  <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-300">
                    El límite es de 100 destinatarios por difusión. Selecciona un segmento más pequeño.
                  </p>
                )}

                {/* Broadcast Message Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                    Mensaje de Difusión
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escribe el mensaje de difusión... (Se enviará de forma individual a cada destinatario)"
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value.slice(0, MAX_CHAT_MESSAGE_LENGTH))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none leading-relaxed bg-white dark:bg-slate-850 text-gray-850 dark:text-gray-100"
                    maxLength={MAX_CHAT_MESSAGE_LENGTH}
                    disabled={sendingBroadcast}
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Solo se permite enviar texto y emojis.</span>
                    <span>{broadcastContent.length}/{MAX_CHAT_MESSAGE_LENGTH}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (If sending) */}
              {sendingBroadcast && (
                <div className="space-y-1 bg-primary/5 dark:bg-blue-950/20 p-3 rounded-xl border border-primary/10 dark:border-blue-900/30">
                  <div className="flex justify-between text-xxs font-semibold text-primary dark:text-church-gold-bright">
                    <span>Enviando difusión en masa...</span>
                    <span>{broadcastProgress.sent} de {broadcastProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary dark:bg-church-gold h-full transition-all duration-300"
                      style={{ width: `${broadcastProgress.total > 0 ? (broadcastProgress.sent / broadcastProgress.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end border-t border-gray-100 dark:border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-450 font-semibold text-xs tracking-wider uppercase rounded-xl transition cursor-pointer"
                  disabled={sendingBroadcast}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={!broadcastContent.trim() || recipientsList.length === 0 || recipientsList.length > MAX_BROADCAST_RECIPIENTS || sendingBroadcast}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sendingBroadcast ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Megaphone size={13} />
                      Enviar Difusión
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </AnimeFadeUp>
  );
}
