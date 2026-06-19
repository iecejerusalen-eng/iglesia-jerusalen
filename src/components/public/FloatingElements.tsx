import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function FloatingElements() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // Generate random items on client side only
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

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ 
            x: 0, 
            y: '100vh', 
            opacity: 0,
            rotate: item.rotation 
          }}
          animate={{ 
            y: '-15vh', 
            x: [0, item.drift, 0],
            opacity: [0, 0.5, 0.5, 0], 
            rotate: item.rotation + 180
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear"
          }}
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
              className="text-gold/40 dark:text-gold/30" 
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
