import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface BibleHighlight {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  color: string;
}

export interface BibleNote {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  content: string;
}

export function useBibleStudy(bookId: string, chapter: number) {
  const { user } = useAuthStore();
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudyData = useCallback(async () => {
    if (!user) {
      setHighlights([]);
      setNotes([]);
      return;
    }

    setLoading(true);
    try {
      const [highlightsRes, notesRes] = await Promise.all([
        supabase
          .from('bible_highlights')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .eq('chapter', chapter),
        supabase
          .from('bible_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .eq('chapter', chapter)
      ]);

      if (highlightsRes.error) throw highlightsRes.error;
      if (notesRes.error) throw notesRes.error;

      setHighlights(highlightsRes.data as BibleHighlight[]);
      setNotes(notesRes.data as BibleNote[]);
    } catch (err) {
      console.error('Error fetching bible study data', err);
    } finally {
      setLoading(false);
    }
  }, [user, bookId, chapter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStudyData();
  }, [fetchStudyData]);

  const addHighlight = async (verse: number, color: string) => {
    if (!user) return;
    
    // optimistic update
    const newHighlight: BibleHighlight = {
      id: Math.random().toString(),
      book_id: bookId,
      chapter,
      verse,
      color
    };
    
    setHighlights(prev => {
      const filtered = prev.filter(h => h.verse !== verse);
      return [...filtered, newHighlight];
    });

    try {
      const { error } = await supabase
        .from('bible_highlights')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          chapter,
          verse,
          color
        }, { onConflict: 'user_id,book_id,chapter,verse' });

      if (error) {
        console.error(error);
        void fetchStudyData(); // revert on error
      }
    } catch {
      void fetchStudyData();
    }
  };

  const removeHighlight = async (verse: number) => {
    if (!user) return;
    setHighlights(prev => prev.filter(h => h.verse !== verse));
    
    try {
      await supabase
        .from('bible_highlights')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter', chapter)
        .eq('verse', verse);
    } catch {
      void fetchStudyData();
    }
  };

  const saveNote = async (verse: number, content: string) => {
    if (!user) return;
    const newNote: BibleNote = {
      id: Math.random().toString(),
      book_id: bookId,
      chapter,
      verse,
      content
    };
    setNotes(prev => {
      const filtered = prev.filter(n => n.verse !== verse);
      return [...filtered, newNote];
    });

    try {
      const { error } = await supabase
        .from('bible_notes')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          chapter,
          verse,
          content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,book_id,chapter,verse' });
      
      if (error) void fetchStudyData();
    } catch {
      void fetchStudyData();
    }
  };

  const deleteNote = async (verse: number) => {
    if (!user) return;
    setNotes(prev => prev.filter(n => n.verse !== verse));
    try {
      await supabase
        .from('bible_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter', chapter)
        .eq('verse', verse);
    } catch {
      void fetchStudyData();
    }
  };

  return {
    highlights,
    notes,
    loading,
    addHighlight,
    removeHighlight,
    saveNote,
    deleteNote
  };
}
