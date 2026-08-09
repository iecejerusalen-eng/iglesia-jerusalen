import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import type { Ministry } from '../../../types';
import type { EditorialSpace } from '../../../features/editorial/types';

export default function MinistryEditorial({ ministry, canEdit }: { ministry: Ministry; canEdit: boolean }) {
  const [space, setSpace] = useState<EditorialSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.from('editorial_spaces').select('*').eq('ministry_id', ministry.id).maybeSingle().then(({ data, error }) => {
      if (error) { console.error('No se pudo consultar el blog del ministerio.', error); }
      if (active) { setSpace(data as EditorialSpace | null); setLoading(false); }
    });
    return () => { active = false; };
  }, [ministry.id]);
  const create = async () => {
    setCreating(true);
    const { data, error } = await supabase.from('editorial_spaces').insert({
      slug: `ministerio-${ministry.slug}`, name: `Publicaciones de ${ministry.name}`,
      description: `Noticias, recursos, testimonios y páginas del ${ministry.name}.`, owner_type: 'ministry',
      ministry_id: ministry.id, cover_image_url: ministry.image_url, accent_color: ministry.theme_color || '#C99A49', is_published: false,
    }).select('*').single();
    setCreating(false);
    if (error) { console.error('No se creó el blog del ministerio.', error); toast.error('No se pudo crear el espacio editorial.'); return; }
    setSpace(data as EditorialSpace); toast.success('Espacio editorial creado como borrador.');
  };
  if (loading) return <div className="h-52 animate-pulse rounded-3xl bg-slate-100 dark:bg-white/5" />;
  if (space) return <div className="grid gap-5 lg:grid-cols-[1fr_20rem]"><section className="rounded-3xl border border-slate-200 bg-white/70 p-7 dark:border-white/10 dark:bg-white/5"><BookOpen className="text-blue-700 dark:text-amber-300" size={30} /><h2 className="mt-5 font-serif text-2xl font-bold">{space.name}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{space.description}</p><div className="mt-6 flex flex-wrap gap-3"><Link to={`/admin/publicaciones/${space.id}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white">Abrir editor <ArrowRight size={16} /></Link>{space.is_published && <Link to={`/publicaciones/${space.slug}`} target="_blank" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Ver página pública</Link>}</div></section><aside className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"><ShieldCheck /><h3 className="mt-4 font-bold">Autonomía con límites</h3><p className="mt-2 text-xs leading-5">Los responsables autorizados pueden escribir y moderar este ministerio sin acceder a publicaciones de otros equipos.</p></aside></div>;
  return <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15"><BookOpen className="mx-auto text-slate-400" size={36} /><h2 className="mt-4 font-serif text-2xl font-bold">Crea el blog de este ministerio</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Puede incluir páginas, subpáginas, noticias, testimonios, recursos internos, contraseña y varios editores.</p>{canEdit && <button onClick={() => void create()} disabled={creating} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> {creating ? 'Creando…' : 'Crear como borrador'}</button>}</div>;
}
