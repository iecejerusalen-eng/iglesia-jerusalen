import { useState } from 'react';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

interface SendNotificationParams {
  userId: string;
  userEmail: string;
  userName: string;
  courseName: string;
  type: 'missing_homework' | 'attendance_alert';
  extraData?: Record<string, unknown>;
}

export function useNotifications() {
  const [isSending, setIsSending] = useState(false);

  const sendNotification = async (params: SendNotificationParams) => {
    setIsSending(true);
    try {
      let subject = 'Notificación de la Iglesia Jerusalén';
      let template = 'general_notification';
      const data: Record<string, unknown> = {
        studentName: params.userName,
        courseName: params.courseName,
      };

      if (params.type === 'missing_homework') {
        subject = `Alerta Académica: Tareas Pendientes en ${params.courseName}`;
        template = 'missing_homework';
        data.missingTasksCount = params.extraData?.missingTasksCount || 1;
      } else if (params.type === 'attendance_alert') {
        subject = `Alerta de Inasistencia en ${params.courseName}`;
        template = 'attendance_alert';
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.userEmail,
          subject,
          template,
          data,
        },
      });

      if (error) {
        throw error;
      }

      toast.success(`Notificación enviada a ${params.userName}`);
      return true;
    } catch (err: unknown) {
      console.error('Error enviando notificación:', err);
      toast.error('Hubo un error al enviar la notificación. ¿Está configurado Resend?');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendNotification,
    isSending,
  };
}
