import type { Variants } from 'framer-motion';

// Transición spring por defecto, suave y responsiva
export const springTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20,
};

// Aparecer desde abajo suavemente
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// Aparecer desde la derecha (para menús móviles tipo drawer)
export const slideInRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0.9,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 22,
    },
  },
  exit: {
    x: '100%',
    opacity: 0.9,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 22,
      delay: 0.1,
    },
  },
};

// Contenedor para animar elementos hijos en cascada (stagger)
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// Aparecer de forma simple (Fade In)
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
