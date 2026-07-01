import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, Send } from 'lucide-react';
import { pushService } from '../../../../services/pushService';
import { toast } from 'sonner';
import { useAuthStore } from '../../../../store/useAuthStore';

const NotificationsTab = () => {
  const [isSupported, setIsSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supported = pushService.isSupported();
      setIsSupported(supported);
      if (supported) {
        // Chequear estado en base de datos o por service worker
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (e) {
          console.error(e);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    if (isSubscribed) {
      const success = await pushService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        toast.success('Notificaciones desactivadas correctamente');
      } else {
        toast.error('Error al desactivar las notificaciones');
      }
    } else {
      const success = await pushService.subscribe();
      if (success) {
        setIsSubscribed(true);
        toast.success('Notificaciones activadas correctamente');
      } else {
        toast.error('Error al activar. Asegúrate de dar permiso en el navegador.');
      }
    }
    setIsLoading(false);
  };

  const handleTestPush = async () => {
    try {
      const { supabase } = await import('../../../../config/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('send-web-push', {
        body: {
          userId: session.user.id,
          title: 'Prueba de Notificación',
          body: '¡Las notificaciones Push están funcionando correctamente!',
        }
      });

      if (response.error) throw response.error;
      toast.success('Notificación de prueba enviada');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la prueba');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="text-primary" />
          Notificaciones Push
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Recibe alertas en tu dispositivo incluso cuando la aplicación está cerrada.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Habilitar notificaciones en este dispositivo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isSupported ? 'Requiere permiso del navegador.' : 'Tu navegador no soporta notificaciones Push Web.'}
            </p>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={!isSupported || isLoading}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
              isSubscribed ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={handleTestPush}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Enviar notificación de prueba a mi dispositivo
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-primary/20 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Send size={18} className="text-primary" />
            Enviar Anuncio Global
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Envía una notificación push a todos los dispositivos suscritos. Úsalo con precaución para no saturar a los usuarios.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Ej. Nuevo Sermón Disponible"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mensaje
              </label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Detalles del anuncio..."
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>
            
            <button
              onClick={async () => {
                if (!broadcastTitle || !broadcastBody) return toast.error('El título y mensaje son obligatorios');
                setIsSending(true);
                try {
                  const { supabase } = await import('../../../../config/supabase');
                  const response = await supabase.functions.invoke('send-web-push', {
                    body: { title: broadcastTitle, body: broadcastBody }
                  });
                  if (response.error) throw response.error;
                  toast.success(`Notificación enviada a ${response.data.sent} dispositivos.`);
                  setBroadcastTitle('');
                  setBroadcastBody('');
                } catch (e) {
                  console.error(e);
                  toast.error('Error al enviar anuncio global');
                } finally {
                  setIsSending(false);
                }
              }}
              disabled={isSending || !broadcastTitle || !broadcastBody}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSending ? 'Enviando...' : 'Transmitir Mensaje'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsTab;
