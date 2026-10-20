interface GameKeyboardHintProps {
  instruction: string;
  nextAction: string;
  tone?: 'default' | 'dark-surface';
}

export function GameKeyboardHint({ instruction, nextAction, tone = 'default' }: GameKeyboardHintProps) {
  return (
    <p role="note" aria-label={`Instrucciones de teclado. ${instruction} Mayús más Intro: ${nextAction}.`} className={`mt-3 text-xs leading-5 ${tone === 'dark-surface' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
      {instruction}{' '}
      <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-bold text-slate-700 shadow-sm dark:border-white/15 dark:bg-slate-900 dark:text-slate-200">Mayús</kbd>
      {' + '}
      <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-bold text-slate-700 shadow-sm dark:border-white/15 dark:bg-slate-900 dark:text-slate-200">Intro</kbd>
      {`: ${nextAction}.`}
    </p>
  );
}
