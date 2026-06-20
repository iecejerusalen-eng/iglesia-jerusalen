-- Migration for Open Resources (Programas y Estudios)

-- Resource Table (Main container for free programs)
CREATE TABLE IF NOT EXISTS public.open_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sections / Modules
CREATE TABLE IF NOT EXISTS public.open_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.open_resources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activities / Content Blocks inside a Section
CREATE TABLE IF NOT EXISTS public.open_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID NOT NULL REFERENCES public.open_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'resource', 'video_link', 'h5p_embed', etc.
    content TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.open_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public Read Access
CREATE POLICY "Public can view published resources" ON public.open_resources 
FOR SELECT TO public USING (is_published = true);

CREATE POLICY "Authenticated users can view all resources" ON public.open_resources 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public can view sections of published resources" ON public.open_sections 
FOR SELECT TO public USING (true);

CREATE POLICY "Public can view activities of published resources" ON public.open_activities 
FOR SELECT TO public USING (true);

-- Admin Write Access
CREATE POLICY "Admin can manage resources" ON public.open_resources 
FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')))
WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')));

CREATE POLICY "Admin can manage sections" ON public.open_sections 
FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')))
WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')));

CREATE POLICY "Admin can manage activities" ON public.open_activities 
FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')))
WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')));
