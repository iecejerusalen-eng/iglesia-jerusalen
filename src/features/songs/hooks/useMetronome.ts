import { useState, useEffect, useRef, useCallback } from 'react';

export const useMetronome = (bpm: number | null) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIDRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const lookahead = 25.0;
  const scheduleAheadTime = 0.1; 

  const playClick = useCallback((beatIndex: number, time: number) => {
    if (!audioContextRef.current || isMuted) return;
    
    // Create an oscillator for a short click sound
    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();
    
    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);
    
    // Beat 1 has a higher pitch
    if (beatIndex === 0) {
      osc.frequency.value = 1200.0;
    } else {
      osc.frequency.value = 800.0;
    }
    
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    
    osc.start(time);
    osc.stop(time + 0.03);
  }, [isMuted]);

  useEffect(() => {
    if (isPlaying && bpm) {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      currentBeatRef.current = 0;
      
      const scheduler = () => {
        if (!bpm || !audioContextRef.current) return;
        
        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
          playClick(currentBeatRef.current, nextNoteTimeRef.current);
          
          const beatForState = (currentBeatRef.current % 4) + 1; // 4/4 time signature
          setCurrentBeat(beatForState);
          
          const secondsPerBeat = 60.0 / bpm;
          nextNoteTimeRef.current += secondsPerBeat;
          currentBeatRef.current = (currentBeatRef.current + 1) % 4; // Loop 0, 1, 2, 3
        }
        
        timerIDRef.current = window.setTimeout(scheduler, lookahead);
      };
      
      scheduler();
    } else {
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
    }
    
    return () => {
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
    };
  }, [isPlaying, bpm, playClick]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  const togglePlay = () => {
    setIsPlaying(prev => {
      if (!prev) {
        setCurrentBeat(1);
      }
      return !prev;
    });
  };
  const toggleMute = () => setIsMuted(prev => !prev);

  return {
    isPlaying,
    isMuted,
    currentBeat,
    togglePlay,
    toggleMute,
    stop: () => setIsPlaying(false)
  };
};
