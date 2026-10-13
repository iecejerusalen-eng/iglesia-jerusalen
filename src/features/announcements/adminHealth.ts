import { supabase } from '../../config/supabase';
import { isAnnouncementRelevantForHome } from './homeRelevance';
import type { AnnouncementEvent } from './types';
export function isAnnouncementExpired(announcement: {expires_at:string|null;event:AnnouncementEvent|null}, now=new Date()) {
 return Boolean(announcement.expires_at && Date.parse(announcement.expires_at)<=now.getTime()) || !isAnnouncementRelevantForHome(announcement,now);
}
export async function expiredAnnouncementCount() {
 const now=new Date();let count=0;
 for(let offset=0;;offset+=200){
  const result=await supabase.from('church_announcements').select('expires_at,event:events(id,title,start_date,end_date,start_time,end_time,is_recurring)').eq('status','published').range(offset,offset+199);
  if(result.error)throw result.error;
  const rows=result.data as unknown as {expires_at:string|null;event:AnnouncementEvent|null}[];
  count+=rows.filter(row=>isAnnouncementExpired(row,now)).length;
  if(rows.length<200)return count;
 }
}
