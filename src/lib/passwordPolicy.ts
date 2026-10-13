/** Check using a SHA-1 prefix only. Never send or log the password or its full hash. */
export async function validateNewPassword(password: string): Promise<void> {
  if (password.length < 12) throw new Error('Usa al menos 12 caracteres para tu nueva contraseña.');
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
  const hash = Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase();
  const response = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0,5)}`, { headers: { 'Add-Padding':'true' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('No se pudo verificar la seguridad de la contraseña. Intenta nuevamente.');
  const suffix = hash.slice(5);
  const breached = (await response.text()).split(/\r?\n/).some(line => { const [candidate,count]=line.split(':'); return candidate === suffix && Number(count)>0; });
  if (breached) throw new Error('Esta contraseña aparece en filtraciones conocidas. Elige otra, única para tu cuenta.');
}
