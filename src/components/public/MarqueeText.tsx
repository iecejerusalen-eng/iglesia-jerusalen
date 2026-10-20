import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export default function MarqueeText() {
  const announcements = ['Servicio dominical · 10:00 AM', 'Estudio bíblico · jueves 7:00 PM', 'Reunión de jóvenes · sábados'];
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    anime({
      targets: textRef.current,
      translateX: ['0%', '-50%'],
      duration: 42000,
      easing: 'linear',
      loop: true
    });
  }, []);

  return (
    <div className="w-full bg-primary overflow-hidden py-3.5 sm:py-4.5 border-y border-white/10 select-none relative z-10 flex">
      <div ref={textRef} className="flex w-max whitespace-nowrap text-xs font-sans font-black tracking-[.12em] text-white uppercase sm:text-sm">
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-9 px-7 sm:gap-14 sm:px-12">
            {announcements.map((announcement) => (
              <span key={announcement} className="inline-flex items-center gap-9 sm:gap-14">
                <span>{announcement}</span>
                <span aria-hidden="true" className="text-amber-300">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
