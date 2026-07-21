-- Create presentation_slides table
CREATE TABLE public.presentation_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_index INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT,
    department TEXT, -- e.g. CRM, LMS, Finanzas
    icon TEXT, -- Lucide icon name
    image_url TEXT,
    theme_color TEXT DEFAULT 'indigo', -- Theme color reference
    animation_type TEXT DEFAULT 'fade', -- Animation reference
    layout TEXT DEFAULT 'standard', -- standard, split, full-image, features
    features JSONB DEFAULT '[]'::jsonb, -- Array of strings/objects for bullet points
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.presentation_slides
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated superadmin users" ON public.presentation_slides
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
      )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presentation_slides_modtime
    BEFORE UPDATE ON public.presentation_slides
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial dummy data based on presentation.html conceptually
INSERT INTO public.presentation_slides (order_index, title, subtitle, department, content, icon, layout, features) VALUES 
(1, 'Iglesia Jerusalén', 'Sistema Integral de Gestión', 'General', 'Una plataforma unificada para administrar todos los aspectos de nuestra congregación.', 'Church', 'standard', '["CRM", "Aula Virtual (LMS)", "Gestión Financiera", "Juegos y Recursos"]'::jsonb),
(2, 'Miembros (CRM)', 'Gestión Pastoral Efectiva', 'CRM', 'Administra a todos los miembros, familias y grupos pequeños con facilidad.', 'Users', 'split', '["Directorio Completo", "Seguimiento Pastoral", "Peticiones de Oración"]'::jsonb),
(3, 'Aula Virtual (LMS)', 'Formación Continua', 'LMS', 'Plataforma educativa para la escuela dominical y discipulado.', 'GraduationCap', 'split', '["Cursos Interactivos", "Progreso de Estudiantes", "Evaluaciones"]'::jsonb),
(4, 'Finanzas', 'Transparencia y Mayordomía', 'Finanzas', 'Control total de ingresos, diezmos, ofrendas y egresos.', 'DollarSign', 'split', '["Reportes Automáticos", "Recibos Digitales", "Presupuestos"]'::jsonb),
(5, 'Recursos para Niños', 'Juegos Interactivos Bíblicos', 'Recursos', 'Herramientas divertidas para aprender la palabra de Dios.', 'Gamepad2', 'split', '["Memorama Bíblico", "Biblionario", "Ahorcado"]'::jsonb);
