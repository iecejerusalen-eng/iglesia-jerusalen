import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { RotateCw, Dices } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * Modern Glassmorphic SVG Spinner Wheel with visible text labels,
 * 360-degree slice fix for single items, smooth deceleration, and confetti.
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
    const targetAngle = 360 - segmentMiddle;
    const fullSpins = 5 * 360;
    const newRotation = rotation + fullSpins + targetAngle + (360 - (rotation % 360));

    setRotation(newRotation);

    setTimeout(() => {
      const winner = items[winnerIdx];
      setResult(winner);
      setIsSpinning(false);
      localStorage.setItem(storageKey, JSON.stringify({ result: winner }));
      toast.success(`¡La ruleta se detuvo en: ${winner}!`);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    }, 4200);
  }, [isSpinning, items, total, rotation, storageKey]);

  if (total === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-gray-400 dark:text-gray-500">
        Esta ruleta no tiene opciones configuradas.
      </div>
    );
  }

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 6;
  const sliceAngle = 360 / total;

  /**
   * Build SVG path for a single segment.
   * Handles total === 1 (360 deg) by capping angle at 359.999 to prevent arc collapse.
   */
  const describeArc = (startAngle: number, endAngle: number) => {
    const isFullCircle = endAngle - startAngle >= 360;
    const effectiveEnd = isFullCircle ? startAngle + 359.999 : endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((effectiveEnd - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = effectiveEnd - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-8 space-y-6 text-center overflow-hidden">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
        <Dices className="text-orange-500 dark:text-orange-400 shrink-0" size={20} />
        {block.question_text || 'Ruleta de Opciones'}
      </p>

      {/* Wheel container */}
      <div className="relative mx-auto" style={{ width: size, height: size + 24 }}>
        {/* Pointer pin at top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 filter drop-shadow-md"
          style={{ top: -4 }}
        >
          <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
            <path
              d="M16 28L2 2C2 2 8 0 16 0C24 0 30 2 30 2L16 28Z"
              fill="url(#pointerGradient)"
              stroke="#b91c1c"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="pointerGradient" x1="16" y1="0" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#b91c1c" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* SVG Wheel */}
        <div className="w-full h-full p-1 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-2xl backdrop-blur-md border-2 border-white/60 dark:border-slate-700/60">
          <svg
            width={size - 8}
            height={size - 8}
            viewBox={`0 0 ${size} ${size}`}
            className="rounded-full overflow-hidden"
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

              // Positioning text inside slice
              const textRadius = total === 1 ? radius * 0.45 : radius * 0.62;
              const tx = cx + textRadius * Math.cos(midRad);
              const ty = cy + textRadius * Math.sin(midRad);
              const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];

              // Rotation for text
              const textRotation = total === 1 ? 0 : midAngle;

              return (
                <g key={idx}>
                  <path
                    d={describeArc(startAngle, endAngle)}
                    fill={color}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={total === 1 ? '0' : '2'}
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                    fill="white"
                    fontSize={total > 8 ? 11 : total > 4 ? 13 : 15}
                    fontWeight="800"
                    className="select-none tracking-wide"
                    style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      fontFamily: 'system-ui, sans-serif'
                    }}
                  >
                    {item.length > 16 ? `${item.slice(0, 14)}…` : item}
                  </text>
                </g>
              );
            })}

            {/* Outer border ring */}
            <circle cx={cx} cy={cy} r={radius - 1} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />

            {/* Center metallic hub */}
            <circle cx={cx} cy={cy} r={26} fill="white" stroke="rgba(0,0,0,0.12)" strokeWidth="3" className="drop-shadow-md" />
            <circle cx={cx} cy={cy} r={18} fill="url(#hubGradient)" />
            <circle cx={cx} cy={cy} r={8} fill="white" opacity="0.9" />

            <defs>
              <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                <stop stopColor="#fb923c" />
                <stop offset="1" stopColor="#ea580c" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Action / Result */}
      <div className="space-y-4 pt-1">
        {!result ? (
          <button
            type="button"
            onClick={spinWheel}
            disabled={isSpinning}
            className="mx-auto flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group text-sm"
          >
            <RotateCw
              size={18}
              className={isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}
            />
            {isSpinning ? 'Girando ruleta...' : '¡Girar la Ruleta!'}
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-5 max-w-sm mx-auto space-y-2 border-2 border-orange-200 dark:border-orange-800/60 shadow-lg animate-in fade-in zoom-in duration-300">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400">
              🎯 Resultado
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-orange-100">{result}</p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline underline-offset-4 cursor-pointer"
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
