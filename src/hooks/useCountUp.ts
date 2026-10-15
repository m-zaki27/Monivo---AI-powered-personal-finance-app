import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/** Animates an integer (cents) toward `target`; jumps instantly with Reduce Motion. */
export function useCountUp(target: number | undefined, duration = 700): number | undefined {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(0);
  const shown = useRef(target);

  useEffect(() => {
    if (target == null) return;
    if (reduceMotion) {
      shown.current = target;
      return;
    }
    from.current = shown.current ?? 0;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from.current + (target - from.current) * eased);
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduceMotion]);

  if (target == null) return undefined;
  return reduceMotion ? target : value;
}
