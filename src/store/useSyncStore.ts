import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { getDb } from '../config/localDb';
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
                phone_country_code: m.phone_country_code || '+593'
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
    },

    syncOfflineQueue: async () => {
      const { isSyncing, isOnline } = get();
      if (isSyncing || !isOnline) return;

      set({ isSyncing: true });

      try {
        const db = await getDb();
        // Fetch all queued mutations and sort by created_at
        let queue: SyncQueueItem[] = await db.getAll('sync_queue');
        queue.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (queue.length === 0) {
          set({ isSyncing: false });
          return;
        }

        console.log(`Processing sync queue: ${queue.length} mutations...`);

        for (const item of queue) {
          const payload = JSON.parse(item.payload);

          if (item.action === 'DELETE') {
            if (item.table_name === 'members') {
              const { error } = await supabase.from('members').update({ deleted_at: item.created_at }).eq('id', item.record_id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from(item.table_name).delete().eq('id', item.record_id);
              if (error) throw error;
            }
          } else {
            // INSERT or UPDATE
            const { data: remoteRecord, error: fetchError } = await supabase
              .from(item.table_name)
              .select('*')
              .eq('id', item.record_id)
              .maybeSingle();

            if (fetchError) {
              console.error(`Error checking remote conflicts for ${item.table_name}:`, fetchError);
              continue;
            }

            if (remoteRecord) {
              let localRecord;
              if (item.table_name === 'members') {
                localRecord = await db.get('local_members', item.record_id);
              } else if (item.table_name === 'schedules') {
                localRecord = await db.get('local_schedules', item.record_id);
              } else if (item.table_name === 'sermon_notes') {
                localRecord = await db.get('local_sermon_notes', item.record_id);
              }

              if (localRecord) {
                const conflict = resolveConflict(localRecord, remoteRecord);

                if (conflict.winner === 'remote') {
                  console.log(`Conflict resolved: Server wins for ${item.table_name} id ${item.record_id}`);
                  const r = conflict.resolvedRecord;
                  
                  if (item.table_name === 'members') {
                    await db.put('local_members', {
                        id: item.record_id,
                        first_name: r.first_name, last_name: r.last_name, photo_url: r.photo_url,
                        birth_date: r.birth_date, conversion_date: r.conversion_date, baptism_date: r.baptism_date,
                        phone: r.phone, dni: r.dni, address: r.address, maps_link: r.maps_link,
                        is_leader: r.is_leader ? 1 : 0, leadership_role: r.leadership_role,
                        ministry_id: r.ministry_id, role_id: r.role_id, latitude: r.latitude,
                        longitude: r.longitude, deleted_at: r.deleted_at, tithes_sum: r.tithes_sum,
                        updated_at: r.updated_at, version: r.version,
                        education_level: r.education_level, career_id: r.career_id,
                        is_studying: r.is_studying ? 1 : 0, studying_career_id: r.studying_career_id,
                        phone_country_code: r.phone_country_code || '+593',
                        emails: '[]', service_areas: '[]', talents: '[]', spiritual_gifts: '[]' // handled in pull
                    });
                  } else if (item.table_name === 'schedules') {
                    await db.put('local_schedules', {
                        id: item.record_id,
                        day: r.day, title: r.title, time_range: r.time_range,
                        description: r.description, order_index: r.order_index,
                        updated_at: r.updated_at, version: r.version,
                        created_at: r.created_at
                    });
                  } else if (item.table_name === 'sermon_notes') {
                    await db.put('local_sermon_notes', {
                        id: item.record_id,
                        user_id: r.user_id,
                        sermon_id: r.sermon_id,
                        content: r.content, updated_at: r.updated_at, version: r.version,
                        created_at: r.created_at
                    });
                  }
                  
                  await db.delete('sync_queue', item.id);
                  continue;
                }
              }
            }

            try {
              let upsertPayload = { ...payload };
              let emails = null;
              let service_areas = null;
              let talents = null;
              let spiritual_gifts = null;

              if (item.table_name === 'members') {
                const { emails: e, service_areas: sa, talents: t, spiritual_gifts: sg, ...rest } = payload;
                upsertPayload = rest;
                emails = e;
                service_areas = sa;
                talents = t;
                spiritual_gifts = sg;
              }

              const { error: upsertError } = await supabase.from(item.table_name).upsert({ id: item.record_id, ...upsertPayload });
              if (upsertError) throw upsertError;

              if (item.table_name === 'members') {
                if (emails !== undefined && emails !== null) {
                  const { error: delErr } = await supabase.from('member_emails').delete().eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  const validEmails = emails.filter((x: any) => x.email && x.email.trim() !== '');
                  if (validEmails.length > 0) {
                    const { error: insErr } = await supabase.from('member_emails').insert(validEmails.map((x: any) => ({ member_id: item.record_id, email: x.email })));
                    if (insErr) throw insErr;
                  }
                }

                if (service_areas !== undefined && service_areas !== null) {
                  const { error: delErr } = await supabase.from('member_service_areas').delete().eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (service_areas.length > 0) {
                    const { error: insErr } = await supabase.from('member_service_areas').insert(service_areas.map((x: any) => ({ member_id: item.record_id, service_area_id: x.catalog_roles?.id || x })));
                    if (insErr) throw insErr;
                  }
                }

                if (talents !== undefined && talents !== null) {
                  const { error: delErr } = await supabase.from('member_talents').delete().eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (talents.length > 0) {
                    const { error: insErr } = await supabase.from('member_talents').insert(talents.map((x: any) => ({ member_id: item.record_id, talent_id: x.catalog_roles?.id || x })));
                    if (insErr) throw insErr;
                  }
                }

                if (spiritual_gifts !== undefined && spiritual_gifts !== null) {
                  const { error: delErr } = await supabase.from('member_spiritual_gifts').delete().eq('member_id', item.record_id);
                  if (delErr) throw delErr;

                  if (spiritual_gifts.length > 0) {
                    const { error: insErr } = await supabase.from('member_spiritual_gifts').insert(spiritual_gifts.map((x: any) => ({ member_id: item.record_id, gift_id: x.catalog_roles?.id || x })));
                    if (insErr) throw insErr;
                  }
                }
              }

              await db.delete('sync_queue', item.id);

            } catch (err: any) {
              console.error(`Sync error on table ${item.table_name} for record ${item.record_id}:`, err);
              const errCode = err?.code || '';
              const isPermanentDbError = typeof errCode === 'string' && (
                errCode.startsWith('23') || errCode.startsWith('42') || errCode.startsWith('22')
              );

              if (isPermanentDbError) {
                let errorMsg = `Error al sincronizar fila de "${item.table_name}": `;
                if (errCode === '23505') errorMsg += 'Cédula/DNI o dato duplicado en el servidor.';
                else if (errCode === '42501') errorMsg += 'Permisos denegados (RLS) en el servidor.';
                else errorMsg += err.message || 'Error de base de datos.';
                toast.error(errorMsg, { duration: 6000 });
                await db.delete('sync_queue', item.id);
              } else {
                throw err;
              }
            }
          }
        }

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
                phone_country_code: m.phone_country_code || '+593'
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
    }
  };
});
