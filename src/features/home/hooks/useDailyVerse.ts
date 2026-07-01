import { useState, useEffect } from 'react';
import { getVerseForDay, getYearlyShuffledVerses } from '../data/dailyVerses';
import type { DailyVerseReference } from '../data/dailyVerses';
import { parseVerseRange } from '../../../utils/bibleParser';

interface VerseData {
  text: string;
  reference: string;
  bookName: string;
}

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
      // We use rv1960 as default for the verse of the day
      const url = `https://bible-api.deno.dev/api/read/rv1960/${verseRef.bookId}/${verseRef.chapter}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('API failed');
      }
      
      const data = await res.json();
      
      // Filter the exact verses from the chapter
      const requestedVerses = parseVerseRange(verseRef.verses);
      const filteredVerses = data.vers.filter((v: { number: number; verse: string }) => requestedVerses.includes(v.number));
      
      if (filteredVerses.length === 0) {
        throw new Error('Verses not found in chapter');
      }
      
      const combinedText = filteredVerses.map((v: { verse: string }) => v.verse).join(' ');
      
      const newVerseData = {
        text: combinedText,
        reference: verseRef.reference,
        bookName: data.name
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
        const url = `https://bible-api.deno.dev/api/read/rv1960/${verseRef.bookId}/${verseRef.chapter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API failed');
        
        const data = await res.json();
        const requestedVerses = parseVerseRange(verseRef.verses);
        const filteredVerses = data.vers.filter((v: { number: number; verse: string }) => requestedVerses.includes(v.number));
        
        if (filteredVerses.length === 0) throw new Error('Verses not found in chapter');
        
        const combinedText = filteredVerses.map((v: { verse: string }) => v.verse).join(' ');
        
        const newVerseData = {
          text: combinedText,
          reference: verseRef.reference,
          bookName: data.name
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
