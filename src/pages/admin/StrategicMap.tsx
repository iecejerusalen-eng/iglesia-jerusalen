import { useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Layers3, LocateFixed, Menu, RefreshCw, Search, Target, UsersRound, X } from 'lucide-react';
import { useStrategicMapData } from '../../features/strategic-map/hooks/useStrategicMapData';
import { useMapMutations } from '../../features/strategic-map/hooks/useMapMutations';
import { MapSidebar } from '../../features/strategic-map/components/MapSidebar';
import { MapVisuals } from '../../features/strategic-map/components/MapVisuals';
import { MapDetailsPanel } from '../../features/strategic-map/components/MapDetailsPanel';
import { calculateStrategicMapMetrics, filterMembersForMap } from '../../features/strategic-map/utils/geoAnalysis';
import type { StrategicMapMode, StrategicMapSelection } from '../../features/strategic-map/types';
import { usePermissions } from '../../hooks/usePermissions';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';

const CHURCH_COORDS = { lat: -2.139188, lng: -79.5949891 }; // Iglesia Jerusalén Central (Milagro, Ecuador)

const StrategicMap = () => {
  const { members, cells, locations, profiles, isLoading, error, refetch } = useStrategicMapData();
  const { createCell, handleDeleteCell } = useMapMutations();
  const { hasPermission } = usePermissions();

  // Layer toggles
  const [showChurch, setShowChurch] = useState(true);
  const [showCells, setShowCells] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showOtherChurches, setShowOtherChurches] = useState(true); // Ver otras iglesias
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCoverage, setShowCoverage] = useState(true); // Ver cobertura de células
  const [mode, setMode] = useState<StrategicMapMode>('pastoral');
  const [memberQuery, setMemberQuery] = useState('');

  // Map settings
  const [mapStyle, setMapStyle] = useState('https://tiles.openfreemap.org/styles/bright');
  const [viewState, setViewState] = useState({
    longitude: CHURCH_COORDS.lng,
    latitude: CHURCH_COORDS.lat,
    zoom: 13,
    pitch: 45,
    bearing: 0,
  });

  const mapRef = useRef<MapRef | null>(null);

  // Detailed view state
  const [selectedItem, setSelectedItem] = useState<StrategicMapSelection | null>(null);

  // Measure Tool State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Geocoding Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Cell creation state
  const [isCreatingCellUI, setIsCreatingCellUI] = useState(false);
  const [cellForm, setCellForm] = useState<{
    name: string;
    sector: string;
    leader_id: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'paused' | 'planning' | 'archived';
    capacity: number | null;
    coverage_radius_m: number;
  }>({
    name: '',
    sector: '',
    leader_id: '',
    latitude: CHURCH_COORDS.lat,
    longitude: CHURCH_COORDS.lng,
    status: 'active',
    capacity: null,
    coverage_radius_m: 500,
  });

  const canManageMap = hasPermission('map', 'edit');
  const metrics = useMemo(() => calculateStrategicMapMetrics(members, cells), [cells, members]);
  const filteredMembers = useMemo(
    () => filterMembersForMap(members, cells, mode, memberQuery),
    [cells, memberQuery, members, mode],
  );

  const calculateTotalDistance = (points: [number, number][]) => {
    if (points.length < 2) return 0;
    let total = 0;
    const R = 6371; // Radio de la Tierra en km
    for (let i = 0; i < points.length - 1; i++) {
      const [lon1, lat1] = points[i];
      const [lon2, lat2] = points[i+1];
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      total += R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }
    return total;
  };

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (isMeasuring) {
      setMeasurePoints(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    } else if (isCreatingCellUI) {
      setCellForm(prev => ({
        ...prev,
        latitude: Number(e.lngLat.lat.toFixed(6)),
        longitude: Number(e.lngLat.lng.toFixed(6))
      }));
      toast.info(`Coordenadas de célula fijadas: ${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`);
    } else {
      setSelectedItem(null);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada en este navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCellForm(prev => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }));
        setViewState(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          zoom: 15
        }));
        toast.success('Ubicación GPS obtenida con éxito.');
      },
      (err) => {
        toast.error('Error al obtener ubicación GPS: ' + err.message);
      }
    );
  };

  const handleCreateCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellForm.name) {
      toast.error('El nombre de la célula es obligatorio');
      return;
    }
    if (!Number.isInteger(cellForm.coverage_radius_m) || cellForm.coverage_radius_m < 100 || cellForm.coverage_radius_m > 10000) {
      toast.error('El radio de cobertura debe estar entre 100 y 10.000 metros.');
      return;
    }

    createCell(cellForm, {
      onSuccess: () => {
        setIsCreatingCellUI(false);
        setCellForm({
          name: '',
          sector: '',
          leader_id: '',
          latitude: CHURCH_COORDS.lat,
          longitude: CHURCH_COORDS.lng,
          status: 'active',
          capacity: null,
          coverage_radius_m: 500,
        });
      }
    });
  };

  const focusLocation = (lat: number, lng: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 16,
      duration: 1200
    });
  };

  const centerOnChurch = () => focusLocation(CHURCH_COORDS.lat, CHURCH_COORDS.lng);

  const handleGeocodeSearch = async () => {
    if (!searchQuery.trim()) return;
    setGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        focusLocation(lat, lon);

        if (isCreatingCellUI) {
          setCellForm(prev => ({
            ...prev,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6))
          }));
        }
        toast.success(`Ubicación encontrada: ${result.display_name}`);
      } else {
        toast.error('No se encontró esa ubicación. Intenta con otros términos.');
      }
    } catch (err) {
      console.error('Error in geocoding search:', err);
      toast.error('Error al realizar la búsqueda geográfica.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleScreenshot = () => {
    if (!mapRef.current) return;
    try {
      const canvas = mapRef.current.getCanvas();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa_estrategico_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Captura del mapa descargada con éxito.');
    } catch (err) {
      console.error('Error al capturar pantalla del mapa:', err);
      toast.error('No se pudo tomar la captura. Asegúrese de que el mapa cargó por completo.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] md:h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[calc(100vh-64px)] place-items-center bg-slate-100 p-6 dark:bg-slate-950">
        <section className="max-w-md rounded-3xl border border-rose-200 bg-white/80 p-7 text-center shadow-xl backdrop-blur-xl dark:border-rose-900/50 dark:bg-slate-900/80">
          <AlertCircle className="mx-auto mb-4 text-rose-600" size={32} aria-hidden="true" />
          <h1 className="font-serif text-xl font-bold text-slate-900 dark:text-white">No pudimos cargar el mapa</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{error.message}</p>
          <button type="button" onClick={() => void refetch()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-blue-800">
            <RefreshCw size={15} /> Reintentar
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-gray-100 md:h-screen">
      <div className="z-20 flex shrink-0 flex-col gap-3 border-b border-white/50 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75 md:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-church-gold-bright">
            Mapa Territorial y Cobertura Pastoral
          </h1>
          <p className="text-slate-500 dark:text-gray-450 text-xs mt-1 leading-relaxed font-medium">
            Visualiza cobertura pastoral, células, sectores y oportunidades de expansión sin mezclarlo con los objetivos institucionales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setIsSidebarOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm lg:hidden dark:border-white/10 dark:bg-slate-800 dark:text-slate-200" aria-expanded={isSidebarOpen}>
            {isSidebarOpen ? <X size={15} /> : <Menu size={15} />} Controles
          </button>
          <button type="button" onClick={centerOnChurch} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
            <LocateFixed size={15} /> Sede central
          </button>
          <button type="button" onClick={() => void refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
            <RefreshCw size={15} /> Actualizar
          </button>
          <a href="/admin/estrategia" className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800">
            <Target size={15} /> Centro de estrategia
          </a>
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
          <button
            type="button"
            onClick={() => setMapStyle('https://tiles.openfreemap.org/styles/bright')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapStyle.includes('bright') ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('https://tiles.openfreemap.org/styles/dark')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mapStyle.includes('dark') ? 'bg-white text-primary shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Oscuro
          </button>
        </div>
        </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Miembros ubicados" value={`${metrics.membersWithLocation}/${members.length}`} icon={<UsersRound size={15} />} tone="blue" />
          <Metric label="Cobertura territorial" value={`${metrics.coveredMembers}/${metrics.membersWithLocation}`} icon={<CheckCircle2 size={15} />} tone={metrics.uncoveredMembers ? 'amber' : 'emerald'} />
          <Metric label="Células activas" value={`${metrics.cellsWithLocation}`} icon={<Layers3 size={15} />} tone="emerald" />
          <Metric label="Sin ubicación" value={`${metrics.membersWithoutLocation}`} icon={<AlertCircle size={15} />} tone={metrics.membersWithoutLocation ? 'amber' : 'slate'} />
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <MapSidebar 
          className={`${isSidebarOpen ? 'absolute inset-y-0 left-0 z-30 shadow-2xl' : 'hidden'} lg:static lg:flex`}
          showChurch={showChurch} setShowChurch={setShowChurch}
          showCells={showCells} setShowCells={setShowCells}
          showCoverage={showCoverage} setShowCoverage={setShowCoverage}
          showMembers={showMembers} setShowMembers={setShowMembers}
          showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
          showOtherChurches={showOtherChurches} setShowOtherChurches={setShowOtherChurches}
          cells={cells} profiles={profiles} canManageCells={canManageMap}
          isCreatingCell={isCreatingCellUI} setIsCreatingCell={setIsCreatingCellUI}
          cellForm={cellForm} setCellForm={setCellForm}
          handleCreateCell={handleCreateCell} handleDeleteCell={handleDeleteCell}
          getCurrentLocation={getCurrentLocation}
          onFocusLocation={focusLocation}
          setSelectedItem={setSelectedItem}
          locationsCount={locations.length}
        />

        <div className="flex-grow h-full relative overflow-hidden">
          <section aria-label="Modos y filtros del mapa" className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-col gap-2 md:left-5 md:top-5">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/80 p-1.5 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <ModeButton active={mode === 'pastoral'} onClick={() => setMode('pastoral')}>Pastoral</ModeButton>
              <ModeButton active={mode === 'cells'} onClick={() => setMode('cells')}>Células</ModeButton>
              <ModeButton active={mode === 'expansion'} onClick={() => setMode('expansion')}>Expansión</ModeButton>
              <ModeButton active={mode === 'quality'} onClick={() => setMode('quality')}>Calidad</ModeButton>
            </div>
            <label className="flex w-72 max-w-full items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3 py-2.5 shadow-lg shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <Search size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
                placeholder="Buscar miembro en el mapa"
                className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <span className="shrink-0 text-[10px] font-bold text-slate-400">{filteredMembers.length}</span>
            </label>
          </section>
          {mode === 'quality' && (
            <div className="absolute bottom-5 left-5 z-10 max-w-sm rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-950 shadow-lg backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-950/80 dark:text-amber-100">
              <strong>{metrics.membersWithoutLocation} registros</strong> necesitan una ubicación válida. Selecciona “Pastoral” para consultar y completar sus fichas autorizadas.
            </div>
          )}
          <MapVisuals 
            mapRef={mapRef}
            viewState={viewState} setViewState={setViewState}
            mapStyle={mapStyle}
            isMeasuring={isMeasuring} setIsMeasuring={setIsMeasuring}
            measurePoints={measurePoints} setMeasurePoints={setMeasurePoints}
            isCreatingCell={isCreatingCellUI}
            handleMapClick={handleMapClick}
            showChurch={showChurch} showCells={showCells}
            showCoverage={showCoverage} showMembers={showMembers && mode !== 'cells'}
            showHeatmap={showHeatmap && mode !== 'cells' && mode !== 'quality'} showOtherChurches={showOtherChurches}
            members={filteredMembers} cells={cells} locations={locations}
            CHURCH_COORDS={CHURCH_COORDS}
            setSelectedItem={setSelectedItem}
            focusLocation={focusLocation}
            handleScreenshot={handleScreenshot}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            handleGeocodeSearch={handleGeocodeSearch} geocoding={geocoding}
            calculateTotalDistance={calculateTotalDistance}
          />

          {selectedItem && (
            <MapDetailsPanel 
              selectedItem={selectedItem} 
              onClose={() => setSelectedItem(null)} 
              onFocusLocation={focusLocation}
              canViewSensitive={canManageMap}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'blue' | 'emerald' | 'amber' | 'slate' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10',
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${styles[tone]}`}>
      <span aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold leading-none">{value}</p>
        <p className="mt-1 truncate text-[10px] font-semibold opacity-75">{label}</p>
      </div>
    </div>
  );
}

function ModeButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
    >
      {children}
    </button>
  );
}

export default StrategicMap;
