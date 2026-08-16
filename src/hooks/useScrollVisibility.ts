import { useCallback, useEffect, useRef, useState } from 'react';

interface ScrollVisibilityOptions {
  topThreshold?: number;
}

interface ScrollVisibilityState {
  isScrolled: boolean;
  isHidden: boolean;
}

/**
 * Shares one predictable scroll policy with public chrome:
 * hide while moving down, reveal as soon as the user moves up.
 * Work is coalesced into animation frames so trackpads and touch scrolling
 * do not cause a render for every native scroll event.
 */
export const useScrollVisibility = ({ topThreshold = 24 }: ScrollVisibilityOptions = {}): ScrollVisibilityState => {
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > topThreshold);
  const [isHidden, setIsHidden] = useState(false);
  const previousY = useRef(0);
  const frameId = useRef<number | null>(null);

  const updateFromScroll = useCallback(() => {
    frameId.current = null;

    const currentY = Math.max(window.scrollY, 0);
    const delta = currentY - previousY.current;

    setIsScrolled(currentY > topThreshold);

    if (currentY <= topThreshold) {
      setIsHidden(false);
    } else if (delta > 0) {
      setIsHidden(true);
    } else if (delta < 0) {
      setIsHidden(false);
    }

    previousY.current = currentY;
  }, [topThreshold]);

  const scheduleUpdate = useCallback(() => {
    if (frameId.current !== null) return;
    frameId.current = window.requestAnimationFrame(updateFromScroll);
  }, [updateFromScroll]);

  useEffect(() => {
    previousY.current = Math.max(window.scrollY, 0);
    scheduleUpdate();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frameId.current !== null) {
        window.cancelAnimationFrame(frameId.current);
        frameId.current = null;
      }
    };
  }, [scheduleUpdate]);

  return { isScrolled, isHidden };
};
