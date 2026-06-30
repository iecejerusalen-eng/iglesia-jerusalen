import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Search, Loader2 } from 'lucide-react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';

interface MapPickerModalProps {
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}

export const MapPickerModal = ({ initialLat, initialLng, onClose, onConfirm }: MapPickerModalProps) => {
  const [pickerCoords, setPickerCoords] = useState({ lat: initialLat, lng: initialLng });
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalGeocoding, setModalGeocoding] = useState(false);
  const modalMapRef = useRef<MapRef | null>(null);

  // When component mounts or initial coords change, update local state
  useEffect(() => {
    setPickerCoords({ lat: initialLat, lng: initialLng });
  }, [initialLat, initialLng]);

  const handleModalSearch = async () => {
    if (!modalSearchQuery.trim()) return;
    setModalGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(modalSearchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        setPickerCoords({ lat, lng: lon });
        modalMapRef.current?.flyTo({
          center: [lon, lat],
          zoom: 16,
          duration: 1000
        });
      } else {
        toast.error('No se encontró esa ubicación en la búsqueda.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al realizar la búsqueda en el mapa.');
    } finally {
      setModalGeocoding(false);
    }
  };

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    setPickerCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[520px] animate-scale-in relative text-left">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-white/10 flex-shrink-0">
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5 font-serif">
            <MapPin className="text-gold animate-bounce" size={18} />
            Ubicar Domicilio en el Mapa
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
          <div className="flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleModalSearch() }}
              placeholder="Busca una calle, barrio o ciudad..."
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs font-semibold"
            />
            <button
              type="button"
              onClick={handleModalSearch}
              disabled={modalGeocoding}
              className="px-3.5 bg-primary hover:bg-blue-800 disabled:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-primary/15"
            >
              {modalGeocoding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Search size={14} />
                  Buscar
                </>
              )}
            </button>
          </div>

          <div className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 relative overflow-hidden shadow-2xs">
            <Map
              ref={modalMapRef}
              initialViewState={{
                longitude: pickerCoords.lng,
                latitude: pickerCoords.lat,
                zoom: 15
              }}
              mapStyle="https://tiles.openfreemap.org/styles/bright"
              style={{ width: '100%', height: '100%' }}
              onClick={handleMapClick}
            >
              <NavigationControl position="bottom-right" showCompass={false} />
              
              <Marker
                longitude={pickerCoords.lng}
                latitude={pickerCoords.lat}
                anchor="bottom"
                draggable
                onDragEnd={(e) => setPickerCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
              >
                <div className="cursor-grab active:cursor-grabbing flex flex-col items-center">
                  <div className="bg-slate-900 border border-slate-800 text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-xl whitespace-nowrap mb-1 font-sans">
                    Arrastra el pin
                  </div>
                  <MapPin size={32} className="text-accent-red fill-accent-red/20 drop-shadow-md" />
                </div>
              </Marker>
            </Map>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-450 font-semibold leading-normal flex items-start gap-1 flex-shrink-0">
            <span className="text-gold">💡</span>
            <span>Puedes escribir en el buscador, hacer clic en cualquier punto del mapa para mover el pin o arrastrar el pin rojo directamente.</span>
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-150 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-gray-500 dark:text-gray-455 font-semibold font-mono">
            Coords: <span className="text-primary dark:text-church-gold-bright font-bold">{pickerCoords.lat.toFixed(6)}, {pickerCoords.lng.toFixed(6)}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(pickerCoords.lat, pickerCoords.lng)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-600/10"
            >
              Confirmar Ubicación
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
