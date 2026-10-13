import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { validateNewPassword } from './passwordPolicy';
afterEach(()=>vi.unstubAllGlobals());
describe('new password privacy and protection',()=>{
 it('rejects short passwords before network access',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);await expect(validateNewPassword('123456')).rejects.toThrow('12 caracteres');expect(fetcher).not.toHaveBeenCalled();});
 it('sends only a five-character prefix and rejects a known hash',async()=>{vi.stubGlobal('crypto',webcrypto);const password='a-test-password-only';const hash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-1',new TextEncoder().encode(password)))).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();const fetcher=vi.fn().mockResolvedValue({ok:true,text:async()=>`${hash.slice(5)}:12`});vi.stubGlobal('fetch',fetcher);await expect(validateNewPassword(password)).rejects.toThrow('filtraciones');expect(fetcher.mock.calls[0][0]).toBe(`https://api.pwnedpasswords.com/range/${hash.slice(0,5)}`);expect(JSON.stringify(fetcher.mock.calls)).not.toContain(password);expect(JSON.stringify(fetcher.mock.calls)).not.toContain(hash);});
 it('does not claim password safety when the check is unavailable',async()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));await expect(validateNewPassword('long-test-secret')).rejects.toThrow('No se pudo verificar');});
});
