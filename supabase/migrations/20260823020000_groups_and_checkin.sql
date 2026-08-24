-- Migration: Small Groups and QR Check-in System
-- Timestamp: 20260823020000

CREATE TABLE IF NOT EXISTS small_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general', -- hombres, mujeres, jovenes, matrimonios, mixtos
    meeting_day VARCHAR(20) NOT NULL, -- lunes, martes, ...
    meeting_time TIME NOT NULL,
    location_name VARCHAR(255),
    address TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    max_members INT DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES small_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- leader, co_leader, member
    status VARCHAR(50) DEFAULT 'active', -- pending, active, inactive
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES small_groups(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    topic VARCHAR(255),
    notes TEXT,
    attendee_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- sunday_service, kids_ministry, event, group_meeting
    event_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    phone VARCHAR(50),
    security_code VARCHAR(20), -- For child pickup label
    allergy_notes TEXT,
    checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE small_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read active small groups" ON small_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin manage small groups" ON small_groups FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor', 'lider_grupo'));

CREATE POLICY "Allow members view memberships" ON group_memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user manage own membership" ON group_memberships FOR ALL TO authenticated USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow members view group meetings" ON group_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow leaders manage meetings" ON group_meetings FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor', 'lider_grupo'));

CREATE POLICY "Allow staff view checkins" ON event_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow checkin registration" ON event_checkins FOR INSERT TO authenticated WITH CHECK (true);
