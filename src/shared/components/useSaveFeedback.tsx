import { useEffect, useRef, useState } from 'react';

/** Acknowledges confirmed writes, retains failed actions for retry, and serializes writes to each cell. */
export function useSaveFeedback(scope = '') {
  const active = useRef(new Map<string, number>());
  const chains = useRef(new Map<string, Promise<boolean>>());
  const failed = useRef(new Map<string, () => Promise<void>>());
  const generation = useRef(0);
  const [pending, setPending] = useState(0);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reconcile, setReconcile] = useState<Record<string, boolean>>({});
  useEffect(() => {
    generation.current++;
    active.current.clear(); chains.current.clear(); failed.current.clear(); setPending(0); setSaved(false); setErrors({}); setReconcile({});
    return () => { generation.current++; };
  }, [scope]);
  function save(action: () => Promise<void>, key = 'save'): Promise<boolean> {
    const version = generation.current;
    active.current.set(key, (active.current.get(key) ?? 0) + 1);
    setPending([...active.current.values()].reduce((sum, n) => sum + n, 0)); setSaved(false);
    const previous = chains.current.get(key) ?? Promise.resolve(true);
    const task = previous.then(async () => {
      if (version !== generation.current) return false;
      failed.current.delete(key);
      setErrors(previousErrors => { const next = { ...previousErrors }; delete next[key]; return next; });
      try { await action(); if (version === generation.current) setSaved(true); return true; }
      catch (err) {
        if (version === generation.current) {
          failed.current.set(key, action);
          setReconcile(previous=>({...previous,[key]:err instanceof Error&&'outcome' in err&&(err.outcome==='uncertain'||err.outcome==='conflict')}));
          setErrors(previousErrors => ({ ...previousErrors, [key]: err instanceof Error ? err.message : 'Could not save. Please try again.' }));
        }
        return false;
      } finally {
        if (version === generation.current) {
          const remaining = (active.current.get(key) ?? 1) - 1;
          if (remaining) active.current.set(key, remaining); else active.current.delete(key);
          setPending([...active.current.values()].reduce((sum, n) => sum + n, 0));
        }
      }
    });
    chains.current.set(key, task);
    void task.then(() => { if (chains.current.get(key) === task) chains.current.delete(key); });
    return task;
  }

  const count = Object.keys(errors).length;
  const needsReconciliation=Object.entries(reconcile).some(([key,blocked])=>blocked&&key in errors);
  return { save, pending, hasFailures: count > 0,
    saveFeedback: <div className="text-xs" aria-live="polite" aria-atomic="true">
      {pending > 0 && <p role="status" className="py-2 font-semibold">Saving {pending > 1 ? `${pending} changes` : 'change'}…</p>}
      {count > 0 ? <div role="alert" className="my-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-600 dark:text-red-300">
        <p>{needsReconciliation?'Score state needs reconciliation. Your edits are retained.':`${count} change${count === 1 ? '' : 's'} could not be saved.`} {Object.values(errors)[0]}</p>
        {needsReconciliation?<p>Reload this class to check stored scores before saving again.</p>:<button type="button" disabled={pending > 0} className="mt-1 min-h-9 font-bold underline disabled:opacity-50" onClick={() => { for (const [key, action] of [...failed.current]) void save(action, key); }}>Retry failed changes</button>}
      </div> : pending === 0 && saved && <p role="status" className="py-2 font-semibold">All changes saved.</p>}
    </div>,
  };
}
