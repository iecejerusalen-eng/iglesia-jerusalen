import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import type { Message } from '../../types';
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
  CheckCheck,
  Copy,
  Trash2,
  ChevronDown
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
      return 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-250 dark:border-teal-900/30';
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
    case 'apoyo': return 'Apoyo';
    default: return 'Miembro';
  }
};

const calculateAge = (birthDateStr: string | null) => {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function ChatManager() {
  const { user, role, memberId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const confirm = useConfirmStore((state) => state.confirm);
  const {
    chats,
    activeChat,
    messages,
    contacts,
    members,
    ministries,
    loadingChats,
    loadingMessages,
    loadingContacts,
    retentionDays,
    fetchChats,
    fetchContacts,
    fetchRetentionDays,
    setActiveChat,
    sendMessage,
    startChatWith,
    sendBroadcast,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    deleteMessage,
    deleteChat
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Helper to highlight matching text in contacts search
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
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
    try {
      await deleteMessage(messageId);
      toast.success('Mensaje eliminado.');
    } catch (err: any) {
      toast.error('No se pudo eliminar el mensaje: ' + err.message);
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

  useEffect(() => {
    fetchChats();
    fetchContacts();
    fetchRetentionDays();
    subscribeToRealtime();

    return () => {
      unsubscribeFromRealtime();
    };
  }, []);

  // Scroll to bottom on active chat change or if user is near bottom
  useEffect(() => {
    if (messagesEndRef.current && !showScrollDown) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages, activeChat]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChat || !messageInput.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await sendMessage(activeChat.id, messageInput.trim());
      setMessageInput('');
      setShowEmojiPicker(false);
    } catch (err: any) {
      toast.error('Error al enviar el mensaje: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async (contactId: string) => {
    try {
      await startChatWith(contactId);
      setActiveTab('chats');
    } catch (err: any) {
      toast.error('No se pudo iniciar la conversación: ' + err.message);
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
  const canBroadcast =
    role === 'admin' ||
    role === 'pastor' ||
    role === 'leader' ||
    role === 'editor' ||
    role === 'secretary' ||
    role === 'secretaria' ||
    role === 'maestro' ||
    role === 'apoyo' ||
    hasPermission('chat', 'edit') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('coordinador') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('coordinadora') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('director') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('directora') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('encargado') ||
    (currentUserMember?.leadership_role || '').toLowerCase().includes('encargada');

  // Filter available ministries for the coordinator dropdown
  const availableMinistries = (() => {
    if (role === 'admin' || role === 'pastor' || role === 'leader') {
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
      const menOver30Members = members.filter(
        (m) => m.gender === 'Masculino' && calculateAge(m.birth_date) >= 30
      );
      const menOver30Ids = menOver30Members.map((m) => m.id);
      return contacts.filter((c) => c.member_id && menOver30Ids.includes(c.member_id));
    } else if (broadcastTarget === 'ladies') {
      // Females in the CRM
      const ladiesMembers = members.filter((m) => m.gender === 'Femenino');
      const ladiesIds = ladiesMembers.map((m) => m.id);
      return contacts.filter((c) => c.member_id && ladiesIds.includes(c.member_id));
    } else if (broadcastTarget === 'youth') {
      // Youth under 30 in the CRM
      const youthMembers = members.filter((m) => calculateAge(m.birth_date) < 30);
      const youthIds = youthMembers.map((m) => m.id);
      return contacts.filter((c) => c.member_id && youthIds.includes(c.member_id));
    }
    return [];
  };

  const recipientsList = getBroadcastRecipients();

  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() || recipientsList.length === 0 || sendingBroadcast) return;

    setSendingBroadcast(true);
    setBroadcastProgress({ sent: 0, total: recipientsList.length });

    try {
      const targetIds = recipientsList.map((r) => r.id);
      await sendBroadcast(targetIds, broadcastContent.trim(), (sent, total) => {
        setBroadcastProgress({ sent, total });
      });

      toast.success('Mensaje de difusión enviado con éxito.');
      setIsBroadcastOpen(false);
      setBroadcastContent('');
    } catch (err: any) {
      toast.error('Error al enviar difusión: ' + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <AnimeFadeUp
      className="space-y-6 h-[calc(100vh-140px)] flex flex-col"
    >
      <div className="flex justify-between items-center shrink-0">
        <AdminHeader
          title="Chat en Tiempo Real"
          description="Mensajería efímera de seguridad y difusiones masivas segmentadas."
        />
        {canBroadcast && (
          <button
            onClick={() => {
              // Pre-select user's department or default values
              setSelectedDeptId(myMinistryId);
              if (role !== 'admin' && role !== 'pastor' && role !== 'leader') {
                setBroadcastTarget('department');
              } else {
                setBroadcastTarget('all');
              }
              setIsBroadcastOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white hover:bg-primary/95 font-semibold text-xs tracking-wider uppercase rounded-xl transition shadow-sm cursor-pointer"
          >
            <Megaphone size={14} />
            Difusión
          </button>
        )}
      </div>

      {/* Main Workspace split screen */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs flex flex-1 overflow-hidden min-h-0">
        
        {/* Left Side: Navigation / Contacts / Chats */}
        <div
          className={`w-full md:w-80 border-r border-gray-150 dark:border-white/10 flex flex-col shrink-0 ${
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
              loadingChats ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="animate-spin text-primary" size={20} />
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {otherParticipant?.photo_url ? (
                            <img
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
                                     title: 'Eliminar conversación',
                                     message: `¿Estás seguro de que deseas eliminar permanentemente la conversación con "${chatName}"?\n\nTodos los mensajes de este chat se borrarán permanentemente.`,
                                     confirmText: 'Eliminar',
                                     cancelText: 'Cancelar',
                                     variant: 'danger',
                                   });
                                   if (confirmed) {
                                     try {
                                       await deleteChat(chat.id);
                                       toast.success('Conversación eliminada.');
                                     } catch (err: any) {
                                       toast.error('No se pudo eliminar la conversación: ' + err.message);
                                     }
                                   }
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/35 text-gray-300 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition-all ml-1 shrink-0 opacity-100 md:opacity-0 md:group-hover/chat:opacity-100"
                                title="Eliminar conversación"
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
              loadingContacts ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="animate-spin text-primary" size={20} />
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {contact.photo_url ? (
                            <img
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
                          {otherParticipant?.photo_url ? (
                            <img
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
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-gray-400">Mensajería efímera</span>
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
                  ⚠️ Por motivos de privacidad y almacenamiento, los mensajes de este chat solo contienen texto/emojis y se eliminarán automáticamente después de <strong>{retentionDays} días</strong>.
                </p>
              </div>

              {/* Message History */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-transparent relative"
              >
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
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
                                  <p className="text-xs break-words whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* Floating actions on hover */}
                                <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 flex items-center bg-white dark:bg-slate-900 shadow-md border border-gray-150 dark:border-white/10 rounded-xl p-1 gap-1 z-10 ${
                                  isMe ? 'right-full mr-2' : 'left-full ml-2'
                                }`}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.content);
                                      toast.success('Mensaje copiado al portapapeles.');
                                    }}
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
                                {isMe && <CheckCheck size={10} className="text-primary/70" />}
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
                  <input
                    type="text"
                    placeholder="Escribe un mensaje aquí... (Solo texto y emojis)"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value.slice(0, 1000))}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:outline-none focus:bg-white dark:focus:bg-slate-850 bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 transition"
                    maxLength={1000}
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="p-2.5 bg-primary text-white hover:bg-primary/95 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
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
                    {messageInput.length}/1000
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessageSquare className="text-gray-300 animate-pulse" size={56} />
              <h3 className="font-serif font-bold text-base text-gray-800 dark:text-gray-100">Mensajería en Tiempo Real</h3>
              <p className="text-xs text-gray-500 dark:text-gray-450 max-w-sm">
                Selecciona un chat en la lista o inicia una conversación con otro miembro para comenzar a chatear.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      <>
        {isBroadcastOpen && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <AnimeFadeUp
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-gray-150 dark:border-white/10 p-6 shadow-xl space-y-4 flex flex-col max-h-[90vh] animate-scale-in"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
                <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                  <Megaphone size={18} className="text-gold" />
                  Nueva Difusión de Mensajería
                </h3>
                <button
                  onClick={() => setIsBroadcastOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
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
                    {(role === 'admin' || role === 'pastor' || role === 'leader') && (
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
                          {role === 'admin' || role === 'pastor' || role === 'leader'
                            ? 'Por Departamento / Ministerio'
                            : `Miembros de mi departamento: ${myMinistry?.name || 'Cargando...'}`}
                        </p>
                        <p className="text-[10px] text-gray-455 dark:text-gray-400">Difusión dirigida a los miembros adscritos a este ministerio.</p>
                        
                        {/* Dropdown if admin/pastor selects department */}
                        {broadcastTarget === 'department' && (role === 'admin' || role === 'pastor' || role === 'leader') && (
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
                  <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xxs rounded-full">
                    {recipientsList.length} usuarios
                  </span>
                </div>

                {/* Broadcast Message Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                    Mensaje de Difusión
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escribe el mensaje de difusión... (Se enviará de forma individual a cada destinatario)"
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value.slice(0, 1000))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none leading-relaxed bg-white dark:bg-slate-850 text-gray-850 dark:text-gray-100"
                    maxLength={1000}
                    disabled={sendingBroadcast}
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Solo se permite enviar texto y emojis.</span>
                    <span>{broadcastContent.length}/1000</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (If sending) */}
              {sendingBroadcast && (
                <div className="space-y-1 bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <div className="flex justify-between text-xxs font-semibold text-primary">
                    <span>Enviando difusión en masa...</span>
                    <span>{broadcastProgress.sent} de {broadcastProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${(broadcastProgress.sent / broadcastProgress.total) * 100}%` }}
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
                  disabled={!broadcastContent.trim() || recipientsList.length === 0 || sendingBroadcast}
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
            </AnimeFadeUp>
          </div>
        )}
      </>
    </AnimeFadeUp>
  );
}
