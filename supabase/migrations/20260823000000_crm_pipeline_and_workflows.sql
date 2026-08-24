-- Migration: CRM Pipeline and Workflow Automations
-- Timestamp: 20260823000000

CREATE TABLE IF NOT EXISTS crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stages JSONB NOT NULL DEFAULT '[
        {"id": "new_guest", "name": "Visitante Nuevo", "color": "#3B82F6"},
        {"id": "contacted", "name": "Contactado", "color": "#8B5CF6"},
        {"id": "connected", "name": "En Conexión", "color": "#10B981"},
        {"id": "member", "name": "Miembro", "color": "#F59E0B"},
        {"id": "servant", "name": "Servidor", "color": "#EC4899"}
    ]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE SET NULL,
    stage_id VARCHAR(100) NOT NULL DEFAULT 'new_guest',
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100) DEFAULT 'web_form', -- web_form, qr_checkin, event, manual
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- stage_change, note, email_sent, sms_sent, call, meeting
    title VARCHAR(255) NOT NULL,
    details TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL, -- new_contact, stage_change, event_checkin, birthday
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    execution_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- pending, completed, failed
    log_output JSONB DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view crm pipelines" ON crm_pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage crm pipelines" ON crm_pipelines FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow authenticated users to view crm contacts" ON crm_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff to manage crm contacts" ON crm_contacts FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view activities" ON crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow staff to manage activities" ON crm_activities FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow admin to view workflows" ON workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage workflows" ON workflows FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow staff to view workflow executions" ON workflow_executions FOR SELECT TO authenticated USING (true);

-- Insert default pipeline if none exists
INSERT INTO crm_pipelines (name, description, is_default)
VALUES ('Pipeline Principal de Asimilación', 'Ruta de seguimiento de visitantes hasta membresía y servicio', true)
ON CONFLICT DO NOTHING;
