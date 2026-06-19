import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { sql } from '../config/localDb';
import { resolveConflict } from '../utils/conflictResolver';
import { toast } from 'sonner';

interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  created_at: string;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  setOnlineStatus: (status: boolean) => void;
  enqueueMutation: (
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: any
  ) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  pullFromServer: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => {
  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOnline: true });
      toast.success('Conexión de red restablecida. Sincronizando datos...');
      get().syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      set({ isOnline: false });
      toast.warning('Dispositivo sin conexión a internet. Los cambios se guardarán localmente.');
    });
  }

  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,

    setOnlineStatus: (status: boolean) => {
      set({ isOnline: status });
      if (status) {
        get().syncOfflineQueue();
      }
    },

    enqueueMutation: async (
      tableName: string,
      recordId: string,
      action: 'INSERT' | 'UPDATE' | 'DELETE',
      payload: any
    ) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const payloadStr = JSON.stringify(payload);

      try {
        // 1. Write mutation to sync_queue SQLite table
        await sql`
          INSERT INTO sync_queue (id, table_name, record_id, action, payload, created_at)
          VALUES (${id}, ${tableName}, ${recordId}, ${action}, ${payloadStr}, ${createdAt});
        `;

        // 2. Perform optimistic local update in SQLite table
        if (action === 'DELETE') {
          if (tableName === 'members') {
            await sql`UPDATE local_members SET deleted_at = ${createdAt}, updated_at = ${createdAt}, version = version + 1 WHERE id = ${recordId}`;
          } else if (tableName === 'schedules') {
            await sql`DELETE FROM local_schedules WHERE id = ${recordId}`;
          } else if (tableName === 'sermon_notes') {
            await sql`DELETE FROM local_sermon_notes WHERE id = ${recordId}`;
          }
        } else {
          // INSERT or UPDATE
          const updated_at = createdAt;
          
          if (tableName === 'members') {
            const m = payload;
            await sql`
              INSERT OR REPLACE INTO local_members (
                id, first_name, last_name, photo_url, birth_date, conversion_date,
                baptism_date, phone, dni, address, maps_link, is_leader, leadership_role,
                ministry_id, role_id, latitude, longitude, deleted_at, tithes_sum,
                created_at, updated_at, version,
                emails, service_areas, talents, spiritual_gifts, gender,
                education_level, career_id, is_studying, studying_career_id, phone_country_code
              ) VALUES (
                ${recordId}, ${m.first_name}, ${m.last_name}, ${m.photo_url || null}, ${m.birth_date || null}, ${m.conversion_date || null},
                ${m.baptism_date || null}, ${m.phone || null}, ${m.dni || null}, ${m.address || null}, ${m.maps_link || null}, ${m.is_leader ? 1 : 0}, ${m.leadership_role || null},
                ${m.ministry_id || null}, ${m.role_id || null}, ${m.latitude || null}, ${m.longitude || null}, ${m.deleted_at || null}, ${m.tithes_sum || 0},
                ${m.created_at || createdAt}, ${updated_at}, COALESCE((SELECT version FROM local_members WHERE id = ${recordId}), 0) + 1,
                ${m.emails ? JSON.stringify(m.emails) : '[]'},
                ${m.service_areas ? JSON.stringify(m.service_areas) : '[]'},
                ${m.talents ? JSON.stringify(m.talents) : '[]'},
                ${m.spiritual_gifts ? JSON.stringify(m.spiritual_gifts) : '[]'},
                ${m.gender || null},
                ${m.education_level || null}, ${m.career_id || null}, ${m.is_studying ? 1 : 0}, ${m.studying_career_id || null}, ${m.phone_country_code || '+593'}
              )
              ON CONFLICT(id) DO UPDATE SET
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                photo_url = excluded.photo_url,
                birth_date = excluded.birth_date,
                conversion_date = excluded.conversion_date,
                baptism_date = excluded.baptism_date,
                phone = excluded.phone,
                dni = excluded.dni,
                address = excluded.address,
                maps_link = excluded.maps_link,
                is_leader = excluded.is_leader,
                leadership_role = excluded.leadership_role,
                ministry_id = excluded.ministry_id,
                role_id = excluded.role_id,
                latitude = excluded.latitude,
                longitude = excluded.longitude,
                deleted_at = excluded.deleted_at,
                tithes_sum = excluded.tithes_sum,
                updated_at = excluded.updated_at,
                emails = excluded.emails,
                service_areas = excluded.service_areas,
                talents = excluded.talents,
                spiritual_gifts = excluded.spiritual_gifts,
                gender = excluded.gender,
                education_level = excluded.education_level,
                career_id = excluded.career_id,
                is_studying = excluded.is_studying,
                studying_career_id = excluded.studying_career_id,
                phone_country_code = excluded.phone_country_code,
                version = version + 1;
            `;
          } else if (tableName === 'schedules') {
            const s = payload;
            await sql`
              INSERT OR REPLACE INTO local_schedules (
                id, day, title, time_range, description, order_index,
                created_at, updated_at, version
              ) VALUES (
                ${recordId}, ${s.day}, ${s.title}, ${s.time_range}, ${s.description || null}, ${s.order_index || 0},
                ${s.created_at || createdAt}, ${updated_at}, COALESCE((SELECT version FROM local_schedules WHERE id = ${recordId}), 0) + 1
              )
              ON CONFLICT(id) DO UPDATE SET
                day = excluded.day,
                title = excluded.title,
                time_range = excluded.time_range,
                description = excluded.description,
                order_index = excluded.order_index,
                updated_at = excluded.updated_at,
                version = version + 1;
            `;
          } else if (tableName === 'sermon_notes') {
            const sn = payload;
            await sql`
              INSERT OR REPLACE INTO local_sermon_notes (
                id, user_id, sermon_id, content,
                created_at, updated_at, version
              ) VALUES (
                ${recordId}, ${sn.user_id}, ${sn.sermon_id || null}, ${sn.content},
                ${sn.created_at || createdAt}, ${updated_at}, COALESCE((SELECT version FROM local_sermon_notes WHERE id = ${recordId}), 0) + 1
              )
              ON CONFLICT(id) DO UPDATE SET
                content = excluded.content,
                updated_at = excluded.updated_at,
                version = version + 1;
            `;
          }
        }
      } catch (err) {
        console.error('Error queuing mutation locally:', err);
      }
    },

    syncOfflineQueue: async () => {
      const { isSyncing, isOnline } = get();
      if (isSyncing || !isOnline) return;

      set({ isSyncing: true });

      try {
        // Fetch all queued mutations
        const queue: SyncQueueItem[] = await sql`
          SELECT * FROM sync_queue ORDER BY created_at ASC;
        `;

        if (queue.length === 0) {
          set({ isSyncing: false });
          return;
        }

        console.log(`Processing sync queue: ${queue.length} mutations...`);

        for (const item of queue) {
          const payload = JSON.parse(item.payload);

          if (item.action === 'DELETE') {
            if (item.table_name === 'members') {
              // Perform soft delete on server
              const { error } = await supabase
                .from('members')
                .update({ deleted_at: item.created_at })
                .eq('id', item.record_id);
              if (error) throw error;
            } else {
              // Hard delete for other tables
              const { error } = await supabase
                .from(item.table_name)
                .delete()
                .eq('id', item.record_id);
              if (error) throw error;
            }
          } else {
            // INSERT or UPDATE - Fetch remote record first to check conflicts
            const { data: remoteRecord, error: fetchError } = await supabase
              .from(item.table_name)
              .select('*')
              .eq('id', item.record_id)
              .maybeSingle();

            if (fetchError) {
              console.error(`Error checking remote conflicts for ${item.table_name}:`, fetchError);
              continue; // Skip and process next
            }

            if (remoteRecord) {
              // Get local record info
              let localQuery: any[] = [];
              if (item.table_name === 'members') {
                localQuery = await sql`SELECT * FROM local_members WHERE id = ${item.record_id}`;
              } else if (item.table_name === 'schedules') {
                localQuery = await sql`SELECT * FROM local_schedules WHERE id = ${item.record_id}`;
              } else if (item.table_name === 'sermon_notes') {
                localQuery = await sql`SELECT * FROM local_sermon_notes WHERE id = ${item.record_id}`;
              }

              const localRecord = localQuery[0];

              if (localRecord) {
                // Apply conflict resolver
                const conflict = resolveConflict(localRecord, remoteRecord);

                if (conflict.winner === 'remote') {
                  // Server wins: overwrite local SQLite and discard local update
                  console.log(`Conflict resolved: Server wins for ${item.table_name} id ${item.record_id}`);
                  const r = conflict.resolvedRecord;
                  
                  if (item.table_name === 'members') {
                    await sql`
                      UPDATE local_members SET
                        first_name = ${r.first_name}, last_name = ${r.last_name}, photo_url = ${r.photo_url},
                        birth_date = ${r.birth_date}, conversion_date = ${r.conversion_date}, baptism_date = ${r.baptism_date},
                        phone = ${r.phone}, dni = ${r.dni}, address = ${r.address}, maps_link = ${r.maps_link},
                        is_leader = ${r.is_leader ? 1 : 0}, leadership_role = ${r.leadership_role},
                        ministry_id = ${r.ministry_id}, role_id = ${r.role_id}, latitude = ${r.latitude},
                        longitude = ${r.longitude}, deleted_at = ${r.deleted_at}, tithes_sum = ${r.tithes_sum},
                        updated_at = ${r.updated_at}, version = ${r.version},
                        education_level = ${r.education_level}, career_id = ${r.career_id},
                        is_studying = ${r.is_studying ? 1 : 0}, studying_career_id = ${r.studying_career_id},
                        phone_country_code = ${r.phone_country_code || '+593'}
                      WHERE id = ${item.record_id};
                    `;
                  } else if (item.table_name === 'schedules') {
                    await sql`
                      UPDATE local_schedules SET
                        day = ${r.day}, title = ${r.title}, time_range = ${r.time_range},
                        description = ${r.description}, order_index = ${r.order_index},
                        updated_at = ${r.updated_at}, version = ${r.version}
                      WHERE id = ${item.record_id};
                    `;
                  } else if (item.table_name === 'sermon_notes') {
                    await sql`
                      UPDATE local_sermon_notes SET
                        content = ${r.content}, updated_at = ${r.updated_at}, version = ${r.version}
                      WHERE id = ${item.record_id};
                    `;
                  }
                  
                  // Delete sync queue item and continue
                  await sql`DELETE FROM sync_queue WHERE id = ${item.id}`;
                  continue;
                }
              }
            }

            try {
              // Local wins or remote doesn't exist: push changes to server
              // Supabase trigger will automatically increment version and set updated_at
              let upsertPayload = { ...payload };
              let emails = null;
              let service_areas = null;
              let talents = null;
              let spiritual_gifts = null;

              if (item.table_name === 'members') {
                const {
                  emails: e,
                  service_areas: sa,
                  talents: t,
                  spiritual_gifts: sg,
                  ...rest
                } = payload;
                upsertPayload = rest;
                emails = e;
                service_areas = sa;
                talents = t;
                spiritual_gifts = sg;
              }

              const { error: upsertError } = await supabase
                .from(item.table_name)
                .upsert({
                  id: item.record_id,
                  ...upsertPayload
                });

              if (upsertError) {
                throw upsertError;
              }

              // Sync relationship tables for members on server
              if (item.table_name === 'members') {
                // 1. Sync emails
                if (emails !== undefined && emails !== null) {
                  const { error: delErr } = await supabase
                    .from('member_emails')
                    .delete()
                    .eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  const validEmails = emails.filter((x: any) => x.email && x.email.trim() !== '');
                  if (validEmails.length > 0) {
                    const { error: insErr } = await supabase
                      .from('member_emails')
                      .insert(
                        validEmails.map((x: any) => ({
                          member_id: item.record_id,
                          email: x.email
                        }))
                      );
                    if (insErr) throw insErr;
                  }
                }

                // 2. Sync service areas
                if (service_areas !== undefined && service_areas !== null) {
                  const { error: delErr } = await supabase
                    .from('member_service_areas')
                    .delete()
                    .eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (service_areas.length > 0) {
                    const { error: insErr } = await supabase
                      .from('member_service_areas')
                      .insert(
                        service_areas.map((x: any) => ({
                          member_id: item.record_id,
                          service_area_id: x.catalog_roles?.id || x
                        }))
                      );
                    if (insErr) throw insErr;
                  }
                }

                // 3. Sync talents
                if (talents !== undefined && talents !== null) {
                  const { error: delErr } = await supabase
                    .from('member_talents')
                    .delete()
                    .eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (talents.length > 0) {
                    const { error: insErr } = await supabase
                      .from('member_talents')
                      .insert(
                        talents.map((x: any) => ({
                          member_id: item.record_id,
                          talent_id: x.catalog_roles?.id || x
                        }))
                      );
                    if (insErr) throw insErr;
                  }
                }

                // 4. Sync spiritual gifts
                if (spiritual_gifts !== undefined && spiritual_gifts !== null) {
                  const { error: delErr } = await supabase
                    .from('member_spiritual_gifts')
                    .delete()
                    .eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (spiritual_gifts.length > 0) {
                    const { error: insErr } = await supabase
                      .from('member_spiritual_gifts')
                      .insert(
                        spiritual_gifts.map((x: any) => ({
                          member_id: item.record_id,
                          gift_id: x.catalog_roles?.id || x
                        }))
                      );
                    if (insErr) throw insErr;
                  }
                }
              }

              // Remove item from SQLite sync queue upon successful synchronization
              await sql`DELETE FROM sync_queue WHERE id = ${item.id};`;

            } catch (err: any) {
              console.error(`Sync error on table ${item.table_name} for record ${item.record_id}:`, err);

              const errCode = err?.code || '';
              const isPermanentDbError = typeof errCode === 'string' && (
                errCode.startsWith('23') || // Integrity Constraint Violation (unique, foreign key, etc.)
                errCode.startsWith('42') || // Syntax Error / Access Rule Violation (including RLS 42501)
                errCode.startsWith('22')    // Data Exception (type errors, overflow)
              );

              if (isPermanentDbError) {
                let errorMsg = `Error al sincronizar fila de "${item.table_name}": `;
                if (errCode === '23505') {
                  errorMsg += 'Cédula/DNI o dato duplicado en el servidor.';
                } else if (errCode === '42501') {
                  errorMsg += 'Permisos denegados (RLS) en el servidor.';
                } else {
                  errorMsg += err.message || 'Error de base de datos.';
                }
                toast.error(errorMsg, { duration: 6000 });

                // Discard the failing mutation to unblock the sync queue
                await sql`DELETE FROM sync_queue WHERE id = ${item.id};`;
              } else {
                // Network error or temporary server issue, throw to retry later
                throw err;
              }
            }
          }
        }

        // Pull latest state from server after sync to align versions and updated_at
        await get().pullFromServer();
        toast.success('Sincronización completada exitosamente.');
      } catch (err) {
        console.error('Error in syncOfflineQueue:', err);
        toast.error('Ocurrió un error al sincronizar con el servidor.');
      } finally {
        set({ isSyncing: false });
      }
    },

    pullFromServer: async () => {
      try {
        console.log('Pulling database state from Supabase to sync local SQLite cache...');

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
          // Clear local table and bulk load (or single statements since SQLite in OPFS is fast)
          await sql`DELETE FROM local_members;`;
          for (const m of members) {
            await sql`
              INSERT OR REPLACE INTO local_members (
                id, first_name, last_name, photo_url, birth_date, conversion_date,
                baptism_date, phone, dni, address, maps_link, is_leader, leadership_role,
                ministry_id, role_id, latitude, longitude, deleted_at, tithes_sum,
                created_at, updated_at, version,
                emails, service_areas, talents, spiritual_gifts, gender,
                education_level, career_id, is_studying, studying_career_id, phone_country_code
              ) VALUES (
                ${m.id}, ${m.first_name}, ${m.last_name}, ${m.photo_url || null}, ${m.birth_date || null}, ${m.conversion_date || null},
                ${m.baptism_date || null}, ${m.phone || null}, ${m.dni || null}, ${m.address || null}, ${m.maps_link || null}, ${m.is_leader ? 1 : 0}, ${m.leadership_role || null},
                ${m.ministry_id || null}, ${m.role_id || null}, ${m.latitude || null}, ${m.longitude || null}, ${m.deleted_at || null}, ${m.tithes_sum || 0},
                ${m.created_at}, ${m.updated_at}, ${m.version},
                ${m.member_emails ? JSON.stringify(m.member_emails) : '[]'},
                ${m.member_service_areas ? JSON.stringify(m.member_service_areas) : '[]'},
                ${m.member_talents ? JSON.stringify(m.member_talents) : '[]'},
                ${m.member_spiritual_gifts ? JSON.stringify(m.member_spiritual_gifts) : '[]'},
                ${m.gender || null},
                ${m.education_level || null}, ${m.career_id || null}, ${m.is_studying ? 1 : 0}, ${m.studying_career_id || null}, ${m.phone_country_code || '+593'}
              );
            `;
          }
        }

        // 2. Pull schedules
        const { data: schedules, error: sErr } = await supabase
          .from('schedules')
          .select('*');
        if (sErr) throw sErr;

        if (schedules) {
          await sql`DELETE FROM local_schedules;`;
          for (const s of schedules) {
            await sql`
              INSERT OR REPLACE INTO local_schedules (
                id, day, title, time_range, description, order_index,
                created_at, updated_at, version
              ) VALUES (
                ${s.id}, ${s.day}, ${s.title}, ${s.time_range}, ${s.description || null}, ${s.order_index || 0},
                ${s.created_at}, ${s.updated_at}, ${s.version}
              );
            `;
          }
        }

        // 3. Pull sermon_notes
        const { data: notes, error: nErr } = await supabase
          .from('sermon_notes')
          .select('*');
        if (nErr) throw nErr;

        if (notes) {
          await sql`DELETE FROM local_sermon_notes;`;
          for (const n of notes) {
            await sql`
              INSERT OR REPLACE INTO local_sermon_notes (
                id, user_id, sermon_id, content,
                created_at, updated_at, version
              ) VALUES (
                ${n.id}, ${n.user_id}, ${n.sermon_id || null}, ${n.content},
                ${n.created_at}, ${n.updated_at}, ${n.version}
              );
            `;
          }
        }

        console.log('Local SQLite cache fully updated with remote data.');
      } catch (err) {
        console.error('Error pulling server database data to SQLite cache:', err);
      }
    }
  };
});
