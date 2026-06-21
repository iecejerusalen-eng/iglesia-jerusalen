import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import type { Donation, DonationCategory } from '../../types';
import { 
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Line, PieChart, Pie, Cell, Legend,
  BarChart
} from 'recharts';
import { 
  Edit2, XCircle, DollarSign, Tag, FolderPlus, 
  Heart, Download, ShoppingBag, TrendingUp,
  FileText, PieChart as PieChartIcon
} from 'lucide-react';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../../components/common/Skeletons';
import { toast } from 'sonner';

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
        *,
        order_items (
          *,
          products (*),
          product_variants (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllOrders(data || []);
    return data || [];
  }, []);

  const computeStatsAndChart = useCallback((
    donationsList: Donation[],
    ordersList: Order[],
    filter: '30days' | '90days' | 'year' | 'all'
  ) => {
    const today = new Date();
    let limitDate = new Date(0); // Epoch beginning (all time)

    if (filter === '30days') {
      limitDate = new Date();
      limitDate.setDate(today.getDate() - 30);
    } else if (filter === '90days') {
      limitDate = new Date();
      limitDate.setDate(today.getDate() - 90);
    } else if (filter === 'year') {
      limitDate = new Date(today.getFullYear(), 0, 1);
    }

    const filteredDonations = donationsList.filter(d => new Date(d.created_at) >= limitDate);
    const filteredOrders = ordersList.filter(o => new Date(o.created_at) >= limitDate);

    // 1. Core Totals
    let donationsTotal = 0;
    let diezmosSum = 0;
    let ofrendasSum = 0;

    filteredDonations.forEach(d => {
      const amount = Number(d.amount);
      donationsTotal += amount;
      
      const isDiezmo = d.category_name_backup?.toLowerCase().includes('diezmo') ?? false;
      if (isDiezmo) {
        diezmosSum += amount;
      } else {
        ofrendasSum += amount;
      }
    });

    let storeTotal = 0;
    let storeCount = 0;

    filteredOrders.forEach(o => {
      const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(o.status);
      if (!isPaid) return;
      
      storeTotal += Number(o.total);
      storeCount++;
    });

    const totalIncome = donationsTotal + storeTotal;
    const donationsCount = filteredDonations.length;
    const donationsAvg = donationsCount > 0 ? donationsTotal / donationsCount : 0;
    const storeAvg = storeCount > 0 ? storeTotal / storeCount : 0;

    // 2. Dominant Payment Method
    const paymentCounts: Record<string, number> = {};
    filteredDonations.forEach(d => {
      const pm = d.payment_method || 'Otros';
      paymentCounts[pm] = (paymentCounts[pm] || 0) + 1;
    });
    filteredOrders.forEach(o => {
      const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(o.status);
      if (!isPaid) return;
      const pm = o.payment_method || 'Otros';
      paymentCounts[pm] = (paymentCounts[pm] || 0) + 1;
    });

    let paymentMethodDominant = 'N/A';
    let paymentMethodDominantCount = 0;
    Object.entries(paymentCounts).forEach(([pm, count]) => {
      if (count > paymentMethodDominantCount) {
        paymentMethodDominantCount = count;
        paymentMethodDominant = pm;
      }
    });

    const pmMap: Record<string, string> = {
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'cash': 'Efectivo',
      'Otros': 'Otros'
    };
    const paymentMethodDominantFriendly = pmMap[paymentMethodDominant] || paymentMethodDominant;

    setStats({
      totalIncome,
      donationsTotal,
      donationsCount,
      donationsAvg,
      storeTotal,
      storeCount,
      storeAvg,
      paymentMethodDominant: paymentMethodDominantFriendly,
      paymentMethodDominantCount
    });

    // 3. Combined Monthly Chart Timeline
    const monthKeys: Record<string, { label: string; diezmos: number; ofrendas: number; tienda: number; total: number }> = {};
    
    const getMonthKeyAndLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const yyyymm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      return { yyyymm, label };
    };

    filteredDonations.forEach(d => {
      const { yyyymm, label } = getMonthKeyAndLabel(d.created_at);
      if (!monthKeys[yyyymm]) {
        monthKeys[yyyymm] = { label, diezmos: 0, ofrendas: 0, tienda: 0, total: 0 };
      }
      const amount = Number(d.amount);
      const isDiezmo = d.category_name_backup?.toLowerCase().includes('diezmo') ?? false;
      if (isDiezmo) {
        monthKeys[yyyymm].diezmos += amount;
      } else {
        monthKeys[yyyymm].ofrendas += amount;
      }
      monthKeys[yyyymm].total += amount;
    });

    filteredOrders.forEach(o => {
      const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(o.status);
      if (!isPaid) return;
      const { yyyymm, label } = getMonthKeyAndLabel(o.created_at);
      if (!monthKeys[yyyymm]) {
        monthKeys[yyyymm] = { label, diezmos: 0, ofrendas: 0, tienda: 0, total: 0 };
      }
      const amount = Number(o.total);
      monthKeys[yyyymm].tienda += amount;
      monthKeys[yyyymm].total += amount;
    });

    if (Object.keys(monthKeys).length === 0) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        monthKeys[yyyymm] = { label, diezmos: 0, ofrendas: 0, tienda: 0, total: 0 };
      }
    }

    const sortedChartData = Object.keys(monthKeys)
      .sort()
      .map(key => monthKeys[key]);

    setChartData(sortedChartData);

    // 4. Income Share Donut Chart
    const shareData = [
      { name: 'Diezmos', value: diezmosSum, color: '#1E3A8A' },
      { name: 'Ofrendas', value: ofrendasSum, color: '#D97706' },
      { name: 'Ventas Tienda', value: storeTotal, color: '#10B981' }
    ].filter(item => item.value > 0);
    setParticipationData(shareData);

    // 5. Payment Methods share data
    const sharePaymentData = Object.entries(paymentCounts).map(([name, count], index) => {
      const colors = ['#1E3A8A', '#D97706', '#10B981', '#8B5CF6', '#EF4444'];
      const friendlyName = pmMap[name] || name;
      return {
        name: friendlyName,
        value: count,
        color: colors[index % colors.length]
      };
    });
    setPaymentMethodsShare(sharePaymentData);

    // 6. Top Selling Products
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; imageUrl: string | null }> = {};
    filteredOrders.forEach(o => {
      const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(o.status);
      if (!isPaid) return;

      if (o.order_items) {
        o.order_items.forEach((item) => {
          if (!item.products) return;
          const pId = item.product_id;
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          const pName = item.products.name;
          const img = item.products.image_url;

          if (!productSalesMap[pId]) {
            productSalesMap[pId] = { name: pName, quantity: 0, revenue: 0, imageUrl: img };
          }
          productSalesMap[pId].quantity += qty;
          productSalesMap[pId].revenue += qty * price;
        });
      }
    });

    const sortedProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity);
    setTopProducts(sortedProducts);

    // 7. Unified Transactions History
    const combinedTx: FilteredTransaction[] = [
      ...filteredDonations.map(d => ({
        id: d.id,
        type: 'donation' as const,
        name: d.donor_name || 'Anónimo',
        email: d.donor_email,
        amount: Number(d.amount),
        category: d.category_name_backup || 'General',
        paymentMethod: d.payment_method,
        status: d.status === 'completed' ? ('completed' as const) : d.status === 'pending' ? ('pending' as const) : ('failed' as const),
        date: d.created_at
      })),
      ...filteredOrders.map(o => {
        const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(o.status);
        return {
          id: o.id,
          type: 'order' as const,
          name: o.customer_name || 'Cliente',
          email: o.customer_email,
          amount: Number(o.total),
          category: 'Tienda',
          paymentMethod: o.payment_method || 'card',
          status: isPaid ? ('completed' as const) : o.status === 'cancelled' ? ('failed' as const) : ('pending' as const),
          date: o.created_at
        };
      })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(combinedTx);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [donationsRes, , ordersRes] = await Promise.all([
        fetchDonations(),
        fetchCategories(),
        fetchOrders()
      ]);
      computeStatsAndChart(donationsRes, ordersRes, dateFilter);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error loading finance data:', err);
      toast.error('Error al cargar datos financieros: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchDonations, fetchCategories, fetchOrders, computeStatsAndChart, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateFilterChange = (val: '30days' | '90days' | 'year' | 'all') => {
    setDateFilter(val);
    computeStatsAndChart(allDonations, allOrders, val);
  };

  // Category CRUD
  const handleOpenCategoryCreate = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      is_active: true
    });
    setShowCategoryForm(true);
  };

  const handleOpenCategoryEdit = (cat: DonationCategory) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      description: cat.description || '',
      is_active: cat.is_active
    });
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('donation_categories')
          .update({
            name: categoryFormData.name,
            description: categoryFormData.description,
            is_active: categoryFormData.is_active
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Categoría actualizada con éxito.');
      } else {
        const { error } = await supabase
          .from('donation_categories')
          .insert({
            name: categoryFormData.name,
            description: categoryFormData.description,
            is_active: categoryFormData.is_active
          });
        
        if (error) throw error;
        toast.success('Categoría creada con éxito.');
      }

      setShowCategoryForm(false);
      await fetchCategories();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error saving category:', err);
      toast.error('Error al guardar la categoría: ' + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCategoryActive = async (cat: DonationCategory) => {
    try {
      const { error } = await supabase
        .from('donation_categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);

      if (error) throw error;
      toast.success(`Categoría ${!cat.is_active ? 'activada' : 'desactivada'} correctamente.`);
      await fetchCategories();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Error toggling active status:', err);
      toast.error('Error al cambiar estado: ' + errorMsg);
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No hay transacciones para exportar.');
      return;
    }

    const headers = [
      'Tipo',
      'Cliente/Donante',
      'Correo',
      'Monto ($ USD)',
      'Categoría',
      'Método de Pago',
      'Estado',
      'Fecha'
    ];

    const rows = filteredTransactions.map(t => [
      t.type === 'donation' ? 'Donación' : 'Venta de Tienda',
      t.name,
      t.email || '',
      t.amount.toFixed(2),
      t.category,
      t.paymentMethod === 'card' ? 'Tarjeta' : t.paymentMethod === 'transfer' ? 'Transferencia' : t.paymentMethod === 'cash' ? 'Efectivo' : t.paymentMethod,
      t.status === 'completed' ? 'Completado' : t.status === 'pending' ? 'Pendiente' : 'Fallido',
      new Date(t.date).toLocaleDateString('es-ES')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finanzas_iglesia_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Historial de transacciones exportado con éxito.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary dark:text-church-gold-bright">Gestión de Finanzas</h1>
          <p className="text-gray-500 dark:text-gray-450 text-sm">Visualiza ingresos e-commerce, diezmos y administra las categorías de donación.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Time range filter */}
          {activeTab === 'metrics' && (
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value as '30days' | '90days' | 'year' | 'all')}
                className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-white/10 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="30days">Últimos 30 días</option>
                <option value="90days">Últimos 90 días</option>
                <option value="year">Este año ({new Date().getFullYear()})</option>
                <option value="all">Todo el tiempo</option>
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-150 dark:border-white/10">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Métricas e Ingresos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Consolidated */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-1">Ingreso Total</span>
                <p className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">${stats.totalIncome.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1 flex items-center gap-1.5">
                  <span className="text-primary dark:text-church-gold-bright">Donaciones: {stats.totalIncome > 0 ? ((stats.donationsTotal / stats.totalIncome) * 100).toFixed(0) : 0}%</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Tienda: {stats.totalIncome > 0 ? ((stats.storeTotal / stats.totalIncome) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50/70 dark:bg-green-900/30 border border-green-100 dark:border-green-500/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                <DollarSign size={22} />
              </div>
            </div>

            {/* Total Donations */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-1">Donaciones Recibidas</span>
                <p className="text-2xl font-extrabold text-primary dark:text-church-gold-bright tracking-tight">${stats.donationsTotal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold mt-1">Recibos: {stats.donationsCount} | Prom: ${stats.donationsAvg.toFixed(0)}</span>
              </div>
              <div className="w-12 h-12 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-center text-primary dark:text-church-gold-bright shrink-0">
                <Heart size={22} />
              </div>
            </div>

            {/* Total Store Sales */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-1">Ventas e-Commerce</span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">${stats.storeTotal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold mt-1">Pedidos: {stats.storeCount} | Ticket: ${stats.storeAvg.toFixed(0)}</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50/70 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShoppingBag size={22} />
              </div>
            </div>

            {/* Dominant Payment Method */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-1">Canal Dominante</span>
                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{stats.paymentMethodDominant}</p>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold mt-1">Volumen: {stats.paymentMethodDominantCount} transacciones</span>
              </div>
              <div className="w-12 h-12 bg-amber-50/50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Tag size={22} />
              </div>
            </div>
          </div>

          {/* Chart Row: Progress & Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Combined Progression (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-800 dark:text-white text-base mb-6 flex items-center gap-1.5">
                <TrendingUp size={18} className="text-gold" />
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
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <h3 className="font-serif font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-1.5">
                <PieChartIcon size={18} className="text-gold" />
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
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-sm flex flex-col justify-between">
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
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
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
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-sm flex flex-col justify-between">
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
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="py-4 px-6 border-b border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-left">
                <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base flex items-center gap-1.5">
                  <FileText size={18} className="text-primary dark:text-church-gold-bright" />
                  Libro Diario de Transacciones Recientes
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">Donaciones y ventas registradas en Supabase.</p>
              </div>
              <button
                type="button"
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto justify-center"
                title="Exportar transacciones a CSV"
              >
                <Download size={14} />
                Exportar Libro Diario (CSV)
              </button>
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
                    {filteredTransactions.slice(0, 50).map((tx) => (
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
