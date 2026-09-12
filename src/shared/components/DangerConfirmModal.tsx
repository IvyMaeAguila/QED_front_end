import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@shared/context/ToastContext";

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden flex flex-col ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FEE2E2]">
            <AlertTriangle size={20} className="text-[#B91C1C]" />
          </div>
          <div>
            <p className={`text-sm font-bold ${textPrimary}`}>{title}</p>
            <div className={`text-xs font-semibold mt-1 ${textMuted}`}>
              {description}
            </div>
          </div>

          <div className="w-full text-left mt-1">
            <label className={`text-[11px] font-bold block mb-1 ${textMuted}`}>
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
                  ? "bg-transparent border-[#374151] text-[#E5E7EB] focus:border-[#6B7280]"
                  : "bg-white border-[#E5E7EB] text-[#111827] focus:border-[#9CA3AF]"
              }`}
            />
          </div>

          {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch || submitting}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-[#B91C1C] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}