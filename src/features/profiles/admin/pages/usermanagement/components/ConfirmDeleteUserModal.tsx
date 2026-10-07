import type { UserAccount } from "../types/user";
import { formatFullName } from "../types/user";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";

interface ConfirmDeleteUserModalProps {
  user: UserAccount;
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteUserModal({ user, darkMode, onCancel, onConfirm }: ConfirmDeleteUserModalProps) {
  return (
    <ConfirmationModal
      title="Remove user account?"
      description={<>This will permanently remove <span className="font-semibold">{formatFullName(user)}</span> and revoke their access. This action cannot be undone.</>}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Remove User"
      variant="danger"
      darkMode={darkMode}
    />
  );
}
