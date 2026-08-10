import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Sparkles, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * CSS 3D dice cube with dot patterns on each face.
 * Uses perspective + preserve-3d for real 3D effect.
 */

/** Grid positions for dots on each dice face (1-6) using a 3x3 grid */
const DOT_LAYOUTS: Record<number, number[][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

/** Final rotation to show a specific face number facing the user */
const FACE_ROTATIONS: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(0deg) rotateY(180deg)',
  3: 'rotateX(0deg) rotateY(-90deg)',
  4: 'rotateX(0deg) rotateY(90deg)',
  5: 'rotateX(-90deg) rotateY(0deg)',
  6: 'rotateX(90deg) rotateY(0deg)',
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
    result ? FACE_ROTATIONS[result] : 'rotateX(-25deg) rotateY(35deg)'
  );

  const rollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    /* Chaotic spin phase: random multi-axis rotations */
    const spinX = 720 + Math.random() * 360;
    const spinY = 720 + Math.random() * 360;
    const spinZ = 360 + Math.random() * 180;
    setCubeTransform(`rotateX(${spinX}deg) rotateY(${spinY}deg) rotateZ(${spinZ}deg)`);

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      /* Land on the winning face */
      setCubeTransform(FACE_ROTATIONS[rolled]);

      setTimeout(() => {
        setResult(rolled);
        setIsRolling(false);
        localStorage.setItem(storageKey, JSON.stringify({ result: rolled }));
        toast.success(`¡Lanzaste un ${rolled}! Lee tu pregunta de reflexión.`);
      }, 600);
    }, 1200);
  }, [isRolling, storageKey]);

  const renderFace = (faceNumber: number) => {
    const dots = DOT_LAYOUTS[faceNumber];
    return (
      <div
        className={`dice-face dice-face--${faceNumber}`}
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          padding: '12px',
        }}
      >
        {Array.from({ length: 9 }).map((_, cellIdx) => {
          const row = Math.floor(cellIdx / 3) + 1;
          const col = (cellIdx % 3) + 1;
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={cellIdx} className="flex items-center justify-center">
              {hasDot && <div className="dice-dot" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-8 space-y-6 text-center">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
        <Sparkles className="text-amber-500 dark:text-amber-400" size={20} />
        {block.question_text}
      </p>

      {/* 3D Dice */}
      <div className="py-4 flex justify-center">
        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          className="dice-scene cursor-pointer disabled:cursor-wait focus:outline-none"
          aria-label="Lanzar dado"
        >
          <div
            className="dice-cube"
            style={{
              transform: cubeTransform,
              transition: isRolling
                ? 'transform 1.2s cubic-bezier(0.2, 0.8, 0.15, 1)'
                : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.15, 1)',
            }}
          >
            {renderFace(1)}
            {renderFace(2)}
            {renderFace(3)}
            {renderFace(4)}
            {renderFace(5)}
            {renderFace(6)}
          </div>
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isRolling ? 'Lanzando...' : result ? 'Toca el dado para lanzar de nuevo' : 'Toca el dado para lanzar'}
      </p>

      {/* Result card */}
      <AnimatePresence>
        {result && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-5 max-w-md mx-auto space-y-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-800/40 px-2 py-0.5 rounded-full">
              Cara #{result}
            </span>
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-amber-200">
              {(block.dice_options || [])[result - 1] || `Pregunta ${result}`}
            </p>
            <button
              type="button"
              onClick={rollDice}
              className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline cursor-pointer flex items-center gap-1 mx-auto"
            >
              <RotateCw size={12} /> Volver a lanzar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dice3D;
