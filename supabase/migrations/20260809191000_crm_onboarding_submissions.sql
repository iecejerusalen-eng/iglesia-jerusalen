-- Migration: 20260809191000_crm_onboarding_submissions.sql
-- Description: Create table for CRM onboarding form submissions.

CREATE TABLE IF NOT EXISTS public.crm_onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.crm_onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anon) can insert submissions
CREATE POLICY "Anyone can insert onboarding submissions" 
ON public.crm_onboarding_submissions FOR INSERT 
WITH CHECK (true);

-- Policy: Admins, pastors, leaders, editors can manage submissions
CREATE POLICY "Admins can manage onboarding submissions"
ON public.crm_onboarding_submissions FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (select auth.uid())
        AND profiles.role IN ('admin', 'pastor', 'leader', 'editor')
    )
);
