/* eslint-disable react-refresh/only-export-components */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import createGlobe, { type COBEOptions } from "cobe";
import { useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 1200;

export interface GlobeMarker {
  location: [number, number]; // [lat, lng]
  size: number;
  label?: string;
  id?: string;
}

export const DEFAULT_GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [239 / 255, 68 / 255, 68 / 255],
  glowColor: [1, 1, 1],
  markers: [],
};

export interface GlobeProps {
  className?: string;
  config?: COBEOptions;
  interactive?: boolean;
  focusCoords?: [number, number] | null; // [lat, lng]
  onSelectLocation?: (location: { lat: number; lng: number; index: number }) => void;
}

export function Globe({
  className,
  config = DEFAULT_GLOBE_CONFIG,
  interactive = true,
  focusCoords = null,
  onSelectLocation,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionMovement = useRef({ x: 0, y: 0 });
  const widthRef = useRef(0);

  // Motion values for smooth rotation physics
  const rX = useMotionValue(config.phi || 0);
  const rY = useMotionValue(config.theta || 0.2);

  const springX = useSpring(rX, { mass: 1, damping: 35, stiffness: 120 });
  const springY = useSpring(rY, { mass: 1, damping: 35, stiffness: 120 });

  // Convert lat, lng to phi, theta for COBE globe
  const convertLocationToAngles = useCallback((lat: number, lng: number) => {
    // COBE phi angle mapping
    const phi = (lng * Math.PI) / 180;
    const theta = (lat * Math.PI) / 180;
    return { phi: -phi + Math.PI / 2, theta };
  }, []);

  // Update target focus when focusCoords change
  useEffect(() => {
    if (focusCoords) {
      const [lat, lng] = focusCoords;
      const { phi, theta } = convertLocationToAngles(lat, lng);
      rX.set(phi);
      rY.set(theta);
    }
  }, [focusCoords, convertLocationToAngles, rX, rY]);

  // Pointer Interaction Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!interactive) return;
    pointerInteracting.current = { x: clientX, y: clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerUp = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (pointerInteracting.current !== null && interactive) {
      const deltaX = clientX - pointerInteracting.current.x;
      const deltaY = clientY - pointerInteracting.current.y;

      pointerInteracting.current = { x: clientX, y: clientY };

      // Update motion values
      rX.set(rX.get() + deltaX / MOVEMENT_DAMPING);
      
      // Clamp vertical theta between -0.8 and 0.8 radians to prevent flip
      const newTheta = Math.max(-0.8, Math.min(0.8, rY.get() - deltaY / MOVEMENT_DAMPING));
      rY.set(newTheta);
    }
  };

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    let phiAccumulator = config.phi || 0;

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: (state) => {
        // Auto slow rotation if user is not dragging and no focus point active
        if (!pointerInteracting.current && !focusCoords) {
          phiAccumulator += 0.003;
          state.phi = phiAccumulator + springX.get();
        } else {
          phiAccumulator = 0;
          state.phi = springX.get();
        }

        state.theta = springY.get();
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
      },
    });

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    }, 0);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [springX, springY, config, focusCoords]);

  return (
    <div className={cn("relative aspect-square w-full select-none", className)}>
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 cursor-grab active:cursor-grabbing touch-none"
        ref={canvasRef}
        onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
        onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
      />
    </div>
  );
}
