import { useState } from "react";
import { useToast } from "@shared/context/ToastContext";
import { ConfirmationModal } from "./ConfirmationModal";

interface DangerConfirmModalTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

interface DangerConfirmModalProps extends DangerConfirmModalTheme {
  /** Ipapakita sa taas ("Delete this class?") */
  title: string;
  /** Paliwanag ng epekto ng aksyon — pwedeng maglaman ng cascade warnings */
  description: React.ReactNode;
  /** Ang exact na text na dapat i-type ng user bago ma-enable ang confirm button */
  confirmPhrase: string;
  /** Label ng confirm button, default "Delete" */
  confirmLabel?: string;
  /**
   * Toast message na ipapakita pagkatapos ng successful na onConfirm.
   * Kung hindi binigyan ng value, walang toast na lalabas — para may
   * kalayaan ang parent kung sila mismo ang may sariling toast logic.
   */
  successMessage?: string;
  errorMessage?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DangerConfirmModal({
  title,
  description,
  confirmPhrase,
  confirmLabel = "Delete",
  successMessage,
  errorMessage,
  onClose,
  onConfirm,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: DangerConfirmModalProps) {
  const { showToast } = useToast();

  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatch = inputValue === confirmPhrase;

  async function handleConfirm() {
    if (!isMatch || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
      if (successMessage) {
        showToast(successMessage, "success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete action.");
      if (errorMessage) {
        showToast(errorMessage, "error");
      }
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && isMatch && !submitting) {
      handleConfirm();
    }
  }

  return (
    <ConfirmationModal
      title={title}
      description={
        <>
          {description}
          {error && <span className="mt-2 block text-[#B91C1C]">{error}</span>}
        </>
      }
      onClose={onClose}
      zIndexClass="z-[60]"
      onConfirm={handleConfirm}
      confirmLabel={confirmLabel}
      loadingLabel="Deleting…"
      variant="danger"
      darkMode={darkMode}
      loading={submitting}
      disabled={!isMatch}
      cancelLabel="Cancel"
      panelClassName={`${panelBg} ${panelBorder}`}
      descriptionClassName={textMuted}
    >
          <div className="w-full text-left mt-1">
            <label className={`text-xs font-bold block mb-1 ${textMuted}`}>
              Type <span className={textPrimary}>{confirmPhrase}</span> to
              continue
            </label>
            <input
              type="text"
              autoFocus
              value={inputValue}
              disabled={submitting}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={confirmPhrase}
              className={`w-full h-10 px-3 rounded-xl text-sm font-semibold border outline-none transition-colors disabled:opacity-50 ${
                darkMode
                  ? "bg-transparent border-[#374151] text-border-border-subtle focus:border-[#6B7280]"
                  : "bg-white border-border-subtle text-[#111827] focus:border-[#9CA3AF]"
              }`}
            />
          </div>
    </ConfirmationModal>
  );
}
