/* eslint-disable react-refresh/only-export-components */
"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe, { type COBEOptions } from "cobe";
import { useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 350;

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
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  focusCoords?: [number, number] | null; // [lat, lng]
}

export function Globe({
  className,
  config = DEFAULT_GLOBE_CONFIG,
  interactive = true,
  autoRotate = true,
  autoRotateSpeed = 0.004,
  focusCoords = null,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const widthRef = useRef(0);
  const phiRef = useRef(config.phi || 0);

  // Motion values for smooth rotation physics
  const rX = useMotionValue(config.phi || 0);
  const rY = useMotionValue(config.theta || 0.2);

  const springX = useSpring(rX, { mass: 1, damping: 30, stiffness: 100 });
  const springY = useSpring(rY, { mass: 1, damping: 30, stiffness: 100 });

  // Convert lat, lng to phi, theta for COBE globe
  const convertLocationToAngles = useCallback((lat: number, lng: number) => {
    const phi = (lng * Math.PI) / 180;
    const theta = (lat * Math.PI) / 180;
    return { phi: -phi + Math.PI / 2, theta };
  }, []);

  // Update target focus when focusCoords change
  useEffect(() => {
    if (focusCoords) {
      const [lat, lng] = focusCoords;
      const { phi, theta } = convertLocationToAngles(lat, lng);
      // Keep continuous rotation direction
      let targetPhi = phi;
      const currentPhi = rX.get();
      while (targetPhi - currentPhi > Math.PI) targetPhi -= Math.PI * 2;
      while (targetPhi - currentPhi < -Math.PI) targetPhi += Math.PI * 2;

      rX.set(targetPhi);
      rY.set(theta);
      phiRef.current = targetPhi;
    }
  }, [focusCoords, convertLocationToAngles, rX, rY]);

  // Pointer Interaction Handlers with global window tracking
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!interactive) return;
    pointerInteracting.current = { x: clientX, y: clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null && interactive) {
        const deltaX = e.clientX - pointerInteracting.current.x;
        const deltaY = e.clientY - pointerInteracting.current.y;

        pointerInteracting.current = { x: e.clientX, y: e.clientY };

        const newPhi = rX.get() + deltaX / MOVEMENT_DAMPING;
        // Clamp vertical theta between -1.0 and 1.0 radians
        const newTheta = Math.max(-1.0, Math.min(1.0, rY.get() - deltaY / MOVEMENT_DAMPING));

        rX.set(newPhi);
        rY.set(newTheta);
        phiRef.current = newPhi;
      }
    };

    const handlePointerUp = () => {
      if (pointerInteracting.current !== null) {
        pointerInteracting.current = null;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interactive, rX, rY]);

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: (state) => {
        // Auto slow rotation if user is not dragging
        if (!pointerInteracting.current && autoRotate) {
          phiRef.current += autoRotateSpeed;
          rX.set(phiRef.current);
        }

        state.phi = springX.get();
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
  }, [springX, springY, config, autoRotate, autoRotateSpeed, rX]);

  return (
    <div className={cn("relative aspect-square w-full select-none", className)}>
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 cursor-grab active:cursor-grabbing touch-none"
        ref={canvasRef}
        onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      />
    </div>
  );
}
