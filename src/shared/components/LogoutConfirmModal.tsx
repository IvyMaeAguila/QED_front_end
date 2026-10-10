import { LogOut } from "lucide-react";
import { ConfirmationModal } from "./ConfirmationModal";

interface LogoutConfirmModalProps {
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ darkMode, onCancel, onConfirm }: LogoutConfirmModalProps) {
  return (
    <ConfirmationModal
      title="Log out?"
      description="Are you sure you want to log out of your account?"
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Log out"
      variant="default"
      icon={<LogOut size={20} aria-hidden="true" />}
      darkMode={darkMode}
      zIndexClass="z-[120]"
      panelClassName="rounded-[12px] border-t-4 border-t-maroon shadow-2xl"
      footerClassName="justify-stretch"
    />
  );
}
