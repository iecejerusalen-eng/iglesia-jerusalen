-- Migration: Add Chat and Broadcast Schema with Ephemeral Message Deletion and Realtime Replication
-- 1. Add columns to public.members and public.church_settings
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Masculino', 'Femenino', 'Otro'));
ALTER TABLE public.church_settings ADD COLUMN IF NOT EXISTS chat_retention_days integer DEFAULT 7 NOT NULL;

-- 2. Create Chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text, -- NULL for direct 1-on-1 chats, has value for group chats
  is_group boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Chat Participants table (Many-to-Many junction)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);

-- 4. Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Helper function to check chat participation without recursion
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_uuid uuid, user_uuid uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_id = chat_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Enable Row Level Security (RLS) on Chat tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies for public.chats
DROP POLICY IF EXISTS "Permitir ver chats a participantes" ON public.chats;
CREATE POLICY "Permitir ver chats a participantes" ON public.chats
  FOR SELECT TO authenticated
  USING (
    public.is_chat_participant(id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Permitir creacion de chats a autenticados" ON public.chats;
CREATE POLICY "Permitir creacion de chats a autenticados" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 7. Setup RLS Policies for public.chat_participants
DROP POLICY IF EXISTS "Permitir ver participantes de chats propios" ON public.chat_participants;
CREATE POLICY "Permitir ver participantes de chats propios" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (
    public.is_chat_participant(chat_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Permitir unirse o crear participantes" ON public.chat_participants;
CREATE POLICY "Permitir unirse o crear participantes" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id 
    OR public.is_chat_participant(chat_id, (select auth.uid()))
    OR exists (
      select 1 from public.profiles 
      where id = (select auth.uid()) and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir salir de chats" ON public.chat_participants;
CREATE POLICY "Permitir salir de chats" ON public.chat_participants
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- 8. Setup RLS Policies for public.messages
DROP POLICY IF EXISTS "Permitir ver mensajes de chats propios" ON public.messages;
CREATE POLICY "Permitir ver mensajes de chats propios" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_chat_participant(chat_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Permitir enviar mensajes en chats propios" ON public.messages;
CREATE POLICY "Permitir enviar mensajes en chats propios" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id 
    AND public.is_chat_participant(chat_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Permitir borrar mensajes propios" ON public.messages;
CREATE POLICY "Permitir borrar mensajes propios" ON public.messages
  FOR DELETE TO authenticated
  USING (
    (select auth.uid()) = sender_id
  );

-- 9. Enable Realtime Replication for these tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object OR others THEN END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    EXCEPTION WHEN duplicate_object OR others THEN END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
    EXCEPTION WHEN duplicate_object OR others THEN END;
  END IF;
END
$$;

-- 10. Automated Message Deletion Function
CREATE OR REPLACE FUNCTION public.delete_expired_messages()
RETURNS void AS $$
DECLARE
  retention_val int;
BEGIN
  -- Fetch the retention period in days from church_settings (default: 7 days)
  SELECT COALESCE(chat_retention_days, 7) INTO retention_val
  FROM public.church_settings
  WHERE id = 1;

  -- Delete all messages older than retention_val days
  DELETE FROM public.messages
  WHERE created_at < now() - (retention_val || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Schedule task with pg_cron if available
DO $$
BEGIN
  -- Enable pg_cron extension safely
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  -- Schedule job to run every day at midnight (00:00)
  PERFORM cron.schedule('delete-messages-job', '0 0 * * *', 'SELECT public.delete_expired_messages();');
EXCEPTION WHEN OTHERS THEN
  -- Raise notice in logs, but let migration finish successfully if pg_cron is blocked
  RAISE NOTICE 'pg_cron extension is not active or user has insufficient privileges. Messages can also be cleaned up on demand or via Supabase Edge Functions.';
END;
$$;
