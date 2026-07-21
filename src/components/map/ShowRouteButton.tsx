import React, { useState } from 'react';
import { RouteModal } from './RouteModal';
import type { RoutePoint } from './ChurchRouteMap';
import { Navigation, MapPin } from 'lucide-react';

export interface ShowRouteButtonProps {
  destination: RoutePoint;
  origin?: RoutePoint;
  title?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function ShowRouteButton({
  destination,
  origin,
  title,
  variant = 'default',
  size = 'sm',
  className = '',
  label = 'Mostrar Ruta',
}: ShowRouteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all shadow-xs cursor-pointer active:scale-95';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5 font-semibold',
  };

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
    link: 'text-primary underline-offset-4 hover:underline p-0 shadow-none',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      >
        <Navigation className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        <span>{label}</span>
      </button>

      <RouteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        destination={destination}
        origin={origin}
        title={title}
      />
    </>
  );
}
