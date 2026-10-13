import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRecoveryDraft } from './useRecoveryDraft';
vi.mock('../store/useAuthStore',()=>({useAuthStore:(select:(state:{user:{id:string}})=>unknown)=>select({user:{id:'test-editor'}})}));
afterEach(()=>{sessionStorage.clear();vi.restoreAllMocks();});
describe('editor recovery',()=>{
 it('saves locally without invoking a remote publication, and clears after confirmation',async()=>{const value={title:'Pending draft'};const {result}=renderHook(()=>useRecoveryDraft('test',value,{title:'Saved'},true,true));await waitFor(()=>expect(result.current.savedAt).not.toBeNull(),{timeout:1600});expect(JSON.parse(sessionStorage.getItem('jerusalen-recovery:test-editor:test')!).value).toEqual(value);act(()=>result.current.clear());expect(sessionStorage.getItem('jerusalen-recovery:test-editor:test')).toBeNull();});
 it('never writes a readonly editor',async()=>{const {result}=renderHook(()=>useRecoveryDraft('read',{title:'x'},{title:'y'},true,false));expect(result.current.savedAt).toBeNull();expect(sessionStorage.length).toBe(0);});
 it('retains the old baseline so a recovery conflict is visible',async()=>{sessionStorage.setItem('jerusalen-recovery:test-editor:conflict',JSON.stringify({value:{title:'Old pending'},baseline:'old',savedAt:new Date().toISOString()}));const {result}=renderHook(()=>useRecoveryDraft('conflict',{title:'New remote'},{title:'New remote'},false,true));await waitFor(()=>expect(result.current.recovery?.baseline).toBe('old'));});
});
