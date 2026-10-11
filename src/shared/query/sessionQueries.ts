// Lightweight lifecycle bridge: authentication must not eagerly import Query.
let clearQueries: (() => void) | undefined;
let sessionSequence = 0;

export function registerSessionQueryCleanup(cleanup: () => void) {
  clearQueries = cleanup;
}

export function nextQuerySession() {
  clearQueries?.();
  return ++sessionSequence;
}
