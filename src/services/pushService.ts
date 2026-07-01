import { supabase } from '../config/supabase';

// Convierte la VAPID public key de base64 a Uint8Array (requerido por pushManager)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  // Comprueba si el navegador soporta Web Push
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Obtiene el estado actual del permiso
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Solicita permiso y se suscribe al servicio Push del navegador
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID Public Key no encontrada en .env');
        return false;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      return await this.saveSubscriptionToDatabase(subscription);
    } catch (error) {
      console.error('Error al suscribirse a Push Notifications:', error);
      return false;
    }
  },

  // Desuscribe el navegador actual
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Eliminar de BD
        await this.removeSubscriptionFromDatabase(subscription.endpoint);
        // Desuscribir en el navegador
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al desuscribirse:', error);
      return false;
    }
  },

  // Guarda la suscripción en Supabase ligada al usuario actual
  async saveSubscriptionToDatabase(subscription: PushSubscription): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const subJSON = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
      }, { onConflict: 'endpoint' });

      if (error) {
        console.error('Supabase error guardando suscripción:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error guardando en BD:', error);
      return false;
    }
  },

  // Elimina la suscripción de la base de datos
  async removeSubscriptionFromDatabase(endpoint: string): Promise<void> {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
};
