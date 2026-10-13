interface SessionError { path: string; at: string }
const key='jerusalen-render-errors';
export function readSessionErrors():SessionError[]{try{const raw:unknown=JSON.parse(sessionStorage.getItem(key)??'[]');return Array.isArray(raw)?raw.filter((item):item is SessionError=>item&&typeof item.path==='string'&&typeof item.at==='string').slice(-30):[];}catch(e){console.error('No se pudo leer registro local de errores',e);return [];}}
export function recordSessionError(){try{sessionStorage.setItem(key,JSON.stringify([...readSessionErrors(),{path:window.location.pathname,at:new Date().toISOString()}].slice(-30)));}catch(e){console.error('No se pudo guardar registro local de errores',e);}}
