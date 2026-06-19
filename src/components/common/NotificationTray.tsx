import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Bell,
  MessageSquare,
  X,
  Send,
  Smile,
  ShieldAlert,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Chat } from '../../types';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🙌', '🎉', '🌟', '⚠️'];

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'pastor': return 'Pastor';
    case 'leader': return 'Líder';
    case 'secretary':
    case 'secretaria': return 'Secretaría';
    default: return 'Líder/Staff';
  }
};

export default function NotificationTray() {
  const { user } = useAuthStore();
  const {
    chats,
    activeChat,
    messages,
    loadingChats,
    loadingMessages,
    retentionDays,
    fetchChats,
    setActiveChat,
    sendMessage,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Local state for read timestamps
  const [readTimes, setReadTimes] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load read times from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('jerusalen_chat_read_times');
    if (stored) {
      try {
        setReadTimes(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch chats and subscribe on mount / login
  useEffect(() => {
    if (user) {
      fetchChats();
      subscribeToRealtime();
    }
    return () => {
      unsubscribeFromRealtime();
    };
  }, [user]);

  // Scroll active chat modal to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  if (!user) return null;

  // Calculate unread chats count
  const unreadChats = chats.filter((chat) => {
    const lastMsg = chat.last_message;
    if (!lastMsg) return false;
    // If sent by me, it's not unread
    if (lastMsg.sender_id === user.id) return false;
    
    const lastRead = readTimes[chat.id];
    if (!lastRead) return true;
    
    return new Date(lastMsg.created_at).getTime() > new Date(lastRead).getTime();
  });

  const unreadCount = unreadChats.length;

  const handleOpenChat = (chat: Chat) => {
    // Set active chat
    setActiveChat(chat);
    
    // Mark as read
    const nowISO = new Date().toISOString();
    const updatedReadTimes = { ...readTimes, [chat.id]: nowISO };
    setReadTimes(updatedReadTimes);
    localStorage.setItem('jerusalen_chat_read_times', JSON.stringify(updatedReadTimes));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !replyText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(activeChat.id, replyText.trim());
      setReplyText('');
      setShowEmojis(false);
      
      // Update read time for this chat to now since we just replied
      const nowISO = new Date().toISOString();
      const updatedReadTimes = { ...readTimes, [activeChat.id]: nowISO };
      setReadTimes(updatedReadTimes);
      localStorage.setItem('jerusalen_chat_read_times', JSON.stringify(updatedReadTimes));
    } catch (err: any) {
      toast.error('No se pudo enviar la respuesta: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Bell Notification Button */}
      <button
        onClick={() => {
          fetchChats();
          setIsOpen(true);
        }}
        className="relative p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-650 hover:text-primary dark:text-white dark:hover:text-gold cursor-pointer"
        title="Bandeja de Mensajes"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-accent-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setActiveChat(null);
              }}
              className="fixed inset-0 bg-black"
            />

            {/* Tray Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-gray-150 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-primary dark:text-gold" size={18} />
                  <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-white">
                    Mensajes y Avisos
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-650 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body - List of conversations */}
              <div className="flex-1 overflow-y-auto">
                {loadingChats ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-xs text-gray-400">Buscando mensajes...</span>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-16 px-6 space-y-3">
                    <Bell className="mx-auto text-gray-300 dark:text-slate-700" size={38} />
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-350">
                      Sin mensajes todavía
                    </p>
                    <p className="text-xxs text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                      Aquí recibirás avisos, difusiones y mensajes directos enviados por los pastores y administradores de la iglesia.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {chats.map((chat) => {
                      const otherParticipant = chat.participants?.find((p) => p.id !== user.id);
                      const chatName = chat.is_group
                        ? (chat.name || 'Grupo de la Iglesia')
                        : `${otherParticipant?.first_name || ''} ${otherParticipant?.last_name || 'Líder'}`;
                      const senderRole = otherParticipant?.role || 'leader';
                      
                      const initials = chatName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const lastMsg = chat.last_message;
                      
                      // Calculate unread flag
                      const isUnread = lastMsg && lastMsg.sender_id !== user.id && (
                        !readTimes[chat.id] || new Date(lastMsg.created_at).getTime() > new Date(readTimes[chat.id]).getTime()
                      );

                      return (
                        <button
                          key={chat.id}
                          onClick={() => handleOpenChat(chat)}
                          className={`w-full text-left p-4 flex items-start gap-3 transition cursor-pointer border-l-3 ${
                            isUnread
                              ? 'bg-primary/5 dark:bg-primary/10 border-primary'
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:text-gold flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-inner">
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

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-bold text-xs text-gray-800 dark:text-white truncate">
                                {chatName}
                              </h4>
                              {lastMsg && (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary dark:bg-gold/10 dark:text-gold">
                                {getRoleLabel(senderRole)}
                              </span>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 bg-accent-red rounded-full"></span>
                              )}
                            </div>

                            <p className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-800 dark:text-slate-200' : 'text-gray-400'}`}>
                              {lastMsg ? lastMsg.content : 'Sin mensajes'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat View Popover Modal */}
              <AnimatePresence>
                {activeChat && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col z-20"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const otherParticipant = activeChat.participants?.find((p) => p.id !== user.id);
                          const chatName = activeChat.is_group
                            ? (activeChat.name || 'Grupo de la Iglesia')
                            : `${otherParticipant?.first_name || ''} ${otherParticipant?.last_name || 'Líder'}`;
                          const initials = chatName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                          return (
                            <>
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:text-gold flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative shadow-inner">
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
                              <div>
                                <h4 className="font-bold text-xs text-gray-850 dark:text-white truncate max-w-[150px]">
                                  {chatName}
                                </h4>
                                <span className="text-[10px] text-gray-400">Mensajes de Administración</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => setActiveChat(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Warning privacy banner */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 p-2 px-4 flex items-center gap-2">
                      <ShieldAlert className="text-amber-600 shrink-0" size={13} />
                      <p className="text-[9.5px] font-medium text-amber-800 dark:text-amber-300 leading-normal">
                        Mensajes efímeros: Se borrarán automáticamente después de {retentionDays} días.
                      </p>
                    </div>

                    {/* Messages History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/30">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="animate-spin text-primary" size={20} />
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-center py-10 text-xxs text-gray-400">Sin historial de mensajes</p>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg) => {
                            const isMe = msg.sender_id === user.id;

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                              >
                                <div className={`max-w-[85%] rounded-2xl p-2.5 shadow-xxs text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-105 border border-gray-150 dark:border-slate-800 rounded-tl-none'
                                }`}>
                                  <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <span className="text-[8px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && <CheckCheck size={8} />}
                                </span>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Quick Reply Form input */}
                    <div className="p-3 border-t border-gray-150 dark:border-slate-800 relative bg-white dark:bg-slate-950">
                      {/* Emoji Quick Shortcut */}
                      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-100 dark:border-slate-800 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setShowEmojis(!showEmojis)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <Smile size={15} />
                        </button>
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setReplyText(prev => prev + emoji)}
                            className="text-xs p-0.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Floating Grid Emojis */}
                      {showEmojis && (
                        <div className="absolute bottom-16 left-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 shadow-lg grid grid-cols-5 gap-2 z-30">
                          {EMOJIS.map(emoji => (
                            <button
                              key={`pop-${emoji}`}
                              onClick={() => {
                                setReplyText(prev => prev + emoji);
                                setShowEmojis(false);
                              }}
                              className="text-sm p-1 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer text-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <form onSubmit={handleSendReply} className="flex gap-2">
                        <label htmlFor="replyText" className="sr-only">Escribe una respuesta</label>
                        <input
                          id="replyText"
                          name="replyText"
                          autoComplete="off"
                          type="text"
                          placeholder="Escribe una respuesta..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-transparent dark:text-white focus:outline-none"
                          maxLength={1000}
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim() || sending}
                          className="p-2 bg-primary text-white hover:bg-primary/95 rounded-xl disabled:opacity-50 transition cursor-pointer shrink-0"
                        >
                          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
