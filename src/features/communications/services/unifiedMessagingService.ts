import { formatWhatsAppLink } from '../../../utils/whatsapp';

export type MessagingChannel = 'whatsapp' | 'email' | 'push';

export interface ChurchMessageTemplateOptions {
  type: 'birthday' | 'sunday_service' | 'volunteer_shift' | 'devotional' | 'general';
  recipientName: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  customText?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
}

export interface DispatchResult {
  success: boolean;
  channel: MessagingChannel;
  actionUrl?: string;
  message?: string;
}

/**
 * Servicio Unificado de Mensajería
 * Centraliza el envío y formateo de avisos a través de WhatsApp, Email y Web Push.
 */
export class UnifiedMessagingService {
  /**
   * Genera el texto del mensaje según la plantilla institucional seleccionada.
   */
  static buildTemplateText(options: ChurchMessageTemplateOptions): string {
    const name = options.recipientName.trim() || 'Estimado(a) hermano(a)';
    
    switch (options.type) {
      case 'birthday':
        return `¡Feliz Cumpleaños, ${name}! 🎉🎂\n\nToda la familia de la Iglesia Jerusalén se alegra contigo en este día especial. Oramos para que Dios continúe bendiciendo tu vida y guíe cada uno de tus pasos.\n\n"Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti" — Números 6:24-25.`;

      case 'sunday_service':
        return `Hola ${name} 👋\n\nTe recordamos nuestro próximo culto de adoración en la Iglesia Jerusalén.\n\n📅 Fecha: ${options.eventDate || 'Este domingo'}\n⏰ Hora: ${options.eventTime || '10:00 AM'}\n📍 Lugar: ${options.location || 'Templo Principal'}\n\n¡Te esperamos con los brazos abiertos!`;

      case 'volunteer_shift':
        return `Hola ${name} ✨\n\nGracias por servir en la obra del Señor. Este es un recordatorio de tu turno de voluntariado:\n\n📌 Ministerio: ${options.customText || 'Servicio General'}\n📅 Fecha: ${options.eventDate || 'Próximo culto'}\n⏰ Hora de llegada: ${options.eventTime || '30 minutos antes'}\n\nQue el Señor recompense tu fidelidad.`;

      case 'devotional':
        return `Devocional del Día 📖\n\nHola ${name},\n\n${options.customText || 'Medita en la Palabra de Dios hoy y comparte su amor con quienes te rodean.'}\n\nIglesia Jerusalén — Una familia de fe.`;

      default:
        return options.customText || `Hola ${name}, te saludamos con la paz del Señor desde la Iglesia Jerusalén.`;
    }
  }

  /**
   * Prepara y genera el enlace de acción para WhatsApp
   */
  static sendWhatsApp(options: ChurchMessageTemplateOptions): DispatchResult {
    if (!options.phone) {
      return { success: false, channel: 'whatsapp', message: 'El número de teléfono no fue proporcionado.' };
    }

    const text = this.buildTemplateText(options);
    const url = formatWhatsAppLink(options.phone, options.countryCode, text);

    return {
      success: true,
      channel: 'whatsapp',
      actionUrl: url,
      message: 'Enlace de WhatsApp generado correctamente.'
    };
  }

  /**
   * Envía o prepara un correo transaccional (Resend / API Backend)
   */
  static async sendEmail(options: ChurchMessageTemplateOptions, subject?: string): Promise<DispatchResult> {
    if (!options.email) {
      return { success: false, channel: 'email', message: 'El correo electrónico no fue proporcionado.' };
    }

    const text = this.buildTemplateText(options);
    const defaultSubject = subject || `Mensaje de la Iglesia Jerusalén para ${options.recipientName}`;

    try {
      const mailtoUrl = `mailto:${encodeURIComponent(options.email)}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(text)}`;
      
      return {
        success: true,
        channel: 'email',
        actionUrl: mailtoUrl,
        message: 'Cliente de correo listo para el envío.'
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        message: error instanceof Error ? error.message : 'Error al despachar el correo.'
      };
    }
  }

  /**
   * Despacha una notificación emergente Web Push (VAPID)
   */
  static async sendWebPush(title: string, body: string, icon = '/favicon.svg'): Promise<DispatchResult> {
    if (!('Notification' in window)) {
      return { success: false, channel: 'push', message: 'El navegador no soporta notificaciones Push.' };
    }

    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
        return { success: true, channel: 'push', message: 'Notificación enviada al dispositivo.' };
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, icon });
          return { success: true, channel: 'push', message: 'Notificación enviada.' };
        }
      }
      return { success: false, channel: 'push', message: 'Permiso de notificaciones denegado por el usuario.' };
    } catch (error) {
      return { success: false, channel: 'push', message: error instanceof Error ? error.message : 'Error al enviar notificación push.' };
    }
  }
}
