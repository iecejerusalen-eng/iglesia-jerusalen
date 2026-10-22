import { beforeEach, describe, expect, it, vi } from 'vitest';
import { claimTrackedOrder, getDigitalLibrary, makeTrackingCode, openDigitalResource, parseTrackingCode, readTrackingCode, restoreTrackedOrder } from '../services/customerService';
const state=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('../../../config/supabase',()=>({supabase:{functions:{invoke:state.invoke}}}));
const id='10000000-0000-0000-0000-000000000001',secret='a'.repeat(64),code=`JER1.${id}.${secret}`;
const order={id,user_id:null,customer_name:'QA',total:10,status:'pending_payment',order_items:[]};
beforeEach(()=>{sessionStorage.clear();state.invoke.mockReset();});
describe('Seguimiento privado y biblioteca',()=>{
 it('solo admite versión y separadores exactos; número solo no sirve',()=>{
  expect(makeTrackingCode(id,secret)).toBe(code);expect(parseTrackingCode(code)).toEqual({orderId:id,secret});
  for(const bad of [id,code.replace('JER1.','JER1x'),code.replace('.'+secret,'x'+secret),code+'extra',code.replace(secret,'b'.repeat(63))])expect(()=>parseTrackingCode(bad)).toThrow('inválida');
 });
 it('guarda la clave en sesión únicamente tras validar acceso, sin añadirla al payload público',async()=>{
  state.invoke.mockResolvedValueOnce({data:order,error:null});await restoreTrackedOrder(code);expect(readTrackingCode()).toBe(code);
  expect(state.invoke.mock.calls[0][1].body).toEqual({action:'status',payload:{order_id:id},secret});
 });
 it('no conserva claves erróneas ni simula historial vacío ante error',async()=>{
  state.invoke.mockResolvedValue({data:null,error:{context:new Response(JSON.stringify({error:'No disponible',rejected:true}),{status:400})}});
  await expect(restoreTrackedOrder(code)).rejects.toThrow('No disponible');expect(readTrackingCode()).toBe('');
  await expect(getDigitalLibrary()).rejects.toThrow('No disponible');
 });
 it('vincula usando clave y elimina copia invitada solo al recibir éxito',async()=>{
  state.invoke.mockResolvedValueOnce({data:order,error:null});await restoreTrackedOrder(code);
  state.invoke.mockResolvedValueOnce({data:null,error:new Error('Respuesta perdida')});await expect(claimTrackedOrder(code)).rejects.toThrow();expect(readTrackingCode()).toBe(code);
  state.invoke.mockResolvedValueOnce({data:{...order,user_id:'owner'},error:null});await claimTrackedOrder(code);expect(readTrackingCode()).toBe('');
 });
 it('rechaza una biblioteca inválida y enlaces que imitan a Google',async()=>{
  state.invoke.mockResolvedValueOnce({data:{},error:null});await expect(getDigitalLibrary()).rejects.toThrow();
  for(const url of ['https://drive.google.com.evil.invalid/a','http://drive.google.com/a','https://user:pass@drive.google.com/a','https://drive.google.com:8443/a']){
   state.invoke.mockResolvedValueOnce({data:{url,instructions:null,kind:'external_google'},error:null});await expect(openDigitalResource('item')).rejects.toThrow('revisión');
  }
 });
 it('entrega externa autorizada conserva instrucciones sin prometer firma temporal',async()=>{
  state.invoke.mockResolvedValueOnce({data:{url:'https://docs.google.com/document/d/qa',instructions:'Leer',kind:'external_google'},error:null});
  expect((await openDigitalResource('item')).kind).toBe('external_google');
 });
});
