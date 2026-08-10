import { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Grid3x3, Award, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/* ── Grid generation algorithm ── */

type Direction = [number, number]; // [rowDelta, colDelta]
const DIRECTIONS: Direction[] = [
  [0, 1],   // horizontal right
  [1, 0],   // vertical down
  [1, 1],   // diagonal down-right
  [1, -1],  // diagonal down-left
  [0, -1],  // horizontal left
  [-1, 0],  // vertical up
  [-1, -1], // diagonal up-left
  [-1, 1],  // diagonal up-right
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface PlacedWord {
  word: string;
  cells: [number, number][];
}

function generateGrid(words: string[], minSize = 10): { grid: string[][]; placed: PlacedWord[] } {
  const cleanWords = words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length > 0);
  if (cleanWords.length === 0) return { grid: [], placed: [] };

  const longestWord = Math.max(...cleanWords.map((w) => w.length));
  const size = Math.max(minSize, longestWord + 3);

  /* Initialize empty grid */
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placed: PlacedWord[] = [];

  /* Sort by longest first for better placement odds */
  const sorted = [...cleanWords].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    let didPlace = false;
    const maxAttempts = 200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);

      const cells: [number, number][] = [];
      let fits = true;

      for (let i = 0; i < word.length; i++) {
        const r = startRow + dir[0] * i;
        const c = startCol + dir[1] * i;

        if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
        if (grid[r][c] !== null && grid[r][c] !== word[i]) { fits = false; break; }

        cells.push([r, c]);
      }

      if (fits) {
        for (let i = 0; i < word.length; i++) {
          grid[cells[i][0]][cells[i][1]] = word[i];
        }
        placed.push({ word, cells });
        didPlace = true;
        break;
      }
    }

    if (!didPlace) {
      /* If we couldn't place it after maxAttempts, skip this word */
    }
  }

  /* Fill remaining nulls with random letters */
  const filledGrid = grid.map((row) =>
    row.map((cell) => cell ?? ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
  );

  return { grid: filledGrid, placed };
}

/* ── Component ── */

interface Props {
  block: LessonBlock;
  storageKey: string;
}

const WordSearchGrid = ({ block, storageKey }: Props) => {
  const words = block.word_search_words || [];
  const [seed, setSeed] = useState(0); // for regeneration

  const wordsKey = JSON.stringify(words);
  const { grid, placed } = useMemo(
    () => generateGrid(words),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordsKey, seed]
  );

  const [foundWords, setFoundWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.found)) return parsed.found;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* Cells that belong to already-found words */
  const foundCells = useMemo(() => {
    const set = new Set<string>();
    for (const pw of placed) {
      if (foundWords.includes(pw.word)) {
        pw.cells.forEach(([r, c]) => set.add(`${r},${c}`));
      }
    }
    return set;
  }, [placed, foundWords]);

  /** Constrain selection to a straight line from start cell */
  const computeLineCells = useCallback(
    (start: [number, number], end: [number, number]): [number, number][] => {
      const [sr, sc] = start;
      const [er, ec] = end;
      const dr = Math.sign(er - sr);
      const dc = Math.sign(ec - sc);

      /* Must be a valid direction (horizontal, vertical, or 45° diagonal) */
      const diffR = Math.abs(er - sr);
      const diffC = Math.abs(ec - sc);
      if (diffR !== 0 && diffC !== 0 && diffR !== diffC) return [start];

      const steps = Math.max(diffR, diffC);
      const cells: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        cells.push([sr + dr * i, sc + dc * i]);
      }
      return cells;
    },
    []
  );

  const handlePointerDown = (row: number, col: number) => {
    setSelecting(true);
    setStartCell([row, col]);
    setSelectedCells([[row, col]]);
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (!selecting || !startCell) return;
    const line = computeLineCells(startCell, [row, col]);
    setSelectedCells(line);
  };

  const handlePointerUp = () => {
    if (!selecting) return;
    setSelecting(false);

    /* Check if selected cells match any placed word */
    const selectedKey = selectedCells.map(([r, c]) => `${r},${c}`).join('|');
    const reverseKey = [...selectedCells].reverse().map(([r, c]) => `${r},${c}`).join('|');

    for (const pw of placed) {
      if (foundWords.includes(pw.word)) continue;
      const pwKey = pw.cells.map(([r, c]) => `${r},${c}`).join('|');
      if (pwKey === selectedKey || pwKey === reverseKey) {
        const updated = [...foundWords, pw.word];
        setFoundWords(updated);
        localStorage.setItem(storageKey, JSON.stringify({ found: updated }));
        toast.success(`¡Encontraste "${pw.word}"!`);

        if (updated.length === placed.length) {
          toast.success('🎉 ¡Felicitaciones! Has encontrado todas las palabras.');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        break;
      }
    }

    setSelectedCells([]);
    setStartCell(null);
  };

  const regenerate = () => {
    setFoundWords([]);
    setSelectedCells([]);
    setStartCell(null);
    setSeed((s) => s + 1);
    localStorage.removeItem(storageKey);
    toast.info('Sopa de letras regenerada.');
  };

  if (grid.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay palabras configuradas para esta sopa de letras.
      </div>
    );
  }

  const selectedSet = new Set(selectedCells.map(([r, c]) => `${r},${c}`));
  const allFound = foundWords.length === placed.length && placed.length > 0;

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
        <Grid3x3 className="text-cyan-600 dark:text-cyan-400" size={20} />
        {block.question_text}
      </p>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Grid */}
        <div
          ref={gridRef}
          className="inline-grid gap-1 mx-auto lg:mx-0 select-none touch-none"
          style={{ gridTemplateColumns: `repeat(${grid[0].length}, 36px)` }}
          onPointerLeave={() => { if (selecting) handlePointerUp(); }}
        >
          {grid.map((row, rIdx) =>
            row.map((letter, cIdx) => {
              const key = `${rIdx},${cIdx}`;
              const isSelected = selectedSet.has(key);
              const isFound = foundCells.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={`ws-cell ${isSelected ? 'selected' : ''} ${isFound ? 'found' : ''}`}
                  onPointerDown={(e) => { e.preventDefault(); handlePointerDown(rIdx, cIdx); }}
                  onPointerEnter={() => handlePointerEnter(rIdx, cIdx)}
                  onPointerUp={handlePointerUp}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>

        {/* Word list */}
        <div className="flex-1 space-y-2 min-w-[140px]">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
            Palabras ({foundWords.length}/{placed.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {placed.map((pw) => {
              const isFound = foundWords.includes(pw.word);
              return (
                <span
                  key={pw.word}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs transition-all ${
                    isFound
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 line-through'
                      : 'bg-white/60 dark:bg-slate-800/60 border border-cyan-200 dark:border-cyan-700/50 text-cyan-900 dark:text-cyan-300'
                  }`}
                >
                  {isFound && <Check size={12} />}
                  {pw.word}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={regenerate}
            className="flex items-center gap-1.5 mt-3 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 cursor-pointer"
          >
            <RefreshCw size={12} /> Regenerar grilla
          </button>
        </div>
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {allFound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/50 rounded-xl text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2"
          >
            <Award size={16} /> ¡Has encontrado todas las palabras clave!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordSearchGrid;
