import { useState } from 'react';
import { BookOpen, Check, Loader2, ShoppingBag, Sparkles, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useSiteFeatureVisibilityStore, type SiteFeatureKey } from '../../../../store/useSiteFeatureVisibilityStore';

const FEATURES: { id: SiteFeatureKey; title: string; description: string; icon: typeof ShoppingBag }[] = [
  { id: 'store', title: 'Tienda pública', description: 'Muestra la tienda y el carrito en el sitio público.', icon: ShoppingBag },
  { id: 'classroom', title: 'Aula Virtual pública', description: 'Muestra el acceso público de presentación del Aula Virtual.', icon: BookOpen },
  { id: 'adminOnboarding', title: 'Onboarding del panel', description: 'Activa la guía inicial y el checklist del equipo administrativo.', icon: Sparkles },
  { id: 'toolbox', title: 'Toolbox global', description: 'Muestra el lanzador de herramientas en las páginas del sitio.', icon: Wrench },
];

export default function VisibilityTab() {
  const visibility = useSiteFeatureVisibilityStore((state) => state.visibility);
  const isLoaded = useSiteFeatureVisibilityStore((state) => state.isLoaded);
  const setFeature = useSiteFeatureVisibilityStore((state) => state.setFeature);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('settings', 'edit');
  const [saving, setSaving] = useState<SiteFeatureKey | null>(null);

  const toggle = async (id: SiteFeatureKey, enabled: boolean) => {
    if (!canEdit || saving) return;
    setSaving(id);
    try {
      await setFeature(id, enabled);
      const search = await import('../../../../features/search/services/searchIndexService');
      search.invalidateSearchIndexCache();
      toast.success(enabled ? 'Herramienta habilitada.' : 'Herramienta oculta.');
    } catch (error) {
      console.error('No se pudo guardar la visibilidad de la herramienta.', error);
      toast.error('No se pudo guardar el cambio. Revisa tu permiso de configuración.');
    } finally {
      setSaving(null);
    }
  };

  return <section aria-labelledby="visibility-title" className="space-y-5">
    <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-400/10">
      <h2 id="visibility-title" className="font-serif text-xl font-bold text-slate-900 dark:text-white">Herramientas y secciones visibles</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Oculta temporalmente una sección mientras la preparas. Puedes volver a habilitarla aquí cuando esté lista.</p>
      {!canEdit && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Tu perfil puede consultar estos ajustes, pero necesita permiso de edición para cambiarlos.</p>}
    </div>
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-slate-950/40">
      {FEATURES.map(({ id, title, description, icon: Icon }) => {
        const enabled = visibility[id];
        const isSaving = saving === id;
        return <div key={id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-blue-400/10 dark:text-blue-300"><Icon size={19} /></span>
            <div><h3 className="font-bold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p></div>
          </div>
          <button type="button" role="switch" aria-checked={enabled} aria-label={`${enabled ? 'Ocultar' : 'Habilitar'} ${title}`} disabled={!isLoaded || !canEdit || saving !== null} onClick={() => void toggle(id, !enabled)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`grid size-5 place-items-center rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}>{isSaving ? <Loader2 size={12} className="animate-spin text-slate-500" /> : enabled ? <Check size={12} className="text-emerald-700" /> : null}</span>
          </button>
        </div>;
      })}
    </div>
  </section>;
}
