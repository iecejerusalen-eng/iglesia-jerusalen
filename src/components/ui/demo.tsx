import React, { useState } from "react";
import VideoThumbnailPlayer from "@/components/ui/video-thumbnail-player";
import VideoPlayer from "@/components/ui/video-player";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BottomAlertToast, type AlertType } from "@/components/ui/bottom-alert-toast";

export default function UIComponentsDemo() {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<AlertType>("info");
  const [toastMessage, setToastMessage] = useState({ title: "", description: "" });

  const triggerToast = (type: AlertType, title: string, description: string) => {
    setToastType(type);
    setToastMessage({ title, description });
    setToastOpen(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-12">
      {/* Sistema de Alertas Inferior Centrado */}
      <div className="space-y-4 p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sistema de Alertas Flotantes (Abajo - Centro)</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Alertas pequeñas en el centro inferior de la pantalla con animación suave desde abajo y disolución al cerrar.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => triggerToast("info", "Información importante", "Tu sesión vencerá en 10 minutos.")}
            variant="outline"
          >
            Alerta Info
          </Button>

          <Button
            onClick={() => triggerToast("success", "¡Cambios guardados!", "Tu perfil se actualizó correctamente.")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Alerta Éxito
          </Button>

          <Button
            onClick={() => triggerToast("warning", "Advertencia de conexión", "Tu señal de internet es inestable.")}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Alerta Advertencia
          </Button>

          <Button
            onClick={() => triggerToast("error", "Error al procesar", "No se pudo realizar el pago. Inténtalo de nuevo.")}
            variant="destructive"
          >
            Alerta Error
          </Button>

          {/* AlertDialog con Shadcn API */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Abrir Alert Dialog (Diálogo de Confirmación)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent position="bottom-center">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la información seleccionada de nuestros servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter variant="bare">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Componente Toast Activo */}
      <BottomAlertToast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastMessage.title}
        description={toastMessage.description}
        type={toastType}
        autoHideDuration={4000}
      />

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">1. Reproductor con Portada / Thumbnail (Modal)</h2>
        <VideoThumbnailPlayer
          thumbnailUrl="https://images.unsplash.com/photo-1593642532454-e138e28a63f4?q=80&w=2069&auto=format&fit=crop"
          videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Building the Future"
          description="A look into modern architecture and design."
          className="rounded-xl"
          mode="modal"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">2. Reproductor con Portada / Thumbnail (Inline)</h2>
        <VideoThumbnailPlayer
          videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Prédica en Vivo - Iglesia Jerusalén"
          description="Transmisión especial del servicio dominical."
          className="rounded-xl"
          mode="inline"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">3. Reproductor Directo de Video</h2>
        <VideoPlayer
          src="https://videos.pexels.com/video-files/30333849/13003128_2560_1440_25fps.mp4"
          title="Video Directo en Alta Definición"
        />
      </div>
    </div>
  );
}
