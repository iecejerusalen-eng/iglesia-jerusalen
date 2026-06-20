import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
// @ts-ignore
import * as animePkg from 'animejs';
const anime = (animePkg as any).default || animePkg;

// ==========================================
// 1. ANIME.JS REVEAL COMPONENT
// ==========================================
interface AnimeRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  distance?: number;
  className?: string;
  triggerId?: number; // Used to trigger animation re-run
}

export const AnimeReveal = ({
  children,
  delay = 0,
  duration = 800,
  direction = 'up',
  distance = 35,
  className = '',
  triggerId = 0
}: AnimeRevealProps) => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elRef.current) return;

    // Initial state
    anime.set(elRef.current, {
      opacity: 0,
      translateY: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      translateX: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      scale: direction === 'scale' ? 0.8 : 1,
    });

    // Animation
    anime({
      targets: elRef.current,
      opacity: 1,
      translateY: 0,
      translateX: 0,
      scale: 1,
      duration: duration * 1000,
      delay: delay * 1000,
      easing: 'easeOutElastic(1, .8)'
    });
  }, [direction, distance, duration, delay, triggerId]);

  return (
    <div ref={elRef} className={className}>
      {children}
    </div>
  );
};

// ==========================================
// 2. ANIME.JS STAGGER GRID COMPONENT
// ==========================================
interface AnimeStaggerGridProps {
  items: ReactNode[];
  staggerDelay?: number;
  duration?: number;
  className?: string;
  triggerId?: number;
}

export const AnimeStaggerGrid = ({
  items,
  staggerDelay = 100,
  duration = 800,
  className = '',
  triggerId = 0
}: AnimeStaggerGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const targets = containerRef.current.children;

    // Initial State
    anime.set(targets, {
      opacity: 0,
      scale: 0.5,
      translateY: 20
    });

    anime({
      targets,
      opacity: 1,
      scale: 1,
      translateY: 0,
      delay: anime.stagger(staggerDelay, { start: 100 }),
      duration: duration * 1000,
      easing: 'easeOutSpring(1, 80, 10, 0)'
    });
  }, [staggerDelay, duration, triggerId]);

  return (
    <div ref={containerRef} className={className}>
      {items.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  );
};
