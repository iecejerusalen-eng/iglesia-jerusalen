import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// ==========================================
// 1. SCROLL REVEAL COMPONENT
// ==========================================
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
}

export const ScrollReveal = ({
  children,
  delay = 0,
  duration = 0.8,
  direction = 'up',
  distance = 35,
  className = ''
}: ScrollRevealProps) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      filter: 'blur(6px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1] as any // easeOutExpo
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 2. STAGGER CONTAINER & ITEM COMPONENTS
// ==========================================
interface StaggerContainerProps {
  children: ReactNode;
  delay?: number;
  staggerChildren?: number;
  className?: string;
  id?: string;
}

export const StaggerContainer = ({
  children,
  delay = 0,
  staggerChildren = 0.1,
  className = '',
  id
}: StaggerContainerProps) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren: delay
      }
    }
  };

  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className = '' }: StaggerItemProps) => {
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 25,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

// ==========================================
// 3. HOVER CARD COMPONENT
// ==========================================
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const HoverCard = ({ children, className = '', onClick }: HoverCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 4. PARALLAX IMAGE COMPONENT
// ==========================================
interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  yOffset?: number;
}

export const ParallaxImage = ({
  src,
  alt,
  className = '',
  yOffset = 40
}: ParallaxImageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Maps scroll progress [0, 1] to translation [-yOffset, yOffset]
  const y = useTransform(scrollYProgress, [0, 1], [-yOffset, yOffset]);

  return (
    <div ref={ref} className="overflow-hidden w-full h-full relative">
      <motion.img
        style={{ y, scale: 1.15 }}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
};
