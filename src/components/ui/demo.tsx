import VideoThumbnailPlayer from "@/components/ui/video-thumbnail-player";
import VideoPlayer from "@/components/ui/video-player";

export default function VideoPlayerDemo() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-10">
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
