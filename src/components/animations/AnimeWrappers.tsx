import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import anime from 'animejs';

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
  items?: ReactNode[]; // Deprecated but kept for compatibility
  children?: ReactNode; // Using children directly
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  triggerId?: number;
}

export const AnimeStaggerGrid = ({
  items,
  children,
  staggerDelay = 100,
  duration = 800,
  className = '',
  triggerId = 0
}: AnimeStaggerGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

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
      easing: 'spring(1, 80, 10, 0)'
    });
  }, [staggerDelay, duration, triggerId, isVisible]);

  return (
    <div ref={containerRef} className={className}>
      {children ? children : items?.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  );
};

// ==========================================
// 3. ANIME.JS SCROLL FADE UP (INTERSECTION OBSERVER)
// ==========================================
interface AnimeFadeUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

export const AnimeFadeUp = ({
  children,
  delay = 0,
  duration = 800,
  distance = 30,
  className = '',
  once = true
}: AnimeFadeUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once]);

  useEffect(() => {
    if (!ref.current) return;
    if (isVisible && (!once || !hasAnimated.current)) {
      anime({
        targets: ref.current,
        opacity: [0, 1],
        translateY: [distance, 0],
        duration,
        delay,
        easing: 'easeOutCubic'
      });
      hasAnimated.current = true;
    } else if (!isVisible && !once) {
      anime.set(ref.current, { opacity: 0, translateY: distance });
    }
  }, [isVisible, delay, duration, distance, once]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

// ==========================================
// 4. ANIME.JS HOVER BUTTON & CARD
// ==========================================
interface AnimeHoverButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  scaleHover?: number;
}

export const AnimeHoverButton = ({
  children,
  className = '',
  onClick,
  scaleHover = 1.05
}: AnimeHoverButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (!btnRef.current) return;
    anime({
      targets: btnRef.current,
      scale: scaleHover,
      duration: 300,
      easing: 'easeOutBack'
    });
  };

  const handleMouseLeave = () => {
    if (!btnRef.current) return;
    anime({
      targets: btnRef.current,
      scale: 1,
      duration: 300,
      easing: 'easeOutQuad'
    });
  };

  const handleMouseDown = () => {
    if (!btnRef.current) return;
    anime({
      targets: btnRef.current,
      scale: 0.95,
      duration: 100,
      easing: 'easeInOutQuad'
    });
  };

  const handleMouseUp = () => {
    if (!btnRef.current) return;
    anime({
      targets: btnRef.current,
      scale: scaleHover,
      duration: 150,
      easing: 'easeOutQuad'
    });
  };

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </button>
  );
};

