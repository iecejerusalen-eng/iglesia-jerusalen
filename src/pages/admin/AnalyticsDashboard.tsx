import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  BarChart3, ClipboardList, Eye, 
  Award, RefreshCw, X, User, Plus, Trash2, Download, 
  Search, TrendingUp, Sparkles, Settings, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useConfirmStore } from '../../store/useConfirmStore';

// Types
interface FormResponseData {
  id: string;
  block_id: string;
  page_id: string;
  user_id: string | null;
  member_name: string | null;
  member_email: string | null;
  answers: Record<string, any>;
  score: number | null;
  max_score: number | null;
  created_at: string;
}

interface Widget {
  id: string;
  title: string;
  source: string;
  dimension: string;
  metric: string;
  aggregation: 'count' | 'sum' | 'avg';
  targetField: string;
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'kpi' | 'table';
}

const COLORS = ['#1e3a8a', '#d97706', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];

const PRESETS: Widget[] = [
  {
    id: 'w-1',
    title: 'Curva de Crecimiento de Miembros',
    source: 'members',
    dimension: 'month',
    metric: 'Miembros',
    aggregation: 'count',
    targetField: '',
    chartType: 'line'
  },
  {
    id: 'w-2',
    title: 'Ingresos por Ofrendas y Diezmos',
    source: 'donations',
    dimension: 'month',
    metric: 'Monto',
    aggregation: 'sum',
    targetField: 'amount',
    chartType: 'area'
  },
  {
    id: 'w-3',
    title: 'Estado de Conservación del Inventario',
    source: 'inventory',
    dimension: 'status',
    metric: 'Equipos',
    aggregation: 'count',
    targetField: '',
    chartType: 'pie'
  },
  {
    id: 'w-4',
    title: 'Calificación Promedio en Cuestionarios',
    source: 'form_responses',
    dimension: 'block_id',
    metric: 'Calificación',
    aggregation: 'avg',
    targetField: 'score',
    chartType: 'bar'
  },
  {
    id: 'w-5',
    title: 'Peticiones de Oración por Estado',
    source: 'petitions',
    dimension: 'status',
    metric: 'Peticiones',
    aggregation: 'count',
    targetField: '',
    chartType: 'bar'
  },
  {
    id: 'w-6',
    title: 'Métodos de Pago de Donaciones',
    source: 'donations',
    dimension: 'payment_method',
    metric: 'Monto',
    aggregation: 'sum',
    targetField: 'amount',
    chartType: 'pie'
  },
  {
    id: 'w-7',
    title: 'Membresía por Rango de Edad',
    source: 'members',
    dimension: 'age_group',
    metric: 'Miembros',
    aggregation: 'count',
    targetField: '',
    chartType: 'pie'
  },
  {
    id: 'w-8',
    title: 'Valor Estimado de Inventario por Categoría',
    source: 'inventory',
    dimension: 'category',
    metric: 'Valor Estimado',
    aggregation: 'sum',
    targetField: 'price * quantity',
    chartType: 'bar'
  }
];

