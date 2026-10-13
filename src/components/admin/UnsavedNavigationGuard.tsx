import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useEditorGuardStore } from '../../store/useEditorGuardStore';
import { useConfirmStore } from '../../store/useConfirmStore';
export default function UnsavedNavigationGuard(){
 const dirty=useEditorGuardStore(state=>state.dirtyEditors.length>0);
 return dirty?<ActiveNavigationGuard/>:null;
}
function ActiveNavigationGuard(){
 const blocker=useBlocker(true);const confirm=useConfirmStore(state=>state.confirm);
 useEffect(()=>{if(blocker.state!=='blocked')return;let cancelled=false;const {proceed,reset}=blocker;void confirm({title:'Cambios sin guardar',message:'Hay cambios sin confirmar en el servidor. ¿Quieres salir del editor?',confirmText:'Salir',cancelText:'Seguir editando'}).then(leave=>{if(!cancelled){if(leave){window.dispatchEvent(new Event('jerusalen-editor-leaving'));proceed();}else reset();}});return()=>{cancelled=true;};},[blocker,confirm]);
 return null;
}
