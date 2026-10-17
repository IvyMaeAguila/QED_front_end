import { createRoot } from 'react-dom/client';
import { useExportProgress } from '../src/shared/components/useExportProgress';
import '../src/style.css';
const dark = new URLSearchParams(location.search).get('dark') === 'true';
const state = window as unknown as { calls: number; start: () => void; release: () => void };
state.calls = 0;
function App() {
  const flow = useExportProgress(dark, 'progress report', 'PDF');
  state.start = () => { void flow.runExport(() => new Promise<void>(resolve => { state.calls++; state.release = resolve; })); };
  return <>{flow.exportFeedback}<button onClick={state.start}>Export</button><button onClick={() => void flow.runExport(() => { throw new Error('Could not generate PDF'); })}>Fail</button></>;
}
createRoot(document.getElementById('root')!).render(<App />);