export default function AnalyticsDashboard() {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'forms'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<FormResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<FormResponseData | null>(null);
  
  // Datasets loaded from Supabase
  const [datasets, setDatasets] = useState<{
    members: any[];
    donations: any[];
    inventory: any[];
    formResponses: any[];
    petitions: any[];
    orders: any[];
    songs: any[];
    events: any[];
  }>({
    members: [],
    donations: [],
    inventory: [],
    formResponses: [],
    petitions: [],
    orders: [],
    songs: [],
    events: []
  });

  // Global filters
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | 'thisyear'>('all');

  // Custom Widgets State
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // Report Builder State
  const [builderSettings, setBuilderSettings] = useState<Omit<Widget, 'id'>>({
    title: 'Nuevo Reporte Personalizado',
    source: 'members',
    dimension: 'gender',
    metric: 'Conteo de Registros',
    aggregation: 'count',
    targetField: '',
    chartType: 'bar'
  });

  // Intelligent Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedNLP, setParsedNLP] = useState<Omit<Widget, 'id'> | null>(null);

  // Widget editing title
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  // Load dashboard widgets and server data
  useEffect(() => {
    // Load Saved Widgets
    const saved = localStorage.getItem('church_analytics_widgets');
    if (saved) {
      try {
        const currentWidgets = JSON.parse(saved);
        // Find presets that aren't in the current saved widgets by comparing source + dimension + aggregation + targetField
        const missingPresets = PRESETS.filter(preset => 
          !currentWidgets.some((w: Widget) => 
            w.source === preset.source && 
            w.dimension === preset.dimension && 
            w.aggregation === preset.aggregation && 
            w.targetField === preset.targetField
          )
        );
        
        if (missingPresets.length > 0) {
          const merged = [...currentWidgets, ...missingPresets];
          setWidgets(merged);
          localStorage.setItem('church_analytics_widgets', JSON.stringify(merged));
        } else {
          setWidgets(currentWidgets);
        }
      } catch (e) {
        setWidgets(PRESETS);
      }
    } else {
      setWidgets(PRESETS);
      localStorage.setItem('church_analytics_widgets', JSON.stringify(PRESETS));
    }

    loadAllDatasets();
  }, []);

  const loadAllDatasets = async () => {
    setLoading(true);
    try {
      const fetchTable = async (tableName: string, select = '*') => {
        try {
          const { data, error } = await supabase.from(tableName).select(select);
          if (error) {
            console.warn(`Error loading table ${tableName}:`, error);
            return [];
          }
          return data || [];
        } catch (err) {
          console.warn(`Exception loading table ${tableName}:`, err);
          return [];
        }
      };

      const [
        membersData, 
        donationsData, 
        formResponsesData, 
        inventoryData, 
        petitionsData, 
        ordersData, 
        songsData, 
        eventsData
      ] = await Promise.all([
        fetchTable('members'),
        fetchTable('donations'),
        fetchTable('form_responses'),
        fetchTable('inventory_items'),
        fetchTable('petitions'),
        fetchTable('orders'),
        fetchTable('songs'),
        fetchTable('events')
      ]);

      setDatasets({
        members: membersData,
        donations: donationsData,
        inventory: inventoryData,
        formResponses: formResponsesData,
        petitions: petitionsData,
        orders: ordersData,
        songs: songsData,
        events: eventsData
      });

      // Maintain backward compat responses list for the forms list tab
      setResponses(formResponsesData as any);

    } catch (err: any) {
      console.error('Error loading analytics datasets:', err);
      toast.error('Error al conectar con la base de datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  const cleanLabel = (text: string) => {
    if (text === 'buen_estado') return 'Buen Estado';
    if (text === 'reparacion') return 'En Reparación';
    if (text === 'critico') return 'Estado Crítico';
    if (text === 'pendiente') return 'Pendiente';
    if (text === 'en_oracion') return 'En Oración';
    if (text === 'respondida') return 'Respondida';
    if (text === 'completed') return 'Completado';
    if (text === 'pending_payment') return 'Pago Pendiente';
    if (text === 'paid') return 'Pagado';
    if (text === 'cancelled') return 'Cancelado';
    return text;
  };

  const getCleanBlockName = (blockId: string) => {
    if (blockId.includes('hero')) return 'Sección Héroe';
    if (blockId.includes('gallery')) return 'Galería Diapositivas';
    if (blockId.includes('trivia')) return 'Trivia de Fe';
    if (blockId.includes('form')) return 'Formulario';
    return 'Cuestionario Modular';
  };

  // Helper to filter data by global date filter
  const filterByDate = (items: any[], dateField: string) => {
    if (dateFilter === 'all') return items;
    const now = new Date();
    let cutoff = new Date();
    
    if (dateFilter === '30days') cutoff.setDate(now.getDate() - 30);
    else if (dateFilter === '90days') cutoff.setDate(now.getDate() - 90);
    else if (dateFilter === 'thisyear') cutoff = new Date(now.getFullYear(), 0, 1);

    return items.filter(item => {
      const dateVal = item[dateField];
      if (!dateVal) return false;
      return new Date(dateVal) >= cutoff;
    });
  };

  // BI Engine: Group and aggregate data dynamically
  const executeQuery = (widget: Omit<Widget, 'id'>) => {
    let rawData: any[] = [];
    let dateField = 'created_at';

    if (widget.source === 'members') {
      rawData = datasets.members;
      dateField = 'created_at';
    } else if (widget.source === 'donations') {
      rawData = datasets.donations;
      dateField = 'created_at';
    } else if (widget.source === 'inventory') {
      rawData = datasets.inventory;
      dateField = 'purchase_date';
    } else if (widget.source === 'form_responses') {
      rawData = datasets.formResponses;
      dateField = 'created_at';
    } else if (widget.source === 'petitions') {
      rawData = datasets.petitions;
      dateField = 'created_at';
    } else if (widget.source === 'orders') {
      rawData = datasets.orders;
      dateField = 'created_at';
    } else if (widget.source === 'songs') {
      rawData = datasets.songs;
      dateField = 'created_at';
    } else if (widget.source === 'events') {
      rawData = datasets.events;
      dateField = 'start_date';
    }

    // Apply global date filter
    rawData = filterByDate(rawData, dateField);

    const groups: Record<string, any[]> = {};

    rawData.forEach(item => {
      let key = 'General';

      if (widget.dimension === 'gender') {
        key = item.gender || 'Sin especificar';
      } else if (widget.dimension === 'leadership_role') {
        key = item.leadership_role || 'Miembro General';
      } else if (widget.dimension === 'status') {
        key = cleanLabel(item.status || 'Sin estado');
      } else if (widget.dimension === 'payment_method') {
        key = item.payment_method || 'Otros';
      } else if (widget.dimension === 'category') {
        // Fallbacks for categories on various models
        key = item.category_name_backup || item.category || item.inventory_categories?.name || item.petition_categories?.name || 'General';
      } else if (widget.dimension === 'artist') {
        key = item.artist || 'Tradicional / Himno';
      } else if (widget.dimension === 'recurrence') {
        key = item.is_recurring ? 'Recurrente' : 'Único';
      } else if (widget.dimension === 'recurrence_type') {
        key = item.is_recurring ? (item.recurrence_type || 'Periódico') : 'No recurrente';
      } else if (widget.dimension === 'block_id') {
        key = getCleanBlockName(item.block_id || '');
      } else if (widget.dimension === 'score_range') {
        const score = item.score;
        const max = item.max_score || 10;
        if (score === null || score === undefined) key = 'Sin puntaje';
        else {
          const pct = (score / max) * 100;
          if (pct < 60) key = 'Bajo (<60%)';
          else if (pct < 85) key = 'Aprobado (60-85%)';
          else key = 'Sobresaliente (>85%)';
        }
      } else if (widget.dimension === 'age_group') {
        if (item.birth_date) {
          const age = new Date().getFullYear() - new Date(item.birth_date).getFullYear();
          if (age < 12) key = 'Niños (<12)';
          else if (age <= 25) key = 'Jóvenes (12-25)';
          else if (age <= 50) key = 'Adultos (26-50)';
          else key = 'Mayores (51+)';
        } else {
          key = 'Sin edad especificada';
        }
      } else if (widget.dimension === 'bpm_range') {
        const bpm = Number(item.bpm);
        if (!bpm) key = 'Sin tempo';
        else if (bpm < 80) key = 'Lento (<80 BPM)';
        else if (bpm <= 110) key = 'Moderado (80-110 BPM)';
        else key = 'Rápido (>110 BPM)';
      } else if (widget.dimension === 'month') {
        const dateStr = item.created_at || item.purchase_date || item.start_date;
        if (dateStr) {
          const d = new Date(dateStr);
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        } else {
          key = 'Sin fecha';
        }
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const result = Object.entries(groups).map(([name, items]) => {
      let val = 0;

      if (widget.aggregation === 'count') {
        val = items.length;
      } else {
        const field = widget.targetField;
        const numbers = items.map(item => {
          if (field === 'price * quantity') {
            return Number(item.price || 0) * Number(item.quantity || 0);
          }
          return Number(item[field] || 0);
        }).filter(n => !isNaN(n));

        if (numbers.length > 0) {
          const sum = numbers.reduce((a, b) => a + b, 0);
          if (widget.aggregation === 'sum') {
            val = sum;
          } else if (widget.aggregation === 'avg') {
            val = sum / numbers.length;
          }
        }
      }

      if (val % 1 !== 0) {
        val = Math.round(val * 100) / 100;
      }

      return { name, valor: val };
    });

    // Sort Month Chronologically
    if (widget.dimension === 'month') {
      const monthsOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      result.sort((a, b) => {
        const partsA = a.name.split(' ');
        const partsB = b.name.split(' ');
        if (partsA.length === 2 && partsB.length === 2) {
          const yearA = parseInt(partsA[1]);
          const yearB = parseInt(partsB[1]);
          if (yearA !== yearB) return yearA - yearB;
          return monthsOrder.indexOf(partsA[0]) - monthsOrder.indexOf(partsB[0]);
        }
        return 0;
      });
    } else {
      // Sort Value Descending
      result.sort((a, b) => b.valor - a.valor);
    }

    return result;
  };

  // NLP Parser - Interpret search queries
  const handleNLPSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();

    // Default configuration
    let parsed: Omit<Widget, 'id'> = {
      title: 'Miembros por Género',
      source: 'members',
      dimension: 'gender',
      metric: 'Miembros',
      aggregation: 'count',
      targetField: '',
      chartType: 'bar'
    };

    // 1. Identify Data Source
    if (query.includes('miembro') || query.includes('crm') || query.includes('persona') || query.includes('gente')) {
      parsed.source = 'members';
      parsed.metric = 'Miembros';
      parsed.title = 'Análisis de Miembros';
    } else if (query.includes('donacion') || query.includes('finanzas') || query.includes('diezmo') || query.includes('ofrenda') || query.includes('ingreso') || query.includes('dinero') || query.includes('recaudado')) {
      parsed.source = 'donations';
      parsed.metric = 'Monto';
      parsed.title = 'Análisis Financiero';
    } else if (query.includes('inventario') || query.includes('equipo') || query.includes('mobiliario') || query.includes('herramienta') || query.includes('articulo') || query.includes('precio')) {
      parsed.source = 'inventory';
      parsed.metric = 'Equipos';
      parsed.title = 'Análisis de Inventario';
    } else if (query.includes('cuestionario') || query.includes('respuesta') || query.includes('trivia') || query.includes('calificacion') || query.includes('nota') || query.includes('evaluacion') || query.includes('puntaje')) {
      parsed.source = 'form_responses';
      parsed.metric = 'Participantes';
      parsed.title = 'Análisis de Cuestionarios';
    } else if (query.includes('peticion') || query.includes('oracion') || query.includes('plegaria')) {
      parsed.source = 'petitions';
      parsed.metric = 'Peticiones';
      parsed.title = 'Peticiones de Oración';
    } else if (query.includes('pedido') || query.includes('tienda') || query.includes('compra') || query.includes('venta')) {
      parsed.source = 'orders';
      parsed.metric = 'Pedidos';
      parsed.title = 'Pedidos de la Tienda';
    } else if (query.includes('cancion') || query.includes('alabanza') || query.includes('himno') || query.includes('musica')) {
      parsed.source = 'songs';
      parsed.metric = 'Canciones';
      parsed.title = 'Catálogo de Alabanzas';
    } else if (query.includes('evento') || query.includes('calendario') || query.includes('actividad') || query.includes('programa')) {
      parsed.source = 'events';
      parsed.metric = 'Eventos';
      parsed.title = 'Eventos y Actividades';
    }

    // 2. Identify Dimension (X-Axis)
    if (query.includes('genero') || query.includes('sexo')) {
      parsed.dimension = 'gender';
      parsed.title = `${parsed.title} por Género`;
    } else if (query.includes('rol') || query.includes('liderazgo') || query.includes('cargo')) {
      parsed.dimension = 'leadership_role';
      parsed.title = `${parsed.title} por Rol de Liderazgo`;
    } else if (query.includes('mes') || query.includes('tiempo') || query.includes('mensual') || query.includes('linea') || query.includes('fecha')) {
      parsed.dimension = 'month';
      parsed.title = `${parsed.title} por Mes`;
    } else if (query.includes('edad') || query.includes('rango de edad') || query.includes('demografia')) {
      parsed.dimension = 'age_group';
      parsed.title = `${parsed.title} por Grupos de Edad`;
    } else if (query.includes('metodo') || query.includes('pago')) {
      parsed.dimension = 'payment_method';
      parsed.title = `${parsed.title} por Método de Pago`;
    } else if (query.includes('categoria') || query.includes('tipo')) {
      parsed.dimension = 'category';
      parsed.title = `${parsed.title} por Categoría`;
    } else if (query.includes('estado') || query.includes('condicion')) {
      parsed.dimension = 'status';
      parsed.title = `${parsed.title} por Estado`;
    } else if (query.includes('artista') || query.includes('autor')) {
      parsed.dimension = 'artist';
      parsed.title = `${parsed.title} por Artista`;
    } else if (query.includes('ritmo') || query.includes('bpm') || query.includes('tempo')) {
      parsed.dimension = 'bpm_range';
      parsed.title = `${parsed.title} por BPM / Tempo`;
    } else if (query.includes('recurrencia') || query.includes('recurrente')) {
      parsed.dimension = 'recurrence';
      parsed.title = `${parsed.title} por Recurrencia`;
    } else if (query.includes('bloque') || query.includes('id') || query.includes('cuestionario')) {
      parsed.dimension = 'block_id';
      parsed.title = `${parsed.title} por Cuestionario`;
    }

    // 3. Identify Aggregation and metrics
    if (query.includes('suma') || query.includes('total') || query.includes('recaudado') || query.includes('monto') || query.includes('valor')) {
      parsed.aggregation = 'sum';
      if (parsed.source === 'donations') {
        parsed.targetField = 'amount';
        parsed.metric = 'Monto Recaudado';
        parsed.title = `Suma de ${parsed.title}`;
      } else if (parsed.source === 'members') {
        parsed.targetField = 'tithes_sum';
        parsed.metric = 'Diezmos Acumulados';
        parsed.title = `Total Diezmos de ${parsed.title}`;
      } else if (parsed.source === 'inventory') {
        parsed.targetField = 'price * quantity';
        parsed.metric = 'Valor Estimado';
        parsed.title = `Valor de Inventario en ${parsed.title}`;
      } else if (parsed.source === 'orders') {
        parsed.targetField = 'total';
        parsed.metric = 'Ventas Totales';
        parsed.title = `Suma de Ventas de ${parsed.title}`;
      } else {
        parsed.aggregation = 'count';
      }
    } else if (query.includes('promedio') || query.includes('media') || query.includes('avg')) {
      parsed.aggregation = 'avg';
      if (parsed.source === 'donations') {
        parsed.targetField = 'amount';
        parsed.metric = 'Donación Promedio';
        parsed.title = `Promedio de Donaciones de ${parsed.title}`;
      } else if (parsed.source === 'members') {
        parsed.targetField = 'tithes_sum';
        parsed.metric = 'Diezmo Promedio';
        parsed.title = `Promedio de Diezmos de ${parsed.title}`;
      } else if (parsed.source === 'inventory') {
        parsed.targetField = 'price';
        parsed.metric = 'Precio Promedio';
        parsed.title = `Precio Promedio de ${parsed.title}`;
      } else if (parsed.source === 'form_responses') {
        parsed.targetField = 'score';
        parsed.metric = 'Calificación Promedio';
        parsed.title = `Calificación Promedio de ${parsed.title}`;
      } else if (parsed.source === 'orders') {
        parsed.targetField = 'total';
        parsed.metric = 'Venta Promedio';
        parsed.title = `Venta Promedio de ${parsed.title}`;
      } else if (parsed.source === 'songs') {
        parsed.targetField = 'bpm';
        parsed.metric = 'BPM Promedio';
        parsed.title = `Tempo Promedio (BPM) de ${parsed.title}`;
      } else {
        parsed.aggregation = 'count';
      }
    } else {
      parsed.aggregation = 'count';
    }

    // 4. Identify Chart Type
    if (query.includes('linea') || query.includes('tendencia')) {
      parsed.chartType = 'line';
    } else if (query.includes('area')) {
      parsed.chartType = 'area';
    } else if (query.includes('pastel') || query.includes('tarta') || query.includes('circular') || query.includes('donut') || query.includes('pie')) {
      parsed.chartType = 'pie';
    } else if (query.includes('kpi') || query.includes('tarjeta') || query.includes('valor') || query.includes('numero')) {
      parsed.chartType = 'kpi';
    } else if (query.includes('tabla') || query.includes('listado') || query.includes('lista')) {
      parsed.chartType = 'table';
    } else {
      if (parsed.dimension === 'month') parsed.chartType = 'area';
      else if (parsed.dimension === 'gender' || parsed.dimension === 'status' || parsed.dimension === 'age_group') parsed.chartType = 'pie';
      else parsed.chartType = 'bar';
    }

    setParsedNLP(parsed);
    toast.success('Consulta procesada de manera inteligente.');
  };

  // Add constructed or parsed widget to saved localStorage widgets
  const addWidgetToDashboard = (settings: Omit<Widget, 'id'>) => {
    const newWidget: Widget = {
      ...settings,
      id: `custom-w-${Date.now()}`
    };
    
    const updated = [...widgets, newWidget];
    setWidgets(updated);
    localStorage.setItem('church_analytics_widgets', JSON.stringify(updated));
    toast.success('Reporte añadido con éxito al Dashboard.');
    setActiveTab('dashboard');
    setParsedNLP(null);
    setSearchQuery('');
  };

  // Delete widget from dashboard
  const handleDeleteWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    setWidgets(updated);
    localStorage.setItem('church_analytics_widgets', JSON.stringify(updated));
    toast.success('Reporte removido del Dashboard.');
  };

  // Quick switch of visual type for a single widget on grid
  const handleSwitchWidgetChartType = (id: string, type: Widget['chartType']) => {
    const updated = widgets.map(w => {
      if (w.id === id) return { ...w, chartType: type };
      return w;
    });
    setWidgets(updated);
    localStorage.setItem('church_analytics_widgets', JSON.stringify(updated));
  };

  // Save edited title
  const handleSaveWidgetTitle = (id: string) => {
    if (!editTitleText.trim()) return;
    const updated = widgets.map(w => {
      if (w.id === id) return { ...w, title: editTitleText };
      return w;
    });
    setWidgets(updated);
    localStorage.setItem('church_analytics_widgets', JSON.stringify(updated));
    setEditingWidgetId(null);
    toast.success('Título del reporte actualizado.');
  };

  // Start editing title
  const startEditingTitle = (widget: Widget) => {
    setEditingWidgetId(widget.id);
    setEditTitleText(widget.title);
  };

  // CSV Export for individual widget aggregated values
  const handleExportWidgetCSV = (widget: Widget) => {
    const data = executeQuery(widget);
    if (data.length === 0) {
      toast.error('No hay datos disponibles para exportar.');
      return;
    }

    const headers = ['Dimensión/Agrupamiento', `Valor (${widget.aggregation === 'count' ? 'Conteo' : widget.aggregation})`].join(';');
    const rows = data.map(d => [d.name, d.valor].join(';'));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${widget.title.toLowerCase().replace(/ /g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Datos del reporte exportados con éxito.');
  };

  // Get clean visual label names for selector inputs
  const getDimensionLabel = (dim: string) => {
    const labels: Record<string, string> = {
      gender: 'Género',
      leadership_role: 'Rol de Liderazgo',
      month: 'Meses / Tiempo',
      age_group: 'Rango de Edad',
      payment_method: 'Método de Pago',
      category: 'Categoría',
      status: 'Estado',
      artist: 'Artista / Autor',
      bpm_range: 'BPM (Tempo)',
      recurrence: 'Es Recurrente (Sí/No)',
      recurrence_type: 'Tipo Recurrencia',
      block_id: 'Cuestionario / Bloque',
      score_range: 'Rango de Nota'
    };
    return labels[dim] || dim;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-gray-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <BarChart3 className="text-gold" />
            Consola Inteligente de Analíticas (BI)
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Plataforma interactiva de Business Intelligence. Construye reportes, analiza datos y consulta al Asistente Inteligente.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Global date filter dropdown */}
          <div className="relative">
            <select
              id="global-date-filter"
              name="global-date-filter"
              aria-label="Filtro de fecha global"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                toast.success('Filtro temporal aplicado globalmente.');
              }}
              className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer shadow-xs focus:outline-none"
            >
              <option value="all">Todos los tiempos</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisyear">Este año ({new Date().getFullYear()})</option>
            </select>
          </div>

          <button
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Restablecer paneles',
                message: '¿Estás seguro de restablecer todos los paneles al estado predeterminado? Se perderán los reportes personalizados que hayas guardado.',
                confirmText: 'Restablecer',
                cancelText: 'Cancelar',
                variant: 'warning',
              });
              if (!confirmed) return;
              setWidgets(PRESETS);
              localStorage.setItem('church_analytics_widgets', JSON.stringify(PRESETS));
              toast.success('Paneles restablecidos a los 8 predeterminados.');
            }}
            className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
            title="Restablecer paneles predeterminados"
          >
            <RefreshCw size={14} className="text-amber-500" />
            Restablecer Paneles
          </button>

          <button
            onClick={loadAllDatasets}
            className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Panel Personalizado ({widgets.length})
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'builder'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={12} className="text-gold" />
          Constructor y Asistente Inteligente
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-white text-primary shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Respuestas de Cuestionarios
        </button>
      </div>

      {/* Loadings */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl animate-pulse col-span-full"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: CUSTOM BI DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgets.map((widget) => {
                const chartData = executeQuery(widget);
                const isKPI = widget.chartType === 'kpi';
                const isTable = widget.chartType === 'table';

                // Sum items for KPI or average
                let kpiValue = 0;
                if (isKPI) {
                  if (chartData.length > 0) {
                    const values = chartData.map(d => d.valor);
                    if (widget.aggregation === 'avg') {
                      kpiValue = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
                    } else {
                      kpiValue = values.reduce((a, b) => a + b, 0);
                    }
                  }
                }

                return (
                  <AnimeFadeUp
                    key={widget.id}
                    className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col justify-between group/card relative hover:border-slate-300 transition-all"
                  >
                    {/* Widget Header */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        {editingWidgetId === widget.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              id={`edit-title-${widget.id}`}
                              name={`edit-title-${widget.id}`}
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              className="px-2 py-0.5 border border-slate-350 rounded-lg text-xs font-serif font-bold text-gray-800 dark:text-gray-100 w-full focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveWidgetTitle(widget.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingWidgetId(null)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <h3 
                            onClick={() => startEditingTitle(widget)}
                            className="font-serif font-bold text-xs md:text-sm text-slate-800 dark:text-gray-100 hover:text-primary cursor-pointer truncate"
                            title="Haz clic para renombrar"
                          >
                            {widget.title}
                          </h3>
                        )}
                        <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider mt-0.5">
                          {widget.source} por {getDimensionLabel(widget.dimension)}
                        </span>
                      </div>

                      {/* Tool Actions */}
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleExportWidgetCSV(widget)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="Descargar CSV"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteWidget(widget.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Remover de panel"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Widget Content */}
                    <div className="flex-1 flex flex-col justify-center min-h-[220px]">
                      {chartData.length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400 font-semibold italic">
                          Sin datos registrados en el rango seleccionado.
                        </div>
                      ) : isKPI ? (
                        <div className="text-center space-y-2 py-4">
                          <TrendingUp size={36} className="text-gold mx-auto" />
                          <p className="text-4xl font-extrabold text-slate-800 dark:text-gray-100 font-mono tracking-tight">
                            {widget.targetField.includes('amount') || widget.targetField.includes('total') || widget.targetField.includes('price')
                              ? `$${kpiValue.toLocaleString('es-ES')}` 
                              : kpiValue.toLocaleString('es-ES')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Métrica Global ({widget.aggregation})
                          </p>
                        </div>
                      ) : isTable ? (
                        <div className="overflow-y-auto max-h-[210px] border border-slate-100 dark:border-white/5 rounded-xl">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 sticky top-0">
                              <tr className="text-gray-500 dark:text-gray-450 font-bold uppercase">
                                <th className="px-3 py-2">Eje X</th>
                                <th className="px-3 py-2 text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {chartData.map((d, index) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-gray-300">{d.name}</td>
                                  <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-600 dark:text-gray-400">
                                    {widget.targetField.includes('amount') || widget.targetField.includes('total') || widget.targetField.includes('price')
                                      ? `$${d.valor.toLocaleString('es-ES')}`
                                      : d.valor.toLocaleString('es-ES')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="h-56 w-full text-[10px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            {widget.chartType === 'bar' ? (
                              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                <Bar dataKey="valor" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            ) : widget.chartType === 'line' ? (
                              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            ) : widget.chartType === 'area' ? (
                              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                  <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                <Area type="monotone" dataKey="valor" stroke="#d97706" strokeWidth={2} fill={`url(#grad-${widget.id})`} />
                              </AreaChart>
                            ) : (
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={3}
                                  dataKey="valor"
                                  label={({ name, percent }) => `${(name || "").slice(0, 10)} (${((percent || 0) * 100).toFixed(0)}%)`}
                                >
                                  {chartData.map((_entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                              </PieChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Chart Quick switcher in footer */}
                    {!isKPI && chartData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-gray-400">
                        <span>Ver en otro formato:</span>
                        <div className="flex gap-1">
                          {['bar', 'line', 'area', 'pie', 'table'].map((t) => (
                            <button
                              key={t}
                              onClick={() => handleSwitchWidgetChartType(widget.id, t as any)}
                              className={`px-1.5 py-0.5 rounded capitalize ${
                                widget.chartType === t ? 'bg-primary text-white font-bold' : 'hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              {t === 'bar' ? 'Barras' : t === 'line' ? 'Línea' : t === 'area' ? 'Área' : t === 'pie' ? 'Tarta' : 'Tabla'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </AnimeFadeUp>
                );
              })}
            </div>
          )}

          {/* TAB 2: REPORT BUILDER AND INTELLIGENT ASSISTANT */}
          {activeTab === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Intelligent NLP assistant */}
              <div className="lg:col-span-3 bg-[#0B1530] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                {/* Background lights decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative space-y-4">
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-gold" />
                    Asistente Inteligente de Datos
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Pregunta al asistente para configurar reportes instantáneamente con palabras clave (ej: *"mostrar donaciones por mes"*, *"inventario por estado"*, *"diezmos totales por miembros"*, *"alabanzas por estilo"*).
                  </p>

                  <form onSubmit={handleNLPSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="nlp-search-query"
                        name="nlp-search-query"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Escribe tu consulta analítica..."
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white/15 transition-all font-semibold"
                      />
                      <Search size={18} className="absolute right-3.5 top-3.5 text-white/50" />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gold hover:bg-gold/90 text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      Analizar
                    </button>
                  </form>

                  {/* Suggestion prompt tags */}
                  <div className="flex flex-wrap gap-2 pt-2 text-[11px] items-center text-slate-350">
                    <span className="font-bold">Sugerencias:</span>
                    {[
                      'diezmos por mes',
                      'miembros por genero',
                      'inventario por estado',
                      'alabanzas por estilo',
                      'peticiones por estado',
                      'donaciones por metodo de pago'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag);
                          // Auto trigger after state change
                          setTimeout(() => {
                            setSearchQuery(tag);
                          }, 50);
                        }}
                        className="bg-white/5 hover:bg-white/15 px-2.5 py-1 rounded-full text-slate-200 border border-white/10 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Builder Preview & Add Button (If NLP triggered) */}
              {parsedNLP && (
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-amber-100 rounded-2xl p-6 shadow-xs animate-fadeIn space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-amber-50">
                    <h3 className="font-serif font-bold text-amber-800 text-sm flex items-center gap-1.5">
                      <Sparkles size={16} className="text-gold animate-bounce" />
                      Resultado del Asistente Inteligente: {parsedNLP.title}
                    </h3>
                    <button
                      onClick={() => setParsedNLP(null)}
                      className="p-1 rounded-full hover:bg-slate-100 text-gray-400"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="space-y-3">
                      <div className="text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-white/10 space-y-2">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Fuente</span>
                          <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">{parsedNLP.source}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Dimensión (Eje X)</span>
                          <span className="font-bold text-slate-800 dark:text-gray-100">{getDimensionLabel(parsedNLP.dimension)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Agregación (Eje Y)</span>
                          <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">
                            {parsedNLP.aggregation} {parsedNLP.targetField && `(${parsedNLP.targetField})`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[9px]">Gráfico</span>
                          <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">{parsedNLP.chartType}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => addWidgetToDashboard(parsedNLP)}
                        className="w-full py-3 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Plus size={16} />
                        Guardar en mi Dashboard
                      </button>
                    </div>

                    {/* NLP Live Chart Preview */}
                    <div className="md:col-span-2 border border-slate-100 dark:border-white/5 rounded-xl p-4 min-h-[220px] flex items-center justify-center bg-slate-50/50">
                      {(() => {
                        const previewData = executeQuery(parsedNLP);
                        if (previewData.length === 0) {
                          return <span className="text-xs text-gray-400 italic">No se hallaron registros coincidentes.</span>;
                        }
                        if (parsedNLP.chartType === 'kpi') {
                          const val = previewData.map(d => d.valor).reduce((a, b) => a + b, 0);
                          return (
                            <div className="text-center">
                              <p className="text-5xl font-mono font-extrabold text-slate-800 dark:text-gray-100">
                                {parsedNLP.targetField.includes('amount') || parsedNLP.targetField.includes('total')
                                  ? `$${val.toLocaleString('es-ES')}` 
                                  : val.toLocaleString('es-ES')}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Vista Previa de Tarjeta</p>
                            </div>
                          );
                        }
                        if (parsedNLP.chartType === 'table') {
                          return (
                            <div className="w-full max-h-[200px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 font-bold">
                                  <tr className="border-b border-slate-100 dark:border-white/5 text-gray-500 dark:text-gray-450">
                                    <th className="p-2">Eje X</th>
                                    <th className="p-2 text-right">Valor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-650">
                                  {previewData.map((d, i) => (
                                    <tr key={i}>
                                      <td className="p-2 font-semibold">{d.name}</td>
                                      <td className="p-2 text-right font-mono font-bold">{d.valor}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        return (
                          <div className="h-48 w-full text-[9px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                              {parsedNLP.chartType === 'bar' ? (
                                <BarChart data={previewData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tickLine={false} />
                                  <YAxis tickLine={false} />
                                  <Tooltip />
                                  <Bar dataKey="valor" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              ) : parsedNLP.chartType === 'line' ? (
                                <LineChart data={previewData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tickLine={false} />
                                  <YAxis tickLine={false} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                              ) : parsedNLP.chartType === 'area' ? (
                                <AreaChart data={previewData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tickLine={false} />
                                  <YAxis tickLine={false} />
                                  <Tooltip />
                                  <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="#eff6ff" />
                                </AreaChart>
                              ) : (
                                <PieChart>
                                  <Pie
                                    data={previewData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    dataKey="valor"
                                    label={({ name, percent }) => `${(name || "").slice(0, 8)} (${((percent || 0) * 100).toFixed(0)}%)`}
                                  >
                                    {previewData.map((_e, i) => (
                                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Report Builder Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-slate-800 dark:text-gray-100 text-sm flex items-center gap-1.5">
                  <Settings size={16} className="text-slate-500 dark:text-gray-450" />
                  Constructor Manual de Reportes
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Title field */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Título del Gráfico</label>
                    <input
                      type="text"
                      value={builderSettings.title}
                      onChange={(e) => setBuilderSettings(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-slate-350"
                    />
                  </div>

                  {/* Origen de Datos selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Origen de Datos</label>
                    <select
                      value={builderSettings.source}
                      onChange={(e) => {
                        const val = e.target.value;
                        let defaultDim = 'gender';
                        if (val === 'donations' || val === 'orders') defaultDim = 'payment_method';
                        else if (val === 'inventory' || val === 'petitions') defaultDim = 'status';
                        else if (val === 'songs') defaultDim = 'artist';
                        else if (val === 'events') defaultDim = 'recurrence';
                        else if (val === 'form_responses') defaultDim = 'block_id';

                        setBuilderSettings(prev => ({
                          ...prev,
                          source: val,
                          dimension: defaultDim,
                          aggregation: 'count',
                          targetField: ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
                    >
                      <option value="members">Miembros (CRM)</option>
                      <option value="donations">Diezmos y Ofrendas (Finanzas)</option>
                      <option value="inventory">Inventario de Equipos</option>
                      <option value="form_responses">Cuestionarios y Notas</option>
                      <option value="petitions">Peticiones de Oración</option>
                      <option value="orders">Pedidos de Tienda</option>
                      <option value="songs">Alabanzas y Himnos</option>
                      <option value="events">Eventos (Calendario)</option>
                    </select>
                  </div>

                  {/* Dimension selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dimensión (Eje X / Agrupación)</label>
                    <select
                      value={builderSettings.dimension}
                      onChange={(e) => setBuilderSettings(prev => ({ ...prev, dimension: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
                    >
                      {builderSettings.source === 'members' && (
                        <>
                          <option value="gender">Género</option>
                          <option value="leadership_role">Rol de Liderazgo</option>
                          <option value="age_group">Grupos de Edad</option>
                          <option value="month">Mes de Registro</option>
                        </>
                      )}
                      {builderSettings.source === 'donations' && (
                        <>
                          <option value="payment_method">Método de Pago</option>
                          <option value="category">Categoría</option>
                          <option value="status">Estado del Pago</option>
                          <option value="month">Mes de Donación</option>
                        </>
                      )}
                      {builderSettings.source === 'inventory' && (
                        <>
                          <option value="status">Estado Físico</option>
                          <option value="category">Categoría de Inventario</option>
                          <option value="month">Mes de Adquisición</option>
                        </>
                      )}
                      {builderSettings.source === 'form_responses' && (
                        <>
                          <option value="block_id">Bloque / Cuestionario</option>
                          <option value="score_range">Rango de Calificación</option>
                          <option value="month">Mes de Envío</option>
                        </>
                      )}
                      {builderSettings.source === 'petitions' && (
                        <>
                          <option value="status">Estado de Petición</option>
                          <option value="month">Mes de Solicitud</option>
                        </>
                      )}
                      {builderSettings.source === 'orders' && (
                        <>
                          <option value="status">Estado del Pedido</option>
                          <option value="payment_method">Método de Pago</option>
                          <option value="month">Mes de Compra</option>
                        </>
                      )}
                      {builderSettings.source === 'songs' && (
                        <>
                          <option value="artist">Artista / Autor</option>
                          <option value="bpm_range">BPM / Tempo</option>
                          <option value="month">Mes de Registro</option>
                        </>
                      )}
                      {builderSettings.source === 'events' && (
                        <>
                          <option value="recurrence">Es Recurrente (Sí/No)</option>
                          <option value="recurrence_type">Tipo Recurrencia</option>
                          <option value="month">Mes de Evento</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Aggregation selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Métrica (Eje Y / Agregación)</label>
                    <select
                      value={`${builderSettings.aggregation}-${builderSettings.targetField}`}
                      onChange={(e) => {
                        const [agg, field] = e.target.value.split(':');
                        setBuilderSettings(prev => ({
                          ...prev,
                          aggregation: agg as any,
                          targetField: field || ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
                    >
                      <option value="count:">Conteo de Registros</option>
                      
                      {builderSettings.source === 'members' && (
                        <>
                          <option value="sum:tithes_sum">Suma de Diezmos</option>
                          <option value="avg:tithes_sum">Promedio de Diezmos</option>
                        </>
                      )}
                      {builderSettings.source === 'donations' && (
                        <>
                          <option value="sum:amount">Suma de Monto</option>
                          <option value="avg:amount">Promedio de Monto</option>
                        </>
                      )}
                      {builderSettings.source === 'inventory' && (
                        <>
                          <option value="sum:quantity">Suma de Cantidades</option>
                          <option value="sum:price * quantity">Valor Estimado Total</option>
                          <option value="avg:price">Precio Unitario Promedio</option>
                        </>
                      )}
                      {builderSettings.source === 'form_responses' && (
                        <>
                          <option value="avg:score">Calificación Promedio</option>
                        </>
                      )}
                      {builderSettings.source === 'orders' && (
                        <>
                          <option value="sum:total">Suma de Totales</option>
                          <option value="avg:total">Monto de Compra Promedio</option>
                        </>
                      )}
                      {builderSettings.source === 'songs' && (
                        <>
                          <option value="avg:bpm">Promedio de BPM</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Chart Type selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Visualización</label>
                    <select
                      value={builderSettings.chartType}
                      onChange={(e) => setBuilderSettings(prev => ({ ...prev, chartType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
                    >
                      <option value="bar">Gráfico de Barras</option>
                      <option value="line">Gráfico de Líneas</option>
                      <option value="area">Gráfico de Área</option>
                      <option value="pie">Gráfico Circular (Pastel)</option>
                      <option value="kpi">Tarjeta KPI (Valor Único)</option>
                      <option value="table">Tabla de Resumen</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => addWidgetToDashboard(builderSettings)}
                  className="w-full py-2.5 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Plus size={16} />
                  Añadir al Dashboard
                </button>
              </div>

              {/* Manual Report Live Preview Area */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-slate-800 dark:text-gray-100 text-xs md:text-sm mb-1">{builderSettings.title}</h3>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Previsualización en Tiempo Real</span>
                </div>

                <div className="flex-1 flex items-center justify-center my-6">
                  {(() => {
                    const data = executeQuery(builderSettings);
                    if (data.length === 0) {
                      return <span className="text-xs text-gray-400 italic">No se hallaron registros coincidentes.</span>;
                    }
                    if (builderSettings.chartType === 'kpi') {
                      const val = data.map(d => d.valor).reduce((a, b) => a + b, 0);
                      return (
                        <div className="text-center">
                          <p className="text-6xl font-mono font-extrabold text-slate-850">
                            {builderSettings.targetField.includes('amount') || builderSettings.targetField.includes('total') || builderSettings.targetField.includes('price')
                              ? `$${val.toLocaleString('es-ES')}` 
                              : val.toLocaleString('es-ES')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Valor Único Agregado</p>
                        </div>
                      );
                    }
                    if (builderSettings.chartType === 'table') {
                      return (
                        <div className="w-full max-h-[220px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 font-bold border-b border-slate-100 dark:border-white/5 text-gray-500 dark:text-gray-450">
                              <tr>
                                <th className="p-2">Eje X</th>
                                <th className="p-2 text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-650">
                              {data.map((d, i) => (
                                <tr key={i}>
                                  <td className="p-2 font-semibold">{d.name}</td>
                                  <td className="p-2 text-right font-mono font-bold">
                                    {builderSettings.targetField.includes('amount') || builderSettings.targetField.includes('total') || builderSettings.targetField.includes('price')
                                      ? `$${d.valor.toLocaleString('es-ES')}`
                                      : d.valor.toLocaleString('es-ES')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return (
                      <div className="h-60 w-full text-[10px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          {builderSettings.chartType === 'bar' ? (
                            <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="valor" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          ) : builderSettings.chartType === 'line' ? (
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                          ) : builderSettings.chartType === 'area' ? (
                            <AreaChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Area type="monotone" dataKey="valor" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                            </AreaChart>
                          ) : (
                            <PieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="valor"
                                label={({ name, percent }) => `${(name || "").slice(0, 10)} (${((percent || 0) * 100).toFixed(0)}%)`}
                              >
                                {data.map((_e, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>

                <div className="text-[10px] text-gray-400 text-center italic">
                  Cambia la configuración del Constructor en la barra lateral para actualizar esta previsualización.
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ORIGINAL LIST OF FORM RESPONSES */}
          {activeTab === 'forms' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-gray-150 dark:border-white/10">
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Respuestas a Cuestionarios Enviadas</h3>
                <p className="text-gray-400 text-xs mt-0.5">Listado de participaciones en línea de miembros y visitantes de la iglesia.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Correo</th>
                      <th className="px-6 py-4">Cuestionario / Bloque</th>
                      <th className="px-6 py-4 text-center">Calificación</th>
                      <th className="px-6 py-4">Fecha de Envío</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                    {responses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold italic">
                          No se han registrado respuestas a cuestionarios en el sistema.
                        </td>
                      </tr>
                    ) : (
                      responses.map((resp) => (
                        <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                            {resp.member_name || 'Anónimo'}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-450 font-mono text-xs">
                            {resp.member_email || 'Sin correo'}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                            {getCleanBlockName(resp.block_id)}
                            <span className="text-[9px] font-normal text-slate-400 block">Pág: {resp.page_id}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {resp.score !== null ? (
                              <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-0.5">
                                <Award size={12} />
                                {resp.score}/{resp.max_score}
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 dark:text-gray-450 px-2 py-0.5 rounded text-[10px] font-bold">
                                Form Libre
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {new Date(resp.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setSelectedResponse(resp)}
                              className="text-primary hover:text-blue-900 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-350 transition-colors inline-flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer"
                            >
                              <Eye size={12} />
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL (Form details check) */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative text-left animate-scale-in border border-slate-200 dark:border-white/10 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedResponse(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-gray-150 dark:border-white/10 pb-4 pr-6 flex items-center gap-3">
              <ClipboardList className="text-gold" size={24} />
              <div>
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base md:text-lg">
                  Respuestas de Cuestionario
                </h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  {getCleanBlockName(selectedResponse.block_id)} / Página: {selectedResponse.page_id}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 custom-scrollbar">
              {/* User credentials summary */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-100 block">{selectedResponse.member_name || 'Anónimo'}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">{selectedResponse.member_email || 'Sin correo electrónico'}</span>
                </div>
              </div>

              {/* Evaluation score summary */}
              {selectedResponse.score !== null && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-amber-800 font-bold flex items-center gap-1.5">
                    <Award size={16} />
                    Resultado de Evaluación
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                    {selectedResponse.score} / {selectedResponse.max_score} Puntos
                  </span>
                </div>
              )}

              {/* Answers details */}
              <div className="space-y-4">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1">Desglose de Respuestas</span>
                
                {Object.entries(selectedResponse.answers).map(([qId, ans], idx) => {
                  const displayAnswer = Array.isArray(ans) ? ans.join(', ') : String(ans);
                  return (
                    <div key={qId} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-100 block">
                        Pregunta {idx + 1}
                      </span>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-300">
                        {displayAnswer || <span className="italic text-gray-400 font-normal">Sin respuesta</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-150 dark:border-white/10 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
