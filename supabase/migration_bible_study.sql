-- Migration: Bible Study Features (Highlights, Notes, Bookmarks)

-- 1. Table for Highlights
CREATE TABLE IF NOT EXISTS public.bible_highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id, chapter, verse)
);

-- 2. Table for Notes
CREATE TABLE IF NOT EXISTS public.bible_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id, chapter, verse)
);

-- 3. Table for Bookmarks
CREATE TABLE IF NOT EXISTS public.bible_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id, chapter)
);

-- Enable RLS
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Highlights
CREATE POLICY "Users can view their own highlights" 
    ON public.bible_highlights FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own highlights" 
    ON public.bible_highlights FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
    ON public.bible_highlights FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
    ON public.bible_highlights FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for Notes
CREATE POLICY "Users can view their own notes" 
    ON public.bible_notes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" 
    ON public.bible_notes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
    ON public.bible_notes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
    ON public.bible_notes FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for Bookmarks
CREATE POLICY "Users can view their own bookmarks" 
    ON public.bible_bookmarks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" 
    ON public.bible_bookmarks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
    ON public.bible_bookmarks FOR DELETE 
    USING (auth.uid() = user_id);
