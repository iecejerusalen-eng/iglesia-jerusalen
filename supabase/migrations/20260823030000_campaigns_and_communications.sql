-- Migration: Mass Communication & Campaigns (Email + SMS)
-- Timestamp: 20260823030000

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general', -- newsletter, welcome, event, announcement
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- email, sms, push
    subject VARCHAR(255),
    content TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    target_segment JSONB DEFAULT '{}'::jsonb, -- filter by group, stage, tag
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, processing, completed, failed
    total_recipients INT DEFAULT 0,
    successful_count INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES communication_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, opened
    error_message TEXT,
    sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS communication_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_opt_in BOOLEAN DEFAULT true,
    sms_opt_in BOOLEAN DEFAULT true,
    push_opt_in BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin manage templates" ON email_templates FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));
CREATE POLICY "Allow admin manage campaigns" ON communication_campaigns FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));
CREATE POLICY "Allow staff view campaign messages" ON campaign_messages FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));
CREATE POLICY "Allow user manage own preferences" ON communication_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);
