import { useEffect, useRef } from "react";

// Existing UI retry counters remain local; they never become cache keys.
export function useTeacherRetryAttempt(attempt: number, retry: () => void) {
  const previous = useRef(attempt);
  useEffect(() => {
    if (previous.current !== attempt) { previous.current = attempt; retry(); }
  }, [attempt, retry]);
}
