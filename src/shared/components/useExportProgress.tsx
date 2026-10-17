import { lazy, Suspense, useRef, useState } from 'react';

const loadExportDialog = () => import('./ExportProgressModal').then(module => ({ default: module.ExportProgressModal }));
const ExportProgressModal = lazy(loadExportDialog);

export function useExportProgress(darkMode: boolean, label: string, format: string) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const active = useRef(false);
  async function runExport(action: () => void | Promise<void>) {
    if (active.current) return;
    active.current = true;
    setError('');
    setState('loading');
    try {
      await loadExportDialog();
      // Let the loading screen paint before synchronous CSV or workbook work.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await action();
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try exporting again.');
      setState('error');
    } finally {
      active.current = false;
    }
  }
  return {
    runExport,
    exporting: state === 'loading',
    exportFeedback: state === 'idle' ? null : <Suspense fallback={<div role="status" className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 text-center text-sm font-semibold text-white">Preparing your {label}…</div>}>
      <ExportProgressModal state={state} darkMode={darkMode} label={label} format={format} error={error} onClose={() => setState('idle')} />
    </Suspense>,
  };
}
