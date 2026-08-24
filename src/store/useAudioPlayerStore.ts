import { create } from 'zustand';
import type { AudioChapter } from '../features/podcast/types';

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  audio_url: string;
  cover_image_url?: string;
  chapters?: AudioChapter[];
  duration?: number;
}

interface AudioPlayerState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  isMinimized: boolean;
  
  // Actions
  playTrack: (track: AudioTrack) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  seek: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleMinimize: () => void;
  close: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  speed: 1,
  isMinimized: false,

  playTrack: (track) => set({
    currentTrack: track,
    isPlaying: true,
    currentTime: 0,
    isMinimized: false,
  }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  pause: () => set({ isPlaying: false }),
  play: () => set({ isPlaying: true }),
  
  seek: (seconds) => set({ currentTime: seconds }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
  close: () => set({ currentTrack: null, isPlaying: false, currentTime: 0 }),
}));
