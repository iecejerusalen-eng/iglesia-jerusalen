import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { RotateCw, Dices } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * SVG-based spinning wheel with visible text labels in each segment,
 * natural deceleration animation, and confetti on result.
 */

const SEGMENT_COLORS = [
  '#f97316', '#8b5cf6', '#06b6d4', '#ec4899',
  '#10b981', '#eab308', '#3b82f6', '#ef4444',
  '#14b8a6', '#a855f7', '#f59e0b', '#6366f1',
];

interface Props {
  block: LessonBlock;
  storageKey: string;
}

const SpinnerWheel = ({ block, storageKey }: Props) => {
  const items = useMemo(() => block.spinner_items || [], [block.spinner_items]);
  const total = items.length;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.result === 'string') return parsed.result;
      }
    } catch { /* ignore */ }
    return null;
  });

  const spinWheel = useCallback(() => {
    if (isSpinning || total === 0) return;
    setIsSpinning(true);
    setResult(null);

    const sliceAngle = 360 / total;
    const winnerIdx = Math.floor(Math.random() * total);
    /* The pointer is at the top (270° in SVG coords). We need the middle
       of the winning segment to align there after the rotation. */
    const segmentMiddle = winnerIdx * sliceAngle + sliceAngle / 2;
    const targetAngle = 360 - segmentMiddle; // where segment center meets pointer at 0°
    const fullSpins = 5 * 360;
    const newRotation = rotation + fullSpins + targetAngle + (360 - (rotation % 360));

    setRotation(newRotation);

    setTimeout(() => {
      const winner = items[winnerIdx];
      setResult(winner);
      setIsSpinning(false);
      localStorage.setItem(storageKey, JSON.stringify({ result: winner }));
      toast.success(`¡La ruleta se detuvo en: ${winner}!`);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }, 4200);
  }, [isSpinning, items, total, rotation, storageKey]);

  if (total === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-gray-400 dark:text-gray-500">
        Esta ruleta no tiene opciones configuradas.
      </div>
    );
  }

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;
  const sliceAngle = 360 / total;

  /** Build SVG path for a single segment */
  const describeArc = (startAngle: number, endAngle: number) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-8 space-y-6 text-center overflow-hidden">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
        <Dices className="text-orange-500 dark:text-orange-400 shrink-0" size={20} />
        {block.question_text}
      </p>

      {/* Wheel container */}
      <div className="relative mx-auto" style={{ width: size, height: size + 20 }}>
        {/* Pointer triangle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: -2 }}
        >
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
            <path d="M14 24L0 0H28L14 24Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          </svg>
        </div>

        {/* SVG Wheel */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
        >
          {items.map((item, idx) => {
            const startAngle = idx * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;
            const midRad = ((midAngle - 90) * Math.PI) / 180;
            const textRadius = radius * 0.62;
            const tx = cx + textRadius * Math.cos(midRad);
            const ty = cy + textRadius * Math.sin(midRad);
            const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];

            return (
              <g key={idx}>
                <path
                  d={describeArc(startAngle, endAngle)}
                  fill={color}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                  fill="white"
                  fontSize={total > 8 ? 10 : total > 5 ? 12 : 14}
                  fontWeight="700"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                >
                  {item.length > 14 ? `${item.slice(0, 12)}…` : item}
                </text>
              </g>
            );
          })}
          {/* Center circle */}
          <circle cx={cx} cy={cy} r={22} fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={10} fill="#f97316" />
        </svg>
      </div>

      {/* Action / Result */}
      <div className="space-y-4 pt-2">
        {!result ? (
          <button
            type="button"
            onClick={spinWheel}
            disabled={isSpinning}
            className="mx-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          >
            <RotateCw
              size={18}
              className={isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}
            />
            {isSpinning ? 'Girando...' : '¡Girar la Ruleta!'}
          </button>
        ) : (
          <div className="glass-card rounded-xl p-5 max-w-sm mx-auto space-y-2 animate-in fade-in zoom-in duration-300">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Resultado
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-orange-200">{result}</p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline underline-offset-2 cursor-pointer"
            >
              Girar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinnerWheel;
