import { useRef, useState, type ReactNode } from 'react';
import type {ModalSize} from './modal';
import { ConfirmationModal } from './ConfirmationModal';

interface Action { layout?: "compact" | "standard"; icon?: ReactNode; size?: ModalSize; loadingLabel?: string; title: string; description: ReactNode; confirmLabel?: string; danger?: boolean; action: () => void | Promise<void> }
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
    layout={request.layout} icon={request.icon} size={request.size} loadingLabel={request.loadingLabel}
    darkMode={darkMode} zIndexClass="z-[120]" onClose={close} onConfirm={async () => { await request.action(); close(); }} /> };
}
