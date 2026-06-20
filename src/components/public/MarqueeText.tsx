import { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function MarqueeText() {
  const phrase = "✦ SERVICIO DOMINICAL 10:00 AM ✦ ESTUDIO BÍBLICO JUEVES 7:00 PM ✦ REUNIÓN DE JÓVENES SÁBADOS ✦ ";
  const repeatedPhrase = Array(6).fill(phrase).join('');
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    anime({
      targets: textRef.current,
      translateX: [0, -1000],
      duration: 35000,
      easing: 'linear',
      loop: true
    });
  }, []);

  return (
    <div className="w-full bg-primary overflow-hidden py-3.5 sm:py-4.5 border-y border-white/10 select-none relative z-10 flex">
      <div
        ref={textRef}
        className="flex whitespace-nowrap text-xs sm:text-sm font-sans font-black tracking-widest text-white uppercase"
      >
        <span className="inline-block pr-8">{repeatedPhrase}</span>
        <span className="inline-block pr-8">{repeatedPhrase}</span>
      </div>
    </div>
  );
}
