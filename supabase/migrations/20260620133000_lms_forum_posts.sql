-- 20260620133000_lms_forum_posts.sql

CREATE TABLE IF NOT EXISTS public.lms_forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES public.lms_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.lms_forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lms_forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view forum posts" 
ON public.lms_forum_posts FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert forum posts" 
ON public.lms_forum_posts FOR INSERT 
TO authenticated WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.lms_forum_posts FOR UPDATE 
TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.lms_forum_posts FOR DELETE 
TO authenticated USING ((select auth.uid()) = user_id);
