import React from 'react';
import { ChurchRouteMap, type RoutePoint } from './ChurchRouteMap';
import { X, Navigation, MapPin } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight text-foreground">
                {title || `Cómo llegar a ${destination.name}`}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-rose-500" />
                <span>{destination.address || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body with Route Map */}
        <div className="flex-1 overflow-y-auto p-4">
          <ChurchRouteMap
            destination={destination}
            initialOrigin={origin}
            height="500px"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
