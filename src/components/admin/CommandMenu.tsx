import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { 
  Search, Users, Video, DollarSign, 
  ShoppingBag, Map, PlusCircle, X, 
  Phone, Calendar, Award, Heart, Globe, BarChart3, Bell
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { formatWhatsAppLink } from '../../utils/whatsapp';

// Custom inline CSS for cmdk to avoid imports issues
const cmdkStyles = `
  [cmdk-root] {
    max-width: 640px;
    width: 100%;
    background: #0f172a;
    border-radius: 16px;
    padding: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: inherit;
    overflow: hidden;
  }
  [cmdk-input] {
    font-family: inherit;
    width: 100%;
    font-size: 14px;
    padding: 12px;
    outline: none;
    border: none;
    background: transparent;
    color: #f1f5f9;
  }
  [cmdk-input]::placeholder {
    color: #64748b;
  }
  [cmdk-item] {
    content-visibility: auto;
    cursor: pointer;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    color: #94a3b8;
    user-select: none;
    transition: all 150ms ease;
  }
  [cmdk-item][data-selected='true'] {
    background: rgba(255, 255, 255, 0.08);
    color: #f8fafc;
  }
  [cmdk-group-heading] {
    user-select: none;
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    padding: 8px 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  [cmdk-empty] {
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    color: #64748b;
  }
`;

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const navigate = useNavigate();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch members when palette is opened
  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    try {
      const { data } = await supabase
        .from('members')
        .select('*, member_emails(email)')
        .is('deleted_at', null)
        .order('last_name', { ascending: true });
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching cmdk members:', err);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  // Format birth date to readable format
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No registrada';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <style>{cmdkStyles}</style>

      {/* COMMAND PALETTE POPUP */}
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-2xl"
          >
            <Command label="Menú de comandos de administración">
              <div className="flex items-center border-b border-slate-800 px-3">
                <Search size={18} className="text-slate-500 shrink-0" />
                <Command.Input 
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Escribe un comando o busca un miembro..." 
                />
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg text-xs font-semibold font-mono border border-slate-800 bg-slate-900/50 cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <Command.List className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
                <Command.Empty>No se encontraron resultados.</Command.Empty>

                <Command.Group heading="Navegación del Panel">
                  <Command.Item onSelect={() => handleNavigation('/admin')}>
                    <Users size={16} />
                    <span>Ir al Inicio (Dashboard)</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/analisis')}>
                    <BarChart3 size={16} className="text-indigo-400" />
                    <span>Análisis y Métricas (Analytics)</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/notificaciones')}>
                    <Bell size={16} className="text-rose-400" />
                    <span>Notificaciones y WhatsApp</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/miembros')}>
                    <Users size={16} className="text-blue-400" />
                    <span>Miembros de la Iglesia (CRM)</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/sermones')}>
                    <Video size={16} className="text-purple-400" />
                    <span>Prédicas y Sermones</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/finanzas')}>
                    <DollarSign size={16} className="text-green-400" />
                    <span>Finanzas y Recaudación</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/tienda')}>
                    <ShoppingBag size={16} className="text-amber-400" />
                    <span>Catálogo de Tienda</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/paginas')}>
                    <Globe size={16} className="text-cyan-400" />
                    <span>Editor de Páginas (Inicio / Nosotros)</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/mapa-estrategico')}>
                    <Map size={16} className="text-emerald-400" />
                    <span>Mapa Estratégico y Zonas</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Acciones Rápidas">
                  <Command.Item onSelect={() => handleNavigation('/admin/miembros')}>
                    <PlusCircle size={16} className="text-blue-500" />
                    <span>Registrar Nuevo Miembro</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/finanzas')}>
                    <PlusCircle size={16} className="text-green-500" />
                    <span>Registrar Nueva Donación</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleNavigation('/admin/tienda')}>
                    <PlusCircle size={16} className="text-amber-500" />
                    <span>Registrar Nuevo Producto</span>
                  </Command.Item>
                </Command.Group>

                {members.length > 0 && (
                  <Command.Group heading="Buscador de Miembros">
                    {members.map((member) => (
                      <Command.Item 
                        key={member.id} 
                        value={`${member.first_name} ${member.last_name} ${member.dni || ''}`}
                        onSelect={() => {
                          setSelectedMember(member);
                          setOpen(false);
                        }}
                      >
                        {member.photo_url ? (
                          <img src={member.photo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 bg-slate-800 text-[10px] font-bold text-slate-350 rounded-full flex items-center justify-center shrink-0">
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1 truncate">
                          <span className="font-bold text-slate-200">{member.first_name} {member.last_name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">DNI: {member.dni || 'S/C'}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL DIALOG (Opened from cmdk) */}
      <AnimatePresence>
        {selectedMember && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
            onClick={() => setSelectedMember(null)}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative text-left animate-scale-in"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-800">
                {selectedMember.photo_url ? (
                  <img 
                    src={selectedMember.photo_url} 
                    alt="" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-gold shadow-md" 
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center font-bold text-2xl border border-blue-800">
                    {selectedMember.first_name[0]}{selectedMember.last_name[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-bold text-lg text-white leading-tight">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </h3>
                  <span className="text-xs text-slate-400 block font-semibold mt-0.5">DNI: {selectedMember.dni || 'No registrado'}</span>
                </div>

                <div className="flex gap-2">
                  {selectedMember.phone && (
                    <a
                      href={formatWhatsAppLink(selectedMember.phone, selectedMember.phone_country_code, `Hola ${selectedMember.first_name}, te saludamos de la Iglesia Jerusalén...`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone size={12} />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      navigate('/admin/miembros');
                    }}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Ver Ficha CRM
                  </button>
                </div>
              </div>

              <div className="py-4 space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <Calendar size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Fecha de Nacimiento</span>
                    <span className="text-slate-200 font-bold">{formatDate(selectedMember.birth_date)}</span>
                  </div>
                </div>

                {selectedMember.address && (
                  <div className="flex items-start gap-2.5">
                    <Map size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block font-semibold">Dirección de Domicilio</span>
                      <span className="text-slate-200 font-semibold">{selectedMember.address}</span>
                      {selectedMember.maps_link && (
                        <a 
                          href={selectedMember.maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline block font-bold mt-0.5"
                        >
                          Ver en Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-850">
                  <Heart size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block font-semibold">Hitos Espirituales</span>
                    <span className="text-slate-200 block font-semibold">Conversión: {formatDate(selectedMember.conversion_date)}</span>
                    <span className="text-slate-200 block font-semibold">Bautismo: {formatDate(selectedMember.baptism_date)}</span>
                  </div>
                </div>

                {selectedMember.is_leader && (
                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-850">
                    <Award size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block font-semibold">Rol de Liderazgo</span>
                      <span className="px-2 py-0.5 bg-gold/15 text-gold border border-gold/20 rounded-full font-bold inline-block mt-0.5">
                        {selectedMember.leadership_role || 'Líder'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
