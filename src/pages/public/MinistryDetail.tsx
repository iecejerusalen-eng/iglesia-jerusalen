import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import { fadeInUp } from '../../utils/animations';
import BlockRenderer from '../../components/public/BlockRenderer';

const MinistryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ministry, setMinistry] = useState<any | null>(null);
  const [logos, setLogos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la visualización de miembros en Cuerpo de Apoyo y Directiva
  const [members, setMembers] = useState<any[]>([]);
  const [directiva, setDirectiva] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    const fetchMinistryDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: apiError } = await supabase
          .from('ministries')
          .select('*')
          .eq('slug', slug)
          .single();

        if (apiError) {
          throw apiError;
        }

        if (data) {
          setMinistry(data);
          
          // Fetch logos for this ministry
          const { data: logosData, error: logosError } = await supabase
            .from('logos')
            .select('*')
            .eq('ministry_id', data.id);
          
          if (!logosError && logosData) {
            setLogos(logosData);
          }

          // Fetch directiva members
          const { data: directivaData, error: directivaError } = await supabase
            .from('ministry_members')
            .select(`
              id, role, member_id, member_name,
              members (
                id, first_name, last_name, photo_url, phone, phone_country_code
              )
            `)
            .eq('ministry_id', data.id);
          
          if (!directivaError && directivaData) {
            const roleOrder = [
              'pastor', 'coordinador', 'coordinadora', 'subcoordinador', 'sub-coordinador', 'sub-coordinadora',
              'secretaria', 'secretario', 'tesorera', 'tesorero', 'vocal', 'vocal 1', 'vocal 2', 'vocal 3'
            ];
            const sortedDirectiva = [...directivaData].sort((a, b) => {
              const roleA = a.role.toLowerCase();
              const roleB = b.role.toLowerCase();
              const idxA = roleOrder.findIndex(r => roleA.includes(r));
              const idxB = roleOrder.findIndex(r => roleB.includes(r));
              const valA = idxA === -1 ? 99 : idxA;
              const valB = idxB === -1 ? 99 : idxB;
              return valA - valB;
            });
            setDirectiva(sortedDirectiva);
          }

          // Fetch members if it is Cuerpo de Apoyo
          if (data.slug === 'cuerpo-de-apoyo') {
            setLoadingMembers(true);
            const { data: membersData, error: membersError } = await supabase
              .from('members')
              .select('id, first_name, last_name, photo_url, is_leader, leadership_role')
              .is('deleted_at', null)
              .order('last_name', { ascending: true });
            
            if (!membersError && membersData) {
              setMembers(membersData);
            } else if (membersError) {
              console.error('Error al cargar miembros para cuerpo de apoyo:', membersError.message);
            }
            setLoadingMembers(false);
          }
        } else {
          setError('No se encontró el ministerio');
        }
      } catch (err: any) {
        console.error('Error fetching ministry details:', err);
        setError(err.message || 'Error al cargar los detalles del ministerio');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchMinistryDetail();
    }
  }, [slug]);

  const filteredMembers = members.filter(m => {
    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    return fullName.includes(memberSearch.toLowerCase());
  });


  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm font-medium">Cargando detalles del ministerio...</p>
      </div>
    );
  }

  if (error || !ministry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-serif font-bold text-3xl text-primary dark:text-white">Ministerio No Encontrado</h2>
        <p className="text-gray-550 dark:text-gray-400 max-w-md mx-auto">
          Lo sentimos, el ministerio que buscas no existe o ha sido modificado.
        </p>
        <Link 
          to="/ministerios"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs"
        >
          <ArrowLeft size={16} />
          Volver a Ministerios
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8"
    >
      {/* Botón Volver */}
      <Link 
        to="/ministerios"
        style={{ color: ministry.theme_color || '#1E3A8A' }}
        className="inline-flex items-center gap-2 text-sm hover:opacity-80 font-semibold transition-opacity"
      >
        <ArrowLeft size={16} />
        Volver a Ministerios
      </Link>

      {/* CABECERA INMERSIVA */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl text-white min-h-[300px] md:min-h-[380px] flex flex-col justify-end">
        {/* Imagen de Fondo o Degradado */}
        {ministry.image_url ? (
          <>
            <img 
              src={ministry.image_url} 
              alt={ministry.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Capa oscura para contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          </>
        ) : (
          <div 
            style={{ background: `linear-gradient(135deg, ${ministry.theme_color || '#1E3A8A'}, #0b1329)` }}
            className="absolute inset-0" 
          />
        )}

        {/* Contenido Cabecera */}
        <div className="relative z-10 p-6 md:p-12 space-y-6 max-w-4xl">
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {ministry.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight drop-shadow-md">
            {ministry.name}
          </h1>

          {/* Información del Líder y Horarios */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-white/20 text-sm font-light">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <User size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Líder o Responsable</p>
                <p className="font-semibold text-gray-100">{ministry.leader_name || 'No asignado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Calendar size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Horario de Reunión</p>
                <p className="font-semibold text-gray-100">{ministry.schedule || 'No especificado'}</p>
              </div>
            </div>

            {ministry.anniversary_date && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm">
                  🎂
                </div>
                <div>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Aniversario</p>
                  <p className="font-semibold text-gray-100">
                    {(() => {
                      try {
                        const [year, month, day] = ministry.anniversary_date.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long'
                        });
                      } catch (e) {
                        return ministry.anniversary_date;
                      }
                    })()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO DETALLADO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 p-8 md:p-12 shadow-xs">
        <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
          Sobre el Ministerio
        </h2>
        {ministry.content_blocks && Array.isArray(ministry.content_blocks) && ministry.content_blocks.length > 0 ? (
          <BlockRenderer blocks={ministry.content_blocks} />
        ) : (
          <div 
            className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ministry.description || '') }}
          />
        )}
      </div>

      {/* SECCIÓN DIRECTIVA */}
      {directiva && directiva.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 p-8 md:p-12 shadow-xs space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">
              Directiva y Liderazgo
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Equipo de líderes y servidores encargados de guiar este departamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {directiva.map((member) => {
              const name = member.members ? `${member.members.first_name} ${member.members.last_name}` : member.member_name;
              const photoUrl = member.members?.photo_url;
              
              return (
                <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-105 dark:border-slate-800/80 hover:shadow-md transition-shadow">
                  {/* Photo or Initials */}
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white dark:border-slate-800 shadow-sm bg-primary/10 text-primary dark:text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">
                      {member.role}
                    </span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs truncate leading-tight">
                      {name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN MIEMBROS (Si es Cuerpo de Apoyo) */}
      {ministry.slug === 'cuerpo-de-apoyo' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 p-8 md:p-12 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">Miembros de la Congregación</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Directorio de miembros activos y colaboradores del Cuerpo de Apoyo.</p>
            </div>
            
            {/* Buscador */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full md:w-80 shadow-2xs">
              <span className="text-gray-400 dark:text-gray-500 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar miembro..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none text-gray-700 dark:text-white font-semibold"
              />
            </div>
          </div>

          {loadingMembers ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-550 dark:text-gray-400 text-xs mt-2 font-medium">Cargando directorio de miembros...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <p className="text-gray-400 text-sm font-medium">No se encontraron miembros con ese nombre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center text-center p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                  {/* Foto o Iniciales */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm bg-primary/10 text-primary dark:text-white flex items-center justify-center font-bold text-xl mb-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={`${member.first_name} ${member.last_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.first_name?.[0] || ''}{member.last_name?.[0] || ''}</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100 text-xs line-clamp-1 leading-tight">
                    {member.first_name} {member.last_name}
                  </span>
                  {member.is_leader ? (
                    <span className="mt-1.5 px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/25 text-[9px] font-extrabold uppercase tracking-wider">
                      {member.leadership_role || 'Líder'}
                    </span>
                  ) : (
                    <span className="mt-1.5 text-gray-400 text-[10px] font-semibold">
                      Colaborador
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN UNIRSE */}
      <div className="bg-gray-50/40 dark:bg-slate-800/40 rounded-2xl border border-gray-150 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 
            style={{ color: ministry.theme_color || '#1E3A8A' }}
            className="font-serif font-bold text-xl flex items-center gap-2 justify-center md:justify-start"
          >
            <Users size={20} />
            ¿Quieres ser parte de {ministry.name}?
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
            Si deseas unirte como colaborador o participar de este grupo, ¡nos encantaría recibirte!
          </p>
        </div>
        <Link 
          to="/contacto"
          style={{ backgroundColor: ministry.theme_color || '#1E3A8A' }}
          className="px-6 py-2.5 hover:opacity-95 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs inline-block"
        >
          Contactar Líder
        </Link>
      </div>

      {/* SECCIÓN IDENTIDAD VISUAL / LOGOS */}
      {logos && logos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-850 p-8 md:p-12 shadow-xs space-y-6">
          <div>
            <h2 
              style={{ color: ministry.theme_color || '#1E3A8A' }}
              className="text-2xl font-serif font-bold border-b border-gray-100 dark:border-slate-800 pb-4"
            >
              Nuestros Logos
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-medium">
              Recursos gráficos oficiales de {ministry.name} para comunicados, flyers y material de difusión.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {logos.map((logo) => {
              const publicUrl = supabase.storage.from('logos').getPublicUrl(logo.storage_path).data.publicUrl;
              const isRenderable = ['png', 'svg', 'webp', 'jpg', 'jpeg'].includes(logo.format.toLowerCase());
              
              const colorModeLabels: any = {
                color: 'Full Color',
                blanco_y_negro: 'Blanco y Negro',
                blanco_solido: 'Blanco Sólido',
                negro_solido: 'Negro Sólido'
              };

              const variantLabels: any = {
                cuadrado: 'Cuadrado (1:1)',
                circular: 'Circular',
                vertical: 'Vertical / Apilado',
                horizontal: 'Horizontal'
              };

              return (
                <div key={logo.id} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900/50 flex flex-col items-center justify-between p-4 group hover:shadow-md transition-shadow relative">
                  <div className="h-32 w-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl p-4 overflow-hidden">
                    {isRenderable ? (
                      <img 
                        src={publicUrl} 
                        alt={`${ministry.name} logo`} 
                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <span className="text-lg font-bold block uppercase">{logo.format}</span>
                        <span className="text-[10px]">Archivo Vectorial</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 w-full space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                        {variantLabels[logo.variant]}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                        {colorModeLabels[logo.color_mode]}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[9px] font-mono font-bold uppercase">
                        {logo.format}
                      </span>
                    </div>
                  </div>

                  {/* Floating download button on hover */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <a
                      href={publicUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: ministry.theme_color || '#1E3A8A' }}
                      className="text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:opacity-90 transition-opacity"
                    >
                      Descargar archivo
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default MinistryDetail;
