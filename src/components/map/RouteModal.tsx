import React from 'react';
import { ChurchRouteMap, type RoutePoint } from './ChurchRouteMap';
import { X } from 'lucide-react';

export interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: RoutePoint;
  origin?: RoutePoint;
  title?: string;
}

export function RouteModal({
  isOpen,
  onClose,
  destination,
  origin,
  title,
}: RouteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-card rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground border shadow-lg hover:bg-muted hover:scale-105 transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Body with Route Map */}
        <div className="flex-1 overflow-y-auto">
          <ChurchRouteMap
            destination={destination}
            initialOrigin={origin}
            height="560px"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
