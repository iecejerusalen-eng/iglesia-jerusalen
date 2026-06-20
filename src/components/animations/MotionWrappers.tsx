import { type ReactNode, useRef, Children, cloneElement, isValidElement } from 'react';
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

// ==========================================
// 5. TEXT REVEAL COMPONENT
// ==========================================
interface TextRevealProps {
  text: string;
  mode?: 'words' | 'chars';
  duration?: number;
  delay?: number;
  stagger?: number;
  className?: string;
}

export const TextReveal = ({
  text,
  mode = 'words',
  duration = 0.5,
  delay = 0,
  stagger = 0.08,
  className = ''
}: TextRevealProps) => {
  const parts = mode === 'words' ? text.split(' ') : text.split('');
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 12,
      filter: 'blur(3px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      className={`inline-block ${className}`}
    >
      {parts.map((part, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline-block"
          style={{ marginRight: mode === 'words' ? '0.25em' : '0em' }}
        >
          {part === ' ' ? '\u00A0' : part}
        </motion.span>
      ))}
    </motion.span>
  );
};

// ==========================================
// 6. SVG DRAW REVEAL COMPONENT
// ==========================================
interface SVGDrawRevealProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  viewBox?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export const SVGDrawReveal = ({
  children,
  duration = 1.5,
  delay = 0,
  className = '',
  viewBox = '0 0 100 100',
  strokeColor = 'currentColor',
  strokeWidth = 2
}: SVGDrawRevealProps) => {
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration, delay, ease: 'easeInOut' },
        opacity: { duration: 0.2, delay }
      }
    }
  };

  // Helper function to recursively add pathVariants to svg shapes
  const renderChildren = (node: ReactNode): ReactNode => {
    return Children.map(node, (child) => {
      if (!isValidElement(child)) return child;

      const type = child.type as string;
      const props = child.props as any;

      if (['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(type)) {
        return cloneElement(child, {
          variants: pathVariants,
          stroke: props.stroke || strokeColor,
          strokeWidth: props.strokeWidth || strokeWidth,
          fill: props.fill || 'none'
        } as any);
      }

      if (props.children) {
        return cloneElement(child, {
          children: renderChildren(props.children)
        } as any);
      }

      return child;
    });
  };

  return (
    <motion.svg
      viewBox={viewBox}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
    >
      {renderChildren(children)}
    </motion.svg>
  );
};
