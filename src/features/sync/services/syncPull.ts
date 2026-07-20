import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';

export const pullFromServer = async () => {
  try {
    console.log('Pulling database state from Supabase to sync local cache...');
    const db = await getDb();

    // 1. Pull members
    const { data: members, error: mErr } = await supabase
      .from('members')
      .select(`
        *,
        member_emails(email),
        member_service_areas(catalog_roles(id, name)),
        member_talents(catalog_roles(id, name)),
        member_spiritual_gifts(catalog_roles(id, name))
      `);
    if (mErr) throw mErr;

    if (members) {
      const tx = db.transaction('local_members', 'readwrite');
      await tx.objectStore('local_members').clear();
      for (const m of members) {
        await tx.objectStore('local_members').put({
            id: m.id, first_name: m.first_name, last_name: m.last_name, photo_url: m.photo_url || null,
            birth_date: m.birth_date || null, conversion_date: m.conversion_date || null,
            baptism_date: m.baptism_date || null, phone: m.phone || null, dni: m.dni || null,
            address: m.address || null, maps_link: m.maps_link || null, is_leader: m.is_leader ? 1 : 0,
            leadership_role: m.leadership_role || null, ministry_id: m.ministry_id || null, role_id: m.role_id || null,
            latitude: m.latitude || null, longitude: m.longitude || null, deleted_at: m.deleted_at || null,
            tithes_sum: m.tithes_sum || 0, created_at: m.created_at, updated_at: m.updated_at, version: m.version,
            emails: m.member_emails ? JSON.stringify(m.member_emails) : '[]',
            service_areas: m.member_service_areas ? JSON.stringify(m.member_service_areas) : '[]',
            talents: m.member_talents ? JSON.stringify(m.member_talents) : '[]',
            spiritual_gifts: m.member_spiritual_gifts ? JSON.stringify(m.member_spiritual_gifts) : '[]',
            gender: m.gender || null, education_level: m.education_level || null, career_id: m.career_id || null,
            is_studying: m.is_studying ? 1 : 0, studying_career_id: m.studying_career_id || null,
            phone_country_code: m.phone_country_code || '+593',
            dedicated_verse: m.dedicated_verse || null,
            marital_status: m.marital_status || null,
            birth_place: m.birth_place || null,
            has_disability: m.has_disability ? 1 : 0,
            disability_types: m.disability_types ? JSON.stringify(m.disability_types) : '[]'
        });
      }
      await tx.done;
    }

    // 2. Pull schedules
    const { data: schedules, error: sErr } = await supabase.from('schedules').select('*');
    if (sErr) throw sErr;

    if (schedules) {
      const tx = db.transaction('local_schedules', 'readwrite');
      await tx.objectStore('local_schedules').clear();
      for (const s of schedules) {
        await tx.objectStore('local_schedules').put({
            id: s.id, day: s.day, title: s.title, time_range: s.time_range,
            description: s.description || null, order_index: s.order_index || 0,
            created_at: s.created_at, updated_at: s.updated_at, version: s.version
        });
      }
      await tx.done;
    }

    // 3. Pull sermon_notes
    const { data: notes, error: nErr } = await supabase.from('sermon_notes').select('*');
    if (nErr) throw nErr;

    if (notes) {
      const tx = db.transaction('local_sermon_notes', 'readwrite');
      await tx.objectStore('local_sermon_notes').clear();
      for (const n of notes) {
        await tx.objectStore('local_sermon_notes').put({
            id: n.id, user_id: n.user_id, sermon_id: n.sermon_id || null,
            content: n.content, created_at: n.created_at, updated_at: n.updated_at, version: n.version
        });
      }
      await tx.done;
    }

    console.log('Local DB cache fully updated with remote data.');
  } catch (err) {
    console.error('Error pulling server database data to local cache:', err);
  }
};
