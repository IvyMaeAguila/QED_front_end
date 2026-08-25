import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { CalendarTheme } from "../types/Calendar";

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
  textPrimary,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden flex flex-col ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FEE2E2]">
            <AlertTriangle size={20} className="text-[#B91C1C]" />
          </div>
          <div>
            <p className={`text-sm font-bold ${textPrimary}`}>Delete this entry?</p>
            <p className={`text-xs font-semibold mt-1 ${textMuted}`}>
              "{entryTitle}" will be permanently removed. This can't be undone.
            </p>
          </div>
          {error && <p className="text-xs font-bold text-[#B91C1C]">{error}</p>}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-[#B91C1C] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}