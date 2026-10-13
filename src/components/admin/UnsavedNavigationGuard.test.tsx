import { fireEvent,render,screen,waitFor,cleanup } from '@testing-library/react';
import { createMemoryRouter,RouterProvider,useNavigate } from 'react-router-dom';
import { afterEach,describe,expect,it,vi } from 'vitest';
import UnsavedNavigationGuard from './UnsavedNavigationGuard';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useEditorGuardStore } from '../../store/useEditorGuardStore';
const confirm=vi.hoisted(()=>vi.fn());
vi.mock('../../store/useConfirmStore',()=>({useConfirmStore:(select:(state:{confirm:typeof confirm})=>unknown)=>select({confirm})}));
function Editor(){useUnsavedChanges(true);const navigate=useNavigate();return <><UnsavedNavigationGuard/><h1>Editor pendiente</h1><button onClick={()=>navigate(-1)}>Atrás</button></>;}
afterEach(()=>{cleanup();useEditorGuardStore.setState({dirtyEditors:[]});vi.clearAllMocks();});
describe('editor navigation protection',()=>{
 it('allows canceling browser-history navigation and proceeds only after confirmation',async()=>{confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);const router=createMemoryRouter([{path:'/other',element:<h1>Otra página</h1>},{path:'/edit',element:<Editor/>}],{initialEntries:['/other','/edit'],initialIndex:1});render(<RouterProvider router={router}/>);await waitFor(()=>expect(useEditorGuardStore.getState().dirtyEditors.length).toBe(1));fireEvent.click(screen.getByRole('button',{name:'Atrás'}));await waitFor(()=>expect(confirm).toHaveBeenCalledTimes(1));expect(screen.getByRole('heading',{name:'Editor pendiente'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Atrás'}));await waitFor(()=>expect(screen.getByRole('heading',{name:'Otra página'})).toBeInTheDocument());});
});
