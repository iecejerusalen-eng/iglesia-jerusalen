CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  sender_name text NOT NULL CHECK (char_length(btrim(sender_name)) BETWEEN 1 AND 120),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 1000),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_host boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS live_chat_messages_session_created_idx
  ON public.live_chat_messages (session_id, created_at);

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads approved live chat" ON public.live_chat_messages;
CREATE POLICY "Public reads approved live chat"
  ON public.live_chat_messages FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Public submits live chat" ON public.live_chat_messages;
CREATE POLICY "Public submits live chat"
  ON public.live_chat_messages FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'approved' AND is_host = false);

GRANT SELECT, INSERT ON public.live_chat_messages TO anon, authenticated;

ALTER TABLE public.live_chat_messages REPLICA IDENTITY FULL;
