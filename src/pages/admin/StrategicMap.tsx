import { useState, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';
import { useStrategicMapData } from '../../features/strategic-map/hooks/useStrategicMapData';
import { useMapMutations } from '../../features/strategic-map/hooks/useMapMutations';
import { MapSidebar } from '../../features/strategic-map/components/MapSidebar';
import { MapVisuals } from '../../features/strategic-map/components/MapVisuals';
import { MapDetailsPanel } from '../../features/strategic-map/components/MapDetailsPanel';

const CHURCH_COORDS = { lat: -2.139188, lng: -79.5949891 }; // Iglesia Jerusalén Central (Milagro, Ecuador)

const StrategicMap = () => {
  const { members, cells, locations, profiles, isLoading } = useStrategicMapData();
  const { createCell, handleDeleteCell } = useMapMutations();

  // Layer toggles
  const [showChurch, setShowChurch] = useState(true);
  const [showCells, setShowCells] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showOtherChurches, setShowOtherChurches] = useState(true); // Ver otras iglesias
  const [showCoverage, setShowCoverage] = useState(true); // Ver cobertura de células

  // Map settings
  const [mapStyle, setMapStyle] = useState('https://tiles.openfreemap.org/styles/bright');
  const [viewState, setViewState] = useState({
    longitude: CHURCH_COORDS.lng,
    latitude: CHURCH_COORDS.lat,
    zoom: 13,
    pitch: 45,
    bearing: 0,
  });

  const mapRef = useRef<any>(null);

  // Detailed view state
  const [selectedItem, setSelectedItem] = useState<{
    type: 'member' | 'cell' | 'church' | 'location';
    data: any;
  } | null>(null);

  // Measure Tool State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Geocoding Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Cell creation state
  const [isCreatingCellUI, setIsCreatingCellUI] = useState(false);
  const [cellForm, setCellForm] = useState({
    name: '',
    sector: '',
    leader_id: '',
    latitude: CHURCH_COORDS.lat,
    longitude: CHURCH_COORDS.lng,
  });

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

  const handleMapClick = (e: any) => {
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

    createCell(cellForm, {
      onSuccess: () => {
        setIsCreatingCellUI(false);
        setCellForm({
          name: '',
          sector: '',
          leader_id: '',
          latitude: CHURCH_COORDS.lat,
          longitude: CHURCH_COORDS.lng
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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-gray-100 overflow-hidden">
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-white/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 shadow-2xs">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-church-gold-bright">
            Mapa Estratégico y Análisis Espacial
          </h1>
          <p className="text-slate-500 dark:text-gray-450 text-xs mt-1 leading-relaxed font-medium">
            Zonificación geográfica de miembros, células de oración e Iglesias de la congregación.
          </p>
        </div>
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

      <div className="flex flex-1 overflow-hidden relative">
        <MapSidebar 
          showChurch={showChurch} setShowChurch={setShowChurch}
          showCells={showCells} setShowCells={setShowCells}
          showCoverage={showCoverage} setShowCoverage={setShowCoverage}
          showMembers={showMembers} setShowMembers={setShowMembers}
          showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
          showOtherChurches={showOtherChurches} setShowOtherChurches={setShowOtherChurches}
          cells={cells} profiles={profiles}
          isCreatingCell={isCreatingCellUI} setIsCreatingCell={setIsCreatingCellUI}
          cellForm={cellForm} setCellForm={setCellForm}
          handleCreateCell={handleCreateCell} handleDeleteCell={handleDeleteCell}
          getCurrentLocation={getCurrentLocation}
          onFocusLocation={focusLocation}
          setSelectedItem={setSelectedItem}
          locationsCount={locations.length}
        />

        <div className="flex-grow h-full relative overflow-hidden">
          <MapVisuals 
            mapRef={mapRef}
            viewState={viewState} setViewState={setViewState}
            mapStyle={mapStyle}
            isMeasuring={isMeasuring} setIsMeasuring={setIsMeasuring}
            measurePoints={measurePoints} setMeasurePoints={setMeasurePoints}
            isCreatingCell={isCreatingCellUI}
            handleMapClick={handleMapClick}
            showChurch={showChurch} showCells={showCells}
            showCoverage={showCoverage} showMembers={showMembers}
            showHeatmap={showHeatmap} showOtherChurches={showOtherChurches}
            members={members} cells={cells} locations={locations}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategicMap;
