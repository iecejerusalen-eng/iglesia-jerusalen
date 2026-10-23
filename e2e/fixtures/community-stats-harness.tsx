import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StatsSection } from '../../src/features/home/components/StatsSection';
import '../../src/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor de revisión visual');
const params = new URLSearchParams(location.search);
const stats = params.has('empty') ? { members: 0, baptized: 0, cells: 0, kids: 0, youth: 0 }
  : params.has('large') ? { members: 12345678, baptized: 10000, cells: 500, kids: 1234, youth: 1234567 }
    : { members: 13, baptized: 1, cells: 0, kids: 0, youth: 2 };
if (params.has('dark')) document.documentElement.classList.add('dark');
ReactDOM.createRoot(root).render(<BrowserRouter><main style={{ minHeight: '100vh', paddingTop: 32 }} className="bg-slate-50 dark:bg-slate-950"><StatsSection stats={stats} isLoading={params.has('loading')} /></main></BrowserRouter>);
