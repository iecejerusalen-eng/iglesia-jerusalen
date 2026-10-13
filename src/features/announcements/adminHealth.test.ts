import { describe,expect,it,vi } from 'vitest';
vi.mock('../../config/supabase',()=>({supabase:{}}));
import { isAnnouncementExpired } from './adminHealth';
const now=new Date('2026-10-13T03:00:00Z');
describe('announcement health',()=>{
 it('includes explicit expiry and expired nonrecurring events',()=>{expect(isAnnouncementExpired({expires_at:'2026-10-12T00:00:00Z',event:null},now)).toBe(true);expect(isAnnouncementExpired({expires_at:null,event:{id:'test',title:'Test',start_date:'2026-09-01',end_date:'2026-09-01',start_time:null,end_time:null,is_recurring:false}},now)).toBe(true);});
 it('keeps general notices without expiry',()=>expect(isAnnouncementExpired({expires_at:null,event:null},now)).toBe(false));
});
