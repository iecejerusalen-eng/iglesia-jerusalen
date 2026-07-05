import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

export function NotificationCenter() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup Realtime subscription for new notifications
      const channel = supabase.channel(`public:lms_notifications:user_id=eq.${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'lms_notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lms_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lms_notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      await supabase
        .from('lms_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('lms_notifications').delete().eq('id', id);
      const isUnread = notifications.find(n => n.id === id && !n.is_read);
      if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gold transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Notificaciones
              {unreadCount > 0 && (
                <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Check size={14} /> Marcar todo
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Bell size={32} className="opacity-20 mb-3" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 flex gap-3 group transition-colors ${
                      notif.is_read ? 'bg-white dark:bg-slate-900 opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10'
                    }`}
                  >
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">{notif.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{notif.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                          {new Date(notif.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </span>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.is_read && (
                            <button onClick={() => markAsRead(notif.id)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded" title="Marcar como leída">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteNotification(notif.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {notif.link && (
                        <Link 
                          to={notif.link}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-gold hover:underline"
                        >
                          Ver detalle <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
