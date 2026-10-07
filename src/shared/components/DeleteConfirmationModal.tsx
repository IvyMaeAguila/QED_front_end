import { useState } from "react";
import type { CalendarTheme } from "../calendar/types/Calendar";
import { ConfirmationModal } from "./ConfirmationModal";

interface DeleteConfirmModalProps extends CalendarTheme {
  entryTitle: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmModal({
  entryTitle,
  onClose,
  onConfirm,
  darkMode,
  panelBg,
  panelBorder,
  textMuted,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  }

  return (
    <ConfirmationModal
      title="Delete this entry?"
      description={
        <>
          “{entryTitle}” will be permanently removed. This can’t be undone.
          {error && <span className="mt-2 block text-[#B91C1C]">{error}</span>}
        </>
      }
      onClose={onClose}
      zIndexClass="z-60"
      onConfirm={handleConfirm}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      darkMode={darkMode}
      loading={deleting}
      loadingLabel="Deleting…"
      descriptionClassName={textMuted}
      panelClassName={`${panelBg} ${panelBorder}`}
    />
  );
}
