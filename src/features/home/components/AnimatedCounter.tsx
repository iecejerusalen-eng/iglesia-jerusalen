import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

const formatter = new Intl.NumberFormat('es-EC');

export const AnimatedCounter = ({ value, suffix = '', text, caption, icon: Icon, index = 0 }: {
  value: number; suffix?: string; text: string; caption?: string; icon?: LucideIcon; index?: number;
}) => {
  const container = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  const inView = useInView(container, { once: true, amount: 0.3 });
  const reducedMotion = useReducedMotion();
  const formatted = formatter.format(value);

  useEffect(() => {
    if (!number.current || !inView) return;
    if (reducedMotion || value === 0) { number.current.textContent = formatted; return; }
    const control = animate(0, value, {
      duration: 1.25, delay: index * 0.09, ease: [0.16, 1, 0.3, 1],
      onUpdate: current => { if (number.current) number.current.textContent = formatter.format(Math.round(current)); },
      onComplete: () => { if (number.current) number.current.textContent = formatted; },
    });
    return () => control.stop();
  }, [value, formatted, inView, reducedMotion, index]);

  const style: CSSProperties & { '--stat-max-size': string } = { '--stat-max-size': Math.min(88, 220 / (formatted.length + suffix.length)) + 'px' };

  return <motion.div ref={container} className="community-metric" style={style}
    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : index * 0.075, ease: [0.16, 1, 0.3, 1] }}>
    <div className="community-metric__meta" aria-hidden="true">
      {Icon && <Icon size={21} strokeWidth={1.5} />}
      <span>{caption}</span><span className="community-metric__index">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <dt className="community-metric__label">{text}</dt>
    <dd className="community-metric__value">
      <span aria-hidden="true"><span ref={number}>{formatted}</span>{suffix}</span>
      <span className="sr-only">{formatted}{suffix}</span>
    </dd>
    <span className="community-metric__line" aria-hidden="true" />
  </motion.div>;
};
