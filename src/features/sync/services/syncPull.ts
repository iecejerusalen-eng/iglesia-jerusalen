import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import { logger } from '../../../utils/logger';

interface PendingQueueItem {
  id: string;
  table_name: string;
  record_id: string;
}

export const pullFromServer = async () => {
  try {
    logger.log('Pulling database state from Supabase to sync local cache...');
    const db = await getDb();

    // Obtener mutaciones pendientes en la cola para no sobreescribir datos locales no sincronizados
    const queue: PendingQueueItem[] = await db.getAll('sync_queue');
    const pendingIdsByTable = new Map<string, Set<string>>();
    for (const item of queue) {
      if (!pendingIdsByTable.has(item.table_name)) {
        pendingIdsByTable.set(item.table_name, new Set());
      }
      pendingIdsByTable.get(item.table_name)!.add(item.record_id);
    }

    const pendingMembers = pendingIdsByTable.get('members') || new Set<string>();
    const pendingSchedules = pendingIdsByTable.get('schedules') || new Set<string>();
    const pendingNotes = pendingIdsByTable.get('sermon_notes') || new Set<string>();

    // 1. Pull members
    const { data: members, error: mErr } = await supabase
      .from('members')
      .select(`
        *,
        member_emails(email),
        member_phones(phone, country_code),
        member_service_areas(catalog_roles(id, name)),
        member_talents(catalog_roles(id, name)),
        member_spiritual_gifts(catalog_roles(id, name))
      `);
    if (mErr) throw mErr;

    if (members) {
      const tx = db.transaction('local_members', 'readwrite');
      const store = tx.objectStore('local_members');
      const remoteIds = new Set<string>();

      for (const m of members) {
        remoteIds.add(m.id);
        // Si hay una mutación local pendiente en la cola de sincronización para este registro,
        // respetamos la versión local hasta que syncWorker la procese y resuelva
        if (pendingMembers.has(m.id)) {
          continue;
        }

        await store.put({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          photo_url: m.photo_url || null,
          birth_date: m.birth_date || null,
          conversion_date: m.conversion_date || null,
          birthday_public: m.birthday_public === true,
          baptism_date: m.baptism_date || null,
          phone: m.phone || null,
          dni: m.dni || null,
          address: m.address || null,
          maps_link: m.maps_link || null,
          is_leader: m.is_leader ? 1 : 0,
          leadership_role: m.leadership_role || null,
          ministry_id: m.ministry_id || null,
          role_id: m.role_id || null,
          latitude: m.latitude || null,
          longitude: m.longitude || null,
          deleted_at: m.deleted_at || null,
          tithes_sum: 0,
          created_at: m.created_at,
          updated_at: m.updated_at,
          version: m.version,
          emails: m.member_emails ? JSON.stringify(m.member_emails) : '[]',
          phones: m.member_phones ? JSON.stringify(m.member_phones) : '[]',
          service_areas: m.member_service_areas ? JSON.stringify(m.member_service_areas) : '[]',
          talents: m.member_talents ? JSON.stringify(m.member_talents) : '[]',
          spiritual_gifts: m.member_spiritual_gifts ? JSON.stringify(m.member_spiritual_gifts) : '[]',
          gender: m.gender || null,
          education_level: m.education_level || null,
          career_id: m.career_id || null,
          is_studying: m.is_studying ? 1 : 0,
          studying_career_id: m.studying_career_id || null,
          phone_country_code: m.phone_country_code || '+593',
          dedicated_verse: m.dedicated_verse || null,
          marital_status: m.marital_status || null,
          birth_place: m.birth_place || null,
          has_disability: m.has_disability ? 1 : 0,
          disability_types: m.disability_types ? JSON.stringify(m.disability_types) : '[]'
        });
      }

      // Eliminar registros locales obsoletos que ya no existen remotamente (salvo los pendientes en cola)
      const allLocalKeys = await store.getAllKeys();
      for (const key of allLocalKeys) {
        const idStr = String(key);
        if (!remoteIds.has(idStr) && !pendingMembers.has(idStr)) {
          await store.delete(key);
        }
      }

      await tx.done;
    }

    // 2. Pull schedules
    const { data: schedules, error: sErr } = await supabase.from('schedules').select('*');
    if (sErr) throw sErr;

    if (schedules) {
      const tx = db.transaction('local_schedules', 'readwrite');
      const store = tx.objectStore('local_schedules');
      const remoteScheduleIds = new Set<string>();

      for (const s of schedules) {
        remoteScheduleIds.add(s.id);
        if (pendingSchedules.has(s.id)) {
          continue;
        }

        await store.put({
          id: s.id,
          day: s.day,
          title: s.title,
          time_range: s.time_range,
          description: s.description || null,
          order_index: s.order_index || 0,
          created_at: s.created_at,
          updated_at: s.updated_at,
          version: s.version
        });
      }

      const allLocalScheduleKeys = await store.getAllKeys();
      for (const key of allLocalScheduleKeys) {
        const idStr = String(key);
        if (!remoteScheduleIds.has(idStr) && !pendingSchedules.has(idStr)) {
          await store.delete(key);
        }
      }

      await tx.done;
    }

    // 3. Pull sermon_notes
    const { data: notes, error: nErr } = await supabase.from('sermon_notes').select('*');
    if (nErr) throw nErr;

    if (notes) {
      const tx = db.transaction('local_sermon_notes', 'readwrite');
      const store = tx.objectStore('local_sermon_notes');
      const remoteNoteIds = new Set<string>();

      for (const n of notes) {
        remoteNoteIds.add(n.id);
        if (pendingNotes.has(n.id)) {
          continue;
        }

        await store.put({
          id: n.id,
          user_id: n.user_id,
          sermon_id: n.sermon_id || null,
          content: n.content,
          created_at: n.created_at,
          updated_at: n.updated_at,
          version: n.version
        });
      }

      const allLocalNoteKeys = await store.getAllKeys();
      for (const key of allLocalNoteKeys) {
        const idStr = String(key);
        if (!remoteNoteIds.has(idStr) && !pendingNotes.has(idStr)) {
          await store.delete(key);
        }
      }

      await tx.done;
    }

    logger.log('Local DB cache safely updated with remote data without destroying offline mutations.');
  } catch (err) {
    logger.error('Error pulling server database data to local cache:', err);
  }
};
