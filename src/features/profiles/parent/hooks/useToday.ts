// hooks/useToday.ts
import { useState, useEffect, useRef } from 'react';

/**
 * Returns the current Date, and automatically updates when the
 * calendar day actually changes (at local midnight) — not just
 * on a dumb interval. Falls back to a periodic check too, in case
 * the tab was backgrounded/throttled and missed the midnight timeout.
 */
export function useToday(fallbackCheckMs = 60000): Date {
  const [today, setToday] = useState<Date>(() => new Date());
  const dayRef = useRef(today.toDateString());

  useEffect(() => {
    const checkAndUpdate = () => {
      const now = new Date();
      // only trigger a re-render if the actual day changed
      if (now.toDateString() !== dayRef.current) {
        dayRef.current = now.toDateString();
        setToday(now);
      }
    };

    // schedule an update exactly at next local midnight
    const scheduleMidnightTick = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1 // 1 second after midnight, avoid edge-case flakiness
      );
      const ms = nextMidnight.getTime() - now.getTime();
      return window.setTimeout(() => {
        checkAndUpdate();
        scheduleMidnightTick(); // reschedule for the next day
      }, ms);
    };

    const midnightTimer = scheduleMidnightTick();
    // fallback: catch missed ticks (e.g. laptop was asleep)
    const fallbackInterval = window.setInterval(checkAndUpdate, fallbackCheckMs);

    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(fallbackInterval);
    };
  }, [fallbackCheckMs]);

  return today;
}

/** Convenience hook: gives you day/month/year already split up. */
export function useTodayParts(): { day: number; month: string; year: number } {
  const today = useToday();
  return {
    day: today.getDate(),
    month: today.toLocaleString('default', { month: 'long' }),
    year: today.getFullYear(),
  };
}