import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import type { Member, Cell } from '../../types';
import Map, { Marker, NavigationControl, Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import Supercluster from 'supercluster';
import { useMapStore } from '../../store/useMapStore';
import { generateCoverageGeoJSON } from '../../utils/geoUtils';
import { 
  Plus, Trash2, Crosshair, MapPin, 
  Layers, Users, Compass, X, 
  AlertTriangle, Phone, Search, Ruler, Camera,
  Calendar
} from 'lucide-react';
import { formatWhatsAppLink } from '../../utils/whatsapp';

const CHURCH_COORDS = { lat: -2.139188, lng: -79.5949891 }; // Iglesia Jerusalén Central (Milagro, Ecuador)

const StrategicMap = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const {
    members,
    cells,
    locations,
    profiles,
    fetchMapData,
    subscribeRealtime,
    unsubscribeRealtime
  } = useMapStore();

  // Layer toggles
  const [showChurch, setShowChurch] = useState(true);
  const [showCells, setShowCells] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showOtherChurches, setShowOtherChurches] = useState(true); // Ver otras iglesias
  const [showCoverage, setShowCoverage] = useState(true); // Ver cobertura de células

  // Map settings - default to light mode (bright)
  const [mapStyle, setMapStyle] = useState('https://tiles.openfreemap.org/styles/bright');
  const [viewState, setViewState] = useState({
    longitude: CHURCH_COORDS.lng,
    latitude: CHURCH_COORDS.lat,
    zoom: 13,
    pitch: 45,
    bearing: 0,
  });

  // Clustering State
  const [superclusterInstance, setSuperclusterInstance] = useState<Supercluster<any, any> | null>(null);
  const [visiblePoints, setVisiblePoints] = useState<any[]>([]);

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
  const [isCreatingCell, setIsCreatingCell] = useState(false);
  const [cellForm, setCellForm] = useState({
    name: '',
    sector: '',
    leader_id: '',
    latitude: CHURCH_COORDS.lat,
    longitude: CHURCH_COORDS.lng,
  });

  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchMapData().catch((err) => {
      console.error('Error fetching strategic map data:', err);
      toast.error('Error al cargar datos del mapa');
    });
    subscribeRealtime();
    return () => {
      unsubscribeRealtime();
    };
  }, [fetchMapData, subscribeRealtime, unsubscribeRealtime]);

  // Initialize Supercluster
  useEffect(() => {
    const validMembers = members.filter(
      m => m.latitude !== null && m.longitude !== null && m.latitude !== undefined && m.longitude !== undefined
    );

    if (validMembers.length === 0) {
      setSuperclusterInstance(null);
      setVisiblePoints([]);
      return;
    }

    const points = validMembers.map(m => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [Number(m.longitude), Number(m.latitude)] as [number, number],
      },
      properties: {
        cluster: false,
        memberId: m.id,
        member: m,
      },
    }));

    const sc = new Supercluster({
      radius: 50,
      maxZoom: 15,
    });
    sc.load(points);
    setSuperclusterInstance(sc);
  }, [members]);

  // Update clusters when viewport or supercluster changes (debounced to prevent animation lag)
  useEffect(() => {
    if (!superclusterInstance) {
      setVisiblePoints([]);
      return;
    }

    const handler = setTimeout(() => {
      let bbox: [number, number, number, number];
      if (mapRef.current) {
        try {
          const bounds = mapRef.current.getMap().getBounds();
          bbox = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ];
        } catch (err) {
          // Fallback computation
          const zoom = viewState.zoom;
          const lat = viewState.latitude;
          const lng = viewState.longitude;
          const lngDiff = 360 / Math.pow(2, zoom);
          const latDiff = 180 / Math.pow(2, zoom);
          bbox = [lng - lngDiff, lat - latDiff, lng + lngDiff, lat + latDiff];
        }
      } else {
        const zoom = viewState.zoom;
        const lat = viewState.latitude;
        const lng = viewState.longitude;
        const lngDiff = 360 / Math.pow(2, zoom);
        const latDiff = 180 / Math.pow(2, zoom);
        bbox = [lng - lngDiff, lat - latDiff, lng + lngDiff, lat + latDiff];
      }

      try {
        const zoom = Math.round(viewState.zoom);
        const clusters = superclusterInstance.getClusters(bbox, zoom);
        setVisiblePoints(clusters);
      } catch (err) {
        console.error('Error updating visible clusters:', err);
      }
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [superclusterInstance, viewState.zoom, viewState.latitude, viewState.longitude]);

  // Geocoding search function
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
        
        mapRef.current?.flyTo({
          center: [lon, lat],
          zoom: 15,
          duration: 1200
        });

        if (isCreatingCell) {
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

  // Capture Map Screenshot using Canvas WebGL
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

  // Calculate total distance in km (Haversine formula)
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
    } else if (isCreatingCell) {
      setCellForm(prev => ({
        ...prev,
        latitude: Number(e.lngLat.lat.toFixed(6)),
        longitude: Number(e.lngLat.lng.toFixed(6))
      }));
      toast.info(`Coordenadas de célula fijadas: ${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`);
    } else {
      // Click outside marker closes the sidebar
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

    try {
      const { error } = await supabase
        .from('cells')
        .insert([{
          name: cellForm.name,
          sector: cellForm.sector || null,
          leader_id: cellForm.leader_id || null,
          latitude: cellForm.latitude,
          longitude: cellForm.longitude
        }]);

      if (error) throw error;

      toast.success(`Célula "${cellForm.name}" creada con éxito.`);
      setIsCreatingCell(false);
      setCellForm({
        name: '',
        sector: '',
        leader_id: '',
        latitude: CHURCH_COORDS.lat,
        longitude: CHURCH_COORDS.lng
      });
      fetchMapData();
    } catch (err: any) {
      toast.error('Error al guardar la célula: ' + err.message);
    }
  };

  const handleDeleteCell = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar célula',
      message: `¿Estás seguro de eliminar lógicamente la célula "${name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('cells')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Célula "${name}" eliminada.`);
      fetchMapData();
    } catch (err: any) {
      toast.error('Error al eliminar célula: ' + err.message);
    }
  };

  const focusLocation = (lat: number, lng: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 16,
      duration: 1200
    });
  };

  // Render HTML for sidebar elements
  const renderMemberDetails = (member: Member) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {member.photo_url ? (
            <img 
              src={member.photo_url} 
              alt={`${member.first_name} ${member.last_name}`}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/10 shadow-md animate-fadeIn" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-3xl font-serif font-bold text-blue-600 uppercase shadow-inner">
              {member.first_name[0]}{member.last_name[0]}
            </div>
          )}
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-gray-100">
              {member.first_name} {member.last_name}
            </h3>
            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100 mt-1.5 uppercase">
              {member.is_leader ? (member.leadership_role || 'Líder') : 'Miembro Congregante'}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
          {member.phone && (
            <div className="flex items-center gap-3.5 text-xs">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-3xs">
                <Phone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 font-bold">Teléfono</p>
                <a href={`tel:${member.phone}`} className="text-slate-700 dark:text-gray-300 font-bold hover:underline">
                  {member.phone}
                </a>
              </div>
              <a 
                href={formatWhatsAppLink(member.phone, member.phone_country_code, `Hola ${member.first_name}, te saludamos de la Iglesia Jerusalén...`)} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer text-[10px]"
              >
                WhatsApp
              </a>
            </div>
          )}

          {member.dni && (
            <div className="flex items-center gap-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-500 dark:text-gray-450 shadow-3xs">
                <span className="text-base font-bold">🪪</span>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Cédula / DNI</p>
                <p className="text-slate-700 dark:text-gray-300 font-semibold">{member.dni}</p>
              </div>
            </div>
          )}

          {member.address && (
            <div className="flex items-start gap-3.5 text-xs">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold">Dirección</p>
                <p className="text-slate-700 dark:text-gray-300 font-semibold leading-relaxed">
                  {member.address}
                </p>
              </div>
            </div>
          )}

          {member.birth_date && (
            <div className="flex items-center gap-3.5 text-xs">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shadow-3xs">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold">Fecha de Nacimiento</p>
                <p className="text-slate-700 dark:text-gray-300 font-semibold">
                  {new Date(member.birth_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {member.conversion_date && (
            <div className="flex items-center gap-3.5 text-xs">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-3xs">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold">Fecha de Conversión</p>
                <p className="text-slate-700 dark:text-gray-300 font-semibold">
                  {new Date(member.conversion_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {member.created_at && (
            <div className="flex items-center gap-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-500 dark:text-gray-450 shadow-3xs">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold">Fecha de Registro</p>
                <p className="text-slate-700 dark:text-gray-300 font-semibold">
                  {new Date(member.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {member.latitude && member.longitude && (
          <button
            onClick={() => focusLocation(Number(member.latitude), Number(member.longitude))}
            className="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Crosshair size={14} /> Centrar en el Mapa
          </button>
        )}
      </div>
    );
  };

  const renderCellDetails = (cell: Cell) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-600 shadow-sm animate-spin-slow">
            <Compass size={32} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-gray-100">
              {cell.name}
            </h3>
            <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 mt-1.5 uppercase">
              Sector: {cell.sector || 'General'}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
          {cell.profiles ? (
            <div className="flex items-start gap-3.5 text-xs">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-3xs mt-0.5">
                <Users size={16} />
              </div>
              <div className="flex-grow">
                <p className="text-slate-400 font-bold">Líder de Célula</p>
                <p className="text-slate-700 dark:text-gray-300 font-bold text-sm">
                  {cell.profiles.first_name} {cell.profiles.last_name}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 text-xs text-slate-500 dark:text-gray-450">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-400 shadow-3xs">
                <Users size={16} />
              </div>
              <div>
                <p className="text-slate-400 font-bold">Líder de Célula</p>
                <p className="font-semibold italic">Sin líder asignado</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-slate-400 font-bold">Coordenadas Geográficas</p>
              <p className="text-slate-700 dark:text-gray-300 font-mono font-semibold">
                Latitud: {cell.latitude.toFixed(6)} <br />
                Longitud: {cell.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => focusLocation(cell.latitude, cell.longitude)}
          className="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <Crosshair size={14} /> Centrar en el Mapa
        </button>
      </div>
    );
  };

  const renderChurchDetails = (church: any) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
            <MapPin size={32} className="text-gold fill-gold/15" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-gray-100">
              {church.name}
            </h3>
            <span className="inline-block bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20 dark:border-blue-900/30 mt-1.5 uppercase">
              Sede Central
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-slate-400 font-bold">Dirección Oficial</p>
              <p className="text-slate-700 dark:text-gray-300 font-semibold leading-relaxed">
                {church.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-500 dark:text-gray-450 shadow-3xs mt-0.5">
              <span className="text-base font-bold">📋</span>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Descripción</p>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                {church.description}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
              <span className="text-base font-bold">📍</span>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Coordenadas</p>
              <p className="text-slate-700 dark:text-gray-300 font-mono font-semibold">
                Latitud: {church.latitude.toFixed(6)} <br />
                Longitud: {church.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => focusLocation(church.latitude, church.longitude)}
          className="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <Crosshair size={14} /> Centrar en el Mapa
        </button>
      </div>
    );
  };

  const renderLocationDetails = (loc: any) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            {loc.icon_type === 'emoji' ? (
              <span className="text-3xl">{loc.icon_value}</span>
            ) : (
              <div 
                className="w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: loc.icon_value }}
              />
            )}
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-gray-100">
              {loc.name}
            </h3>
            <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 mt-1.5 uppercase">
              Iglesia Filial / Punto estratégico
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-slate-400 font-bold">Dirección</p>
              <p className="text-slate-700 dark:text-gray-300 font-semibold leading-relaxed">
                {loc.address_street || 'Sin dirección registrada'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-xs">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-3xs mt-0.5">
              <span className="text-base font-bold">📍</span>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Coordenadas</p>
              <p className="text-slate-700 dark:text-gray-300 font-mono font-semibold">
                Latitud: {loc.lat.toFixed(6)} <br />
                Longitud: {loc.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => focusLocation(loc.lat, loc.lng)}
          className="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <Crosshair size={14} /> Centrar en el Mapa
        </button>
      </div>
    );
  };

  // GeoJSON data structures for members heatmap
  const memberGeoJSON = {
    type: 'FeatureCollection' as const,
    features: members
      .filter(m => m.latitude !== null && m.longitude !== null && m.latitude !== undefined && m.longitude !== undefined)
      .map(m => ({
        type: 'Feature' as const,
        properties: { id: m.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(m.longitude), Number(m.latitude)]
        }
      }))
  };

  const heatmapLayer: any = {
    id: 'member-heatmap',
    type: 'heatmap',
    maxzoom: 15,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgba(59, 130, 246, 0.45)',
        0.4, 'rgba(34, 211, 238, 0.6)',
        0.6, 'rgba(52, 211, 153, 0.7)',
        0.8, 'rgba(251, 191, 36, 0.8)',
        1, 'rgba(251, 113, 133, 0.9)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 20],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.95, 15, 0.15]
    }
  };

  // GeoJSON data structures for cell coverage circles (500m geofencing)
  const coverageGeoJSON = generateCoverageGeoJSON(cells, 500);

  const coverageFillLayer: any = {
    id: 'cell-coverage-fill',
    type: 'fill',
    paint: {
      'fill-color': '#1E3A8A',
      'fill-opacity': 0.15
    }
  };

  const coverageLineLayer: any = {
    id: 'cell-coverage-line',
    type: 'line',
    paint: {
      'line-color': '#D4AF37',
      'line-width': 1.5,
      'line-opacity': 0.5
    }
  };

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
        {/* Sidebar Controls */}
        <div className="w-80 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-sm">
          
          {/* Layer Visibility */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-450 font-bold flex items-center gap-1.5 font-serif">
              <Layers size={14} className="text-gold" />
              Capas Visibles
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3.5 text-xs font-semibold text-slate-750 shadow-xs">
              <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showChurch} 
                  onChange={() => setShowChurch(!showChurch)} 
                  className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-gray-100">
                  <MapPin size={14} className="text-gold fill-gold/25" />
                  Iglesia Jerusalén Central
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showCells} 
                  onChange={() => setShowCells(!showCells)} 
                  className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-gray-100">
                  <Compass size={14} className="text-emerald-600" />
                  Células ({cells.length})
                </span>
              </label>
              {showCells && (
                <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors pl-4 animate-fadeIn">
                  <input 
                    type="checkbox" 
                    checked={showCoverage} 
                    onChange={() => setShowCoverage(!showCoverage)} 
                    className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 text-slate-650 text-[11px] font-bold">
                    <span>🌐</span>
                    Cobertura de Células (500m)
                  </span>
                </label>
              )}
              <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showMembers} 
                  onChange={() => {
                    setShowMembers(!showMembers);
                    if (showMembers) {
                      setSelectedItem(null);
                    }
                  }} 
                  className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  Hermanos (Agrupados)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showHeatmap} 
                  onChange={() => setShowHeatmap(!showHeatmap)} 
                  className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Crosshair size={14} className="text-red-500 animate-pulse" />
                  Densidad (Mapa Calor)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showOtherChurches} 
                  onChange={() => {
                    setShowOtherChurches(!showOtherChurches);
                    if (showOtherChurches) {
                      setSelectedItem(null);
                    }
                  }} 
                  className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">⛪</span>
                  Otras Iglesias ({locations.length})
                </span>
              </label>
            </div>
          </div>

          {/* Cells Management */}
          <div className="space-y-4 flex-grow flex flex-col min-h-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-450 font-bold flex items-center gap-1.5 font-serif">
                <Compass size={14} className="text-emerald-600" />
                Células / Hogares
              </h3>
              {!isCreatingCell ? (
                <button
                  onClick={() => setIsCreatingCell(true)}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors cursor-pointer shadow-sm shadow-emerald-600/10"
                  title="Nueva Célula"
                >
                  <Plus size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setIsCreatingCell(false)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-gray-300 transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isCreatingCell ? (
              <form onSubmit={handleCreateCell} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3.5 text-xs text-left animate-fadeIn shadow-2xs">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-gray-450 font-bold">Nombre de Célula</label>
                  <input
                    type="text"
                    value={cellForm.name}
                    onChange={e => setCellForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Célula La Roca"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-gray-450 font-bold">Sector / Zona</label>
                  <input
                    type="text"
                    value={cellForm.sector}
                    onChange={e => setCellForm(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="Ej. Sector Norte"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-gray-450 font-bold">Líder a Cargo</label>
                  <select
                    value={cellForm.leader_id}
                    onChange={e => setCellForm(prev => ({ ...prev, leader_id: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
                  >
                    <option value="">Selecciona un Líder...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-gray-450 font-bold">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={cellForm.latitude}
                      onChange={e => setCellForm(prev => ({ ...prev, latitude: Number(e.target.value) }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-600 dark:text-gray-400 font-mono shadow-2xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-gray-450 font-bold">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={cellForm.longitude}
                      onChange={e => setCellForm(prev => ({ ...prev, longitude: Number(e.target.value) }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-600 dark:text-gray-400 font-mono shadow-2xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl text-[10px] text-amber-800 leading-normal flex items-start gap-2 border border-amber-200/50">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Haz clic directamente sobre el mapa para ubicar o usa el GPS.</span>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
                  >
                    <Crosshair size={12} className="text-gold" />
                    Usar GPS
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                  >
                    Crear
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-150 dark:border-white/10 flex-grow overflow-y-auto max-h-[300px] custom-scrollbar space-y-1 text-xs text-left shadow-2xs">
                {cells.length === 0 ? (
                  <span className="text-slate-400 font-bold text-center block py-8">No hay células creadas</span>
                ) : (
                  cells.map(cell => (
                    <div 
                      key={cell.id}
                      className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100/50 rounded-xl transition-all border border-slate-100 dark:border-white/5 hover:border-slate-200 flex items-center justify-between group shadow-2xs mb-1"
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          focusLocation(cell.latitude, cell.longitude);
                          setSelectedItem({ type: 'cell', data: cell });
                        }}
                        className="cursor-pointer flex-grow min-w-0"
                      >
                        <h4 className="font-bold text-slate-800 dark:text-gray-100 truncate">{cell.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-gray-450 block truncate">
                          Sector: {cell.sector || 'General'}
                        </span>
                        {cell.profiles && (
                          <span className="text-[10px] text-emerald-600 font-bold block truncate mt-0.5">
                            Líder: {cell.profiles.first_name} {cell.profiles.last_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCell(cell.id, cell.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Eliminar célula"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Map Area */}
        <div className="flex-grow h-full relative overflow-hidden">
          
          {/* Floating Geocoding Search Box */}
          <div className="absolute top-5 left-5 z-10 w-72 max-w-[calc(100vw-40px)] flex gap-2">
            <input
              id="searchLocation"
              name="searchLocation"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGeocodeSearch() }}
              placeholder="Buscar ubicación (ej: Guayaquil)..."
              className="flex-1 bg-white/95 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary backdrop-blur-md shadow-lg min-w-0 font-medium"
            />
            <button
              type="button"
              onClick={handleGeocodeSearch}
              disabled={geocoding}
              className="p-2.5 bg-primary hover:bg-blue-800 disabled:bg-blue-900 text-white rounded-xl shadow-lg border border-primary/20 transition-all shrink-0 flex items-center justify-center cursor-pointer"
              title="Buscar dirección"
            >
              {geocoding ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>
  
          {/* Map Tools Sidebar (Right) */}
          <div className="absolute top-5 right-5 flex flex-col gap-3 z-10">
            <button
              type="button"
              onClick={() => { setIsMeasuring(!isMeasuring); setMeasurePoints([]) }}
              className={`p-3 rounded-2xl transition-all shadow-lg backdrop-blur-md border flex items-center justify-center cursor-pointer ${isMeasuring ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/95 border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50'}`}
              title="Medir distancia en km"
            >
              <Ruler size={18} />
            </button>
            <button
              type="button"
              onClick={handleScreenshot}
              className="bg-white/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-2xl text-slate-600 dark:text-gray-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center cursor-pointer"
              title="Capturar pantalla del mapa"
            >
              <Camera size={18} />
            </button>
          </div>
  
          {/* Measuring Distance Tooltip overlay */}
          {isMeasuring && measurePoints.length > 0 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 z-10 animate-fadeIn text-xs font-semibold">
              <div className="text-slate-800 dark:text-gray-100">
                Distancia Medida: <span className="text-primary dark:text-church-gold-bright font-mono font-bold">{calculateTotalDistance(measurePoints).toFixed(2)} km</span>
              </div>
              <button
                onClick={() => setMeasurePoints([])}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                title="Limpiar medición"
              >
                ✕
              </button>
            </div>
          )}
  
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            preserveDrawingBuffer={true}
            cursor={isMeasuring || isCreatingCell ? 'crosshair' : 'grab'}
          >
            <NavigationControl position="bottom-right" showCompass visualizePitch />
  
            {/* Measuring Line Source/Layer */}
            {isMeasuring && measurePoints.length > 1 && (
              <Source type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: measurePoints } }}>
                <Layer
                  id="measure-line"
                  type="line"
                  paint={{ 'line-color': '#1e3a8a', 'line-width': 3.5, 'line-dasharray': [2, 2] }}
                />
              </Source>
            )}
  
            {/* Measuring Points Markers */}
            {isMeasuring && measurePoints.map((pt, i) => (
              <Marker key={`measure-pt-${i}`} longitude={pt[0]} latitude={pt[1]} anchor="center">
                <div className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-bold text-white font-mono leading-none">
                  {i + 1}
                </div>
              </Marker>
            ))}
  
            {/* Coverage Layers for Cells (500m Area) */}
            {showCoverage && showCells && coverageGeoJSON.features.length > 0 && (
              <Source type="geojson" data={coverageGeoJSON}>
                <Layer {...coverageFillLayer} />
                <Layer {...coverageLineLayer} />
              </Source>
            )}

            {/* Heatmap Layer for Members */}
            {showHeatmap && memberGeoJSON.features.length > 0 && (
              <Source type="geojson" data={memberGeoJSON}>
                <Layer {...heatmapLayer} />
              </Source>
            )}
  
            {/* Central Church Marker */}
            {showChurch && (
              <Marker longitude={CHURCH_COORDS.lng} latitude={CHURCH_COORDS.lat} anchor="bottom">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    focusLocation(CHURCH_COORDS.lat, CHURCH_COORDS.lng);
                    setSelectedItem({
                      type: 'church',
                      data: {
                        name: 'Iglesia Jerusalén Central',
                        latitude: CHURCH_COORDS.lat,
                        longitude: CHURCH_COORDS.lng,
                        address: 'E25 y Av. 17 de Septiembre, Milagro, Ecuador',
                        description: 'Sede principal de la congregación de la Iglesia Jerusalén. Centro de adoración, comunión, discipulado y desarrollo de ministerios estratégicos.'
                      }
                    });
                  }}
                  className="w-11 h-11 bg-primary rounded-full border-2 border-gold shadow-xl shadow-gold/30 flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative z-10"
                >
                  <MapPin size={22} className="text-gold fill-gold/20" />
                  <div className="absolute top-12 bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded-xl shadow-xl text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    Iglesia Jerusalén Central
                  </div>
                </div>
              </Marker>
            )}
  
            {/* Cell Markers */}
            {showCells && cells.filter(c => c.latitude != null && c.longitude != null).map(cell => (
              <Marker key={cell.id} longitude={cell.longitude} latitude={cell.latitude} anchor="bottom">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    focusLocation(cell.latitude, cell.longitude);
                    setSelectedItem({ type: 'cell', data: cell });
                  }}
                  className="w-9 h-9 bg-white dark:bg-slate-900 rounded-full border-2 border-emerald-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative"
                >
                  <Compass size={16} className="text-emerald-600 animate-spin-slow" />
                  <div className="absolute top-10 bg-slate-900 border border-slate-850 text-[10px] p-2.5 rounded-xl shadow-xl text-slate-200 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 space-y-0.5 pointer-events-none">
                    <p className="font-bold text-white leading-none">{cell.name}</p>
                    <p className="text-[9px] text-slate-400">Sector: {cell.sector || 'General'}</p>
                    {cell.profiles && (
                      <p className="text-[9px] text-emerald-400 font-bold">Líder: {cell.profiles.first_name} {cell.profiles.last_name}</p>
                    )}
                  </div>
                </div>
              </Marker>
            ))}
  
            {/* Clustered & Unclustered Member Markers */}
            {showMembers && visiblePoints.map((point, idx) => {
              const [longitude, latitude] = point.geometry.coordinates;
              const { cluster, point_count: pointCount, member } = point.properties;

              if (cluster) {
                // Determine color and size of cluster based on members density
                let sizeClass = 'w-9 h-9 bg-blue-500/90 ring-4 ring-blue-500/35';
                if (pointCount > 50) {
                  sizeClass = 'w-12 h-12 bg-rose-600/95 ring-4 ring-rose-600/35';
                } else if (pointCount > 15) {
                  sizeClass = 'w-10 h-10 bg-amber-500/95 ring-4 ring-amber-500/35';
                }

                return (
                  <Marker
                    key={`cluster-${point.id || idx}`}
                    longitude={longitude}
                    latitude={latitude}
                    anchor="center"
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (superclusterInstance) {
                          try {
                            const nextZoom = superclusterInstance.getClusterExpansionZoom(point.properties.cluster_id);
                            const targetZoom = Math.min(Math.max(nextZoom, Math.ceil(viewState.zoom + 1)), 20);
                            mapRef.current?.flyTo({
                              center: [longitude, latitude],
                              zoom: targetZoom,
                              duration: 1000,
                              essential: true
                            });
                          } catch (err) {
                            console.error('Error expanding cluster:', err);
                            // Fallback zoom
                            mapRef.current?.flyTo({
                              center: [longitude, latitude],
                              zoom: Math.min(viewState.zoom + 2, 20),
                              duration: 1000,
                              essential: true
                            });
                          }
                        }
                      }}
                      className={`${sizeClass} rounded-full text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-110 select-none border border-white/20`}
                    >
                      {pointCount}
                    </div>
                  </Marker>
                );
              }

              // Unclustered Member marker
              return (
                <Marker
                  key={`member-${member.id}`}
                  longitude={longitude}
                  latitude={latitude}
                  anchor="bottom"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ type: 'member', data: member });
                      mapRef.current?.flyTo({
                        center: [longitude, latitude],
                        zoom: 16,
                        duration: 1000,
                        essential: true
                      });
                    }}
                    className="w-7.5 h-7.5 bg-white dark:bg-slate-900 rounded-full border-2 border-blue-500 dark:border-church-gold shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-120 group relative"
                  >
                    {member.photo_url ? (
                      <img 
                        src={member.photo_url} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover animate-fadeIn" 
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-church-gold-bright uppercase">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    )}
                    <div className="absolute top-7 bg-slate-900 border border-slate-850 text-[10px] p-2.5 rounded-xl shadow-xl text-slate-350 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      <p className="font-bold text-white">{member.first_name} {member.last_name}</p>
                      {member.phone && (
                        <p className="text-[9px] flex items-center gap-1 mt-0.5 text-emerald-400 font-semibold">
                          <Phone size={8} /> {member.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </Marker>
              );
            })}
  
            {/* Other Churches Locations Markers (Locations table) */}
            {showOtherChurches && locations.filter(l => l.lat != null && l.lng != null).map(loc => (
              <Marker key={loc.id} longitude={loc.lng} latitude={loc.lat} anchor="bottom">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    focusLocation(loc.lat, loc.lng);
                    setSelectedItem({ type: 'location', data: loc });
                  }}
                  className="w-9 h-9 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative"
                >
                  {loc.icon_type === 'emoji' ? (
                    <span className="text-lg">{loc.icon_value}</span>
                  ) : (
                    <div
                      className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-indigo-600"
                      dangerouslySetInnerHTML={{ __html: loc.icon_value }}
                    />
                  )}
                  <div className="absolute top-10 bg-slate-900 border border-slate-850 text-[10px] p-2 rounded-xl shadow-xl text-slate-200 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    <p className="font-bold text-white leading-none">{loc.name}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{loc.address_street || 'Sin dirección'}</p>
                  </div>
                </div>
              </Marker>
            ))}
          </Map>
  
          {/* Hint Overlay Banner */}
          <div className="absolute bottom-5 left-5 z-10 bg-white/90 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-semibold text-slate-600 dark:text-gray-400 select-none flex items-center gap-2 pointer-events-none shadow-lg backdrop-blur-xs">
            {isMeasuring ? (
              <span className="text-primary dark:text-church-gold-bright animate-pulse font-bold">Modo Medidor: Clic en el mapa para fijar puntos y calcular distancia</span>
            ) : isCreatingCell ? (
              <span className="text-emerald-600 dark:text-emerald-400 animate-pulse font-bold">Modo Célula: Clic en el mapa para ubicar la nueva célula</span>
            ) : (
              <span>Usa el buscador o arrastra el mapa para analizar las zonas geográficas</span>
            )}
          </div>

          {/* Sliding Details Sidebar Overlay */}
          {selectedItem && (
            <div className="absolute top-5 right-5 bottom-5 w-96 max-w-[calc(100vw-40px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-350 ease-out border-l border-slate-100 dark:border-white/5">
              {/* Header */}
              <div className="p-5 border-b border-slate-150 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:text-gray-450 border border-slate-200 dark:border-white/10">
                    {selectedItem.type === 'member' && 'Miembro de Iglesia'}
                    {selectedItem.type === 'cell' && 'Célula de Oración'}
                    {selectedItem.type === 'church' && 'Iglesia Jerusalén'}
                    {selectedItem.type === 'location' && 'Iglesia Filial'}
                  </span>
                  <h2 className="text-base font-serif font-bold text-primary dark:text-church-gold-bright mt-1">
                    Información Detallada
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {selectedItem.type === 'member' && renderMemberDetails(selectedItem.data)}
                {selectedItem.type === 'cell' && renderCellDetails(selectedItem.data)}
                {selectedItem.type === 'church' && renderChurchDetails(selectedItem.data)}
                {selectedItem.type === 'location' && renderLocationDetails(selectedItem.data)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StrategicMap;

