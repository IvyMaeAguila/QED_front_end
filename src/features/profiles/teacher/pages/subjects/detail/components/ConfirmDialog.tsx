import { ConfirmationModal } from "@shared/components/ConfirmationModal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onCancel,
  darkMode,
}: ConfirmDialogProps) {
  return (
    <ConfirmationModal
      title={title}
      description={message}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      variant={danger ? "danger" : "default"}
      darkMode={darkMode}
      zIndexClass="z-100"
      panelClassName={`border-t-4 border-t-maroon shadow-card ${darkMode ? "bg-panel-dark" : "bg-white"}`}
    />
  );
}
