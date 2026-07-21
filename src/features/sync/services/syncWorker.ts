import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import { resolveConflict } from '../../../utils/conflictResolver';
import { toast } from 'sonner';
import { pullFromServer } from './syncPull';

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  created_at: string;
}

export const processSyncQueue = async (
  isSyncing: boolean,
  isOnline: boolean,
  setSyncing: (status: boolean) => void
) => {
  if (isSyncing || !isOnline) return;

  setSyncing(true);

  try {
    const db = await getDb();
    // Fetch all queued mutations and sort by created_at
    const queue: SyncQueueItem[] = await db.getAll('sync_queue');
    queue.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (queue.length === 0) {
      setSyncing(false);
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
              toast.warning(`Tus cambios en ${item.table_name} no se aplicaron porque alguien más modificó el registro.`);
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
                    dedicated_verse: r.dedicated_verse || null,
                    marital_status: r.marital_status || null,
                    gender: r.gender || null,
                    birth_place: r.birth_place || null,
                    has_disability: r.has_disability ? 1 : 0,
                    disability_types: r.disability_types ? JSON.stringify(r.disability_types) : '[]',
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
          let additional_phones = null;

          if (item.table_name === 'members') {
            const { emails: e, service_areas: sa, talents: t, spiritual_gifts: sg, additional_phones: ap, ...rest } = payload;
            upsertPayload = rest;
            emails = e;
            service_areas = sa;
            talents = t;
            spiritual_gifts = sg;
            additional_phones = ap;
          }

          const { error: upsertError } = await supabase.from(item.table_name).upsert({ id: item.record_id, ...upsertPayload });
          if (upsertError) throw upsertError;

          if (item.table_name === 'members') {
            if (emails !== undefined && emails !== null) {
              const { error: delErr } = await supabase.from('member_emails').delete().eq('member_id', item.record_id);
              if (delErr) throw delErr;

              const validEmails = emails.filter((x: Record<string, unknown>) => typeof x.email === 'string' && x.email.trim() !== '');
              if (validEmails.length > 0) {
                const { error: insErr } = await supabase.from('member_emails').insert(validEmails.map((x: Record<string, unknown>) => ({ member_id: item.record_id, email: x.email })));
                if (insErr) throw insErr;
              }
            }

            if (additional_phones !== undefined && additional_phones !== null) {
              const { error: delErr } = await supabase.from('member_phones').delete().eq('member_id', item.record_id);
              if (delErr) throw delErr;

              const validPhones = additional_phones.filter((x: Record<string, unknown>) => typeof x.phone === 'string' && x.phone.trim() !== '');
              if (validPhones.length > 0) {
                const { error: insErr } = await supabase.from('member_phones').insert(validPhones.map((x: Record<string, unknown>) => ({ 
                  member_id: item.record_id, 
                  phone: x.phone,
                  country_code: x.phone_country_code || '+593'
                })));
                if (insErr) throw insErr;
              }
            }

            if (service_areas !== undefined && service_areas !== null) {
              const { error: delErr } = await supabase.from('member_service_areas').delete().eq('member_id', item.record_id);
              if (delErr) throw delErr;

              if (service_areas.length > 0) {
                const { error: insErr } = await supabase.from('member_service_areas').insert(service_areas.map((x: Record<string, unknown>) => ({ member_id: item.record_id, service_area_id: (x.catalog_roles as Record<string, string>)?.id || x })));
                if (insErr) throw insErr;
              }
            }

            if (talents !== undefined && talents !== null) {
              const { error: delErr } = await supabase.from('member_talents').delete().eq('member_id', item.record_id);
              if (delErr) throw delErr;

              if (talents.length > 0) {
                const { error: insErr } = await supabase.from('member_talents').insert(talents.map((x: Record<string, unknown>) => ({ member_id: item.record_id, talent_id: (x.catalog_roles as Record<string, string>)?.id || x })));
                if (insErr) throw insErr;
              }
            }

            if (spiritual_gifts !== undefined && spiritual_gifts !== null) {
              const { error: delErr } = await supabase.from('member_spiritual_gifts').delete().eq('member_id', item.record_id);
              if (delErr) throw delErr;

              if (spiritual_gifts.length > 0) {
                const { error: insErr } = await supabase.from('member_spiritual_gifts').insert(spiritual_gifts.map((x: Record<string, unknown>) => ({ member_id: item.record_id, gift_id: (x.catalog_roles as Record<string, string>)?.id || x })));
                if (insErr) throw insErr;
              }
            }
          }

          await db.delete('sync_queue', item.id);

        } catch (err: unknown) {
          console.error(`Sync error on table ${item.table_name} for record ${item.record_id}:`, err);
          const errCode = (err as Record<string, unknown>)?.code || '';
          const isPermanentDbError = typeof errCode === 'string' && (
            errCode.startsWith('23') || errCode.startsWith('42') || errCode.startsWith('22')
          );

          if (isPermanentDbError) {
            let errorMsg = `Error al sincronizar fila de "${item.table_name}": `;
            if (errCode === '23505') errorMsg += 'Cédula/DNI o dato duplicado en el servidor.';
            else if (errCode === '42501') errorMsg += 'Permisos denegados (RLS) en el servidor.';
            else if (errCode === '42703') errorMsg += 'La columna "dedicated_verse" no existe en el servidor. Aplica la migración SQL.';
            else errorMsg += (err as Error)?.message || 'Error de base de datos.';
            toast.error(errorMsg, { duration: 6000 });
            await db.delete('sync_queue', item.id);
          } else {
            throw err;
          }
        }
      }
    }

    await pullFromServer();
    toast.success('Sincronización completada exitosamente.');
  } catch (err) {
    console.error('Error in syncOfflineQueue:', err);
    toast.error('Ocurrió un error al sincronizar con el servidor.');
  } finally {
    setSyncing(false);
  }
};
