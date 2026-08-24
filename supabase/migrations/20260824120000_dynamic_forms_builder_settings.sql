ALTER TABLE public.dynamic_forms
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.dynamic_forms.settings IS 'Configuración editable del constructor: contacto, confirmación, progreso y presentación.';