interface AnimeHoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimeHoverCard = ({ children, className = '', onClick }: AnimeHoverCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    anime({
      targets: cardRef.current,
      translateY: -8,
      scale: 1.02,
      duration: 400,
      easing: 'easeOutExpo'
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    anime({
      targets: cardRef.current,
      translateY: 0,
      scale: 1,
      duration: 400,
      easing: 'easeOutExpo'
    });
  };

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 cursor-pointer ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

// ==========================================
// 5. ANIME.JS SCALE IN (INTERSECTION OBSERVER)
// ==========================================
interface AnimeScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const AnimeScaleIn = ({
  children,
  delay = 0,
  duration = 600,
  className = ''
}: AnimeScaleInProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          anime({
            targets: ref.current,
            opacity: [0, 1],
            scale: [0.8, 1],
            duration,
            delay,
            easing: 'easeOutElastic(1, .8)'
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    anime.set(ref.current, { opacity: 0, scale: 0.8 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// ==========================================
// 6. ANIME.JS PARALLAX IMAGE
// ==========================================
interface AnimeParallaxProps {
  src: string;
  alt: string;
  className?: string;
  yOffset?: number;
}

export const AnimeParallax = ({
  src,
  alt,
  className = '',
  yOffset = 40
}: AnimeParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!ref.current || !imgRef.current) return;

    const onScroll = () => {
      if (!ref.current || !imgRef.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      // If element is in viewport
      if (rect.top <= viewHeight && rect.bottom >= 0) {
        // Progress from 0 to 1
        const progress = 1 - (rect.bottom / (viewHeight + rect.height));
        
        // Translate from -yOffset to +yOffset
        const translateY = -yOffset + (progress * yOffset * 2);
        
        anime.set(imgRef.current, {
          translateY: translateY,
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial call
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [yOffset]);

  return (
    <div ref={ref} className="overflow-hidden w-full h-full relative">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover scale-110 origin-center ${className}`}
      />
    </div>
  );
};

// ==========================================
// 7. ANIME.JS FLOAT/PULSE
// ==========================================
interface AnimeFloatProps {
  children?: React.ReactNode;
  className?: string;
  duration?: number;
  y?: [number, number];
  x?: [number, number];
}

export const AnimeFloat = ({ children, className = '', duration = 4000, y = [0, 0], x = [0, 0] }: AnimeFloatProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    anime({
      targets: ref.current,
      translateY: y,
      translateX: x,
      duration: duration,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });
  }, [duration, y, x]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// ==========================================
// 8. NEW ANIMATIONS (ZOOM, FLIP, BOUNCE)
// ==========================================

interface AnimeZoomInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export const AnimeZoomIn = ({ children, delay = 0, duration = 800, className = '', once = true }: AnimeZoomInProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setIsVisible(false);
      }
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once]);

  useEffect(() => {
    if (!ref.current) return;
    if (isVisible && (!once || !hasAnimated.current)) {
      anime({
        targets: ref.current,
        opacity: [0, 1],
        scale: [0.3, 1],
        duration,
        delay,
        easing: 'easeOutElastic(1, .8)'
      });
      hasAnimated.current = true;
    } else if (!isVisible && !once) {
      anime.set(ref.current, { opacity: 0, scale: 0.3 });
    }
  }, [isVisible, delay, duration, once]);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
};

export const AnimeFlipIn = ({ children, delay = 0, duration = 800, className = '', once = true, axis = 'Y' as 'X' | 'Y' }: AnimeZoomInProps & { axis?: 'X' | 'Y' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setIsVisible(false);
      }
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once]);

  useEffect(() => {
    if (!ref.current) return;
    if (isVisible && (!once || !hasAnimated.current)) {
      anime({
        targets: ref.current,
        opacity: [0, 1],
        rotateY: axis === 'Y' ? [90, 0] : 0,
        rotateX: axis === 'X' ? [90, 0] : 0,
        duration,
        delay,
        easing: 'easeOutBack'
      });
      hasAnimated.current = true;
    } else if (!isVisible && !once) {
      anime.set(ref.current, { opacity: 0, rotateY: axis === 'Y' ? 90 : 0, rotateX: axis === 'X' ? 90 : 0 });
    }
  }, [isVisible, delay, duration, once, axis]);

  return <div ref={ref} className={className} style={{ opacity: 0, perspective: 1000 }}>{children}</div>;
};

export const AnimeBounceIn = ({ children, delay = 0, duration = 1000, className = '', once = true }: AnimeZoomInProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setIsVisible(false);
      }
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once]);

  useEffect(() => {
    if (!ref.current) return;
    if (isVisible && (!once || !hasAnimated.current)) {
      anime({
        targets: ref.current,
        opacity: [0, 1],
        translateY: [-200, 0],
        duration,
        delay,
        easing: 'easeOutBounce'
      });
      hasAnimated.current = true;
    } else if (!isVisible && !once) {
      anime.set(ref.current, { opacity: 0, translateY: -200 });
    }
  }, [isVisible, delay, duration, once]);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
};

// ==========================================
// 9. NEW HOVER EFFECTS (PULSE, RUBBERBAND)
// ==========================================

interface AnimeButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const AnimePulseHover = ({ children, className = '', onClick, onMouseEnter, onMouseLeave, type = 'button', disabled = false }: AnimeButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (onMouseEnter) onMouseEnter();
    if (!btnRef.current || disabled) return;
    anime({
      targets: btnRef.current,
      scale: [1, 1.05, 1],
      duration: 800,
      loop: true,
      easing: 'easeInOutSine'
    });
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) onMouseLeave();
    if (!btnRef.current || disabled) return;
    anime.remove(btnRef.current);
    anime({
      targets: btnRef.current,
      scale: 1,
      duration: 300,
      easing: 'easeOutQuad'
    });
  };

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const AnimeRubberBandHover = ({ children, className = '', onClick, onMouseEnter, onMouseLeave, type = 'button', disabled = false }: AnimeButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (onMouseEnter) onMouseEnter();
    if (!btnRef.current || disabled) return;
    anime.remove(btnRef.current);
    anime({
      targets: btnRef.current,
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
      duration: 1000,
      easing: 'easeOutElastic(1, .8)'
    });
  };
  
  const handleMouseLeave = () => {
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

