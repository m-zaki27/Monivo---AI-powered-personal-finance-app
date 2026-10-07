import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds left until a deadline. We store the end *time*, not a counter we
 * decrement: timers pause while the app is backgrounded, but Date.now() doesn't,
 * so the countdown stays correct when the user comes back from their inbox.
 */
export function useCountdown(seconds: number) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const done = remaining === 0;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [done, endsAt]);

  const restart = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setEndsAt(t + seconds * 1000);
  }, [seconds]);

  return { remaining, done, restart };
}

/** 75 → "1:15" */
export const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
