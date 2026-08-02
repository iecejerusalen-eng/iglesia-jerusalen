import React from 'react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const AdminHeader = ({ title, description, action }: AdminHeaderProps) => {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-gray-150 pb-4 dark:border-white/10 sm:mb-6 md:flex-row md:items-end md:justify-between md:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-serif font-bold tracking-tight text-primary dark:text-church-gold-bright sm:text-2xl md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-500 sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="w-full flex-shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminHeader);
