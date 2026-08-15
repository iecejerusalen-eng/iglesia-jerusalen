import type { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface AdminStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

const AdminState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: AdminStateProps) => (
  <section
    className={`rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 ${className}`}
  >
    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
      {icon ?? <Inbox size={22} />}
    </div>
    <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
    {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
    {actionLabel && onAction && (
      <Button type="button" variant="outline" className="mt-5" onClick={onAction}>
        <RefreshCw size={15} />
        {actionLabel}
      </Button>
    )}
  </section>
);

interface AdminErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminErrorState = ({
  title = 'No pudimos cargar esta información',
  description = 'Comprueba tu conexión y vuelve a intentarlo. Si el problema continúa, revisa los permisos de este módulo.',
  actionLabel = 'Reintentar',
  onAction,
}: AdminErrorStateProps) => (
  <AdminState
    title={title}
    description={description}
    actionLabel={actionLabel}
    onAction={onAction}
    icon={<AlertCircle size={22} />}
    className="border-rose-200/80 dark:border-rose-400/20"
  />
);

export default AdminState;
