import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RotateCw, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * Modern 3D Vector SVG Dice with physical toss animation,
 * dynamic floor shadows, multi-axis tumbling, and confetti.
 */

/** Pip coordinates on 120x120 SVG grid */
const PIP_COORDS: Record<number, [number, number][]> = {
  1: [[60, 60]],
  2: [[35, 35], [85, 85]],
  3: [[35, 35], [60, 60], [85, 85]],
  4: [[35, 35], [85, 35], [35, 85], [85, 85]],
  5: [[35, 35], [85, 35], [60, 60], [35, 85], [85, 85]],
  6: [[35, 35], [85, 35], [35, 60], [85, 60], [35, 85], [85, 85]],
};

/** Exact rotation angles to land showing Face 1 to 6 facing front */
const FACE_FINAL_ROTATIONS: Record<number, { x: number; y: number; z: number }> = {
  1: { x: 1080, y: 1080, z: 0 },
  2: { x: 1080, y: 1260, z: 0 },
  3: { x: 1080, y: 990,  z: 0 },
  4: { x: 1080, y: 1170, z: 0 },
  5: { x: 990,  y: 1080, z: 0 },
  6: { x: 1170, y: 1080, z: 0 },
};

interface Props {
  block: LessonBlock;
  storageKey: string;
}

const Dice3D = ({ block, storageKey }: Props) => {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.result === 'number') return parsed.result;
      }
    } catch { /* ignore */ }
    return null;
  });

  const [cubeTransform, setCubeTransform] = useState<string>(
    result
      ? `rotateX(${FACE_FINAL_ROTATIONS[result].x}deg) rotateY(${FACE_FINAL_ROTATIONS[result].y}deg)`
      : 'rotateX(-25deg) rotateY(35deg)'
  );

  const rollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    const rolled = Math.floor(Math.random() * 6) + 1;
    const finalRot = FACE_FINAL_ROTATIONS[rolled];

    /* Calculate multi-revolution spin targeting the winning face */
    const spinX = finalRot.x + (Math.floor(Math.random() * 2) + 2) * 360;
    const spinY = finalRot.y + (Math.floor(Math.random() * 2) + 2) * 360;
    const spinZ = (Math.random() > 0.5 ? 360 : -360);

    setCubeTransform(`rotateX(${spinX}deg) rotateY(${spinY}deg) rotateZ(${spinZ}deg)`);

    setTimeout(() => {
      setResult(rolled);
      setIsRolling(false);
      localStorage.setItem(storageKey, JSON.stringify({ result: rolled }));
      toast.success(`🎲 ¡Lanzaste un ${rolled}!`);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }, 1650);
  }, [isRolling, storageKey]);

  /** Render face as a high-precision vector SVG */
  const renderSvgFace = (faceNum: number) => {
    const pips = PIP_COORDS[faceNum];

    return (
      <div className={`dice-face dice-face--${faceNum}`}>
        <svg width="120" height="120" viewBox="0 0 120 120" className="w-full h-full">
          <defs>
            {/* Main ivory face gradient */}
            <linearGradient id={`faceGrad-${faceNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>

            {/* Standard pip dark gradient */}
            <radialGradient id="pipDarkGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* Red Ace pip gradient for face 1 */}
            <radialGradient id="pipAceGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>

            {/* Pip drop shadow filter */}
            <filter id="pipShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Dice face background */}
          <rect
            width="120"
            height="120"
            rx="20"
            fill={`url(#faceGrad-${faceNum})`}
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
          />

          {/* Inset border ring */}
          <rect
            x="6"
            y="6"
            width="108"
            height="108"
            rx="15"
            fill="none"
            stroke="rgba(180, 83, 9, 0.15)"
            strokeWidth="1.5"
          />

          {/* Vector Pips */}
          {pips.map(([px, py], idx) => {
            const isAce = faceNum === 1;
            const pipRadius = isAce ? 13 : 9.5;
            const gradId = isAce ? 'url(#pipAceGrad)' : 'url(#pipDarkGrad)';

            return (
              <g key={idx} filter="url(#pipShadow)">
                <circle cx={px} cy={py} r={pipRadius} fill={gradId} />
                {/* Specular highlight */}
                <circle
                  cx={px - pipRadius * 0.3}
                  cy={py - pipRadius * 0.3}
                  r={pipRadius * 0.28}
                  fill="white"
                  opacity="0.75"
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-8 space-y-6 text-center overflow-hidden">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
        <Dices className="text-amber-500 dark:text-amber-400" size={20} />
        {block.question_text || 'Dado de Reflexión'}
      </p>

      {/* 3D Dice Scene */}
      <div className="py-6 flex flex-col items-center justify-center relative">
        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          className={`dice-scene cursor-pointer disabled:cursor-wait focus:outline-none ${
            isRolling ? 'dice-tossing' : ''
          }`}
          aria-label="Lanzar dado 3D"
        >
          <div
            className="dice-cube"
            style={{
              transform: cubeTransform,
              transition: isRolling
                ? 'transform 1.6s cubic-bezier(0.2, 0.9, 0.2, 1)'
                : 'transform 0.5s ease-out',
            }}
          >
            {renderSvgFace(1)}
            {renderSvgFace(2)}
            {renderSvgFace(3)}
            {renderSvgFace(4)}
            {renderSvgFace(5)}
            {renderSvgFace(6)}
          </div>
        </button>

        {/* Dynamic Floor Shadow */}
        <div
          className={`w-24 h-4 bg-black/20 dark:bg-black/50 rounded-full blur-sm mt-3 ${
            isRolling ? 'dice-shadow-tossing' : ''
          }`}
        />
      </div>

      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {isRolling ? '🎲 Dado rodando...' : result ? 'Toca el dado para volver a lanzar' : 'Toca el dado para lanzar'}
      </p>

      {/* Result Card */}
      <AnimatePresence>
        {result && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-5 max-w-md mx-auto space-y-2 border-2 border-amber-200 dark:border-amber-800/60 shadow-lg"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-800/40 px-2.5 py-1 rounded-full">
              Cara #{result}
            </span>
            <p className="text-sm md:text-base font-extrabold text-slate-900 dark:text-amber-100">
              {(block.dice_options || [])[result - 1] || `Pregunta / Consigna ${result}`}
            </p>
            <button
              type="button"
              onClick={rollDice}
              className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline underline-offset-4 cursor-pointer flex items-center gap-1 mx-auto"
            >
              <RotateCw size={12} /> Lanzar de nuevo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dice3D;
