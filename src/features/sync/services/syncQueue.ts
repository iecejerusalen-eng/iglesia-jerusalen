import { getDb } from '../../../config/localDb';

export const enqueueMutation = async (
  tableName: string,
  recordId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: any
) => {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payloadStr = JSON.stringify(payload);

  try {
    const db = await getDb();
    const tx = db.transaction(['sync_queue', 'local_members', 'local_schedules', 'local_sermon_notes'], 'readwrite');
    
    // 1. Write mutation to sync_queue
    await tx.objectStore('sync_queue').put({
      id,
      table_name: tableName,
      record_id: recordId,
      action,
      payload: payloadStr,
      created_at: createdAt
    });

    // 2. Perform optimistic local update
    if (action === 'DELETE') {
      if (tableName === 'members') {
        const store = tx.objectStore('local_members');
        const existing = await store.get(recordId);
        if (existing) {
          existing.deleted_at = createdAt;
          existing.updated_at = createdAt;
          existing.version = (existing.version || 0) + 1;
          await store.put(existing);
        }
      } else if (tableName === 'schedules') {
        await tx.objectStore('local_schedules').delete(recordId);
      } else if (tableName === 'sermon_notes') {
        await tx.objectStore('local_sermon_notes').delete(recordId);
      }
    } else {
      // INSERT or UPDATE
      const updated_at = createdAt;
      
      if (tableName === 'members') {
        const store = tx.objectStore('local_members');
        const existing = await store.get(recordId);
        const m = payload;
        
        const newRecord = {
            id: recordId,
            first_name: m.first_name,
            last_name: m.last_name,
            photo_url: m.photo_url || null,
            birth_date: m.birth_date || null,
            conversion_date: m.conversion_date || null,
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
            tithes_sum: m.tithes_sum || 0,
            created_at: existing?.created_at || createdAt,
            updated_at,
            version: (existing?.version || 0) + 1,
            emails: m.emails ? JSON.stringify(m.emails) : '[]',
            service_areas: m.service_areas ? JSON.stringify(m.service_areas) : '[]',
            talents: m.talents ? JSON.stringify(m.talents) : '[]',
            spiritual_gifts: m.spiritual_gifts ? JSON.stringify(m.spiritual_gifts) : '[]',
            gender: m.gender || null,
            education_level: m.education_level || null,
            career_id: m.career_id || null,
            is_studying: m.is_studying ? 1 : 0,
            studying_career_id: m.studying_career_id || null,
            phone_country_code: m.phone_country_code || '+593',
            dedicated_verse: m.dedicated_verse || null
        };
        await store.put(newRecord);

      } else if (tableName === 'schedules') {
        const store = tx.objectStore('local_schedules');
        const existing = await store.get(recordId);
        const s = payload;
        await store.put({
            id: recordId,
            day: s.day,
            title: s.title,
            time_range: s.time_range,
            description: s.description || null,
            order_index: s.order_index || 0,
            created_at: existing?.created_at || createdAt,
            updated_at,
            version: (existing?.version || 0) + 1
        });
      } else if (tableName === 'sermon_notes') {
        const store = tx.objectStore('local_sermon_notes');
        const existing = await store.get(recordId);
        const sn = payload;
        await store.put({
            id: recordId,
            user_id: sn.user_id,
            sermon_id: sn.sermon_id || null,
            content: sn.content,
            created_at: existing?.created_at || createdAt,
            updated_at,
            version: (existing?.version || 0) + 1
        });
      }
    }
    await tx.done;
  } catch (err) {
    console.error('Error queuing mutation locally:', err);
  }
};
