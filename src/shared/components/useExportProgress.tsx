import { useRef, useState } from 'react';
import { ExportProgressModal } from './ExportProgressModal';

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
    exportFeedback: <ExportProgressModal state={state} darkMode={darkMode} label={label} format={format} error={error} onClose={() => setState('idle')} />,
  };
}
