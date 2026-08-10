import { Chord, Note } from '@tonaljs/tonal';
import type { InstrumentType } from './chordDictionary';
import { parseChord, transposeNote } from './musicEngine';

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!sharedContext) {
    const Context = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
    if (!Context) throw new Error('Web Audio API no está disponible.');
    sharedContext = new Context();
  }
  if (sharedContext.state === 'suspended') void sharedContext.resume();
  return sharedContext;
}

function midiForPitchClass(pitchClass: string, baseOctave: number): number | null {
  const midi = Note.midi(`${pitchClass}${baseOctave}`);
  return typeof midi === 'number' ? midi : null;
}

function oscillatorType(instrument: InstrumentType): OscillatorType {
  if (instrument === 'electrica') return 'sawtooth';
  if (instrument === 'bajo') return 'square';
  return instrument === 'piano' ? 'triangle' : 'sine';
}

export function playInstrumentChord(chordName: string, instrument: InstrumentType): void {
  const symbol = parseChord(chordName);
  if (!symbol) throw new Error(`No se pudo interpretar el acorde ${chordName}.`);
  const root = transposeNote(symbol.root, 0, symbol.root.includes('b') ? 'flat' : 'sharp', symbol.root);
  const parsed = Chord.get(`${root}${symbol.quality}`);
  if (parsed.empty || !parsed.notes.length) throw new Error(`No se pudo interpretar el acorde ${chordName}.`);
  const context = getContext();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(instrument === 'bajo' ? 0.16 : 0.11, context.currentTime + 0.015);
  const duration = instrument === 'piano' ? 1.8 : instrument === 'electrica' ? 2.2 : 1.45;
  master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  master.connect(context.destination);

  const baseOctave = instrument === 'bajo' ? 2 : instrument === 'ukelele' ? 4 : instrument === 'piano' ? 4 : 3;
  const voices = symbol.bass
    ? [{ note: transposeNote(symbol.bass, 0, symbol.bass.includes('b') ? 'flat' : 'sharp', symbol.bass), octave: Math.max(1, baseOctave - 1) }, ...parsed.notes.map((note) => ({ note, octave: baseOctave }))]
    : parsed.notes.map((note) => ({ note, octave: baseOctave }));
  voices.forEach(({ note, octave }, index) => {
    const midi = midiForPitchClass(note, octave);
    if (midi === null) return;
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = oscillatorType(instrument);
    oscillator.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), context.currentTime);
    voice.gain.setValueAtTime(0.0001, context.currentTime);
    const stagger = instrument === 'guitarra' || instrument === 'electrica' || instrument === 'ukelele' ? index * 0.028 : 0;
    voice.gain.exponentialRampToValueAtTime(0.8 / voices.length, context.currentTime + stagger + 0.012);
    voice.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(voice).connect(master);
    oscillator.start(context.currentTime + stagger);
    oscillator.stop(context.currentTime + duration + 0.08);
  });
}
