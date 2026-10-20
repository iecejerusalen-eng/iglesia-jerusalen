import { useEffect } from 'react';

interface GameKeyboardShortcuts {
  enabled?: boolean;
  onNext?: () => void;
  onLetter?: (letter: string) => void;
  onNumber?: (number: number) => void;
  onEnter?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

/** Shared non-invasive keyboard controls for the public Bible games. */
export function useGameKeyboardShortcuts({ enabled = true, onNext, onLetter, onNumber, onEnter }: GameKeyboardShortcuts) {
  useEffect(() => {
    if (!enabled || (!onNext && !onLetter && !onNumber && !onEnter)) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || isEditableTarget(event.target)) return;

      if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && onNext) {
        const targetElement = event.target instanceof HTMLElement ? event.target : null;
        const focusedControl = targetElement?.closest('button, a, [role="button"]');
        if (focusedControl && focusedControl.getAttribute('aria-keyshortcuts') !== 'Shift+Enter') return;
        event.preventDefault();
        event.stopPropagation();
        onNext();
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const numberKey = /^[1-4]$/.test(event.key)
        ? Number(event.key)
        : /^Numpad[1-4]$/.test(event.code)
          ? Number(event.code.slice(-1))
          : null;
      if (!event.shiftKey && numberKey !== null && onNumber) {
        event.preventDefault();
        onNumber(numberKey);
        return;
      }

      const isInteractiveTarget = event.target instanceof HTMLElement
        && Boolean(event.target.closest('button, a, [role="button"]'));

      if (event.key === 'Enter' && !event.shiftKey && !isInteractiveTarget && onEnter) {
        event.preventDefault();
        onEnter();
        return;
      }

      if (!event.shiftKey && event.key.length === 1 && /^\p{L}$/u.test(event.key)) {
        onLetter?.(event.key.toLocaleUpperCase('es'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEnter, onLetter, onNext, onNumber]);
}
