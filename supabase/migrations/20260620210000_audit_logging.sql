-- Migration: System Audit Logging for Admin actions
-- Create audit_logs table to record administrative actions in a secure, RLS-enforced manner

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- Enable Row Level Security (RLS) on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies for audit_logs
CREATE POLICY "Allow users to view their own logs" ON public.audit_logs 
    FOR SELECT TO authenticated 
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Allow admins to view all logs" ON public.audit_logs 
    FOR SELECT TO authenticated 
    USING (
        exists (
            select 1 from public.profiles
            where id = (select auth.uid()) and role = 'admin'
        )
    );

CREATE POLICY "Allow authenticated users to insert logs" ON public.audit_logs 
    FOR INSERT TO authenticated 
    WITH CHECK ((select auth.uid()) = user_id);
