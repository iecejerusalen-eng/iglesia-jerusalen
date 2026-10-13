import { useEffect,useId } from 'react';
import { useEditorGuardStore } from '../store/useEditorGuardStore';

/** BrowserRouter: protect document exit and delegated link navigation. */
export function useUnsavedChanges(dirty: boolean) {
  const id=useId();const setDirty=useEditorGuardStore(state=>state.setDirty);
  useEffect(()=>{setDirty(id,dirty);return()=>setDirty(id,false);},[id,dirty,setDirty]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('beforeunload', unload); };
  }, [dirty]);
}
