import React from 'react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const AdminHeader = ({ title, description, action }: AdminHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-church-gold-bright">
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
