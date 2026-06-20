import { Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
// @ts-ignore
import * as animePkg from 'animejs';
const anime = (animePkg as any).default || animePkg;

interface FloatingItem {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  type: 'cross' | 'sparkle' | 'olive';
  rotation: number;
  drift: number;
  blur: number;
}

const OliveIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="text-emerald-700/20 dark:text-emerald-500/20"
  >
    <path d="M12 22c5.523 0 10-4.477 10-10 0-2.136-2.5-6-10-10C4.5 6 2 9.864 2 12c0 5.523 4.477 10 10 10z" />
  </svg>
);

const CrossIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/20 dark:text-primary/40">
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v9c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-9h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>
  </svg>
);

function FloatingItemElement({ item }: { item: FloatingItem }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    anime.set(ref.current, {
      translateX: 0,
      translateY: window.innerHeight,
      opacity: 0,
      rotate: item.rotation
    });

    anime({
      targets: ref.current,
      translateY: [window.innerHeight, -window.innerHeight * 0.15],
      translateX: [
        { value: 0, duration: 0 },
        { value: item.drift, duration: (item.duration * 1000) / 2, easing: 'linear' },
        { value: 0, duration: (item.duration * 1000) / 2, easing: 'linear' }
      ],
      opacity: [
        { value: 0, duration: 0 },
        { value: 0.5, duration: (item.duration * 1000) * 0.2, easing: 'linear' },
        { value: 0.5, duration: (item.duration * 1000) * 0.6, easing: 'linear' },
        { value: 0, duration: (item.duration * 1000) * 0.2, easing: 'linear' }
      ],
      rotate: item.rotation + 180,
      duration: item.duration * 1000,
      loop: true,
      delay: item.delay * 1000,
      easing: 'linear'
    });
  }, [item]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        width: item.size,
        height: item.size,
        left: `${item.x}%`,
        top: 0,
        filter: item.blur > 0 ? `blur(${item.blur}px)` : 'none',
      }}
    >
      {item.type === 'cross' && <CrossIcon size={item.size} />}
      {item.type === 'olive' && <OliveIcon size={item.size} />}
      {item.type === 'sparkle' && (
        <Sparkles 
          size={item.size - 4} 
          className="text-amber-500/40 dark:text-amber-500/30" 
        />
      )}
    </div>
  );
}

export default function FloatingElements() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const generated: FloatingItem[] = Array.from({ length: 18 }).map((_, i) => {
      const types: ('cross' | 'sparkle' | 'olive')[] = [
        'cross', 'sparkle', 'olive'
      ];
      return {
        id: i,
        x: Math.random() * 90 + 5,
        size: Math.random() * 20 + 16,
        delay: Math.random() * 8,
        duration: Math.random() * 20 + 15,
        type: types[i % types.length],
        rotation: Math.random() * 360,
        drift: Math.random() * 60 - 30,
        blur: Math.random() > 0.6 ? Math.random() * 2 + 0.5 : 0
      };
    });
    setItems(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((item) => (
        <FloatingItemElement key={item.id} item={item} />
      ))}
    </div>
  );
}
