import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}

const AdminHeader = ({ title, description, action, eyebrow = 'Panel administrativo' }: AdminHeaderProps) => {
  return (
    <header className="relative mb-5 overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/75 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 sm:mb-6 sm:p-5 md:flex md:items-center md:justify-between md:gap-5 md:rounded-3xl md:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative min-w-0">
        <p className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-gold sm:text-[10px]">
          <ShieldCheck size={13} />
          {eyebrow}
        </p>
        <h1 className="font-sans text-xl font-bold tracking-tight text-primary dark:text-church-gold-bright sm:text-2xl md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-500 sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="relative mt-4 w-full flex-shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto md:mt-0">
          {action}
        </div>
      )}
    </header>
  );
};

export default React.memo(AdminHeader);
