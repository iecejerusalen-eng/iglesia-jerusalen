import { SQLocal } from 'sqlocal';

// Initialize sqlocal with our database file
export const { sql } = new SQLocal('jerusalen_local.db');

export async function initLocalDatabase(): Promise<void> {
  try {
    // 1. Members table
    await sql`
      CREATE TABLE IF NOT EXISTS local_members (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        photo_url TEXT,
        birth_date TEXT,
        conversion_date TEXT,
        baptism_date TEXT,
        phone TEXT,
        dni TEXT,
        address TEXT,
        maps_link TEXT,
        is_leader INTEGER DEFAULT 0,
        leadership_role TEXT,
        ministry_id TEXT,
        role_id TEXT,
        latitude REAL,
        longitude REAL,
        deleted_at TEXT,
        tithes_sum REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1 NOT NULL,
        emails TEXT,
        service_areas TEXT,
        talents TEXT,
        spiritual_gifts TEXT,
        gender TEXT,
        education_level TEXT,
        career_id TEXT,
        is_studying INTEGER DEFAULT 0,
        studying_career_id TEXT,
        phone_country_code TEXT DEFAULT '+593'
      );
    `;

    // Ensure relationship columns exist in local_members for existing databases
    try { await sql`ALTER TABLE local_members ADD COLUMN emails TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN service_areas TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN talents TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN spiritual_gifts TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN gender TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN education_level TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN career_id TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN is_studying INTEGER DEFAULT 0;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN studying_career_id TEXT;`; } catch (e) {}
    try { await sql`ALTER TABLE local_members ADD COLUMN phone_country_code TEXT DEFAULT '+593';`; } catch (e) {}


    // 2. Schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS local_schedules (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        title TEXT NOT NULL,
        time_range TEXT NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1 NOT NULL
      );
    `;

    // 3. Sermon Notes table
    await sql`
      CREATE TABLE IF NOT EXISTS local_sermon_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        sermon_id TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1 NOT NULL
      );
    `;

    // 4. Sync Queue table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `;

    console.log('Local SQLite database schema initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize local SQLite database:', error);
  }
}
