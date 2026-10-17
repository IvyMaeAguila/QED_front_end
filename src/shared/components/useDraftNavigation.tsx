import { useState } from 'react';
import { useUnsavedChanges } from './useUnsavedChanges';

/** Capture user changes without treating asynchronous form hydration as editing. */
export function useDraftNavigation(darkMode: boolean) {
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChanges(dirty, darkMode);
  return { ...guard, markChanged: () => setDirty(true), markSaved: () => { guard.allowNavigation(); setDirty(false); } };
}
