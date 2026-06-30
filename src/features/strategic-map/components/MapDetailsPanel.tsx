import { Phone, MapPin, Calendar, Crosshair, Users, Compass, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { Member, Cell } from '../../../types';
import { formatWhatsAppLink } from '../../../utils/whatsapp';

interface MapDetailsPanelProps {
  selectedItem: {
    type: 'member' | 'cell' | 'church' | 'location';
    data: any;
  };
  onClose: () => void;
  onFocusLocation: (lat: number, lng: number) => void;
}

export const MapDetailsPanel = ({ selectedItem, onClose, onFocusLocation }: MapDetailsPanelProps) => {
  const renderMemberDetails = (member: Member) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {member.photo_url ? (
            <img loading="lazy" 
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
            onClick={() => onFocusLocation(Number(member.latitude), Number(member.longitude))}
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
          onClick={() => onFocusLocation(cell.latitude, cell.longitude)}
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
          onClick={() => onFocusLocation(church.latitude, church.longitude)}
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
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(loc.icon_value, { USE_PROFILES: { svg: true } }) }}
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
          onClick={() => onFocusLocation(loc.lat, loc.lng)}
          className="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <Crosshair size={14} /> Centrar en el Mapa
        </button>
      </div>
    );
  };

  return (
    <div className="absolute top-5 right-5 bottom-5 w-96 max-w-[calc(100vw-40px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-350 ease-out border-l border-slate-100 dark:border-white/5">
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
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {selectedItem.type === 'member' && renderMemberDetails(selectedItem.data)}
        {selectedItem.type === 'cell' && renderCellDetails(selectedItem.data)}
        {selectedItem.type === 'church' && renderChurchDetails(selectedItem.data)}
        {selectedItem.type === 'location' && renderLocationDetails(selectedItem.data)}
      </div>
    </div>
  );
};
