import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import type { Donation, DonationCategory } from '../../types';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Line, PieChart, Pie, Cell, Legend,
  BarChart
} from 'recharts';
import { 
  Download, Edit2, TrendingUp, DollarSign, Heart, ShoppingBag, Tag, PieChart as PieChartIcon, FileText, XCircle, FolderPlus, Settings2
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../../components/common/Skeletons';
import { toast } from 'sonner';

// Magic UI
import { NumberTicker } from '../../components/ui/magicui/number-ticker';
import { Marquee } from '../../components/ui/magicui/marquee';
import { ShinyButton } from '../../components/ui/magicui/shiny-button';

interface CustomTooltipItem {
  color?: string;
  name?: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold">
        <p className="font-serif font-bold text-gold mb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || '#D4AF37' }}></div>
            <span className="text-gray-300 capitalize">{item.name === 'diezmos' ? 'Diezmos' : item.name === 'ofrendas' ? 'Ofrendas' : item.name === 'tienda' ? 'Ventas Tienda' : item.name}:</span>
            <span className="font-mono font-bold text-white ml-auto">${item.value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number | string;
  price: number | string;
  products?: {
    name: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total: number | string;
  payment_method?: string | null;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  order_items?: OrderItem[] | null;
}

interface FilteredTransaction {
  id: string;
  type: 'donation' | 'order';
  name: string;
  email?: string | null;
  amount: number;
  category: string;
  paymentMethod?: string | null;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  imageUrl: string | null;
}

interface PaymentSharePoint {
  name: string;
  value: number;
  color: string;
}

interface ChartDataPoint {
  label: string;
  diezmos: number;
  ofrendas: number;
  tienda: number;
  total: number;
}

interface ParticipationPoint {
  name: string;
  value: number;
  color: string;
}

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'categories'>('metrics');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Master lists
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<DonationCategory[]>([]);

  // Filter and Derived statistics
  const [dateFilter, setDateFilter] = useState<'30days' | '90days' | 'year' | 'all'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<FilteredTransaction[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [paymentMethodsShare, setPaymentMethodsShare] = useState<PaymentSharePoint[]>([]);
  const [participationData, setParticipationData] = useState<ParticipationPoint[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const [stats, setStats] = useState({
    totalIncome: 0,
    donationsTotal: 0,
    donationsCount: 0,
    donationsAvg: 0,
    storeTotal: 0,
    storeCount: 0,
    storeAvg: 0,
    paymentMethodDominant: 'N/A',
    paymentMethodDominantCount: 0
  });

  // States for Category Form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DonationCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('donation_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    setCategories(data || []);
    return data || [];
  }, []);

  const fetchDonations = useCallback(async () => {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllDonations(data || []);
    return data || [];
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        payment_method,
        created_at,
        customer_name,
        customer_email,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            image_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllOrders((data as unknown as Order[]) || []);
    return (data as unknown as Order[]) || [];
  }, []);

  const processMetricsAndFilters = useCallback((
    donations: Donation[], 
    orders: Order[], 
    filter: '30days' | '90days' | 'year' | 'all'
  ) => {
    const now = new Date();
    let startDate: Date | null = null;

    if (filter === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter === '90days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (filter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredDons = donations.filter(d => {
      if (!startDate) return true;
      return new Date(d.created_at) >= startDate;
    });

    const filteredOrds = orders.filter(o => {
      if (!startDate) return true;
      return new Date(o.created_at) >= startDate;
    });

    const completedDons = filteredDons.filter(d => d.status === 'completed');
    const completedOrds = filteredOrds.filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'paid');

    const donationsTotal = completedDons.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const donationsCount = completedDons.length;
    const donationsAvg = donationsCount > 0 ? donationsTotal / donationsCount : 0;

    const storeTotal = completedOrds.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const storeCount = completedOrds.length;
    const storeAvg = storeCount > 0 ? storeTotal / storeCount : 0;

    const totalIncome = donationsTotal + storeTotal;

    const paymentCounts: Record<string, number> = {};
    
    completedDons.forEach(d => {
      const method = (d.payment_method || 'transfer').toLowerCase();
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });

    completedOrds.forEach(o => {
      const method = (o.payment_method || 'card').toLowerCase();
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });

    let dominantMethod = 'N/A';
    let maxCount = 0;
    Object.entries(paymentCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMethod = method;
      }
    });

    const methodLabels: Record<string, string> = {
      card: 'Tarjeta Crédito/Débito',
      transfer: 'Transferencia Bancaria',
      cash: 'Efectivo / Caja',
      paypal: 'PayPal',
      stripe: 'Stripe'
    };

    setStats({
      totalIncome,
      donationsTotal,
      donationsCount,
      donationsAvg,
      storeTotal,
      storeCount,
      storeAvg,
      paymentMethodDominant: methodLabels[dominantMethod] || dominantMethod.toUpperCase(),
      paymentMethodDominantCount: maxCount
    });

    const methodColors: Record<string, string> = {
      transfer: '#1E3A8A',
      card: '#10B981',
      cash: '#D97706',
      paypal: '#3B82F6',
      stripe: '#8B5CF6'
    };

    const sharePoints: PaymentSharePoint[] = Object.entries(paymentCounts).map(([key, value]) => ({
      name: methodLabels[key] || key.toUpperCase(),
      value,
      color: methodColors[key] || '#6B7280'
    }));
    setPaymentMethodsShare(sharePoints);

    let diezmosTotal = 0;
    let ofrendasTotal = 0;
    completedDons.forEach(d => {
      const catName = (d.donation_categories?.name || d.category || '').toLowerCase();
      if (catName.includes('diezmo')) {
        diezmosTotal += (Number(d.amount) || 0);
      } else {
        ofrendasTotal += (Number(d.amount) || 0);
      }
    });

    const partData: ParticipationPoint[] = [
      { name: 'Diezmos', value: diezmosTotal, color: '#1e3a8a' },
      { name: 'Ofrendas Especiales', value: ofrendasTotal, color: '#d97706' },
      { name: 'Ventas Tienda', value: storeTotal, color: '#10b981' }
    ].filter(p => p.value > 0);
    setParticipationData(partData);

    const productMap: Record<string, TopProduct> = {};
    completedOrds.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach(item => {
          const pName = item.products?.name || 'Producto Desconocido';
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const rev = qty * price;
          const img = item.products?.image_url || null;

          if (!productMap[pName]) {
            productMap[pName] = { name: pName, quantity: 0, revenue: 0, imageUrl: img };
          }
          productMap[pName].quantity += qty;
          productMap[pName].revenue += rev;
        });
      }
    });

    const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
    setTopProducts(sortedProducts);

    const mergedList: FilteredTransaction[] = [
      ...filteredDons.map(d => ({
        id: `don-${d.id}`,
        type: 'donation' as const,
        name: d.donor_name || 'Donante Anónimo',
        email: d.donor_email,
        amount: Number(d.amount) || 0,
        category: d.donation_categories?.name || d.category || 'General',
        paymentMethod: d.payment_method || 'transfer',
        status: (d.status === 'completed' ? 'completed' : d.status === 'pending' ? 'pending' : 'failed') as 'completed' | 'pending' | 'failed',
        date: d.created_at
      })),
      ...filteredOrds.map(o => ({
        id: `ord-${o.id}`,
        type: 'order' as const,
        name: o.customer_name || 'Cliente Tienda',
        email: o.customer_email,
        amount: Number(o.total) || 0,
        category: 'Tienda Jerusalén',
        paymentMethod: o.payment_method || 'card',
        status: (o.status === 'completed' || o.status === 'delivered' || o.status === 'paid' ? 'completed' : o.status === 'pending' ? 'pending' : 'failed') as 'completed' | 'pending' | 'failed',
        date: o.created_at
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(mergedList);

    const monthlyMap: Record<string, { diezmos: number; ofrendas: number; tienda: number; total: number }> = {};
    
    mergedList.filter(t => t.status === 'completed').forEach(t => {
      const dateObj = new Date(t.date);
      const monthKey = `${dateObj.toLocaleString('es-ES', { month: 'short' })} ${dateObj.getFullYear().toString().slice(-2)}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { diezmos: 0, ofrendas: 0, tienda: 0, total: 0 };
      }

      if (t.type === 'order') {
        monthlyMap[monthKey].tienda += t.amount;
      } else {
        const cat = t.category.toLowerCase();
        if (cat.includes('diezmo')) {
          monthlyMap[monthKey].diezmos += t.amount;
        } else {
          monthlyMap[monthKey].ofrendas += t.amount;
        }
      }
      monthlyMap[monthKey].total += t.amount;
    });

    const points: ChartDataPoint[] = Object.entries(monthlyMap).map(([label, val]) => ({
      label,
      ...val
    })).reverse().slice(-12);

    setChartData(points);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, dons, ords] = await Promise.all([
        fetchCategories(),
        fetchDonations(),
        fetchOrders()
      ]);

      processMetricsAndFilters(dons, ords, dateFilter);
    } catch (err) {
      console.error('Error al cargar datos financieros:', err);
      toast.error('Error al cargar la información financiera.');
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchDonations, fetchOrders, processMetricsAndFilters, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateFilterChange = (newFilter: '30days' | '90days' | 'year' | 'all') => {
    setDateFilter(newFilter);
    processMetricsAndFilters(allDonations, allOrders, newFilter);
  };

  const handleToggleCategoryActive = async (category: DonationCategory) => {
    try {
      const newStatus = !category.is_active;
      const { error } = await supabase
        .from('donation_categories')
        .update({ is_active: newStatus })
        .eq('id', category.id);

      if (error) throw error;
      
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: newStatus } : c));
      toast.success(`Categoría "${category.name}" ${newStatus ? 'activada' : 'desactivada'}.`);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo actualizar el estado de la categoría.');
    }
  };

  const handleOpenCategoryCreate = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '', is_active: true });
    setShowCategoryForm(true);
  };

  const handleOpenCategoryEdit = (category: DonationCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.error('Ingresa un nombre para la categoría.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('donation_categories')
          .update({
            name: categoryFormData.name.trim(),
            description: categoryFormData.description.trim() || null,
            is_active: categoryFormData.is_active
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categoría actualizada con éxito.');
      } else {
        const { error } = await supabase
          .from('donation_categories')
          .insert([{
            name: categoryFormData.name.trim(),
            description: categoryFormData.description.trim() || null,
            is_active: categoryFormData.is_active
          }]);

        if (error) throw error;
        toast.success('Categoría creada correctamente.');
      }

      setShowCategoryForm(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la categoría.');
    } finally {
      setActionLoading(false);
    }
  };

  const prepareExportData = () => {
    return filteredTransactions.map(t => ({
      ID: t.id,
      Tipo: t.type === 'donation' ? 'Donación / Diezmo' : 'Venta Tienda',
      Nombre: t.name,
      Email: t.email || 'N/A',
      Monto: t.amount,
      Categoría: t.category,
      Método_Pago: t.paymentMethod,
      Estado: t.status,
      Fecha: new Date(t.date).toLocaleDateString('es-EC')
    }));
  };

  const exportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No hay transacciones para exportar.');
      return;
    }
    const data = prepareExportData();
    exportToExcel(data, `finanzas_iglesia_${dateFilter}_${new Date().toISOString().split('T')[0]}`);
  };

  const exportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No hay transacciones para exportar.');
      return;
    }
    const data = prepareExportData();
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => Object.values(obj));
    exportToPDF('Libro Diario de Transacciones', headers, rows, `finanzas_iglesia_${dateFilter}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="relative min-h-full space-y-7 text-slate-800 dark:text-slate-100">
      {/* Atmosphere Background Glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]" aria-hidden="true" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Contabilidad & Transacciones
          </p>
          <h1 className="mt-1 text-2xl font-serif font-bold text-slate-950 dark:text-white">
            Gestión de Finanzas
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Visualiza ingresos e-commerce, diezmos y administra las categorías de donación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link 
            to="/admin/finanzas/donaciones" 
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-500/20 dark:text-blue-300 transition-all shadow-xs"
          >
            <Settings2 size={14} /> Página de donaciones
          </Link>
          {/* Time range filter */}
          {activeTab === 'metrics' && (
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value as '30days' | '90days' | 'year' | 'all')}
                className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="30days">Últimos 30 días</option>
                <option value="90days">Últimos 90 días</option>
                <option value="year">Este año ({new Date().getFullYear()})</option>
                <option value="all">Todo el tiempo</option>
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Métricas e Ingresos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Categorías de Donación
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton />
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : activeTab === 'metrics' ? (
        /* METRICS AND REVENUE TAB */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Real-time Ticker Marquee */}
          {filteredTransactions.length > 0 && (
            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/70 bg-white/75 dark:border-white/10 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
              <Marquee pauseOnHover className="[--duration:40s] py-3">
                {filteredTransactions.slice(0, 10).map((tx, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-6 border-r border-slate-200/50 dark:border-white/10 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${tx.type === 'donation' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tx.name}
                    </span>
                    <span className={`font-mono text-sm font-bold ${tx.type === 'donation' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      +${tx.amount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </Marquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white dark:from-slate-950"></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white dark:from-slate-950"></div>
            </div>
          )}

          {/* High-Aesthetic Glassmorphic KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Ingreso Total */}
            <article className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-teal-400/5 opacity-60 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ingreso Total</p>
                  <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center">
                    $<NumberTicker value={stats.totalIncome} decimalPlaces={2} />
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-blue-600 dark:text-blue-300">Donaciones: {stats.totalIncome > 0 ? ((stats.donationsTotal / stats.totalIncome) * 100).toFixed(0) : 0}%</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Tienda: {stats.totalIncome > 0 ? ((stats.storeTotal / stats.totalIncome) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <DollarSign size={20} />
                </span>
              </div>
            </article>

            {/* Card 2: Donaciones Recibidas */}
            <article className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-indigo-400/5 opacity-60 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Donaciones Recibidas</p>
                  <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 flex items-center">
                    $<NumberTicker value={stats.donationsTotal} decimalPlaces={2} />
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Recibos: {stats.donationsCount} | Prom: ${stats.donationsAvg.toFixed(0)}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400">
                  <Heart size={20} />
                </span>
              </div>
            </article>

            {/* Card 3: Ventas e-Commerce */}
            <article className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-teal-400/5 opacity-60 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ventas e-Commerce</p>
                  <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center">
                    $<NumberTicker value={stats.storeTotal} decimalPlaces={2} />
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Pedidos: {stats.storeCount} | Ticket: ${stats.storeAvg.toFixed(0)}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <ShoppingBag size={20} />
                </span>
              </div>
            </article>

            {/* Card 4: Canal Dominante */}
            <article className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 to-orange-400/5 opacity-60 pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Canal Dominante</p>
                  <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                    {stats.paymentMethodDominant}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Volumen: {stats.paymentMethodDominantCount} transacciones
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400">
                  <Tag size={20} />
                </span>
              </div>
            </article>
          </div>

          {/* Chart Row: Progress & Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Combined Progression (Left 2 cols) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-6 flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <TrendingUp size={18} />
                </span>
                Evolución Temporal de Ingresos
              </h3>
              <div className="h-80 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="diezmosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.25}/>
                      </linearGradient>
                      <linearGradient id="ofrendasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.25}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '15px' }} />
                    <Bar dataKey="diezmos" fill="url(#diezmosGrad)" name="Diezmos" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="ofrendas" fill="url(#ofrendasGrad)" name="Ofrendas" radius={[4, 4, 0, 0]} barSize={14} />
                    <Line type="monotone" dataKey="tienda" stroke="#10b981" strokeWidth={2.5} name="Tienda" dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#fff' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income breakdown share donut (Right 1 col) */}
            <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <PieChartIcon size={18} />
                </span>
                Distribución por Origen
              </h3>
              <div className="h-60 flex items-center justify-center relative">
                {participationData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <PieChart>
                        <Pie
                          data={participationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {participationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: unknown) => `$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-white font-mono">${stats.totalIncome.toLocaleString('es-EC', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic font-semibold">Sin ingresos acumulados</span>
                )}
              </div>

              {/* Legends details */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-2">
                {participationData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">${item.value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* E-Commerce Section: Top products & payment types */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top selling items */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-3xl border border-white/70 dark:border-white/10 p-6 shadow-sm flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-800 dark:text-white text-base mb-6 flex items-center gap-1.5">
                <ShoppingBag size={18} className="text-gold" />
                Productos más Vendidos (Tienda)
              </h3>
              
              {topProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Vertical bar chart of top items */}
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={topProducts.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} width={80} />
                        <Tooltip formatter={(value: unknown) => `${value} unidades`} />
                        <Bar dataKey="quantity" fill="#10B981" name="Unidades" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Detailed list */}
                  <div className="divide-y divide-gray-100 dark:divide-white/10 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {topProducts.slice(0, 5).map((prod, idx) => (
                      <div key={idx} className="py-2.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {prod.imageUrl ? (
                            <img loading="lazy" src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="text-gray-400 dark:text-gray-500" size={16} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="font-bold text-xs text-gray-800 dark:text-white block truncate">{prod.name}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">{prod.quantity} unidades vendidas</span>
                        </div>
                        <div className="text-right font-mono font-bold text-xs text-emerald-650 shrink-0">
                          +${prod.revenue.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-450 text-xs italic">
                  Sin ventas registradas en el rango seleccionado.
                </div>
              )}
            </div>

            {/* Payment methods stats */}
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-white/70 dark:border-white/10 p-6 shadow-sm flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
                <Tag size={18} className="text-gold" />
                Uso de Canales de Pago
              </h3>
              
              <div className="h-44 flex items-center justify-center">
                {paymentMethodsShare.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={paymentMethodsShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {paymentMethodsShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: unknown) => `${value} transacciones`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin registros de pago</span>
                )}
              </div>

              {/* List */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {paymentMethodsShare.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{item.value} txs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Transactions History */}
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-white/70 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="py-4 px-6 border-b border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-left">
                <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base flex items-center gap-1.5">
                  <FileText size={18} className="text-primary dark:text-church-gold-bright" />
                  Libro Diario de Transacciones Recientes
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">Donaciones y ventas registradas en Supabase.</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <ShinyButton
                  onClick={exportExcel}
                  shinyColor="#10B981"
                  className="bg-emerald-600 dark:bg-emerald-700 shadow-emerald-500/30 hover:shadow-emerald-500/50 text-[10px] px-4 py-2 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Download size={14} /> Excel
                </ShinyButton>
                <ShinyButton
                  onClick={exportPDF}
                  shinyColor="#EF4444"
                  className="bg-red-600 dark:bg-red-700 shadow-red-500/30 hover:shadow-red-500/50 text-[10px] px-4 py-2 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <FileText size={14} /> PDF
                </ShinyButton>
              </div>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                      <th className="py-4 px-6">Tipo</th>
                      <th className="py-4 px-6">Cliente/Donante</th>
                      <th className="py-4 px-6">Monto</th>
                      <th className="py-4 px-6">Categoría</th>
                      <th className="py-4 px-6">Método</th>
                      <th className="py-4 px-6">Fecha</th>
                      <th className="py-4 px-6">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10 text-sm text-gray-700 dark:text-gray-300">
                    {filteredTransactions.slice(0, visibleCount).map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            tx.type === 'donation'
                              ? 'bg-blue-50 text-primary border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/20'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/20'
                          }`}>
                            {tx.type === 'donation' ? 'Donación' : 'Venta Tienda'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="font-bold text-gray-800 dark:text-white block leading-tight">{tx.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{tx.email}</span>
                        </td>
                        <td className={`py-4 px-6 font-bold font-mono ${tx.status === 'failed' ? 'text-red-500 line-through' : 'text-green-600 dark:text-green-400'}`}>
                          +${tx.amount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-lg">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 capitalize text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {tx.paymentMethod === 'card' ? 'Tarjeta' : tx.paymentMethod === 'transfer' ? 'Transferencia' : tx.paymentMethod === 'cash' ? 'Efectivo' : tx.paymentMethod}
                        </td>
                        <td className="py-4 px-6 text-gray-400 dark:text-gray-500 text-xs font-semibold">
                          {new Date(tx.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === 'completed' ? 'bg-green-600 animate-none' : tx.status === 'pending' ? 'bg-amber-600 animate-pulse' : 'bg-red-500'
                            }`}></span>
                            {tx.status === 'completed' ? 'Completado' : tx.status === 'pending' ? 'Pendiente' : 'Fallido'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleCount < filteredTransactions.length && (
                  <div className="p-4 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cargar más transacciones
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-450 text-sm italic">
                Aún no hay transacciones de donaciones o ventas registradas en base de datos.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DONATION CATEGORIES CRUD TAB */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">Categorías Disponibles</h3>
            <button
              onClick={handleOpenCategoryCreate}
              className="bg-primary hover:bg-blue-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FolderPlus size={16} />
              Agregar Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all text-left ${
                  cat.is_active ? 'border-gray-150 dark:border-white/10 bg-white dark:bg-slate-800/50' : 'border-gray-200 dark:border-white/5 opacity-60 bg-gray-50/50 dark:bg-slate-800/20'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-serif font-bold text-gray-800 dark:text-white text-base">{cat.name}</h4>
                    <button
                      onClick={() => handleToggleCategoryActive(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        cat.is_active
                          ? 'bg-green-50 text-green-600 border-green-150 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/20 hover:bg-red-50 hover:text-accent-red hover:border-red-150'
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-150'
                      }`}
                    >
                      {cat.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    {cat.description || 'Sin descripción.'}
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => handleOpenCategoryEdit(cat)}
                    className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-blue-400 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <Edit2 size={12} />
                    Editar detalles
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Category Modal Form */}
          {showCategoryForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-150 dark:border-white/10 overflow-hidden animate-scale-in my-8">
                <div className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-150 dark:border-white/10 py-4 px-6 flex justify-between items-center">
                  <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                  <button
                    onClick={() => setShowCategoryForm(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1 transition-colors cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Ej. Ofrenda Pro-Misiones"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
                    <textarea
                      rows={3}
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Ej. Fondo especial destinado a la plantación de nuevas iglesias."
                    />
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={categoryFormData.is_active}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded text-primary focus:ring-primary/20 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="is_active" className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
                      Categoría disponible públicamente
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2 border border-gray-250 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 dark:disabled:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Guardando...' : 'Guardar Categoría'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
