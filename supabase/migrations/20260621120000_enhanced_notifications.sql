-- =======================================================
-- SQL MIGRATION: ENHANCED NOTIFICATIONS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar columnas para control de avisos en public.notification_logs
ALTER TABLE public.notification_logs 
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general' CHECK (category IN ('general', 'cumpleanos', 'aniversario', 'reunion', 'evento')),
  ADD COLUMN IF NOT EXISTS target_ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL;

-- 2. Actualizar Políticas de RLS para public.notification_logs
DROP POLICY IF EXISTS "Permitir gestión de notificaciones a personal autorizado" ON public.notification_logs;
DROP POLICY IF EXISTS "Permitir lectura de notificaciones a autenticados" ON public.notification_logs;

-- Permitir a cualquier usuario autenticado ver los avisos / notificaciones
CREATE POLICY "Permitir lectura de notificaciones a autenticados"
  ON public.notification_logs FOR SELECT TO authenticated
  USING (true);

-- Permitir la gestión (crear, modificar, borrar) solo al equipo administrativo/pastoral
CREATE POLICY "Permitir gestión de notificaciones a personal autorizado"
  ON public.notification_logs FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );
