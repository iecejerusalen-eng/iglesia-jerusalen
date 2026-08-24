-- Migration: Community Features (Prayer Wall + Social Feed) & Sermon Notes
-- Timestamp: 20260823040000

-- Prayer Wall
CREATE TABLE IF NOT EXISTS prayer_wall_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) DEFAULT 'Anónimo',
    is_anonymous BOOLEAN DEFAULT false,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'salud', -- salud, familia, finanzas, trabajo, misiones, gratitud
    prayer_count INT DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    answer_testimony TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES prayer_wall_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Community Social Feed
CREATE TABLE IF NOT EXISTS community_feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_feed_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_feed_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactive Sermon Notes
CREATE TABLE IF NOT EXISTS sermon_note_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    blanks_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of prompt questions/fill-ins
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sermon_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    filled_answers JSONB DEFAULT '{}'::jsonb,
    personal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sermon_id)
);

-- RLS Policies
ALTER TABLE prayer_wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sermon_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read prayer wall" ON prayer_wall_posts FOR SELECT USING (true);
CREATE POLICY "Allow auth insert prayer wall" ON prayer_wall_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow author update prayer wall" ON prayer_wall_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow auth prayer interactions" ON prayer_interactions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow auth read feed posts" ON community_feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth insert feed posts" ON community_feed_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow author edit feed posts" ON community_feed_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow auth feed likes" ON community_feed_likes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth feed comments" ON community_feed_comments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read sermon note templates" ON sermon_note_templates FOR SELECT USING (true);
CREATE POLICY "Allow admin manage sermon note templates" ON sermon_note_templates FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'pastor'));

CREATE POLICY "Allow user manage own sermon notes" ON user_sermon_notes FOR ALL TO authenticated USING (auth.uid() = user_id);
