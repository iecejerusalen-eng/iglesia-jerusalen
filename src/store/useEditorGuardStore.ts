import { create } from 'zustand';
interface EditorGuardState { dirtyEditors:string[];setDirty:(id:string,dirty:boolean)=>void }
export const useEditorGuardStore=create<EditorGuardState>(set=>({dirtyEditors:[],setDirty:(id,dirty)=>set(state=>({dirtyEditors:dirty?[...new Set([...state.dirtyEditors,id])]:state.dirtyEditors.filter(item=>item!==id)}))}));
