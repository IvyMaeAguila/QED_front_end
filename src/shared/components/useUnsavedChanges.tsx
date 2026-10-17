import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import { useActionConfirmation } from './useActionConfirmation';

/** Guards application navigation and browser history while a draft or failed write remains. */
export function useUnsavedChanges(dirty: boolean, darkMode: boolean) {
  const navigation = useContext(UNSAFE_NavigationContext);
  const { confirmAction, confirmationDialog } = useActionConfirmation(darkMode);
  const enabled = useRef(dirty);
  enabled.current = dirty;
  const ask = useRef(confirmAction); ask.current = confirmAction;
  const bypass = useRef(false);
  useEffect(() => { if (dirty) bypass.current = false; }, [dirty]);
  function allowNavigation() { enabled.current = false; bypass.current = true; }
  useEffect(() => {
    if (!navigation || !dirty) return;
    let live = true;
    const navigator = navigation.navigator;
    const push = navigator.push, replace = navigator.replace, go = navigator.go;
    function request(action: () => void) {
      if (!live || !enabled.current || bypass.current) { action(); return; }
      ask.current({ title: 'Leave without saving?', description: 'Some changes have not been saved. Leave this page and discard them?', confirmLabel: 'Leave page', action: () => { allowNavigation(); action(); } });
    }
    const guardedPush: typeof push = (...args) => request(() => push.apply(navigator, args));
    const guardedReplace: typeof replace = (...args) => request(() => replace.apply(navigator, args));
    const guardedGo: typeof go = (...args) => request(() => go.apply(navigator, args));
    navigator.push = guardedPush; navigator.replace = guardedReplace; navigator.go = guardedGo;
    const onUnload = (event: BeforeUnloadEvent) => { if (enabled.current && !bypass.current) { event.preventDefault(); event.returnValue = ''; } };
    let index = window.history.state?.idx as number | undefined;
    let restoring = false;
    const onPop = (event: PopStateEvent) => {
      const nextIndex = event.state?.idx as number | undefined;
      if (restoring) { restoring = false; event.stopImmediatePropagation(); return; }
      if (!enabled.current || bypass.current || index === undefined || nextIndex === undefined) { index = nextIndex; return; }
      const delta = nextIndex - index;
      if (!delta) return;
      event.stopImmediatePropagation();
      restoring = true;
      window.history.go(-delta);
      ask.current({ title: 'Leave without saving?', description: 'Some changes have not been saved. Leave this page and discard them?', confirmLabel: 'Leave page', action: () => { allowNavigation(); window.history.go(delta); } });
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('popstate', onPop, true);
    return () => {
      live = false;
      if (navigator.push === guardedPush) navigator.push = push;
      if (navigator.replace === guardedReplace) navigator.replace = replace;
      if (navigator.go === guardedGo) navigator.go = go;
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('popstate', onPop, true);
    };
  }, [navigation, dirty]);
  return { navigationDialog: confirmationDialog, allowNavigation,
    guardAction: (action: () => void) => {
      if (!enabled.current) { action(); return; }
      confirmAction({ title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', action: () => { allowNavigation(); action(); } });
    },
  };
}
