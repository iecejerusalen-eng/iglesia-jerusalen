import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/Jerusalén/solo logo colorido.svg';
import anime from 'animejs/lib/anime.es.js';

export default function Preloader() {
  const [show, setShow] = useState(true);
  const [isRendered, setIsRendered] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('jerusalen_preloader_seen');
    if (hasSeen === 'true') {
      setIsRendered(false);
      setShow(false);
      return;
    }

    // Safety fallback: force unmount after 2.2 seconds no matter what
    const safetyTimer = setTimeout(() => {
      setShow(false);
      setIsRendered(false);
      sessionStorage.setItem('jerusalen_preloader_seen', 'true');
    }, 2200);

    try {
      if (logoRef.current && textRef.current) {
        anime.set([logoRef.current, textRef.current], { opacity: 0 });
        anime.set(logoRef.current, { scale: 0.8 });
        anime.set(textRef.current, { translateY: 10 });

        anime({
          targets: logoRef.current,
          opacity: 1,
          duration: 500,
          easing: 'easeOutQuad',
        });

        anime({
          targets: logoRef.current,
          scale: [0.95, 1.05, 0.95],
          duration: 1200,
          loop: true,
          easing: 'easeInOutQuad',
        });

        anime({
          targets: textRef.current,
          opacity: 0.7,
          translateY: 0,
          delay: 300,
          duration: 500,
          easing: 'easeOutQuad'
        });
      }
    } catch (e) {
      console.warn("Preloader animation error:", e);
    }

    const timer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('jerusalen_preloader_seen', 'true');
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!show && isRendered) {
      const unmountTimer = setTimeout(() => {
        setIsRendered(false);
      }, 900);

      if (containerRef.current) {
        try {
          anime({
            targets: containerRef.current,
            translateY: '-100%',
            duration: 800,
            easing: 'easeInQuint',
            complete: () => {
              setIsRendered(false);
              clearTimeout(unmountTimer);
            }
          });
        } catch {
          setIsRendered(false);
        }
      }

      return () => clearTimeout(unmountTimer);
    }
  }, [show, isRendered]);

  if (!isRendered) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center select-none transition-all duration-500 ${
        show ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        ref={logoRef}
        className="w-48 h-48 flex items-center justify-center"
      >
        <img loading="lazy" src={logo} alt="Iglesia Jerusalén Logo" className="w-full h-full object-contain" />
      </div>
      
      <span
        ref={textRef}
        className="text-xs font-bold text-primary uppercase tracking-widest mt-4"
      >
        Preparando tu visita...
      </span>
    </div>
  );
}
