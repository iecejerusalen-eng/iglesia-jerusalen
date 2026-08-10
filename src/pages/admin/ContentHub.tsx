import { ArrowRight, Eye, Layers3, Radio, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import { ADMIN_MODULES, getAdminModulePermission } from '../../config/adminModules';
import { usePermissions } from '../../hooks/usePermissions';

const ContentHub = () => {
  const { hasPermission } = usePermissions();
  const tools = ADMIN_MODULES.filter((module) => (
    module.group === 'contenido'
    && module.id !== 'content_hub'
    && module.available !== false
    && hasPermission(getAdminModulePermission(module), 'view')
  ));

  return (
    <div className="space-y-6">
      <AdminHeader
        eyebrow="Contenido y comunicación"
        title="Centro de contenido"
        description="Un punto de partida para mantener el sitio, atender mensajes y coordinar lo que la iglesia publica cada semana."
        action={(
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-gold/40 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <Eye size={17} /> Ver sitio público
          </a>
        )}
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="Flujo editorial recomendado">
        {[
          { icon: Layers3, title: '1. Organiza', text: 'Actualiza páginas, ministerios y publicaciones desde sus editores.' },
          { icon: Radio, title: '2. Comunica', text: 'Programa eventos, horarios, sermones y notificaciones.' },
          { icon: Sparkles, title: '3. Revisa', text: 'Previsualiza el resultado público y atiende el buzón de contacto.' },
        ].map((step) => (
          <article key={step.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <step.icon className="text-gold" size={21} aria-hidden="true" />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{step.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
        <div className="mb-5">
          <h2 className="font-serif text-xl font-bold text-primary dark:text-white">Herramientas disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">Solo aparecen las herramientas autorizadas para tu rol.</p>
        </div>
        {tools.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <tool.icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-slate-900 dark:text-white">{tool.name}</strong>
                  <span className="mt-1 block line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{tool.label}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-gold" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div role="status" className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/15">
            Tu rol todavía no tiene herramientas de contenido asignadas.
          </div>
        )}
      </section>
    </div>
  );
};

export default ContentHub;
