import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryManager from '../../src/features/store/components/InventoryManager';
import ConfirmDialog from '../../src/components/common/ConfirmDialog';
import { useAuthStore } from '../../src/store/useAuthStore';
import type { DbProduct } from '../../src/features/store/types';
import '../../src/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor QA');
useAuthStore.setState({ user: { id:'00000000-0000-0000-0000-000000000001', aud:'authenticated', app_metadata:{}, user_metadata:{}, created_at:'2026-10-21T00:00:00Z' } });
const products: DbProduct[] = [{ id:'10000000-0000-0000-0000-000000000001',name:'Inventario QA físico',sku:'QA-ONLY',category:'Prueba aislada',type:'physical',stock:3,product_variants:[],price:10,description:null,image_url:null,created_at:'2026-10-21T00:00:00Z' }];
ReactDOM.createRoot(root).render(<QueryClientProvider client={new QueryClient()}><main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950"><InventoryManager products={products} canEdit={!location.search.includes('readonly')} /><ConfirmDialog /></main></QueryClientProvider>);
