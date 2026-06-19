import { create } from 'zustand';

interface LiveModeState {
  isLiveModeActive: boolean;
  liveYoutubeUrl: string;
  liveAnnouncement: string;
  activeSongId: string | null;
  setLiveModeActive: (active: boolean) => void;
  setLiveYoutubeUrl: (url: string) => void;
  setLiveAnnouncement: (announcement: string) => void;
  setActiveSongId: (songId: string | null) => void;
}

export const useLiveModeStore = create<LiveModeState>((set) => ({
  isLiveModeActive: false,
  liveYoutubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // default live stream URL / fallback
  liveAnnouncement: '¡Bienvenidos al servicio de hoy! Te invitamos a adorar a Dios con nosotros y escribir tus notas.',
  activeSongId: null,

  setLiveModeActive: (active) => set({ isLiveModeActive: active }),
  setLiveYoutubeUrl: (url) => set({ liveYoutubeUrl: url }),
  setLiveAnnouncement: (announcement) => set({ liveAnnouncement: announcement }),
  setActiveSongId: (songId) => set({ activeSongId: songId }),
}));
