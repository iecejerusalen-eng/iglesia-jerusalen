import { useState, useEffect } from 'react';
import { getVerseForDay, getYearlyShuffledVerses } from '../data/dailyVerses';
import type { DailyVerseReference } from '../data/dailyVerses';
import { parseVerseRange } from '../../../utils/bibleParser';

interface VerseData {
  text: string;
  reference: string;
  bookName: string;
}

const BOLLS_BOOK_MAP: Record<string, number> = {
  'genesis': 1, 'exodo': 2, 'levitico': 3, 'numeros': 4, 'deuteronomio': 5,
  'josue': 6, 'jueces': 7, 'rut': 8, '1-samuel': 9, '2-samuel': 10,
  '1-reyes': 11, '2-reyes': 12, '1-cronicas': 13, '2-cronicas': 14, 'esdras': 15,
  'nehemias': 16, 'ester': 17, 'job': 18, 'salmos': 19, 'proverbios': 20,
  'eclesiastes': 21, 'cantares': 22, 'isaias': 23, 'jeremias': 24, 'lamentaciones': 25,
  'ezequiel': 26, 'daniel': 27, 'oseas': 28, 'joel': 29, 'amos': 30,
  'abdias': 31, 'jonas': 32, 'miqueas': 33, 'nahum': 34, 'habacuc': 35,
  'sofonias': 36, 'hageo': 37, 'zacarias': 38, 'malaquias': 39,
  'mateo': 40, 'marcos': 41, 'lucas': 42, 'juan': 43, 'hechos': 44,
  'romanos': 45, '1-corintios': 46, '2-corintios': 47, 'galatas': 48, 'efesios': 49,
  'filipenses': 50, 'colosenses': 51, '1-tesalonicenses': 52, '2-tesalonicenses': 53,
  '1-timoteo': 54, '2-timoteo': 55, 'tito': 56, 'filemon': 57, 'hebreos': 58,
  'santiago': 59, '1-pedro': 60, '2-pedro': 61, '1-juan': 62, '2-juan': 63,
  '3-juan': 64, 'judas': 65, 'apocalipsis': 66
};

export function useDailyVerse() {
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get current day of year
  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const fetchVerseData = async (verseRef: DailyVerseReference, forceRefresh = false) => {
    if (forceRefresh) {
      setLoading(true);
      setError(null);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `daily-verse-${todayStr}-${verseRef.reference}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setVerseData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    }

    try {
      const bookIdInt = BOLLS_BOOK_MAP[verseRef.bookId];
      if (!bookIdInt) throw new Error('Invalid book ID');
      
      const url = `https://bolls.life/get-chapter/RV1960/${bookIdInt}/${verseRef.chapter}/`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('API failed');
      }
      
      const data = await res.json();
      
      // Filter the exact verses from the chapter
      const requestedVerses = parseVerseRange(verseRef.verses);
      const filteredVerses = data.filter((v: { verse: number; text: string }) => requestedVerses.includes(v.verse));
      
      if (filteredVerses.length === 0) {
        throw new Error('Verses not found in chapter');
      }
      
      const combinedText = filteredVerses.map((v: { text: string }) => v.text.replace(/<[^>]+>/g, '')).join(' ');
      
      const newVerseData = {
        text: combinedText,
        reference: verseRef.reference,
        bookName: verseRef.reference.split(' ')[0] // extract name
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(newVerseData));
      setVerseData(newVerseData);
      
    } catch (err) {
      console.error('Failed to load verse of the day:', err);
      // Fallback: just show the reference
      setError('No se pudo cargar el texto del versículo, pero puedes leerlo aquí:');
      setVerseData({
        text: '',
        reference: verseRef.reference,
        bookName: verseRef.bookId // Fallback book name
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const day = getDayOfYear(now);
    
    const verseRef = getVerseForDay(year, day);
    
    // Inline the initial fetch to avoid synchronous setState warnings from the compiler
    const initFetch = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const cacheKey = `daily-verse-${todayStr}-${verseRef.reference}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setVerseData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const bookIdInt = BOLLS_BOOK_MAP[verseRef.bookId];
        if (!bookIdInt) throw new Error('Invalid book ID');

        const url = `https://bolls.life/get-chapter/RV1960/${bookIdInt}/${verseRef.chapter}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API failed');
        
        const data = await res.json();
        const requestedVerses = parseVerseRange(verseRef.verses);
        const filteredVerses = data.filter((v: { verse: number; text: string }) => requestedVerses.includes(v.verse));
        
        if (filteredVerses.length === 0) throw new Error('Verses not found in chapter');
        
        const combinedText = filteredVerses.map((v: { text: string }) => v.text.replace(/<[^>]+>/g, '')).join(' ');
        
        const newVerseData = {
          text: combinedText,
          reference: verseRef.reference,
          bookName: verseRef.reference.split(' ')[0]
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(newVerseData));
        setVerseData(newVerseData);
      } catch (err) {
        console.error('Failed to load verse of the day:', err);
        setError('No se pudo cargar el texto del versículo, pero puedes leerlo aquí:');
        setVerseData({
          text: '',
          reference: verseRef.reference,
          bookName: verseRef.bookId
        });
      } finally {
        setLoading(false);
      }
    };

    initFetch();
  }, []);

  const fetchRandomVerse = () => {
    const now = new Date();
    const year = now.getFullYear();
    const shuffled = getYearlyShuffledVerses(year);
    const randomIndex = Math.floor(Math.random() * shuffled.length);
    fetchVerseData(shuffled[randomIndex], true);
  };

  return { verseData, loading, error, fetchRandomVerse };
}
