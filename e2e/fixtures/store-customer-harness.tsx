import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MyPurchases from '../../src/pages/public/MyPurchases';
import Store from '../../src/pages/public/Store';
import TrackingKey from '../../src/features/store/components/TrackingKey';
import { useAuthStore } from '../../src/store/useAuthStore';
import '../../src/index.css';

const root = document.getElementById('root');
if (!root?.dataset.order) throw new Error('Falta el pedido sintético del entorno QA');
useAuthStore.setState({ user: location.search.includes('account=1') ? {
  id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated',
  app_metadata: {}, user_metadata: {}, created_at: '2026-10-21T00:00:00Z',
} : null, isLoading: false });
ReactDOM.createRoot(root).render(<HelmetProvider><QueryClientProvider client={new QueryClient()}><BrowserRouter>
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    {location.search.includes('catalog=1') ? <Store /> : <><TrackingKey orderId={root.dataset.order} secret={'a'.repeat(64)} /><MyPurchases /></>}
  </div>
</BrowserRouter></QueryClientProvider></HelmetProvider>);
