import { useState, useEffect, useRef } from 'react';

export const AnimatedCounter = ({ value, suffix = "", text }: { value: number, suffix?: string, text: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      const end = value;
      const duration = 2.0; // seconds
      const totalFrames = Math.round(duration * 60);
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Ease out quadratic interpolation
        const current = Math.round(end * (1 - (1 - progress) * (1 - progress)));
        setCount(current);

        if (frame >= totalFrames) {
          setCount(end);
          clearInterval(timer);
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center p-6 text-center space-y-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs rounded-2xl border border-slate-150 dark:border-white/5 shadow-xs">
      <span className="text-4xl md:text-5xl font-extrabold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 drop-shadow-sm">
        +{count}{suffix}
      </span>
      <span className="text-slate-600 dark:text-slate-350 text-xs font-bold tracking-wider uppercase">
        {text}
      </span>
    </div>
  );
};
