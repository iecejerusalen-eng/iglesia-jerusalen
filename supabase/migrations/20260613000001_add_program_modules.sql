CREATE TABLE IF NOT EXISTS program_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE program_modules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to program_modules' AND tablename = 'program_modules'
    ) THEN
        CREATE POLICY "Allow public read access to program_modules"
        ON program_modules FOR SELECT
        TO public
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin full access to program_modules' AND tablename = 'program_modules'
    ) THEN
        CREATE POLICY "Allow admin full access to program_modules"
        ON program_modules FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Try adding module_id to program_lessons if program_lessons exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_lessons') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_lessons' AND column_name = 'module_id') THEN
            ALTER TABLE program_lessons ADD COLUMN module_id UUID REFERENCES program_modules(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
