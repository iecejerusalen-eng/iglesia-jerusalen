-- Migration: Digital Giving and Payments Platform
-- Timestamp: 20260823010000

CREATE TABLE IF NOT EXISTS giving_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount NUMERIC(12, 2),
    current_amount NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giving_recurring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fund_id UUID REFERENCES giving_funds(id) ON DELETE SET NULL,
    frequency VARCHAR(50) NOT NULL DEFAULT 'monthly', -- weekly, biweekly, monthly, annual
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, cancelled
    next_payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giving_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fee_covered NUMERIC(10, 2) DEFAULT 0,
    net_amount NUMERIC(10, 2) NOT NULL,
    fund_id UUID REFERENCES giving_funds(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card', -- card, bank_transfer, apple_pay, google_pay
    status VARCHAR(50) NOT NULL DEFAULT 'succeeded', -- pending, succeeded, failed, refunded
    stripe_payment_intent VARCHAR(255),
    recurring_id UUID REFERENCES giving_recurring(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giving_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES giving_transactions(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receipt_url TEXT,
    year INT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE giving_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read giving funds" ON giving_funds FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin manage giving funds" ON giving_funds FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));

CREATE POLICY "Allow donor view recurring" ON giving_recurring FOR SELECT TO authenticated USING (auth.uid() = donor_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));
CREATE POLICY "Allow donor manage recurring" ON giving_recurring FOR ALL TO authenticated USING (auth.uid() = donor_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));

CREATE POLICY "Allow donor view transactions" ON giving_transactions FOR SELECT TO authenticated USING (auth.uid() = donor_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));
CREATE POLICY "Allow staff manage transactions" ON giving_transactions FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));

CREATE POLICY "Allow donor view receipts" ON giving_receipts FOR SELECT TO authenticated USING (auth.uid() = donor_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor', 'tesorero'));

-- Seed funds
INSERT INTO giving_funds (name, description, is_default)
VALUES 
    ('Diezmos y Ofrendas Generales', 'Sostén general de la iglesia y ministerio pastoral', true),
    ('Fondo Misionero', 'Apoyo a misioneros e iglesias hijas', false),
    ('Construcción y Mantenimiento', 'Mejoras de infraestructura del templo', false),
    ('Acción Social y Benevolencia', 'Ayuda a familias vulnerables y comunidad', false)
ON CONFLICT DO NOTHING;
