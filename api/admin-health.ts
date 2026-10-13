import { createClient } from '@supabase/supabase-js';
type Request = { method?: string; headers: Record<string,string | string[] | undefined> };
type Response = { status: (code:number)=>Response; json:(value:unknown)=>void; setHeader:(key:string,value:string)=>void };
const origin='https://www.iecejerusalen.com';
export default async function handler(req:Request,res:Response){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Usa POST.'});
 const authorization=req.headers.authorization;
 if(typeof authorization!=='string'||!authorization.startsWith('Bearer '))return res.status(401).json({error:'Inicia sesión.'});
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const key=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
 if(!url||!key)return res.status(503).json({error:'Comprobación no configurada en el servidor.'});
 const client=createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const auth=await client.auth.getUser(authorization.slice(7));
 if(auth.error||!auth.data.user)return res.status(401).json({error:'Sesión no válida.'});
 const permission=await client.rpc('can_check_site_health');
 if(permission.error||permission.data!==true)return res.status(403).json({error:'Necesitas permiso de consulta de páginas.'});
 try{
  const content=await client.from('about_learning_published').select('sources,content');if(content.error)throw content.error;
  const paths=new Set(['/','/nosotros','/nosotros/doctrina','/nosotros/himno','/nosotros/documentos','/visita','/sitemap.xml']);
  const collect=(value:unknown):void=>{
   if(typeof value==='string'&&(value.startsWith('/')||value.startsWith(origin+'/'))){
    const target=new URL(value,origin);if(target.origin===origin&&!target.pathname.startsWith('/admin')&&!target.pathname.startsWith('/api'))paths.add(target.pathname);
   }else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect);
  };content.data.forEach(collect);
  const selected=[...paths].slice(0,30);const results=[];
  // Bounded, fixed public host, no arbitrary URLs or redirects (SSRF boundary).
  for(let i=0;i<selected.length;i+=5){results.push(...await Promise.all(selected.slice(i,i+5).map(async path=>{
   try{const response=await fetch(origin+path,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(5000)});const shellAsFile=/\.[a-z0-9]{2,5}$/i.test(path)&&path!=='/sitemap.xml'&&/text\/html/.test(response.headers.get('content-type')??'');return {path,status:response.status,ok:response.status===200&&!shellAsFile,detail:shellAsFile?'Devuelve HTML en lugar del archivo.':response.status===200?'Disponible por HTTPS.':'Revisar respuesta HTTP o redirección.'};}catch(e){console.error('Comprobación HTTPS fallida',path,e instanceof Error?e.name:'Error');return {path,status:null,ok:false,detail:'Fallo de conexión desde el comprobador; confirma con otra red.'};}
  })));}
  return res.status(200).json({checkedAt:new Date().toISOString(),results,scope:'Rutas principales y referencias internas de Nosotros; no valida contenido renderizado ni enlaces externos.'});
 }catch(e){console.error('No se pudo revisar el sitio',e);return res.status(500).json({error:'No se pudo consultar el contenido del sitio.'});}
}
