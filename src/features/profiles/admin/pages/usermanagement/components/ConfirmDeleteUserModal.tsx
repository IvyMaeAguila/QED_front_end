import type { UserAccount } from "../types/user";
import { formatFullName } from "../types/user";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";
import { useRef, useState } from 'react';
import { LoadingRegion } from '@shared/loading/LoadingRegion';

interface ConfirmDeleteUserModalProps {
  user: UserAccount;
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteUserModal({ user, darkMode, onCancel, onConfirm }: ConfirmDeleteUserModalProps) {
  const busy = useRef(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  async function confirm() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError(null);
    try { await onConfirm(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Failed to delete user'); }
    finally { busy.current = false; setLoading(false); }
  }
  return (
    <ConfirmationModal
      title="Remove user account?"
      description={<>This will permanently remove <span className="font-semibold">{formatFullName(user)}</span> and revoke their access. This action cannot be undone.</>}
      onClose={onCancel}
      onConfirm={confirm}
      loading={loading}
      loadingLabel="Removing…"
      confirmLabel="Remove User"
      variant="danger"
      darkMode={darkMode}
    >{error && <LoadingRegion loading={false} error={error} retry={confirm} skeleton={null} className="px-6">{null}</LoadingRegion>}</ConfirmationModal>
  );
}
