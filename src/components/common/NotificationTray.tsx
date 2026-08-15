import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../config/supabase";
import {
  useChats,
  useChatMessages,
  useChatMutations,
  useChatRetentionDays,
  useChatRealtime,
} from "../../features/chat/hooks";
import {
  Bell,
  MessageSquare,
  X,
  Send,
  Smile,
  ShieldAlert,
  Loader2,
  CheckCheck,
  Award,
  Calendar,
  Volume2,
  Gift,
  Archive,
  Inbox,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import type { Chat } from "../../types";

interface NotificationLog {
  id: string;
  type: "whatsapp" | "push";
  title: string;
  message: string;
  recipient_group: string;
  status: "enviado" | "fallido" | "programado";
  created_at: string;
  scheduled_at?: string | null;
  category?:
    "general" | "cumpleanos" | "aniversario" | "reunion" | "evento" | null;
  target_ministry_id?: string | null;
  announcement_id?: string | null;
  announcement_expires_at?: string | null;
}

const EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🙌", "🎉", "🌟", "⚠️"];

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Administrador";
    case "pastor":
      return "Pastor";
    case "leader":
      return "Líder";
    case "secretary":
    case "secretaria":
      return "Secretaría";
    default:
      return "Líder/Staff";
  }
};

export default function NotificationTray() {
  const { user, role, ministryId } = useAuthStore();
  const { activeChat, setActiveChat } = useChatStore();

  const {
    data: chats = [],
    isLoading: loadingChats,
    refetch: fetchChats,
  } = useChats();
  const { data: messages = [], isLoading: loadingMessages } = useChatMessages(
    activeChat?.id,
  );
  const { data: retentionDays = 7 } = useChatRetentionDays();
  const { sendMessage } = useChatMutations();

  useChatRealtime(activeChat?.id || null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "announcements">(
    "chats",
  );
  const [replyText, setReplyText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentTime] = useState(() => Date.now());

  // Announcements local state
  const [announcements, setAnnouncements] = useState<NotificationLog[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);

  // Local state for read timestamps
  const [readTimes, setReadTimes] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load read times and dismissed announcements from localStorage
  useEffect(() => {
    const storedRead = localStorage.getItem("jerusalen_chat_read_times");
    if (storedRead) {
      try {
        window.setTimeout(() => setReadTimes(JSON.parse(storedRead)), 0);
      } catch (e) {
        console.error(e);
      }
    }

    const storedDismissed = localStorage.getItem(
      "jerusalen_dismissed_announcements",
    );
    if (storedDismissed) {
      try {
        window.setTimeout(() => setDismissedIds(JSON.parse(storedDismissed)), 0);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch chats and subscribe on mount / login
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // Scroll active chat modal to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  if (!user) return null;

  async function fetchAnnouncements() {
    if (!user) return;
    setLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("type", "push")
        .eq("status", "enviado")
        .or(`announcement_expires_at.is.null,announcement_expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const logs = (data ?? []) as NotificationLog[];
      setAnnouncements(logs);
      const now = new Date().toISOString();
      setReadAnnouncementIds(logs.map((log) => log.id));
      if (logs.length) {
        const { error: markReadError } = await supabase
          .from("notification_reads")
          .upsert(
            logs.map((log) => ({
              notification_id: log.id,
              user_id: user.id,
              read_at: now,
            })),
            { onConflict: "notification_id,user_id" },
          );
        if (markReadError)
          console.warn(
            "No se pudieron sincronizar las lecturas de avisos.",
            markReadError,
          );
      }
      const { data: readRows, error: readError } = await supabase
        .from("notification_reads")
        .select("notification_id, dismissed_at")
        .eq("user_id", user.id)
        .in(
          "notification_id",
          logs.map((log) => log.id),
        );
      if (readError) {
        console.warn(
          "No se pudieron sincronizar las lecturas de avisos; se usará el estado local.",
          readError,
        );
      } else {
        setReadAnnouncementIds(
          (readRows ?? []).map((row) => row.notification_id),
        );
        const remoteDismissed = (readRows ?? [])
          .filter((row) => row.dismissed_at)
          .map((row) => row.notification_id);
        setDismissedIds((current) =>
          Array.from(new Set([...current, ...remoteDismissed])),
        );
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setAnnouncementError(err instanceof Error ? err.message : "No se pudieron cargar los avisos.");
    } finally {
      setLoadingAnnouncements(false);
    }
  }
  const handleDismissAnnouncement = async (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem(
      "jerusalen_dismissed_announcements",
      JSON.stringify(updated),
    );
    const { error } = await supabase
      .from("notification_reads")
      .upsert(
        {
          notification_id: id,
          user_id: user.id,
          read_at: new Date().toISOString(),
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: "notification_id,user_id" },
      );
    if (error)
      console.warn(
        "El aviso se archivó localmente, pero no se sincronizó.",
        error,
      );
    toast.success("Aviso archivado.");
  };

  // Calculate unread chats count
  const unreadChats = chats.filter((chat) => {
    const lastMsg = chat.last_message;
    if (!lastMsg) return false;
    if (lastMsg.sender_id === user.id) return false;

    const lastRead = readTimes[chat.id];
    if (!lastRead) return true;

    return (
      new Date(lastMsg.created_at).getTime() > new Date(lastRead).getTime()
    );
  });

  const unreadChatsCount = unreadChats.length;

  // Process & filter announcements
  const activeAnnouncements = announcements.filter(
    (ann) => !dismissedIds.includes(ann.id),
  );

  const visibleAnnouncements = activeAnnouncements.filter((ann) => {
    // Safety check for scheduled releases in future
    if (ann.scheduled_at && new Date(ann.scheduled_at).getTime() > currentTime) {
      return false;
    }

    const group = ann.recipient_group;
    if (!group) return true;

    if (group === "Todos los Miembros" || group === "todos") {
      return true;
    }

    if (group === "Líderes de Ministerios" || group === "lideres") {
      return [
        "admin",
        "pastor",
        "secretary",
        "secretaria",
        "editor",
        "leader",
      ].includes(role || "");
    }

    if (
      group.startsWith("Miembros del Ministerio:") &&
      ann.target_ministry_id
    ) {
      return ministryId === ann.target_ministry_id;
    }

    return true;
  });

  const unreadAnnouncementsCount = visibleAnnouncements.filter(
    (ann) => !readAnnouncementIds.includes(ann.id),
  ).length;
  const totalUnreadCount = unreadChatsCount + unreadAnnouncementsCount;

  const handleOpenChat = (chat: Chat) => {
    setActiveChat(chat);

    // Mark as read
    const nowISO = new Date().toISOString();
    const updatedReadTimes = { ...readTimes, [chat.id]: nowISO };
    setReadTimes(updatedReadTimes);
    localStorage.setItem(
      "jerusalen_chat_read_times",
      JSON.stringify(updatedReadTimes),
    );
    void supabase
      .from("chat_read_states")
      .upsert(
        { chat_id: chat.id, user_id: user.id, read_at: nowISO },
        { onConflict: "chat_id,user_id" },
      )
      .then(({ error }) => {
        if (error)
          console.warn(
            "La conversación se marcó localmente, pero no se sincronizó.",
            error,
          );
      });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !replyText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage.mutateAsync({
        chatId: activeChat.id,
        content: replyText.trim(),
      });
      setReplyText("");
      setShowEmojis(false);

      const nowISO = new Date().toISOString();
      const updatedReadTimes = { ...readTimes, [activeChat.id]: nowISO };
      setReadTimes(updatedReadTimes);
      localStorage.setItem(
        "jerusalen_chat_read_times",
        JSON.stringify(updatedReadTimes),
      );
    } catch (err: unknown) {
      toast.error(
        "No se pudo enviar la respuesta: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setSending(false);
    }
  };

  // Helper for rendering category icons and colors
  const getAnnouncementStyles = (category: string | null | undefined) => {
    switch (category) {
      case "cumpleanos":
        return {
          icon: <Gift className="text-pink-600 dark:text-pink-400" size={16} />,
          bgColor:
            "bg-pink-50/70 border-pink-100 dark:bg-pink-950/10 dark:border-pink-900/30",
          badgeText: "Cumpleaños",
        };
      case "aniversario":
        return {
          icon: (
            <Award className="text-amber-600 dark:text-amber-400" size={16} />
          ),
          bgColor:
            "bg-amber-50/70 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30",
          badgeText: "Aniversario",
        };
      case "reunion":
        return {
          icon: (
            <Calendar className="text-blue-600 dark:text-blue-400" size={16} />
          ),
          bgColor:
            "bg-blue-50/70 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30",
          badgeText: "Reunión",
        };
      case "evento":
        return {
          icon: (
            <Calendar
              className="text-purple-600 dark:text-purple-400"
              size={16}
            />
          ),
          bgColor:
            "bg-purple-50/70 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/30",
          badgeText: "Evento Especial",
        };
      default:
        return {
          icon: <Volume2 className="text-primary dark:text-gold" size={16} />,
          bgColor:
            "bg-indigo-50/50 border-indigo-100 dark:bg-slate-900 dark:border-slate-800/80",
          badgeText: "Anuncio",
        };
    }
  };

  return (
    <>
      {/* Bell Notification Button */}
      <button
        type="button"
        onClick={() => {
          fetchChats();
          setIsOpen(true);
        }}
        className="relative grid size-10 place-items-center rounded-2xl border border-transparent text-gray-650 transition hover:border-slate-200 hover:bg-gray-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:text-white dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-gold"
        title="Bandeja de Mensajes y Avisos"
        aria-label={`Abrir mensajes y avisos${totalUnreadCount > 0 ? `, ${totalUnreadCount} pendientes` : ''}`}
      >
        <Bell size={19} strokeWidth={1.8} />
        {totalUnreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[8px] font-black leading-3 text-white dark:border-slate-950">
            {totalUnreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Panel */}
      <div
        role="presentation"
        className={`fixed inset-0 z-[100] flex justify-end transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          onClick={() => {
            setIsOpen(false);
            setActiveChat(null);
          }}
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? "opacity-45" : "opacity-0"}`}
        />

        {/* Tray Content */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-tray-title"
          className={`relative flex h-full w-full max-w-[min(100vw,30rem)] flex-col border-l border-slate-200/80 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#0d172b] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Drawer Header */}
          <div className="border-b border-slate-200/80 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[#080f20]/95 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <Bell size={19} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 id="notification-tray-title" className="truncate font-serif text-base font-bold text-slate-950 dark:text-white">
                Notificaciones de la Iglesia
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Tu bandeja de mensajes y avisos importantes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setActiveChat(null); }}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Cerrar bandeja de notificaciones"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{totalUnreadCount > 0 ? `${totalUnreadCount} pendientes de revisar` : 'Todo al día'}</span>
            </div>
          </div>

          {/* Double-Tab Menu */}
          <div className="border-b border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-[#0a1426] sm:px-5">
            <div className="flex gap-1 rounded-2xl bg-slate-200/60 p-1 dark:bg-white/[0.06]">
            <button
              onClick={() => setActiveTab("chats")}
              type="button"
              className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "chats"
                  ? "bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-gold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <MessageSquare size={14} />
              <span>Mensajes</span>
              {unreadChatsCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {unreadChatsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("announcements");
                void fetchAnnouncements();
              }}
              type="button"
              className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "announcements"
                  ? "bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-gold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Volume2 size={14} />
              <span>Avisos Generales</span>
              {unreadAnnouncementsCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 dark:bg-[#0d172b]">
            {activeTab === "chats" ? (
              /* TAB 1: CHATS */
              loadingChats ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-xs text-gray-400">
                    Buscando mensajes...
                  </span>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-20 px-6 space-y-3">
                  <MessageSquare
                    className="mx-auto text-gray-300 dark:text-slate-700"
                    size={38}
                  />
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-350">
                    Sin conversaciones todavía
                  </p>
                  <p className="text-xxs text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                    Aquí aparecerán los mensajes directos enviados por los
                    pastores y líderes de la congregación.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3 animate-fadeIn sm:p-4">
                  {chats.map((chat) => {
                    const otherParticipant = chat.participants?.find(
                      (p) => p.id !== user.id,
                    );
                    const chatName = chat.is_group
                      ? chat.name || "Grupo de la Iglesia"
                      : `${otherParticipant?.first_name || ""} ${otherParticipant?.last_name || "Líder"}`;
                    const senderRole = otherParticipant?.role || "leader";

                    const initials = chatName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const lastMsg = chat.last_message;

                    const isUnread =
                      lastMsg &&
                      lastMsg.sender_id !== user.id &&
                      (!readTimes[chat.id] ||
                        new Date(lastMsg.created_at).getTime() >
                          new Date(readTimes[chat.id]).getTime());

                    return (
                      <button
                        key={chat.id}
                        onClick={() => handleOpenChat(chat)}
                        className={`group w-full rounded-2xl border p-3.5 text-left flex items-start gap-3 transition cursor-pointer ${
                          isUnread
                            ? "border-primary/30 bg-primary/[0.07] shadow-sm dark:border-blue-400/25 dark:bg-blue-400/[0.08]"
                            : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-2xl bg-primary/10 text-primary shadow-inner dark:bg-blue-400/10 dark:text-gold">
                          {otherParticipant?.photo_url ? (
                            <img
                              loading="lazy"
                              src={otherParticipant.photo_url}
                              alt={chatName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {chatName}
                            </h4>
                            {lastMsg && (
                              <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                {new Date(
                                  lastMsg.created_at,
                                ).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary dark:bg-gold/10 dark:text-gold">
                              {getRoleLabel(senderRole)}
                            </span>
                            {isUnread && (
                              <span className="size-1.5 rounded-full bg-rose-500" aria-label="No leído" />
                            )}
                          </div>

                          <p
                            className={`truncate text-xs leading-5 ${isUnread ? "font-semibold text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            {lastMsg ? lastMsg.content : "Sin mensajes"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : /* TAB 2: ANNOUNCEMENTS */
            loadingAnnouncements ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="text-xs text-gray-455">
                  Buscando avisos...
                </span>
              </div>
            ) : announcementError ? (
              <div className="mx-3 my-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-400/20 dark:bg-rose-400/10 sm:mx-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 shrink-0 text-rose-500" size={18} />
                  <div>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-100">No pudimos cargar los avisos</p>
                    <p className="mt-1 text-xs leading-5 text-rose-700 dark:text-rose-200/80">Comprueba tu conexión e inténtalo de nuevo.</p>
                    <button type="button" onClick={() => void fetchAnnouncements()} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white transition hover:bg-rose-700">
                      <RefreshCw size={13} /> Reintentar
                    </button>
                  </div>
                </div>
              </div>
            ) : visibleAnnouncements.length === 0 ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center px-6 text-center animate-fadeIn">
                <span className="grid size-16 place-items-center rounded-3xl border border-slate-200 bg-white text-slate-400 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500">
                  <Inbox size={29} strokeWidth={1.6} />
                </span>
                <p className="mt-4 text-sm font-bold text-slate-800 dark:text-white">No hay avisos pendientes</p>
                <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-500 dark:text-slate-400">Los comunicados generales aparecerán aquí cuando la iglesia publique uno.</p>
              </div>
            ) : (
              <div className="space-y-3 p-3 animate-fadeIn sm:p-4">
                {visibleAnnouncements.map((ann) => {
                  const styles = getAnnouncementStyles(ann.category);
                  const isUnread = !readAnnouncementIds.includes(ann.id);
                  return (
                    <div
                      key={ann.id}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md space-y-3 ${isUnread ? "border-primary/25 bg-primary/[0.05] shadow-sm dark:border-blue-400/20 dark:bg-blue-400/[0.06]" : "border-slate-200/80 bg-white/75 dark:border-white/10 dark:bg-white/[0.03]"}`}
                    >
                      {/* Card header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          {styles.icon}
                          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                            {styles.badgeText}
                          </span>
                          {isUnread && <span className="size-1.5 rounded-full bg-rose-500" aria-label="No leído" />}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDismissAnnouncement(ann.id)}
                          className="grid size-8 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                          title="Archivar aviso"
                          aria-label={`Archivar aviso ${ann.title}`}
                        >
                          <Archive size={14} />
                        </button>
                      </div>

                      {/* Title & Body */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                          {ann.title}
                        </h4>
                        <p className="break-words whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {ann.message}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400 dark:border-white/10 dark:text-slate-500">
                        <span>
                          {new Date(ann.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {ann.announcement_id && <Link to={`/anuncios#${ann.announcement_id}`} onClick={() => setIsOpen(false)} className="font-bold text-blue-700 hover:underline dark:text-amber-300">Ver anuncio</Link>}
                        <span className="font-semibold text-slate-450 dark:text-slate-500">
                          Iglesia Jerusalén
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat View Popover Modal */}
          <div
            className={`absolute inset-0 z-20 flex flex-col bg-slate-50 dark:bg-[#0d172b] transition-all duration-300 ${
              activeChat
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 p-4 dark:border-white/10 dark:bg-[#080f20]/95">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveChat(null)}
                  className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Volver a la bandeja"
                >
                  <ChevronLeft size={19} />
                </button>
                {activeChat &&
                  (() => {
                    const otherParticipant = activeChat.participants?.find(
                      (p) => p.id !== user.id,
                    );
                    const chatName = activeChat.is_group
                      ? activeChat.name || "Grupo de la Iglesia"
                      : `${otherParticipant?.first_name || ""} ${otherParticipant?.last_name || "Líder"}`;
                    const initials = chatName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:text-gold flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative shadow-inner">
                          {otherParticipant?.photo_url ? (
                            <img
                              loading="lazy"
                              src={otherParticipant.photo_url}
                              alt={chatName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="max-w-[180px] truncate text-sm font-bold text-slate-900 dark:text-white">
                            {chatName}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            Conversación privada
                          </span>
                        </div>
                      </>
                    );
                  })()}
              </div>
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Cerrar conversación"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning privacy banner */}
            <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/80 p-3 px-4 dark:border-amber-400/15 dark:bg-amber-400/[0.08]">
              <ShieldAlert className="text-amber-600 shrink-0" size={13} />
              <p className="text-[10px] font-medium leading-4 text-amber-800 dark:text-amber-300">
                Mensajes efímeros: Se borrarán automáticamente después de{" "}
                {retentionDays} días.
              </p>
            </div>

            {/* Messages History */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4 dark:bg-[#0d172b]">
              {loadingMessages ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center py-10 text-xxs text-gray-400">
                  Sin historial de mensajes
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-5 shadow-sm ${
                            isMe
                              ? "rounded-tr-md bg-primary text-white"
                              : "rounded-tl-md border border-slate-200/80 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-[8px] text-gray-450 dark:text-gray-400 mt-1 px-1 flex items-center gap-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
            <div className="relative border-t border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-[#080f20]">
              {/* Emoji Quick Shortcut */}
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-100 dark:border-slate-800 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Mostrar emojis"
                >
                  <Smile size={15} />
                </button>
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setReplyText((prev) => prev + emoji)}
                  type="button"
                  className="rounded-lg p-1 text-xs transition hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Floating Grid Emojis */}
              {showEmojis && (
                <div className="absolute bottom-16 left-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 shadow-lg grid grid-cols-5 gap-2 z-30">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={`pop-${emoji}`}
                      onClick={() => {
                        setReplyText((prev) => prev + emoji);
                        setShowEmojis(false);
                      }}
                      className="text-sm p-1 hover:bg-gray-55 dark:hover:bg-slate-700 rounded cursor-pointer text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendReply} className="flex gap-2">
                <label htmlFor="replyText" className="sr-only">
                  Escribe una respuesta
                </label>
                <input
                  id="replyText"
                  name="replyText"
                  autoComplete="off"
                  type="text"
                  placeholder="Escribe una respuesta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                  className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  maxLength={1000}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="p-2 bg-primary text-white hover:bg-primary/95 rounded-xl disabled:opacity-50 transition cursor-pointer shrink-0"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
