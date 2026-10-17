import { useRef, useState, type ReactNode } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

interface Action { title: string; description: ReactNode; confirmLabel?: string; danger?: boolean; action: () => void | Promise<void> }
export function useActionConfirmation(darkMode: boolean) {
  const [request, setRequest] = useState<Action | null>(null);
  const requestRef = useRef<Action | null>(null);
  function confirmAction(action: Action) {
    if (requestRef.current) return;
    requestRef.current = action;
    setRequest(action);
  }
  function close() { requestRef.current = null; setRequest(null); }
  return { confirmAction, confirmationDialog: request && <ConfirmationModal key={request.title} title={request.title}
    description={request.description} confirmLabel={request.confirmLabel ?? 'Confirm'} variant={request.danger ? 'danger' : 'warning'}
    darkMode={darkMode} zIndexClass="z-[120]" onClose={close} onConfirm={async () => { await request.action(); close(); }} /> };
}
