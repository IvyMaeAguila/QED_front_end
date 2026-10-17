import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../src/features/profiles/admin/pages/settings/context/SettingsContext';
import { ToastProvider, useToast } from '../src/shared/context/ToastContext';
import { useActionConfirmation } from '../src/shared/components/useActionConfirmation';
import { useDraftNavigation } from '../src/shared/components/useDraftNavigation';
import { useSaveFeedback } from '../src/shared/components/useSaveFeedback';
import { HolisticTab } from '../src/features/profiles/teacher/pages/subjects/detail/components/HolisticTab';
import '../src/style.css';
const state = window as unknown as { testFeedback: { calls: number; fail: boolean; release?: () => void; values: number[] } };
state.testFeedback = { calls: 0, fail: false, values: [] };
const dark = new URLSearchParams(location.search).get('dark') === 'true';
function Harness() {
  const navigate = useNavigate(), location = useLocation();
  const { showToast } = useToast();
  const { confirmAction, confirmationDialog } = useActionConfirmation(dark);
  const { markChanged, markSaved, navigationDialog } = useDraftNavigation(dark);
  const { save, saveFeedback } = useSaveFeedback();
  const [value, setValue] = useState(''), [ratings, setRatings] = useState({});
  async function write(n = 1) {
    state.testFeedback.calls++;
    await new Promise<void>(resolve => { state.testFeedback.release = resolve; });
    if (state.testFeedback.fail) throw new Error('Synthetic save failed');
    state.testFeedback.values.push(n);
  }
  return <div className={dark ? 'bg-panel-dark p-4 text-white' : 'bg-white p-4 text-gray-900'}>
    {confirmationDialog}{navigationDialog}
    <output data-testid="path">{location.pathname}</output>
    <label>Draft<input aria-label="Draft" value={value} onChange={e => { setValue(e.target.value); markChanged(); }}/></label>
    <button onClick={() => navigate('/other')}>Navigate away</button><button onClick={() => { markSaved(); navigate('/saved'); }}>Save and navigate</button>
    <button onClick={() => navigate('/edit')}>Open editor</button>
    <button onClick={() => confirmAction({ title: 'Delete test record?', description: 'This removes the test record.', confirmLabel: 'Delete record', danger: true, action: () => write() })}>Delete test record</button>
    <button onClick={() => void save(() => write())}>Save change</button>
    <button onClick={() => { void save(() => write(1), 'ordered'); void save(() => write(2), 'ordered'); }}>Save ordered changes</button>
    <button onClick={() => { showToast('Saved once'); showToast('Saved once'); }}>Toast twice</button>
    {saveFeedback}
    <HolisticTab roster={[{ id: '1', name: 'Test learner', gender: 'F' }]} ratings={ratings} weekStartDate="2026-10-12" termNumber={1} locked={false}
      onRate={async (student, axis, n) => { await write(n); setRatings(previous => ({ ...previous, [student]: { [axis]: n } })); }} onOpenRecords={() => {}} darkMode={dark} panelBg={dark ? 'bg-panel-dark' : 'bg-white'} panelBorder="border-gray-300" textPrimary={dark ? 'text-white' : 'text-gray-900'} textMuted="text-gray-500" />
  </div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><SettingsProvider><ToastProvider><Harness/></ToastProvider></SettingsProvider></BrowserRouter></StrictMode>);
